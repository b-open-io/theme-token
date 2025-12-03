import { generateObject } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FONT_NAMES, SYSTEM_FONTS } from "@/lib/fonts";
import { generateTintsPalette } from "@/lib/tints";

// Theme color schema for OKLCH colors
const oklchColorSchema = z
	.string()
	.describe(
		"OKLCH color value in format: oklch(L C H) where L=0-1, C=0-0.37, H=0-360",
	);

// Schema for a single mode's style
const styleModeSchema = z.object({
	background: oklchColorSchema.describe(
		"Page canvas - Light: L=0.95-0.99, tint with base hue. Dark: L=0.10-0.15, never pure black",
	),
	foreground: oklchColorSchema.describe(
		"Base text - Light: L=0.10-0.20. Dark: L=0.90-0.98, avoid pure white",
	),
	card: oklchColorSchema.describe(
		"Card backgrounds - Light: slightly darker than bg. Dark: slightly lighter than bg for elevation",
	),
	"card-foreground": oklchColorSchema.describe(
		"Text on cards - must contrast with card background",
	),
	popover: oklchColorSchema.describe(
		"Dropdowns/modals background - usually matches card",
	),
	"popover-foreground": oklchColorSchema.describe("Text on popovers"),
	primary: oklchColorSchema.describe(
		"Main brand/action color - Light: L=0.45-0.65, C=0.12-0.25. Dark: L=0.60-0.75, reduce chroma 10-20%",
	),
	"primary-foreground": oklchColorSchema.describe(
		"Text on primary - calculate for max contrast (white or near-black)",
	),
	secondary: oklchColorSchema.describe(
		"Less prominent actions - derived from primary with reduced chroma",
	),
	"secondary-foreground": oklchColorSchema.describe("Text on secondary"),
	muted: oklchColorSchema.describe(
		"Subtle/disabled backgrounds - low chroma",
	),
	"muted-foreground": oklchColorSchema.describe(
		"Subtle text - reduced contrast from foreground",
	),
	accent: oklchColorSchema.describe(
		"Hover states/highlights - from color harmony strategy",
	),
	"accent-foreground": oklchColorSchema.describe("Text on accent"),
	destructive: oklchColorSchema.describe(
		"Error/danger - red/orange hue (H=15-30), high visibility",
	),
	"destructive-foreground": oklchColorSchema.describe("Text on destructive"),
	border: oklchColorSchema.describe(
		"Borders for cards/inputs - low chroma, appropriate contrast",
	),
	input: oklchColorSchema.describe(
		"Input field borders - often matches or slightly darker than border",
	),
	ring: oklchColorSchema.describe(
		"Focus rings - usually matches primary or distinct accent",
	),
	radius: z
		.string()
		.describe(
			"Border radius: 0rem (sharp), 0.5rem (subtle), 0.75rem (rounded), 1rem (pill-like)",
		),
	"chart-1": oklchColorSchema.describe(
		"Chart color 1 - distinct, harmonious with palette",
	),
	"chart-2": oklchColorSchema.describe(
		"Chart color 2 - equidistant hue from chart-1",
	),
	"chart-3": oklchColorSchema.describe(
		"Chart color 3 - distinguishable from 1 and 2",
	),
	"chart-4": oklchColorSchema.describe(
		"Chart color 4 - maintains visual harmony",
	),
	"chart-5": oklchColorSchema.describe(
		"Chart color 5 - completes the data viz palette",
	),
	"font-sans": z
		.string()
		.optional()
		.describe(
			'Sans-serif font family. Format: "FontName", fallback-stack. Example: "Inter", ui-sans-serif, system-ui, sans-serif',
		),
	"font-serif": z
		.string()
		.optional()
		.describe(
			'Serif font family. Format: "FontName", fallback-stack. Example: "Playfair Display", ui-serif, Georgia, serif',
		),
	"font-mono": z
		.string()
		.optional()
		.describe(
			'Monospace font family. Format: "FontName", fallback-stack. Example: "JetBrains Mono", ui-monospace, monospace',
		),
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

		// If primaryColor provided, generate palette locally using tints.dev library
		let paletteContext = "";
		if (primaryColor) {
			const palette = generateTintsPalette("primary", primaryColor);
			if (palette) {
				paletteContext = `
## Pre-Generated Primary Palette (from tints.dev)
You MUST use these exact OKLCH values from the generated palette:
- 50 (lightest): ${palette["50"]}
- 100: ${palette["100"]}
- 200: ${palette["200"]}
- 300: ${palette["300"]}
- 400: ${palette["400"]}
- 500 (base): ${palette["500"]}
- 600: ${palette["600"]}
- 700: ${palette["700"]}
- 800: ${palette["800"]}
- 900: ${palette["900"]}
- 950 (darkest): ${palette["950"]}

Use these for:
- Light mode primary: Use shade 500-600
- Dark mode primary: Use shade 400-500 (lighter for dark backgrounds)
- Light mode background: Use shade 50 with reduced chroma OR derive from it
- Dark mode card: Consider using shade 900-950 tones
- Borders: Derive from 200-300 shades
- Muted elements: Use 100-200 for light, 800-900 for dark`;
			}
		}

		// Expert-level system prompt for theme generation
		const systemPrompt = `You are the ShadCN Theme Architect, an expert AI specializing in advanced colorimetry, UI/UX design, and accessible web aesthetics. Generate professional, cohesive, and accessible color themes using the OKLCH color space.

## Core Philosophy (tints.dev approach)
Build complete themes from a single base color by generating a full 10-shade spectrum.
Key principles from Refactoring UI and tints.dev:
1. UI design requires "light and shade" - multiple variations of each color for backgrounds, borders, text, hover states
2. Don't just mathematically lighten/darken - adjust saturation at extremes (the "V" curve)
3. Slightly shift hue at light/dark ends for natural feel (cooler darks, warmer lights)
4. Never use pure black (#000) or pure white (#fff) - pull extremes inward for comfort

## OKLCH Format
Output: oklch(L C H) - e.g., oklch(0.65 0.22 255)
- Lightness (L): 0.0 (black) to 1.0 (white)
- Chroma (C): 0.0 (gray) to ~0.37 (max saturation)
- Hue (H): 0-360 degrees

## Light Mode Construction
- background: L=0.97-0.99, very low chroma (0.005-0.015), tinted with primary hue
- foreground: L=0.15-0.25, never pure black
- card: L=0.94-0.98, slightly darker than bg OR pure white if bg is tinted
- primary: Use provided palette shade 500-600, high chroma
- secondary: Reduced chroma from primary, L=0.90-0.95
- muted: L=0.92-0.96, very low chroma
- border: L=0.85-0.90, low chroma

## Dark Mode Construction (Rich Dark Method)
DO NOT just invert. Create premium dark themes:
- background: L=0.12-0.18, tinted with primary hue (C: 0.01-0.03)
- foreground: L=0.92-0.97, slightly warm
- card: L=0.16-0.22, slightly lighter than bg for elevation
- primary: Use provided palette shade 400-500 (lighter than light mode)
- muted: L=0.22-0.28, low chroma

## Accessibility
- Text on backgrounds: minimum 4.5:1 contrast (WCAG AA)
- Large text/UI: minimum 3:1 contrast
- Primary buttons: ensure foreground has 4.5:1+ against primary
${paletteContext}

## Color Harmony
- accent: Shift hue 30-60° from primary (analogous) or 180° (complementary)
- destructive: H=20-35 (red-orange), high visibility
- chart-1 to chart-5: Equidistant hues, all distinguishable

## Typography (Google Fonts)
Select fonts that complement the theme's personality. Always include fallback stacks.

### Available Sans-Serif Fonts (--font-sans)
${FONT_NAMES.sans.join(", ")}

### Available Serif Fonts (--font-serif)
${FONT_NAMES.serif.join(", ")}

### Available Monospace Fonts (--font-mono)
${FONT_NAMES.mono.join(", ")}

### Font Format
Always use this format: "FontName", ${SYSTEM_FONTS.sans}
Examples:
- "Inter", ${SYSTEM_FONTS.sans}
- "Playfair Display", ${SYSTEM_FONTS.serif}
- "JetBrains Mono", ${SYSTEM_FONTS.mono}

### Font Pairing Guidelines
- Modern/Tech: Inter or Space Grotesk + JetBrains Mono
- Elegant/Luxury: Playfair Display (headings) + Lora (body)
- Playful: Poppins or Nunito + Fira Code
- Professional: IBM Plex Sans + IBM Plex Mono
- Minimalist: DM Sans or Outfit + Source Code Pro`;

		let userPrompt = prompt || "Generate a modern, professional theme";

		// Add constraints from filters
		if (primaryColor && !paletteContext) {
			userPrompt += `\n\nIMPORTANT: The primary color MUST be based on ${primaryColor}.`;
		}
		if (radius) {
			userPrompt += `\n\nBorder radius MUST be exactly: ${radius}`;
		}
		if (style) {
			userPrompt += `\n\nStyle preference: ${style}`;
		}

		const { object: theme } = await generateObject({
			model: "google/gemini-3-pro-preview" as Parameters<
				typeof generateObject
			>[0]["model"],
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
			{
				error:
					error instanceof Error ? error.message : "Failed to generate theme",
			},
			{ status: 500 },
		);
	}
}
