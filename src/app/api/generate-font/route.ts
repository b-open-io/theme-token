import { generateObject } from "ai";
import { kv } from "@vercel/kv";
import { waitUntil } from "@vercel/functions";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * AI Font Generation API (Async Job Pattern)
 *
 * Uses waitUntil to run AI generation in background after returning job ID.
 * This allows the generation to continue even if user navigates away.
 *
 * Flow:
 * 1. Client POSTs prompt + model
 * 2. Server generates jobId, stores initial state in KV, returns immediately
 * 3. Background: AI generates font, updates KV with result
 * 4. Client polls /api/font-generation/[id] for status
 */

// Allow long-running background tasks (up to 5 minutes on Pro)
export const maxDuration = 300;

// Cache expiry: 24 hours (user should use font within a day)
const CACHE_TTL_SECONDS = 86400;

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

// Type for stored generation state
interface GenerationState {
	status: "generating" | "compiling" | "complete" | "failed";
	prompt: string;
	model: string;
	createdAt: number;
	completedAt?: number;
	isRemix: boolean;
	font?: z.infer<typeof fontSchema> & {
		generatedBy: string;
		generatedAt: string;
		isRemix: boolean;
		prompt?: string;
	};
	compiled?: {
		woff2Base64: string;
		otfBase64: string;
		woff2Size: number;
		otfSize: number;
		familyName: string;
		glyphCount: number;
	};
	error?: string;
}

export async function POST(request: NextRequest) {
	try {
		const { prompt, model, previousFont } = await request.json() as {
			prompt: string;
			model?: string;
			previousFont?: PreviousFontData;
		};

		if (!prompt) {
			return NextResponse.json(
				{ error: "Prompt is required" },
				{ status: 400 },
			);
		}

		// Generate job ID server-side
		const jobId = crypto.randomUUID();
		const modelId = model === "claude-opus-4.5"
			? "anthropic/claude-opus-4.5"
			: "google/gemini-3-pro-preview";
		const modelName = model || "gemini-3-pro";

		// Store initial state immediately
		const initialState: GenerationState = {
			status: "generating",
			prompt,
			model: modelName,
			createdAt: Date.now(),
			isRemix: !!previousFont,
		};

		await kv.set(`font:${jobId}`, initialState, { ex: CACHE_TTL_SECONDS });

		// Fire and forget - run AI generation after response is sent
		waitUntil(
			runFontGeneration(jobId, prompt, modelId, modelName, previousFont)
		);

		// Return job ID immediately
		return NextResponse.json({
			success: true,
			jobId,
			status: "generating",
		});
	} catch (error) {
		console.error("[generate-font] Error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to start generation",
			},
			{ status: 500 },
		);
	}
}

/**
 * Background task: Generate font and compile it
 */
async function runFontGeneration(
	jobId: string,
	prompt: string,
	modelId: string,
	modelName: string,
	previousFont?: PreviousFontData
) {
	try {
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

		// Generate font with AI
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
			generatedBy: modelName,
			generatedAt: new Date().toISOString(),
			isRemix: !!previousFont,
			prompt,
		};

		// Update status to compiling
		await kv.set(`font:${jobId}`, {
			status: "compiling",
			prompt,
			model: modelName,
			createdAt: Date.now(),
			isRemix: !!previousFont,
			font: fontData,
		} satisfies GenerationState, { ex: CACHE_TTL_SECONDS });

		// Compile font to WOFF2
		let compiled: GenerationState["compiled"] = undefined;
		try {
			const compileResponse = await fetch(new URL("/api/compile-font", process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3033"), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(font),
			});

			if (compileResponse.ok) {
				const compileData = await compileResponse.json();
				compiled = {
					woff2Base64: compileData.woff2.base64,
					otfBase64: compileData.otf.base64,
					woff2Size: compileData.woff2.size,
					otfSize: compileData.otf.size,
					familyName: compileData.metadata.familyName,
					glyphCount: compileData.metadata.glyphCount,
				};
			}
		} catch (compileError) {
			console.warn("[generate-font] Compilation failed:", compileError);
			// Continue without compiled font - user can still see SVG preview
		}

		// Store completed result
		const completedState: GenerationState = {
			status: "complete",
			prompt,
			model: modelName,
			createdAt: Date.now(),
			completedAt: Date.now(),
			isRemix: !!previousFont,
			font: fontData,
			compiled,
		};

		await kv.set(`font:${jobId}`, completedState, { ex: CACHE_TTL_SECONDS });
		console.log(`[generate-font] Completed job ${jobId}`);

	} catch (error) {
		console.error(`[generate-font] Job ${jobId} failed:`, error);

		// Store failed state
		const failedState: GenerationState = {
			status: "failed",
			prompt,
			model: modelName,
			createdAt: Date.now(),
			isRemix: !!previousFont,
			error: error instanceof Error ? error.message : "Generation failed",
		};

		await kv.set(`font:${jobId}`, failedState, { ex: CACHE_TTL_SECONDS });
	}
}
