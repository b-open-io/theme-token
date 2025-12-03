import { generateObject } from "ai";
import { kv } from "@vercel/kv";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * AI Font Generation API
 *
 * Uses AI to generate SVG glyph paths for each character in a font.
 * The client receives SVG data that can be previewed and eventually
 * compiled into a proper font file.
 *
 * Supports:
 * - Fresh generation: Just prompt + model
 * - Seeded remix: prompt + model + previousFont (iterative refinement)
 * - Results stored in Vercel KV keyed by origin for recovery
 */

// Cache expiry: 7 days
const CACHE_TTL_SECONDS = 86400 * 7;

// Schema for a single glyph
const glyphSchema = z.object({
	char: z.string().describe("The character this glyph represents"),
	unicode: z.number().describe("Unicode code point"),
	width: z.number().describe("Advance width in font units (typically 1000 units per em)"),
	path: z.string().describe("SVG path data (d attribute) for the glyph outline. Use M, L, C, Q, Z commands. Coordinate space is 0-1000 units, with baseline at y=200 and cap height at y=800."),
});

// Schema for the complete font
const fontSchema = z.object({
	name: z.string().describe("Font family name based on the style"),
	style: z.string().describe("Style description (e.g., 'Bold Sans-Serif')"),
	unitsPerEm: z.number().describe("Units per em (always use 1000)"),
	ascender: z.number().describe("Ascender height (typically 800-900)"),
	descender: z.number().describe("Descender depth as negative (typically -200 to -300)"),
	capHeight: z.number().describe("Capital letter height (typically 700-750)"),
	xHeight: z.number().describe("Lowercase x height (typically 450-550)"),
	glyphs: z.array(glyphSchema).describe("Array of glyph definitions"),
});

// Characters to generate - basic Latin set
const CHARS_TO_GENERATE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,:;!?-'\"()";

// Type for previous font data (for seeded remix)
interface PreviousFontData {
	name: string;
	style: string;
	capHeight: number;
	xHeight: number;
	glyphs: Array<{ char: string; path: string; width: number }>;
}

export async function POST(request: NextRequest) {
	try {
		const { prompt, model, paymentTxid, previousFont } = await request.json() as {
			prompt: string;
			model?: string;
			paymentTxid?: string;
			previousFont?: PreviousFontData;
		};

		if (!prompt) {
			return NextResponse.json(
				{ error: "Prompt is required" },
				{ status: 400 },
			);
		}

		// Select the AI model (IDs from Vercel AI Gateway)
		const modelId = model === "claude-opus-4.5"
			? "anthropic/claude-opus-4.5"
			: "google/gemini-3-pro-preview";

		// Build seeded remix context if previous font provided
		const seedContext = previousFont ? `
## Previous Font Reference (SEEDED REMIX)
You are REMIXING an existing font. Here is the previous design to use as a reference:
- Original Style: ${previousFont.style}
- Metrics: capHeight=${previousFont.capHeight}, xHeight=${previousFont.xHeight}
- Key glyph paths for reference (first 10 characters):
${previousFont.glyphs.slice(0, 10).map(g => `  ${g.char}: width=${g.width}, path="${g.path.substring(0, 100)}..."`).join('\n')}

IMPORTANT: Maintain the core identity and proportions of this font while applying the user's modifications.
The result should feel like an evolution of the original, not a completely different font.
` : '';

		const systemPrompt = `You are a master typographer and font designer with deep expertise in letterform construction. Generate precise SVG path data for professional-quality font glyphs.
${seedContext}

## CRITICAL: Coordinate System
- Units per Em: 1000 (ALWAYS use 1000)
- Y-axis: Higher values = UP (opposite of screen SVG!)
- Baseline: y = 200
- x-Height: y = 500 (top of lowercase x, a, e, etc.)
- Cap Height: y = 700 (top of H, E, A, etc.)
- Ascender: y = 800 (top of b, d, h, l)
- Descender: y = 0-50 (bottom of g, p, y, j)

## SVG Path Construction Rules
1. Use ONLY absolute commands: M (moveTo), L (lineTo), C (cubic bezier), Q (quadratic bezier), Z (close)
2. Outer contours: CLOCKWISE direction
3. Inner contours (counters): COUNTER-CLOCKWISE direction
4. Start each glyph with M (move to starting point)
5. End closed shapes with Z

## Stroke Weight Consistency
- Main stems: Define a consistent vertical stroke width (e.g., 80-120 units for regular weight)
- Horizontal strokes: Slightly thinner (85-90% of vertical)
- Hairlines (for high-contrast styles): 20-40 units
- Keep stroke weights consistent across ALL glyphs

## Character Width Guidelines (advance width including side bearings)
- Narrow: i I l 1 | : ; . , ! (200-300 units)
- Medium-narrow: j J f t r (350-450 units)
- Medium: a c e g n o s u v x z (500-600 units)
- Medium-wide: A B C D E F G H K N P R S U V X Y Z b d h k p q (600-750 units)
- Wide: M W m w O Q (750-900 units)
- Numbers: All same width for tabular alignment (600 units)

## Design Principles
- Optical corrections: Round letters (O, C, e, o) should extend 2-3% beyond flat letters
- Pointed letters (A, V, W) should overshoot cap height slightly
- Bowl shapes need smooth, continuous curves (use C commands, not L)
- Maintain consistent x-height across all lowercase letters
- Counters (holes in a, e, g, etc.) should be open and legible

## Path Quality
- Use cubic bezier (C) for smooth curves - minimum 2-4 control points per curve
- Avoid jagged paths - no sequences of short L commands for curves
- Off-curve points (bezier handles) should create tangent-continuous curves
- Stems should be perfectly vertical or horizontal where intended

## Example Path Structure for Letter "O":
M 350 700 C 350 720 320 750 250 750 C 180 750 100 720 100 550 C 100 380 180 350 250 350 C 320 350 350 380 350 550 Z
M 280 650 C 280 680 260 700 220 700 C 180 700 150 680 150 550 C 150 420 180 400 220 400 C 260 400 280 420 280 550 Z

Generate glyphs for: ${CHARS_TO_GENERATE}`;

		const { object: font } = await generateObject({
			model: modelId as Parameters<typeof generateObject>[0]["model"],
			schema: fontSchema,
			system: systemPrompt,
			prompt: `Design a professional font with this style: "${prompt}"

Requirements:
1. Generate high-quality SVG path data for ALL characters: ${CHARS_TO_GENERATE}
2. Maintain CONSISTENT stroke weight, cap height, x-height, and baseline across all glyphs
3. Use smooth cubic bezier curves (C command) for all curved shapes
4. Each glyph's width should be appropriate for the character (narrow for i, wide for M/W)
5. Apply the style consistently - if it's bold, ALL letters should have thick stems; if it's geometric, ALL letters should have circular bowls

Style interpretation for "${prompt}":
- Translate the style description into specific typographic choices (stroke contrast, terminal style, proportions)
- Create a cohesive design where all characters feel like they belong to the same family
- The style should be evident in every single glyph

Technical requirements:
- All paths MUST use absolute coordinates
- Outer contours clockwise, inner contours counter-clockwise
- Close all paths with Z command
- Numbers should all have the same width (600 units) for tabular alignment`,
		});

		const fontData = {
			...font,
			generatedBy: model || "gemini-3-pro",
			generatedAt: new Date().toISOString(),
			isRemix: !!previousFont,
		};

		// Store in KV if we have a payment txid (for recovery)
		// Use paymentTxid as the origin for now - in production this would be the inscription origin
		if (paymentTxid) {
			try {
				await kv.set(
					`font:generation:${paymentTxid}`,
					{
						font: fontData,
						prompt,
						model: model || "gemini-3-pro",
						createdAt: Date.now(),
						isRemix: !!previousFont,
					},
					{ ex: CACHE_TTL_SECONDS }
				);
				console.log(`[generate-font] Stored generation for txid: ${paymentTxid}`);
			} catch (kvError) {
				// Don't fail the request if KV storage fails
				console.error("[generate-font] KV storage error:", kvError);
			}
		}

		// Return the font data as JSON - client will handle preview/compilation
		return NextResponse.json({
			success: true,
			font: fontData,
			cached: !!paymentTxid,
			cacheKey: paymentTxid || null,
		});
	} catch (error) {
		console.error("[generate-font] Error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to generate font",
			},
			{ status: 500 },
		);
	}
}
