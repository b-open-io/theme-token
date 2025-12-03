import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: Request) {
	const url = new URL(request.url);
	const themeOrigin = url.searchParams.get("theme");

	// Redirect to static image
	if (themeOrigin) {
		return NextResponse.redirect(new URL(`/og/${themeOrigin}.png`, url.origin));
	}

	// Default homepage OG
	return NextResponse.redirect(new URL("/og/default.png", url.origin));
}
