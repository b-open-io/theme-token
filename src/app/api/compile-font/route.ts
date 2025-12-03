import { type NextRequest, NextResponse } from "next/server";
import { compileFont, fontToBase64, type FontData } from "@/lib/font-compiler";
import {
	optimizeFont,
	validateAndFixGlyphs,
	generateKerningPairs,
} from "@/lib/font-optimizer";

/**
 * Font Compilation API
 *
 * Takes AI-generated font data (JSON with SVG paths) and compiles it
 * into real OTF and WOFF2 font files.
 *
 * Applies optimizations:
 * - Glyph validation and fixes
 * - Kerning pair generation
 * - Optical corrections (when implemented)
 */

export async function POST(request: NextRequest) {
	try {
		const fontData: FontData = await request.json();

		// Validate required fields
		if (!fontData.name || !fontData.glyphs?.length) {
			return NextResponse.json(
				{ error: "Invalid font data: missing name or glyphs" },
				{ status: 400 },
			);
		}

		// Validate and fix common glyph issues
		const fixedGlyphs = validateAndFixGlyphs(fontData.glyphs);

		// Apply optimizations
		const optimizedData = optimizeFont({
			...fontData,
			glyphs: fixedGlyphs,
		});

		// Compile the font
		const compiled = await compileFont(optimizedData);

		// Return both formats as base64 for client-side use
		return NextResponse.json({
			success: true,
			otf: {
				base64: fontToBase64(compiled.otf),
				size: compiled.metadata.fileSize.otf,
				mimeType: "font/otf",
			},
			woff2: {
				base64: fontToBase64(compiled.woff2),
				size: compiled.metadata.fileSize.woff2,
				mimeType: "font/woff2",
			},
			metadata: compiled.metadata,
			optimization: {
				kerningPairs: optimizedData.kerningPairs?.length ?? 0,
				applied: optimizedData.optimizationApplied,
			},
		});
	} catch (error) {
		console.error("[compile-font] Error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to compile font",
				details: error instanceof Error ? error.stack : undefined,
			},
			{ status: 500 },
		);
	}
}
