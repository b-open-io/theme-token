import { toShadcnRegistry, validateThemeToken } from "@theme-token/sdk";
import { NextResponse } from "next/server";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ origin: string }> },
) {
	try {
		const { origin } = await params;

		const response = await fetch(`https://ordfs.network/${origin}`);
		if (!response.ok) {
			return NextResponse.json({ error: "Theme not found" }, { status: 404 });
		}

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
				"Cache-Control": "public, max-age=3600",
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
