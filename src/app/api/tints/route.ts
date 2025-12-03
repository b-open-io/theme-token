import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy for tints.dev API to avoid CORS issues
 * GET /api/tints?name=primary&hex=3B82F6
 */
export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const name = searchParams.get("name");
	const hex = searchParams.get("hex");

	if (!name || !hex) {
		return NextResponse.json(
			{ error: "Missing required parameters: name and hex" },
			{ status: 400 },
		);
	}

	// Clean hex value
	const cleanHex = hex.replace(/^#/, "");

	try {
		const response = await fetch(
			`https://www.tints.dev/api/${encodeURIComponent(name)}/${encodeURIComponent(cleanHex)}`,
		);

		if (!response.ok) {
			return NextResponse.json(
				{ error: `tints.dev API error: ${response.status}` },
				{ status: response.status },
			);
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Failed to fetch from tints.dev:", error);
		return NextResponse.json(
			{ error: "Failed to fetch palette" },
			{ status: 500 },
		);
	}
}
