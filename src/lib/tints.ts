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

/**
 * Rotate hue by a given number of degrees
 */
export function rotateHue(hex: string, degrees: number): string {
	// Remove # if present
	const cleanHex = hex.replace(/^#/, "");

	// Parse RGB (0-1 scale)
	let r = parseInt(cleanHex.substring(0, 2), 16) / 255;
	let g = parseInt(cleanHex.substring(2, 4), 16) / 255;
	let b = parseInt(cleanHex.substring(4, 6), 16) / 255;

	// RGB to HSL
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}

	// Rotate by specified degrees
	h = (h + degrees / 360) % 1;
	if (h < 0) h += 1;

	// HSL back to RGB
	const hue2rgb = (p: number, q: number, t: number) => {
		let tt = t;
		if (tt < 0) tt += 1;
		if (tt > 1) tt -= 1;
		if (tt < 1 / 6) return p + (q - p) * 6 * tt;
		if (tt < 1 / 2) return q;
		if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
		return p;
	};

	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;

	r = hue2rgb(p, q, h + 1 / 3);
	g = hue2rgb(p, q, h);
	b = hue2rgb(p, q, h - 1 / 3);

	// RGB to Hex
	const toHex = (x: number) => {
		const hx = Math.round(x * 255).toString(16);
		return hx.length === 1 ? "0" + hx : hx;
	};

	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Get complementary color by rotating hue 180 degrees
 */
export function getComplementaryColor(hex: string): string {
	return rotateHue(hex, 180);
}

/**
 * Get triadic color by rotating hue 120 degrees
 */
export function getTriadicColor(hex: string): string {
	return rotateHue(hex, 120);
}

/**
 * Get split-complementary colors (150° and 210°)
 */
export function getSplitComplementaryColors(hex: string): [string, string] {
	return [rotateHue(hex, 150), rotateHue(hex, 210)];
}

/**
 * Get analogous colors (30° apart)
 */
export function getAnalogousColors(hex: string): [string, string] {
	return [rotateHue(hex, -30), rotateHue(hex, 30)];
}

