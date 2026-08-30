import { toShadcnRegistry, validateThemeToken } from "@theme-token/sdk";
import { NextResponse } from "next/server";
import { getOrdfsUrl } from "@/lib/ordfs";
import { normalizeOriginRouteParam } from "@/lib/outpoint";
import { getThemeByOrigin } from "@/lib/server/get-session-theme";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ origin: string }> },
) {
	try {
		const { origin: originParam } = await params;
		const origin = normalizeOriginRouteParam(originParam);

		// Themes are ord-fs/json directory packages: theme.json lives at the
		// directory root. ORDFS resolves the `_N` directory pointer to the file.
		const response = await fetch(getOrdfsUrl(`${origin}/theme.json`), {
			cache: "no-store",
		});
		const result = response.ok
			? validateThemeToken(await response.json())
			: { valid: false as const, error: "Theme not available from 1Sat yet" };
		const theme = result.valid ? result.theme : await getThemeByOrigin(origin);
		if (!theme) {
			return NextResponse.json({ error: "Theme not found" }, { status: 404 });
		}

		const registryItem = toShadcnRegistry(theme);
		return NextResponse.json(registryItem, {
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=3600, s-maxage=31536000, immutable",
			},
		});
	} catch (error) {
		console.error("[Registry API] Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch theme" },
			{ status: 500 },
		);
	}
}
