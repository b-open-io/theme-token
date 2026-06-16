import { toShadcnRegistry, validateThemeToken } from "@theme-token/sdk";
import { NextResponse } from "next/server";
import { getOrdfsUrl } from "@/lib/ordfs";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ origin: string }> },
) {
	try {
		const { origin } = await params;

		// Themes are ord-fs/json directory packages: theme.json lives at the
		// directory root. ORDFS resolves the `_N` directory pointer to the file.
		const response = await fetch(getOrdfsUrl(`${origin}/theme.json`));
		if (!response.ok) {
			return NextResponse.json({ error: "Theme not found" }, { status: 404 });
		}

		const result = validateThemeToken(await response.json());
		if (!result.valid) {
			return NextResponse.json(
				{ error: "Invalid theme format", details: result.error },
				{ status: 400 },
			);
		}

		const registryItem = toShadcnRegistry(result.theme);
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
