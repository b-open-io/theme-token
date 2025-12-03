/**
 * Color utilities for OKLCH color distance calculation
 */

export interface OklchColor {
	l: number; // Lightness 0-1
	c: number; // Chroma 0-0.4
	h: number; // Hue 0-360
}

/**
 * Parse OKLCH string to components
 * Handles formats: "oklch(0.5 0.2 180)" or "oklch(50% 0.2 180)"
 */
export function parseOklch(oklchString: string): OklchColor | null {
	const match = oklchString.match(
		/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*\)/i,
	);
	if (!match) return null;

	let l = Number.parseFloat(match[1]);
	// Handle percentage format
	if (match[1].includes("%")) {
		l = l / 100;
	}

	return {
		l,
		c: Number.parseFloat(match[2]),
		h: Number.parseFloat(match[3]),
	};
}

/**
 * Calculate perceptual color distance between two OKLCH colors
 * Uses weighted Euclidean distance accounting for hue circularity
 */
export function getColorDistance(colorA: OklchColor, colorB: OklchColor): number {
	const dL = colorA.l - colorB.l;
	const dC = colorA.c - colorB.c;

	// Hue is circular (0-360), find shortest path
	let dH = colorA.h - colorB.h;
	if (dH > 180) dH -= 360;
	if (dH < -180) dH += 360;

	// Weight hue less when chroma is low (gray colors have meaningless hue)
	const avgChroma = (colorA.c + colorB.c) / 2;
	const hueWeight = Math.min(avgChroma * 2, 0.5);

	return Math.sqrt(
		(dL * 100) ** 2 + // Lightness: scale up for importance
		(dC * 100) ** 2 + // Chroma: scale up
		(dH * hueWeight) ** 2, // Hue: weighted by chroma
	);
}

/**
 * Convert hex color to OKLCH (approximate)
 * For use with color picker input
 */
export function hexToOklch(hex: string): OklchColor {
	// Remove # if present
	hex = hex.replace(/^#/, "");

	// Parse RGB
	const r = Number.parseInt(hex.slice(0, 2), 16) / 255;
	const g = Number.parseInt(hex.slice(2, 4), 16) / 255;
	const b = Number.parseInt(hex.slice(4, 6), 16) / 255;

	// Convert to linear RGB
	const toLinear = (c: number) =>
		c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	const lr = toLinear(r);
	const lg = toLinear(g);
	const lb = toLinear(b);

	// RGB to XYZ (D65)
	const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb;
	const y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb;
	const z = 0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb;

	// XYZ to OKLab
	const l_ = 0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z;
	const m_ = 0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z;
	const s_ = 0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z;

	const l_3 = Math.cbrt(l_);
	const m_3 = Math.cbrt(m_);
	const s_3 = Math.cbrt(s_);

	const L = 0.2104542553 * l_3 + 0.793617785 * m_3 - 0.0040720468 * s_3;
	const a = 1.9779984951 * l_3 - 2.428592205 * m_3 + 0.4505937099 * s_3;
	const bVal = 0.0259040371 * l_3 + 0.7827717662 * m_3 - 0.808675766 * s_3;

	// OKLab to OKLCH
	const c = Math.sqrt(a * a + bVal * bVal);
	let h = (Math.atan2(bVal, a) * 180) / Math.PI;
	if (h < 0) h += 360;

	return { l: L, c, h };
}

/**
 * Convert OKLCH to hex color (approximate)
 * For displaying selected color in color picker input
 */
export function oklchToHex(oklch: OklchColor): string {
	const { l: L, c, h } = oklch;

	// OKLCH to OKLab
	const hRad = (h * Math.PI) / 180;
	const a = c * Math.cos(hRad);
	const bVal = c * Math.sin(hRad);

	// OKLab to linear RGB (via LMS)
	const l_ = L + 0.3963377774 * a + 0.2158037573 * bVal;
	const m_ = L - 0.1055613458 * a - 0.0638541728 * bVal;
	const s_ = L - 0.0894841775 * a - 1.291485548 * bVal;

	const l = l_ ** 3;
	const m = m_ ** 3;
	const s = s_ ** 3;

	// LMS to linear RGB
	let lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
	let lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
	let lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

	// Clamp to valid range
	lr = Math.max(0, Math.min(1, lr));
	lg = Math.max(0, Math.min(1, lg));
	lb = Math.max(0, Math.min(1, lb));

	// Linear to sRGB
	const toSrgb = (c: number) =>
		c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

	const r = Math.round(toSrgb(lr) * 255);
	const g = Math.round(toSrgb(lg) * 255);
	const b = Math.round(toSrgb(lb) * 255);

	return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Color presets for quick filtering
 */
export const colorPresets = [
	{ name: "Zinc", hex: "#71717a", label: "Neutral" },
	{ name: "Red", hex: "#ef4444", label: "Warm" },
	{ name: "Orange", hex: "#f97316", label: "Warm" },
	{ name: "Amber", hex: "#f59e0b", label: "Warm" },
	{ name: "Green", hex: "#22c55e", label: "Natural" },
	{ name: "Teal", hex: "#14b8a6", label: "Cool" },
	{ name: "Blue", hex: "#3b82f6", label: "Cool" },
	{ name: "Violet", hex: "#8b5cf6", label: "Cool" },
	{ name: "Pink", hex: "#ec4899", label: "Warm" },
] as const;

/**
 * Radius presets
 */
export const radiusPresets = [
	{ value: "0", label: "Sharp", className: "rounded-none" },
	{ value: "0.375rem", label: "Subtle", className: "rounded-md" },
	{ value: "0.5rem", label: "Medium", className: "rounded-lg" },
	{ value: "0.75rem", label: "Soft", className: "rounded-xl" },
	{ value: "1rem", label: "Round", className: "rounded-2xl" },
] as const;
