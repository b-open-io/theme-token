import { NextResponse } from "next/server";
import { getOrdfsUrl } from "@/lib/ordfs";
import { normalizeOriginRouteParam } from "@/lib/outpoint";
import {
	hydrateRegistryManifest,
	toShadcnRegistryItem,
	validateRegistryManifest,
} from "@/lib/registry-gateway";

/**
 * Registry endpoint for components
 *
 * Serves registry:component items to the shadcn CLI:
 *   bunx shadcn@latest add https://themetoken.dev/r/components/{origin}.json
 *
 * Handles:
 * - Single-file components (most common)
 * - Multi-file components with hooks/utils
 * - _N relative vout reference resolution
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ origin: string }> },
) {
	try {
		const origin = normalizeOriginRouteParam((await params).origin);

		// Fetch the manifest from ORDFS
		const response = await fetch(getOrdfsUrl(origin));
		if (!response.ok) {
			return NextResponse.json(
				{ error: "Component not found" },
				{ status: 404 },
			);
		}

		// ORDFS resolves _N refs natively — no client-side resolution needed
		const json = await response.json();

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
				{
					error: `Expected registry:component or registry:ui, got ${result.manifest.type}`,
				},
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
				"Cache-Control": "public, max-age=3600, s-maxage=31536000, immutable",
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
