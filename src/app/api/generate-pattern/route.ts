import { generateText, streamText } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { patternTools, tokenToCss, type Token } from "@/lib/tools/pattern-tools";
import {
	validatePatternSvg,
	sanitizeSvg,
	extractPatternMeta,
	ensureSeamlessStructure,
} from "@/lib/pattern-validation";
import {
	generators,
	type GeneratorType,
	type GridParams,
	type WaveParams,
	type TopoParams,
} from "@/lib/pattern-generators";
import type { ScatterParams, LineParams, NoiseParams } from "@/lib/tools/pattern-tools";

type ColorMode = "theme" | "currentColor" | "grayscale";

interface PatternRequest {
	prompt: string;
	colorMode?: ColorMode;
	seed?: string;
	// Optional: use procedural generator directly
	generator?: GeneratorType;
	generatorParams?: Record<string, unknown>;
	// Streaming mode
	stream?: boolean;
	// Augmentation mode - AI modifies existing pattern
	mode?: "generate" | "augment";
	existingSvg?: string;
	currentParams?: Record<string, unknown>;
}

// Build tool descriptions for the system prompt
const toolDescriptions = Object.entries(patternTools)
	.map(([name, tool]) => `- ${name}: ${tool.description?.split("\n")[0] || "No description"}`)
	.join("\n");

// Token reference for the prompt
const tokenList = Object.keys(tokenToCss).join(", ");

// Expert prompt for generating seamless SVG patterns
const systemPrompt = `You are an SVG pattern generator creating seamless, tileable patterns.

## OUTPUT REQUIREMENTS
- Output ONLY valid SVG markup, no explanation or markdown
- Use viewBox="0 0 100 100" for consistent coordinates
- Use patternUnits="userSpaceOnUse" for the pattern element

## SVG STRUCTURE (always follow this exactly)
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <defs>
    <pattern id="p" width="[tile-width]" height="[tile-height]" patternUnits="userSpaceOnUse">
      <!-- pattern shapes here -->
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#p)"/>
</svg>

## SEAMLESS TILING RULES (Critical!)
- Any shape touching LEFT edge (x=0) must be duplicated at RIGHT edge (x=tile-width)
- Any shape touching TOP edge (y=0) must be duplicated at BOTTOM edge (y=tile-height)
- Corner shapes must appear at all 4 corners

## COLOR TOKENS
Use these CSS variable tokens for theme-aware colors: ${tokenList}
Prefer "currentColor" for single-color patterns that inherit from CSS.

## AVAILABLE TOOLS
You have tools to modify patterns after generation:
${toolDescriptions}

## EXAMPLES

Polka Dot Grid (offset pattern):
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <defs>
    <pattern id="p" width="50" height="50" patternUnits="userSpaceOnUse">
      <circle cx="25" cy="25" r="8" fill="currentColor"/>
      <circle cx="0" cy="0" r="8" fill="currentColor"/>
      <circle cx="50" cy="0" r="8" fill="currentColor"/>
      <circle cx="0" cy="50" r="8" fill="currentColor"/>
      <circle cx="50" cy="50" r="8" fill="currentColor"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#p)"/>
</svg>

Diagonal Lines:
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <defs>
    <pattern id="p" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M-5,5 l10,-10 M0,20 l20,-20 M15,25 l10,-10" stroke="currentColor" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#p)"/>
</svg>

Hexagon Grid:
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <defs>
    <pattern id="p" width="28" height="49" patternUnits="userSpaceOnUse">
      <path d="M14 0 L28 8 L28 24 L14 32 L0 24 L0 8 Z M14 32 L28 40 L28 56 L14 64 L0 56 L0 40 Z M0 24 L14 16 L28 24 M0 56 L14 48 L28 56" fill="none" stroke="currentColor" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#p)"/>
</svg>

Waves:
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <defs>
    <pattern id="p" width="100" height="20" patternUnits="userSpaceOnUse">
      <path d="M0 10 C25 0, 75 20, 100 10" fill="none" stroke="currentColor" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#p)"/>
</svg>

Circuit Board:
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <defs>
    <pattern id="p" width="50" height="50" patternUnits="userSpaceOnUse">
      <circle cx="25" cy="25" r="3" fill="currentColor"/>
      <circle cx="0" cy="0" r="2" fill="currentColor"/>
      <circle cx="50" cy="0" r="2" fill="currentColor"/>
      <circle cx="0" cy="50" r="2" fill="currentColor"/>
      <circle cx="50" cy="50" r="2" fill="currentColor"/>
      <path d="M25 25 L25 0 M25 25 L50 25 M0 0 L0 25 L25 25" fill="none" stroke="currentColor" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#p)"/>
</svg>`;

// Augmentation prompt - AI modifies existing pattern
const augmentSystemPrompt = `You are an SVG pattern editor that modifies existing patterns.

## YOUR TASK
You will receive an existing SVG pattern and instructions on how to modify it.
Analyze the pattern, then apply the requested changes.

## AVAILABLE TOOLS
You have these tools to modify the pattern:
${toolDescriptions}

## MODIFICATION GUIDELINES
- Preserve the pattern structure (keep the <pattern> element and patternUnits)
- Maintain seamless tiling - any edge modifications must tile correctly
- Use "currentColor" for theme-aware colors
- Keep modifications minimal and targeted
- Output the complete modified SVG

## OUTPUT
Return ONLY the modified SVG markup, no explanation.`;

function buildUserPrompt(prompt: string, colorMode: ColorMode): string {
	let colorInstruction: string;
	switch (colorMode) {
		case "currentColor":
			colorInstruction = "currentColor";
			break;
		case "theme":
			colorInstruction = "theme tokens (primary, secondary, accent, etc.)";
			break;
		case "grayscale":
			colorInstruction = "grayscale values only (#333, #666, #999)";
			break;
	}

	return `Create a seamless tileable SVG pattern: ${prompt}

Remember:
- Output ONLY valid SVG code, nothing else
- Use ${colorInstruction} for strokes/fills
- Keep it simple and minimal
- Ensure perfect edge-to-edge tiling`;
}

/**
 * Handle procedural generator request
 */
function handleProceduralGen(
	generator: GeneratorType,
	params: Record<string, unknown>,
	seed?: string
): { svg: string; seed: string } {
	const p = { ...params, seed };
	switch (generator) {
		case "scatter":
			return generators.scatter(p as ScatterParams);
		case "grid":
			return generators.grid(p as GridParams);
		case "lines":
			return generators.lines(p as LineParams);
		case "waves":
			return generators.waves(p as WaveParams);
		case "noise":
			return generators.noise(p as NoiseParams);
		case "topo":
			return generators.topo(p as TopoParams);
		default:
			throw new Error(`Unknown generator: ${generator}`);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as PatternRequest;
		const { prompt, colorMode = "currentColor", seed, generator, generatorParams, stream, mode, existingSvg, currentParams } = body;

		// Handle procedural generator mode
		if (generator && generators[generator]) {
			const result = handleProceduralGen(generator, generatorParams || {}, seed);
			const validation = validatePatternSvg(result.svg);

			return NextResponse.json({
				svg: result.svg,
				seed: result.seed,
				provider: "procedural",
				model: generator,
				validation,
			});
		}

		// AI generation mode
		if (!prompt?.trim()) {
			return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
		}

		// Augmentation mode - modify existing pattern
		const isAugment = mode === "augment" && existingSvg;
		
		let userPrompt: string;
		let activeSystemPrompt: string;
		
		if (isAugment) {
			activeSystemPrompt = augmentSystemPrompt;
			userPrompt = `Here is the current SVG pattern:
\`\`\`svg
${existingSvg}
\`\`\`

Current parameters: ${JSON.stringify(currentParams || {}, null, 2)}

Modification request: ${prompt.trim()}

Apply the requested changes and return the modified SVG.`;
		} else {
			activeSystemPrompt = systemPrompt;
			userPrompt = buildUserPrompt(prompt.trim(), colorMode);
		}

		// Streaming mode
		if (stream) {
			const result = await streamText({
				model: "google/gemini-2.0-flash" as Parameters<typeof streamText>[0]["model"],
				system: activeSystemPrompt,
				prompt: userPrompt,
				tools: patternTools,
			});

			// Return streaming response
			return new Response(result.textStream as unknown as ReadableStream, {
				headers: {
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache",
					Connection: "keep-alive",
				},
			});
		}

		// Non-streaming mode
		const { text: svgResult, toolCalls: resultToolCalls } = await generateText({
			model: "google/gemini-2.0-flash" as Parameters<typeof generateText>[0]["model"],
			system: activeSystemPrompt,
			prompt: userPrompt,
			tools: patternTools,
		});

		// Extract SVG from response
		const svgMatch = svgResult.match(/<svg[\s\S]*<\/svg>/);
		if (!svgMatch) {
			return NextResponse.json(
				{ error: "Failed to generate valid SVG" },
				{ status: 500 }
			);
		}

		let svg = svgMatch[0];

		// Validate
		const validation = validatePatternSvg(svg);
		if (!validation.valid) {
			// Try to sanitize and re-validate
			svg = sanitizeSvg(svg);
			const revalidation = validatePatternSvg(svg);
			if (!revalidation.valid) {
				return NextResponse.json(
					{
						error: "Generated SVG failed validation",
						details: revalidation.errors,
					},
					{ status: 500 }
				);
			}
		}

		// Ensure proper structure
		svg = ensureSeamlessStructure(svg);

		// Extract metadata
		const meta = extractPatternMeta(svg);

		// Collect tool calls (toolCalls use 'input' in AI SDK v5)
		const toolCalls = (resultToolCalls || [])
			.map((tc) => ({ name: tc.toolName, input: "input" in tc ? tc.input : undefined }));

		return NextResponse.json({
			svg,
			seed: seed || Math.random().toString(36).substring(2, 10),
			provider: "google",
			model: "gemini-2.0-flash",
			mode: isAugment ? "augment" : "generate",
			meta,
			toolCalls,
			validation: {
				valid: true,
				warnings: validation.warnings,
			},
		});
	} catch (error) {
		console.error("Pattern generation error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to generate pattern",
			},
			{ status: 500 }
		);
	}
}
