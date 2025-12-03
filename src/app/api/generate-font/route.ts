import { generateObject } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * AI Font Generation API
 *
 * Uses AI to generate SVG glyph paths for each character in a font.
 * The client receives SVG data that can be previewed and eventually
 * compiled into a proper font file.
 */

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

export async function POST(request: NextRequest) {
	try {
		const { prompt, model } = await request.json();

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

		const systemPrompt = `You are a master typographer and font designer. Your task is to generate SVG path data for font glyphs based on a style description.

## Font Metrics
- Units per Em: 1000
- Baseline: y = 200 (descenders go below this)
- x-Height: around y = 550 (top of lowercase letters like 'x')
- Cap Height: around y = 800 (top of uppercase letters)
- Ascender: around y = 850 (top of tall lowercase like 'h', 'l')
- Descender: around y = 0-100 (bottom of 'g', 'y', 'p')

## SVG Path Guidelines
- Use absolute coordinates (M, L, C, Q, Z commands)
- Paths should be clockwise for outer contours
- Coordinate space: x from 0 to glyph width, y from 0 to ~1000
- Higher y values are UP (opposite of screen coordinates)
- Create smooth, professional letterforms
- Maintain consistent stroke weight across all glyphs
- Ensure proper spacing (advance width should include side bearings)

## Style Interpretation
Interpret the user's style description and create cohesive glyphs that embody that aesthetic. Consider:
- Stroke contrast (thick/thin variation)
- Terminal style (rounded, flat, angled)
- x-height proportion
- Letter spacing feel
- Overall personality (friendly, formal, technical, etc.)

Generate glyphs for these characters: ${CHARS_TO_GENERATE}`;

		const { object: font } = await generateObject({
			model: modelId as Parameters<typeof generateObject>[0]["model"],
			schema: fontSchema,
			system: systemPrompt,
			prompt: `Design a font with this style: ${prompt}

Generate complete SVG path data for all basic Latin characters. Each glyph should have:
1. Proper width based on the character (e.g., 'M' is wider than 'i')
2. Professional-quality bezier curves for smooth outlines
3. Consistent design language matching the requested style

Characters to generate: ${CHARS_TO_GENERATE}`,
		});

		// Return the font data as JSON - client will handle preview/compilation
		return NextResponse.json({
			success: true,
			font: {
				...font,
				generatedBy: model || "gemini-3-pro",
				generatedAt: new Date().toISOString(),
			},
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
