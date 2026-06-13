import { getOrdfsUrl } from "@theme-token/sdk";
import { NextResponse } from "next/server";
import {
	hydrateRegistryManifest,
	toShadcnRegistryItem,
	validateRegistryManifest,
} from "@/lib/registry-gateway";

/**
 * Registry endpoint for blocks
 *
 * Serves registry:block items to the shadcn CLI:
 *   bunx shadcn@latest add https://themetoken.dev/r/blocks/{origin}
 *
 * Handles:
 * - Single-file blocks (content embedded in JSON)
 * - Multi-file blocks (content in sibling inscriptions, hydrated at serve time)
 * - _N relative vout reference resolution for bundle references
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
			return NextResponse.json({ error: "Block not found" }, { status: 404 });
		}

		// ORDFS resolves _N refs natively — no client-side resolution needed
		const json = await response.json();

		// Validate the manifest structure
		const result = validateRegistryManifest(json);
		if (!result.valid) {
			return NextResponse.json(
				{ error: "Invalid block format", details: result.error },
				{ status: 400 },
			);
		}

		// Verify this is actually a block
		if (result.manifest.type !== "registry:block") {
			return NextResponse.json(
				{ error: `Expected registry:block, got ${result.manifest.type}` },
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
		console.error("[Registry API - Blocks] Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch block" },
			{ status: 500 },
		);
	}
}
