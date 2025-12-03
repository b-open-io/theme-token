/**
 * Tints.dev API integration
 * Generates harmonious color palettes from a single hex color
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

export interface TintsResponse {
	[name: string]: TintsPalette;
}

/**
 * Fetch a color palette from tints.dev API via our proxy
 * @param name - Name for the palette (e.g., "primary", "accent")
 * @param hex - Hex color without # (e.g., "2522FC")
 */
export async function fetchTintsPalette(
	name: string,
	hex: string,
): Promise<TintsPalette | null> {
	try {
		// Remove # if present
		const cleanHex = hex.replace(/^#/, "");

		// Use our API proxy to avoid CORS issues
		const response = await fetch(
			`/api/tints?name=${encodeURIComponent(name)}&hex=${encodeURIComponent(cleanHex)}`,
		);

		if (!response.ok) {
			console.error("tints API error:", response.status);
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
