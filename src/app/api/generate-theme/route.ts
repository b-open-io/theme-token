import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Theme color schema for OKLCH colors
const oklchColorSchema = z.string().describe("OKLCH color value like oklch(0.65 0.22 255)");

// Schema for a single mode's style
const styleModeSchema = z.object({
	background: oklchColorSchema.describe("Main background color - light for light mode, dark for dark mode"),
	foreground: oklchColorSchema.describe("Main text color - dark for light mode, light for dark mode"),
	card: oklchColorSchema.describe("Card/surface background color"),
	"card-foreground": oklchColorSchema.describe("Card text color"),
	popover: oklchColorSchema.describe("Popover/dropdown background"),
	"popover-foreground": oklchColorSchema.describe("Popover text color"),
	primary: oklchColorSchema.describe("Primary brand/action color"),
	"primary-foreground": oklchColorSchema.describe("Text on primary color"),
	secondary: oklchColorSchema.describe("Secondary/subtle action color"),
	"secondary-foreground": oklchColorSchema.describe("Text on secondary color"),
	muted: oklchColorSchema.describe("Muted/disabled background"),
	"muted-foreground": oklchColorSchema.describe("Muted text color"),
	accent: oklchColorSchema.describe("Accent/highlight color"),
	"accent-foreground": oklchColorSchema.describe("Text on accent"),
	destructive: oklchColorSchema.describe("Error/danger color (usually red)"),
	"destructive-foreground": oklchColorSchema.describe("Text on destructive"),
	border: oklchColorSchema.describe("Border color"),
	input: oklchColorSchema.describe("Input field border color"),
	ring: oklchColorSchema.describe("Focus ring color"),
	radius: z.string().describe("Border radius like 0.5rem, 0.75rem, 1rem"),
	"chart-1": oklchColorSchema.optional().describe("First chart color"),
	"chart-2": oklchColorSchema.optional().describe("Second chart color"),
	"chart-3": oklchColorSchema.optional().describe("Third chart color"),
	"chart-4": oklchColorSchema.optional().describe("Fourth chart color"),
	"chart-5": oklchColorSchema.optional().describe("Fifth chart color"),
});

// Full theme schema
const themeSchema = z.object({
	name: z.string().describe("Creative theme name"),
	light: styleModeSchema.describe("Light mode colors"),
	dark: styleModeSchema.describe("Dark mode colors"),
});

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { prompt, primaryColor, radius, style } = body;

		// Build the generation prompt
		let systemPrompt = `You are a professional UI/UX designer specializing in design systems and color theory.
Generate a cohesive ShadCN-compatible theme using OKLCH color format.

OKLCH format: oklch(lightness chroma hue)
- Lightness: 0-1 (0=black, 1=white)
- Chroma: 0-0.4 (0=gray, higher=more saturated)
- Hue: 0-360 degrees (0=red, 120=green, 240=blue)

Key principles:
1. Light mode: backgrounds should be light (L > 0.9), foregrounds dark (L < 0.3)
2. Dark mode: backgrounds should be dark (L < 0.2), foregrounds light (L > 0.85)
3. Maintain good contrast ratios (WCAG AA: 4.5:1 for text)
4. Primary color should be vibrant but readable
5. Chart colors should be distinct and visually pleasing
6. Keep consistent hue families for cohesion`;

		let userPrompt = prompt || "Generate a modern, professional theme";

		// Add constraints from filters
		if (primaryColor) {
			userPrompt += `\n\nIMPORTANT: The primary color MUST be ${primaryColor} or very close to it.`;
		}
		if (radius) {
			userPrompt += `\n\nBorder radius MUST be exactly: ${radius}`;
		}
		if (style) {
			userPrompt += `\n\nStyle preference: ${style}`;
		}

		const { object: theme } = await generateObject({
			model: google("gemini-2.5-flash"),
			schema: themeSchema,
			system: systemPrompt,
			prompt: userPrompt,
		});

		// Transform to ThemeToken format
		const themeToken = {
			$schema: "https://themetoken.dev/v1/schema.json",
			name: theme.name,
			author: "AI Generated",
			styles: {
				light: theme.light,
				dark: theme.dark,
			},
		};

		return NextResponse.json({ theme: themeToken });
	} catch (error) {
		console.error("Theme generation error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to generate theme" },
			{ status: 500 },
		);
	}
}
