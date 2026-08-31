/**
 * /init endpoint - Serve on-chain projects as shadcn-compatible presets
 *
 * Usage:
 * bunx shadcn@latest create --preset "https://themetoken.dev/init?project={origin}" --template next
 *
 * Query parameters:
 * - project: Origin outpoint of the inscribed project (required)
 * - base: Override component primitives (optional)
 * - iconLibrary: Override icon library (optional)
 * - font/fontHeading: Override font registry items (optional)
 * - radius: Override the theme radius (optional)
 * - menuColor: Override menu color (optional)
 * - menuAccent: Override menu accent (optional)
 * - baseColor: Override Tailwind base color (optional)
 */

import { NextResponse } from "next/server";
import type {
	BaseColor,
	IconLibrary,
	MenuAccent,
	MenuColor,
	ProjectBase,
	ProjectFont,
	ProjectHeadingFont,
	ProjectManifest,
	ProjectRadius,
} from "@/lib/project-types";
import {
	BASE_COLORS,
	ICON_LIBRARIES,
	ICON_LIBRARY_PACKAGES,
	MENU_ACCENTS,
	MENU_COLORS,
	PROJECT_BASE_PACKAGES,
	PROJECT_BASES,
	PROJECT_FONTS,
	PROJECT_RADII,
	PROJECT_RADIUS_VALUES,
	qualifyProjectStyle,
} from "@/lib/project-types";
import { fetchJsonFromOrdfs } from "@/lib/registry-gateway";

// Valid parameter values
export interface InitParams {
	project: string | null;
	base: ProjectBase | null;
	iconLibrary: IconLibrary | null;
	font: ProjectFont | null;
	fontHeading: ProjectHeadingFont | null;
	radius: ProjectRadius | null;
	baseColor: BaseColor | null;
	menuColor: MenuColor | null;
	menuAccent: MenuAccent | null;
}

function isOneOf<const T extends readonly string[]>(
	values: T,
	value: string | null,
): value is T[number] {
	return value !== null && values.includes(value as T[number]);
}

export function parseParams(searchParams: URLSearchParams): InitParams {
	const base = searchParams.get("base");
	const iconLibrary = searchParams.get("iconLibrary");
	const font = searchParams.get("font");
	const fontHeading = searchParams.get("fontHeading");
	const radius = searchParams.get("radius");
	const baseColor = searchParams.get("baseColor");
	const menuColor = searchParams.get("menuColor");
	const menuAccent = searchParams.get("menuAccent");

	return {
		project: searchParams.get("project"),
		base: isOneOf(PROJECT_BASES, base) ? base : null,
		iconLibrary: isOneOf(ICON_LIBRARIES, iconLibrary) ? iconLibrary : null,
		font: isOneOf(PROJECT_FONTS, font) ? font : null,
		fontHeading:
			fontHeading === "inherit" || isOneOf(PROJECT_FONTS, fontHeading)
				? fontHeading
				: null,
		radius: isOneOf(PROJECT_RADII, radius) ? radius : null,
		baseColor: isOneOf(BASE_COLORS, baseColor) ? baseColor : null,
		menuColor: isOneOf(MENU_COLORS, menuColor) ? menuColor : null,
		menuAccent: isOneOf(MENU_ACCENTS, menuAccent) ? menuAccent : null,
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
		const rawManifest =
			(await fetchJsonFromOrdfs<ProjectManifest>(
				`${params.project}/project.json`,
			)) || (await fetchJsonFromOrdfs<ProjectManifest>(params.project));

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
					hint: "This endpoint requires a registry:base project. For themes, use /r/themes/{origin}.json",
				},
				{ status: 400 },
			);
		}

		// ORDFS resolves _N vout references natively — no client-side resolution needed
		const manifest = rawManifest;

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
export function applyOverrides(
	manifest: ProjectManifest,
	params: InitParams,
): ProjectManifest {
	// Deep clone to avoid mutating original
	const result = JSON.parse(JSON.stringify(manifest)) as ProjectManifest;

	// Old manifests used an unqualified style. Current ShadCN styles include
	// their primitive base (for example, radix-vega or base-vega).
	const currentBase = params.base ?? getProjectBase(result.config.style);
	result.config.style = qualifyProjectStyle(currentBase, result.config.style);
	result.dependencies = updatePrimitiveDependencies(
		result.dependencies,
		currentBase,
	);
	result.config.rtl ??= false;
	result.config.menuColor = normalizeMenuColor(result.config.menuColor);
	result.config.menuAccent = normalizeMenuAccent(result.config.menuAccent);

	if (params.base) {
		result.config.style = `${params.base}-${getStyleName(result.config.style)}`;
	}

	if (params.iconLibrary) {
		result.config.iconLibrary = params.iconLibrary;
		// Update dependencies to match new icon library
		result.dependencies = updateIconDependencies(
			result.dependencies,
			params.iconLibrary,
		);
	}

	if (params.font || params.fontHeading) {
		result.registryDependencies = updateFontDependencies(
			result.registryDependencies,
			params.font,
			params.fontHeading,
		);
	}

	if (params.radius) {
		result.cssVars.light.radius = PROJECT_RADIUS_VALUES[params.radius];
		result.cssVars.dark.radius = PROJECT_RADIUS_VALUES[params.radius];
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

function getProjectBase(style: string): ProjectBase {
	return style.startsWith("base-") ? "base" : "radix";
}

function getStyleName(style: string): string {
	return style.replace(/^(radix|base|aria)-/, "");
}

function normalizeMenuColor(value: string): MenuColor {
	return isOneOf(MENU_COLORS, value) ? value : "default";
}

function normalizeMenuAccent(value: string): MenuAccent {
	return isOneOf(MENU_ACCENTS, value) ? value : "subtle";
}

function updatePrimitiveDependencies(
	dependencies: string[],
	base: ProjectBase,
): string[] {
	const primitivePackages = Object.values(PROJECT_BASE_PACKAGES).flat();
	return [
		...dependencies.filter(
			(dependency) => !primitivePackages.includes(dependency),
		),
		...PROJECT_BASE_PACKAGES[base],
	];
}

function updateFontDependencies(
	dependencies: string[],
	font: ProjectFont | null,
	fontHeading: ProjectHeadingFont | null,
): string[] {
	let result = dependencies;
	if (font) {
		result = result.filter(
			(dependency) =>
				!dependency.startsWith("font-") ||
				dependency.startsWith("font-heading-"),
		);
		result.push(`font-${font}`);
	}
	if (fontHeading) {
		result = result.filter(
			(dependency) => !dependency.startsWith("font-heading-"),
		);
		if (fontHeading !== "inherit") {
			result.push(`font-heading-${fontHeading}`);
		}
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
	const iconPackages = Object.values(ICON_LIBRARY_PACKAGES).flat();

	const filtered = deps.filter((d) => !iconPackages.includes(d));

	// Add new icon library packages
	return [...filtered, ...ICON_LIBRARY_PACKAGES[iconLibrary]];
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
