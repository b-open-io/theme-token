/**
 * /init endpoint - Serve on-chain projects as shadcn-compatible presets
 *
 * Usage:
 * bunx shadcn@latest create --preset "https://themetoken.dev/init?project={origin}" --template next
 *
 * Query parameters:
 * - project: Origin outpoint of the inscribed project (required)
 * - iconLibrary: Override icon library (optional)
 * - menuColor: Override menu color (optional)
 * - menuAccent: Override menu accent (optional)
 * - baseColor: Override Tailwind base color (optional)
 */

import { NextResponse } from "next/server";
import { fetchJsonFromOrdfs, resolveBundleReferences } from "@/lib/registry-gateway";
import type { ProjectManifest, IconLibrary, BaseColor, MenuColor, MenuAccent } from "@/lib/project-types";

export const runtime = "edge";

// Valid parameter values
const VALID_ICON_LIBRARIES: IconLibrary[] = ["lucide", "hugeicons", "tabler"];
const VALID_BASE_COLORS: BaseColor[] = ["neutral", "gray", "zinc", "stone", "slate"];
const VALID_MENU_COLORS: MenuColor[] = ["default", "primary", "accent"];
const VALID_MENU_ACCENTS: MenuAccent[] = ["subtle", "normal", "bold"];

interface InitParams {
	project: string | null;
	iconLibrary: IconLibrary | null;
	baseColor: BaseColor | null;
	menuColor: MenuColor | null;
	menuAccent: MenuAccent | null;
}

function parseParams(searchParams: URLSearchParams): InitParams {
	const iconLibrary = searchParams.get("iconLibrary") as IconLibrary | null;
	const baseColor = searchParams.get("baseColor") as BaseColor | null;
	const menuColor = searchParams.get("menuColor") as MenuColor | null;
	const menuAccent = searchParams.get("menuAccent") as MenuAccent | null;

	return {
		project: searchParams.get("project"),
		iconLibrary: iconLibrary && VALID_ICON_LIBRARIES.includes(iconLibrary) ? iconLibrary : null,
		baseColor: baseColor && VALID_BASE_COLORS.includes(baseColor) ? baseColor : null,
		menuColor: menuColor && VALID_MENU_COLORS.includes(menuColor) ? menuColor : null,
		menuAccent: menuAccent && VALID_MENU_ACCENTS.includes(menuAccent) ? menuAccent : null,
	};
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const params = parseParams(searchParams);

	// Validate required project parameter
	if (!params.project) {
		return NextResponse.json(
			{
				error: "Missing required parameter: project",
				usage: "GET /init?project={origin}",
				example: "GET /init?project=abc123def456_0&iconLibrary=hugeicons",
			},
			{ status: 400 },
		);
	}

	try {
		// Fetch project manifest from ORDFS
		const rawManifest = await fetchJsonFromOrdfs<ProjectManifest>(params.project);

		if (!rawManifest) {
			return NextResponse.json(
				{
					error: "Project not found",
					origin: params.project,
				},
				{ status: 404 },
			);
		}

		// Validate it's a registry:base item
		if (rawManifest.type !== "registry:base") {
			return NextResponse.json(
				{
					error: "Invalid project type",
					expected: "registry:base",
					received: rawManifest.type,
					hint: "This endpoint requires a registry:base project. For themes, use /r/themes/{origin}",
				},
				{ status: 400 },
			);
		}

		// Resolve {{vout:N}} references to absolute ORDFS URLs
		const manifest = resolveBundleReferences(
			rawManifest as unknown as Record<string, unknown>,
			params.project,
		) as unknown as ProjectManifest;

		// Apply query parameter overrides
		const finalManifest = applyOverrides(manifest, params);

		// Return shadcn-compatible registry:base response
		return NextResponse.json(finalManifest, {
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=3600",
				"Access-Control-Allow-Origin": "*",
			},
		});
	} catch (error) {
		console.error("[/init] Error fetching project:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch project",
				origin: params.project,
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

/**
 * Apply query parameter overrides to the manifest
 */
function applyOverrides(
	manifest: ProjectManifest,
	params: InitParams,
): ProjectManifest {
	// Deep clone to avoid mutating original
	const result = JSON.parse(JSON.stringify(manifest)) as ProjectManifest;

	// Apply config overrides
	if (params.iconLibrary) {
		result.config.iconLibrary = params.iconLibrary;
		// Update dependencies to match new icon library
		result.dependencies = updateIconDependencies(
			result.dependencies,
			params.iconLibrary,
		);
	}

	if (params.baseColor) {
		result.config.tailwind.baseColor = params.baseColor;
	}

	if (params.menuColor) {
		result.config.menuColor = params.menuColor;
	}

	if (params.menuAccent) {
		result.config.menuAccent = params.menuAccent;
	}

	return result;
}

/**
 * Update dependencies when icon library changes
 */
function updateIconDependencies(
	deps: string[],
	iconLibrary: IconLibrary,
): string[] {
	// Remove existing icon library packages
	const iconPackages = [
		"lucide-react",
		"@hugeicons/react",
		"@hugeicons/core-free-icons",
		"@tabler/icons-react",
	];

	const filtered = deps.filter((d) => !iconPackages.includes(d));

	// Add new icon library packages
	const newPackages: Record<IconLibrary, string[]> = {
		lucide: ["lucide-react"],
		hugeicons: ["@hugeicons/react", "@hugeicons/core-free-icons"],
		tabler: ["@tabler/icons-react"],
	};

	return [...filtered, ...newPackages[iconLibrary]];
}

// Handle preflight requests for CORS
export async function OPTIONS() {
	return new NextResponse(null, {
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		},
	});
}
