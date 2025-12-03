import { generateText } from "ai";
import { type NextRequest, NextResponse } from "next/server";

type ColorMode = "theme" | "currentColor" | "grayscale";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { prompt, colorMode } = body as { prompt: string; colorMode: ColorMode };

		if (!prompt?.trim()) {
			return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
		}

		// Build color instruction based on mode
		let colorInstruction: string;
		switch (colorMode) {
			case "currentColor":
				colorInstruction = `Use "currentColor" for all stroke and fill attributes. This allows the pattern to inherit the color from CSS.`;
				break;
			case "theme":
				colorInstruction = `Use explicit colors that work well on any background. Prefer dark grays (#333, #444) for strokes.`;
				break;
			case "grayscale":
				colorInstruction = `Use only grayscale colors (#333, #666, #999) for all strokes and fills.`;
				break;
		}

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

## COLOR MODE
${colorInstruction}

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

		const userPrompt = `Create a seamless tileable SVG pattern: ${prompt}

Remember:
- Output ONLY valid SVG code, nothing else
- Use ${colorMode === "currentColor" ? "currentColor" : "explicit colors"} for strokes/fills
- Keep it simple and minimal
- Ensure perfect edge-to-edge tiling`;

		const { text: svgResult } = await generateText({
			model: "google/gemini-2.0-flash" as Parameters<typeof generateText>[0]["model"],
			system: systemPrompt,
			prompt: userPrompt,
			maxOutputTokens: 2000,
		});

		// Extract SVG from response (in case there's any extra text)
		const svgMatch = svgResult.match(/<svg[\s\S]*<\/svg>/);
		if (!svgMatch) {
			return NextResponse.json(
				{ error: "Failed to generate valid SVG" },
				{ status: 500 },
			);
		}

		const svg = svgMatch[0];

		// Validate SVG has basic structure
		if (!svg.includes("<pattern") || !svg.includes("</pattern>")) {
			// If no pattern element, try to generate a simpler fallback
			return NextResponse.json(
				{ error: "Generated SVG does not contain a pattern element. Please try a simpler description." },
				{ status: 500 },
			);
		}

		return NextResponse.json({ svg });
	} catch (error) {
		console.error("Pattern generation error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to generate pattern",
			},
			{ status: 500 },
		);
	}
}
