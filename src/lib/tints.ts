/**
 * Tints.dev local library integration
 * Generates harmonious color palettes from a single hex color
 * NO external API dependency - runs entirely client-side
 */

import { createPaletteFromNameValue } from "tints.dev";

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
	[key: string]: string;
}

const PALETTE_KEYS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"] as const;

/**
 * Type guard to validate that an object has all required palette keys
 */
function isTintsPalette(obj: Record<string, string>): obj is TintsPalette {
	return PALETTE_KEYS.every((key) => typeof obj[key] === "string");
}

/**
 * Generate a color palette locally using tints.dev algorithm
 * @param name - Name for the palette (e.g., "primary", "accent")
 * @param hex - Hex color without # (e.g., "2522FC")
 */
export function generateTintsPalette(
	name: string,
	hex: string,
): TintsPalette | null {
	try {
		// Remove # if present
		const cleanHex = hex.replace(/^#/, "");

		const result = createPaletteFromNameValue(name, cleanHex);

		if (result && result[name] && isTintsPalette(result[name])) {
			return result[name];
		}
		return null;
	} catch (error) {
		console.error("Failed to generate tints palette:", error);
		return null;
	}
}

/**
 * Async wrapper for compatibility with existing code
 * (Library is synchronous but we keep async interface)
 */
export async function fetchTintsPalette(
	name: string,
	hex: string,
): Promise<TintsPalette | null> {
	return generateTintsPalette(name, hex);
}

/**
 * Get all palette shades as an ordered array
 */
export function paletteToArray(
	palette: TintsPalette,
): { shade: string; color: string }[] {
	const shades = [
		"50",
		"100",
		"200",
		"300",
		"400",
		"500",
		"600",
		"700",
		"800",
		"900",
		"950",
	] as const;
	return shades.map((shade) => ({ shade, color: palette[shade] }));
}

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const cleanHex = hex.replace(/^#/, "");
	const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
	if (!result) return null;
	return {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16),
	};
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
	return (
		"#" +
		[r, g, b]
			.map((x) => {
				const hex = Math.round(x).toString(16);
				return hex.length === 1 ? "0" + hex : hex;
			})
			.join("")
	);
}
