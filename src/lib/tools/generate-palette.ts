import { tool } from "ai";
import { z } from "zod";

/**
 * AI SDK Tool for generating color palettes via tints.dev
 *
 * This tool allows the AI to generate a full 50-950 color scale
 * from any hex color, following the tints.dev philosophy of
 * creating harmonious, accessible color palettes.
 *
 * Usage in generateObject/generateText:
 * ```ts
 * import { generatePaletteTool } from "@/lib/tools/generate-palette";
 *
 * const result = await generateText({
 *   model: myModel,
 *   tools: { generatePalette: generatePaletteTool },
 *   prompt: "Create a theme with a blue primary color"
 * });
 * ```
 */

export interface TintsPalette {
	"50": string;
	"100": string;
	"200": string;
	"300": string;
	"400": string;
	"500": string;
	"600": string;
	"700": string;
	"800": string;
	"900": string;
	"950": string;
}

interface TintsResponse {
	[name: string]: TintsPalette;
}

async function fetchTintsPalette(
	name: string,
	hex: string,
): Promise<TintsPalette | null> {
	try {
		const cleanHex = hex.replace(/^#/, "");
		const response = await fetch(
			`https://www.tints.dev/api/${encodeURIComponent(name)}/${encodeURIComponent(cleanHex)}`,
		);

		if (!response.ok) {
			console.error("tints.dev API error:", response.status);
			return null;
		}

		const data: TintsResponse = await response.json();
		return data[name] ?? null;
	} catch (error) {
		console.error("Failed to fetch tints palette:", error);
		return null;
	}
}

/**
 * Generate Palette Tool
 *
 * Takes a hex color and returns a full 50-950 color scale in OKLCH format.
 * The AI can use this to build harmonious themes from a single base color.
 */
export const generatePaletteTool = tool({
	description: `Generate a complete 50-950 color palette from a single hex color using tints.dev.
Returns colors in OKLCH format which is perceptually uniform and ideal for UI design.
Use this tool when you need to:
- Create a full color scale from a brand/primary color
- Generate harmonious shades for backgrounds, borders, and text
- Build accessible color combinations

The returned palette includes:
- 50: Lightest tint (great for subtle backgrounds)
- 100-400: Light shades (backgrounds, borders, disabled states)
- 500: Base color (primary actions, main brand)
- 600-800: Dark shades (text, active states)
- 900-950: Darkest shades (headings, high contrast text)`,
	inputSchema: z.object({
		hex: z
			.string()
			.describe("Hex color code (with or without #), e.g., '3B82F6' or '#3B82F6'"),
		name: z
			.string()
			.default("primary")
			.describe("Name for the palette, e.g., 'primary', 'accent', 'brand'"),
	}),
	execute: async ({ hex, name }) => {
		const palette = await fetchTintsPalette(name, hex);

		if (!palette) {
			return {
				success: false,
				error: "Failed to generate palette from tints.dev",
			};
		}

		return {
			success: true,
			name,
			sourceHex: hex.startsWith("#") ? hex : `#${hex}`,
			palette,
			usage: {
				"50": "Subtle backgrounds, hover states on light mode",
				"100": "Light backgrounds, disabled button fills",
				"200": "Borders on light mode, secondary backgrounds",
				"300": "Icons, less prominent borders",
				"400": "Placeholder text, disabled text",
				"500": "Primary buttons, links, main brand color",
				"600": "Hover state for primary, dark mode links",
				"700": "Active/pressed state, focus rings",
				"800": "Headings, important text on light backgrounds",
				"900": "High contrast text, dark mode backgrounds",
				"950": "Darkest text, dark mode card backgrounds",
			},
		};
	},
});

/**
 * Convenience type for the tool result
 */
export type GeneratePaletteResult =
	| {
			success: true;
			name: string;
			sourceHex: string;
			palette: TintsPalette;
			usage: Record<string, string>;
	  }
	| {
			success: false;
			error: string;
	  };
