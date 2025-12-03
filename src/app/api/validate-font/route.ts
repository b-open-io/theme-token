import { type NextRequest, NextResponse } from "next/server";
import { validateFont } from "@/lib/font-validation";

// Cache Google Fonts list in memory (refreshed on cold start)
let googleFontsCache: Set<string> | null = null;
let googleFontsCacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

async function getGoogleFonts(): Promise<Set<string>> {
	const now = Date.now();

	// Return cached if valid
	if (googleFontsCache && now - googleFontsCacheTime < CACHE_TTL) {
		return googleFontsCache;
	}

	try {
		// Google Fonts API - free, no key required for this endpoint
		const response = await fetch(
			"https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyBwIX97bVWr3-6AIUvGkcNnmFgirefZ6Sw&sort=alpha",
			{ next: { revalidate: 3600 } },
		);

		if (!response.ok) {
			console.warn("[validate-font] Failed to fetch Google Fonts list");
			return googleFontsCache || new Set();
		}

		const data = await response.json();
		const fonts = new Set<string>(
			data.items?.map((item: { family: string }) =>
				item.family.toLowerCase(),
			) || [],
		);

		googleFontsCache = fonts;
		googleFontsCacheTime = now;

		return fonts;
	} catch (error) {
		console.error("[validate-font] Error fetching Google Fonts:", error);
		return googleFontsCache || new Set();
	}
}

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get("font") as File | null;

		if (!file) {
			return NextResponse.json({ error: "No font file provided" }, { status: 400 });
		}

		// Validate file type
		const validTypes = [
			"font/woff2",
			"font/woff",
			"font/ttf",
			"font/otf",
			"application/font-woff2",
			"application/font-woff",
			"application/x-font-ttf",
			"application/x-font-opentype",
			"application/octet-stream", // Some browsers send this
		];

		// Also check extension
		const ext = file.name.split(".").pop()?.toLowerCase();
		const validExtensions = ["woff2", "woff", "ttf", "otf"];

		if (!validExtensions.includes(ext || "")) {
			return NextResponse.json(
				{ error: `Invalid file type. Expected font file, got .${ext}` },
				{ status: 400 },
			);
		}

		// Parse and validate the font
		const buffer = await file.arrayBuffer();
		const result = await validateFont(buffer);

		// Check against Google Fonts
		const googleFonts = await getGoogleFonts();
		const familyNormalized = result.metadata.familyName.toLowerCase();

		if (googleFonts.has(familyNormalized)) {
			result.checks.isGoogleFont = true;
			// Remove license warnings for verified Google Fonts
			result.warnings = result.warnings.filter(
				(w) => !w.includes("license") && !w.includes("License"),
			);
			// Add positive confirmation
			if (!result.errors.length) {
				result.warnings.unshift(
					`Verified: "${result.metadata.familyName}" is a Google Font (open source).`,
				);
			}
		}

		return NextResponse.json(result);
	} catch (error) {
		console.error("[validate-font] Error:", error);

		// Handle opentype.js parsing errors
		if (error instanceof Error && error.message.includes("not a valid font")) {
			return NextResponse.json(
				{ error: "Invalid or corrupted font file" },
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Validation failed" },
			{ status: 500 },
		);
	}
}
