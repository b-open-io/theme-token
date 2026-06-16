import {
	getOrdfsUrl,
	toShadcnRegistry,
	validateThemeToken,
} from "@theme-token/sdk";
import { NextResponse } from "next/server";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ origin: string }> },
) {
	try {
		const { origin } = await params;

		// ORDFS resolves _N refs natively — no client-side resolution needed
		const response = await fetch(getOrdfsUrl(origin));
		if (!response.ok) {
			return NextResponse.json({ error: "Theme not found" }, { status: 404 });
		}

		const contentType = response.headers.get("content-type") || "";

		// New format: ord-fs/json manifest — fetch theme.json via directory path
		if (contentType.includes("ord-fs/json") || contentType.includes("ord-fs")) {
			const themeJsonResponse = await fetch(
				getOrdfsUrl(`${origin}/theme.json`),
			);
			if (!themeJsonResponse.ok) {
				return NextResponse.json(
					{ error: "Theme manifest found but theme.json not accessible" },
					{ status: 400 },
				);
			}

			const themeJson = await themeJsonResponse.json();
			const result = validateThemeToken(themeJson);
			if (!result.valid) {
				return NextResponse.json(
					{ error: "Invalid theme format in package", details: result.error },
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
		}

		// Old format: direct application/json ThemeToken
		const json = await response.json();

		const result = validateThemeToken(json);
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
