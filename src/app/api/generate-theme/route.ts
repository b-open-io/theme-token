import { generateObject } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Theme color schema for OKLCH colors
const oklchColorSchema = z.string().describe("OKLCH color value in format: oklch(L C H) where L=0-1, C=0-0.37, H=0-360");

// Schema for a single mode's style
const styleModeSchema = z.object({
	background: oklchColorSchema.describe("Page canvas - Light: L=0.95-0.99, tint with base hue. Dark: L=0.10-0.15, never pure black"),
	foreground: oklchColorSchema.describe("Base text - Light: L=0.10-0.20. Dark: L=0.90-0.98, avoid pure white"),
	card: oklchColorSchema.describe("Card backgrounds - Light: slightly darker than bg. Dark: slightly lighter than bg for elevation"),
	"card-foreground": oklchColorSchema.describe("Text on cards - must contrast with card background"),
	popover: oklchColorSchema.describe("Dropdowns/modals background - usually matches card"),
	"popover-foreground": oklchColorSchema.describe("Text on popovers"),
	primary: oklchColorSchema.describe("Main brand/action color - Light: L=0.45-0.65, C=0.12-0.25. Dark: L=0.60-0.75, reduce chroma 10-20%"),
	"primary-foreground": oklchColorSchema.describe("Text on primary - calculate for max contrast (white or near-black)"),
	secondary: oklchColorSchema.describe("Less prominent actions - derived from primary with reduced chroma"),
	"secondary-foreground": oklchColorSchema.describe("Text on secondary"),
	muted: oklchColorSchema.describe("Subtle/disabled backgrounds - low chroma"),
	"muted-foreground": oklchColorSchema.describe("Subtle text - reduced contrast from foreground"),
	accent: oklchColorSchema.describe("Hover states/highlights - from color harmony strategy"),
	"accent-foreground": oklchColorSchema.describe("Text on accent"),
	destructive: oklchColorSchema.describe("Error/danger - red/orange hue (H=15-30), high visibility"),
	"destructive-foreground": oklchColorSchema.describe("Text on destructive"),
	border: oklchColorSchema.describe("Borders for cards/inputs - low chroma, appropriate contrast"),
	input: oklchColorSchema.describe("Input field borders - often matches or slightly darker than border"),
	ring: oklchColorSchema.describe("Focus rings - usually matches primary or distinct accent"),
	radius: z.string().describe("Border radius: 0rem (sharp), 0.5rem (subtle), 0.75rem (rounded), 1rem (pill-like)"),
	"chart-1": oklchColorSchema.describe("Chart color 1 - distinct, harmonious with palette"),
	"chart-2": oklchColorSchema.describe("Chart color 2 - equidistant hue from chart-1"),
	"chart-3": oklchColorSchema.describe("Chart color 3 - distinguishable from 1 and 2"),
	"chart-4": oklchColorSchema.describe("Chart color 4 - maintains visual harmony"),
	"chart-5": oklchColorSchema.describe("Chart color 5 - completes the data viz palette"),
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

		// Expert-level system prompt for theme generation
		const systemPrompt = `You are the ShadCN Theme Architect, an expert AI specializing in advanced colorimetry, UI/UX design, and accessible web aesthetics. Generate professional, cohesive, and accessible color themes using the OKLCH color space.

## Core Philosophy
Construct colors mathematically based on:
1. Perceptual Uniformity: Leverage OKLCH for consistent perceived brightness
2. Semantic Logic: Colors defined by function (Action, Surface, Border, State)
3. Accessibility: WCAG AA minimum, AAA preferred contrast ratios
4. Hue Shifting: Use Bezold-Brücke shift where shadows cool and highlights warm for depth

## OKLCH Format
Output: oklch(L C H) - e.g., oklch(0.65 0.22 255)
- Lightness (L): 0.0 (black) to 1.0 (white)
- Chroma (C): 0.0 (gray) to ~0.37 (max saturation). Keep UI surfaces low chroma (<0.05) to avoid eye fatigue
- Hue (H): 0-360 degrees

## Light Mode Construction
- background: High lightness (0.95-0.99), tint slightly with base hue (C: 0.002-0.01)
- foreground: High contrast (L: 0.10-0.20), never pure black
- card: Slightly lower lightness than background (0.90-0.96) OR pure white if background is tinted
- primary: Main brand color, high chroma (0.12-0.25), lightness 0.45-0.65 for white text readability
- muted: Low chroma, mid-high lightness for de-emphasized elements
- border: Low chroma, high lightness but darker than background

## Dark Mode Construction (Rich Dark Method)
DO NOT just invert lightness. Create rich, premium dark themes:
- background: Low lightness (0.10-0.15), NEVER pure black. Tint with base hue (C: 0.01-0.03) for richness
- foreground: High lightness (0.90-0.98), avoid pure white to prevent eye strain
- primary: Shift lightness UP (0.60-0.75) vs light mode. REDUCE chroma 10-20% to prevent neon vibration
- card: Slightly LIGHTER than background (0.15-0.20) to simulate elevation
- muted: Darker than foreground, low chroma

## Semantic Relationships
- secondary: Derived from primary with reduced chroma or shifted hue
- accent: From harmony strategy (complementary, analogous, triadic, split-complementary)
- destructive: Red/orange hue (H: 15-30), high visibility
- ring: Usually matches primary or distinct accent
- chart-1 to chart-5: 5 distinct, harmonious colors equidistant in hue, distinguishable from each other

## Color Harmony Strategies
Based on user request mood, choose:
- Analogous: Adjacent hues (±30°) for calm, cohesive feel
- Complementary: Opposite hues (180°) for high contrast, energy
- Triadic: Three equidistant hues (120° apart) for vibrant, balanced
- Split-Complementary: Base + two colors adjacent to complement for nuanced contrast`;

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
			model: "google/gemini-3-pro-preview" as Parameters<typeof generateObject>[0]["model"],
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
