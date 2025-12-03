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
		const systemPrompt = `You are an expert SVG pattern designer. Generate a seamless, tileable SVG pattern based on the user's description.

## Technical Requirements
1. Use SVG <pattern> element inside <defs> for true seamless tiling
2. Use viewBox="0 0 100 100" for the root SVG
3. Pattern dimensions should be 10-30 units for good tile density
4. Keep patterns simple and minimal - aim for under 2KB total
5. Use patternUnits="userSpaceOnUse" for predictable scaling

## Color Requirement
${colorInstruction}

## Pattern Guidelines
- Dot patterns: Use small circles (r="1" to r="3")
- Grid patterns: Use thin strokes (0.5px to 2px)
- Line patterns: Ensure lines connect at edges for seamless tiling
- Geometric patterns: Use clean, precise shapes
- Keep stroke-width between 0.5 and 2 for subtle textures

## Output Format
Return ONLY valid SVG code, no explanation. The SVG must:
- Start with <svg and end with </svg>
- Include xmlns="http://www.w3.org/2000/svg"
- Have width="100" height="100" viewBox="0 0 100 100"
- Use <defs><pattern>...</pattern></defs><rect width="100%" height="100%" fill="url(#pattern)"/>

## Example Structure
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <defs>
    <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <!-- Pattern elements here -->
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#pattern)"/>
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
