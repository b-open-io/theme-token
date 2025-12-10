import { getOrdfsUrl } from "@theme-token/sdk";
import { NextResponse } from "next/server";
import {
	validateRegistryManifest,
	hydrateRegistryManifest,
	toShadcnRegistryItem,
	hasBundleReferences,
	resolveBundleReferences,
} from "@/lib/registry-gateway";

/**
 * Registry endpoint for components
 *
 * Serves registry:component items to the shadcn CLI:
 *   bunx shadcn@latest add https://themetoken.dev/r/components/{origin}
 *
 * Handles:
 * - Single-file components (most common)
 * - Multi-file components with hooks/utils
 * - {{vout:N}} placeholder resolution
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ origin: string }> },
) {
	try {
		const { origin } = await params;

		// Fetch the manifest from ORDFS
		const response = await fetch(getOrdfsUrl(origin));
		if (!response.ok) {
			return NextResponse.json(
				{ error: "Component not found" },
				{ status: 404 },
			);
		}

		let json = await response.json();

		// Resolve any {{vout:N}} placeholders in the manifest
		if (hasBundleReferences(json)) {
			json = resolveBundleReferences(json, origin);
		}

		// Validate the manifest structure
		const result = validateRegistryManifest(json);
		if (!result.valid) {
			return NextResponse.json(
				{ error: "Invalid component format", details: result.error },
				{ status: 400 },
			);
		}

		// Verify this is actually a component (allow component or ui types)
		const validTypes = ["registry:component", "registry:ui"];
		if (!validTypes.includes(result.manifest.type)) {
			return NextResponse.json(
				{ error: `Expected registry:component or registry:ui, got ${result.manifest.type}` },
				{ status: 400 },
			);
		}

		// Hydrate files - fetch content from sibling inscriptions
		const hydrated = await hydrateRegistryManifest(result.manifest, origin);

		// Convert to shadcn CLI-compatible format
		const registryItem = toShadcnRegistryItem(hydrated);

		return NextResponse.json(registryItem, {
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=3600",
			},
		});
	} catch (error) {
		console.error("[Registry API - Components] Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch component" },
			{ status: 500 },
		);
	}
}
