/**
 * Font system for Theme Token
 * Supports dynamic Google Fonts loading and on-chain fonts via ORDFS
 */

import { isOnChainFont, extractOriginFromPath, loadFontByOrigin } from "./font-loader";

// Available font categories with Google Fonts support
export const FONT_CATALOG = {
	sans: [
		{ name: "Inter", value: "Inter", weights: [400, 500, 600, 700] },
		{ name: "DM Sans", value: "DM Sans", weights: [400, 500, 600, 700] },
		{ name: "Geist", value: "Geist", weights: [400, 500, 600, 700] },
		{ name: "IBM Plex Sans", value: "IBM Plex Sans", weights: [400, 500, 600, 700] },
		{ name: "Montserrat", value: "Montserrat", weights: [400, 500, 600, 700] },
		{ name: "Open Sans", value: "Open Sans", weights: [400, 500, 600, 700] },
		{ name: "Outfit", value: "Outfit", weights: [400, 500, 600, 700] },
		{ name: "Plus Jakarta Sans", value: "Plus Jakarta Sans", weights: [400, 500, 600, 700] },
		{ name: "Poppins", value: "Poppins", weights: [400, 500, 600, 700] },
		{ name: "Roboto", value: "Roboto", weights: [400, 500, 700] },
		{ name: "Space Grotesk", value: "Space Grotesk", weights: [400, 500, 600, 700] },
		{ name: "Nunito", value: "Nunito", weights: [400, 500, 600, 700] },
		{ name: "Lato", value: "Lato", weights: [400, 700] },
		{ name: "Raleway", value: "Raleway", weights: [400, 500, 600, 700] },
		{ name: "Work Sans", value: "Work Sans", weights: [400, 500, 600, 700] },
		{ name: "Manrope", value: "Manrope", weights: [400, 500, 600, 700, 800] },
		{ name: "Sora", value: "Sora", weights: [400, 500, 600, 700] },
	],
	serif: [
		{ name: "Libre Baskerville", value: "Libre Baskerville", weights: [400, 700] },
		{ name: "Lora", value: "Lora", weights: [400, 500, 600, 700] },
		{ name: "Merriweather", value: "Merriweather", weights: [400, 700] },
		{ name: "Playfair Display", value: "Playfair Display", weights: [400, 500, 600, 700] },
		{ name: "Source Serif 4", value: "Source Serif 4", weights: [400, 500, 600, 700] },
		{ name: "Crimson Pro", value: "Crimson Pro", weights: [400, 500, 600, 700] },
		{ name: "EB Garamond", value: "EB Garamond", weights: [400, 500, 600, 700] },
		{ name: "Cormorant", value: "Cormorant", weights: [400, 500, 600, 700] },
		{ name: "Spectral", value: "Spectral", weights: [400, 500, 600, 700] },
		{ name: "Bitter", value: "Bitter", weights: [400, 500, 600, 700] },
	],
	mono: [
		{ name: "Fira Code", value: "Fira Code", weights: [400, 500, 600, 700] },
		{ name: "Geist Mono", value: "Geist Mono", weights: [400, 500, 600, 700] },
		{ name: "IBM Plex Mono", value: "IBM Plex Mono", weights: [400, 500, 600, 700] },
		{ name: "JetBrains Mono", value: "JetBrains Mono", weights: [400, 500, 600, 700] },
		{ name: "Roboto Mono", value: "Roboto Mono", weights: [400, 500, 700] },
		{ name: "Source Code Pro", value: "Source Code Pro", weights: [400, 500, 600, 700] },
		{ name: "Space Mono", value: "Space Mono", weights: [400, 700] },
		{ name: "Inconsolata", value: "Inconsolata", weights: [400, 500, 600, 700] },
		{ name: "Ubuntu Mono", value: "Ubuntu Mono", weights: [400, 700] },
	],
	display: [
		{ name: "Architects Daughter", value: "Architects Daughter", weights: [400] },
		{ name: "Oxanium", value: "Oxanium", weights: [400, 500, 600, 700] },
		{ name: "Righteous", value: "Righteous", weights: [400] },
		{ name: "Bebas Neue", value: "Bebas Neue", weights: [400] },
		{ name: "Abril Fatface", value: "Abril Fatface", weights: [400] },
		{ name: "Josefin Sans", value: "Josefin Sans", weights: [400, 500, 600, 700] },
		{ name: "Fredoka", value: "Fredoka", weights: [400, 500, 600, 700] },
	],
} as const;

// System font stacks for fallbacks
export const SYSTEM_FONTS = {
	sans: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
	serif: "ui-serif, Georgia, Cambria, Times New Roman, serif",
	mono: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace",
};

// All fonts flattened for lookup
export const ALL_FONTS = [
	...FONT_CATALOG.sans.map((f) => ({ ...f, category: "sans" as const })),
	...FONT_CATALOG.serif.map((f) => ({ ...f, category: "serif" as const })),
	...FONT_CATALOG.mono.map((f) => ({ ...f, category: "mono" as const })),
	...FONT_CATALOG.display.map((f) => ({ ...f, category: "display" as const })),
];

// Font names for AI prompt
export const FONT_NAMES = {
	sans: FONT_CATALOG.sans.map((f) => f.name),
	serif: FONT_CATALOG.serif.map((f) => f.name),
	mono: FONT_CATALOG.mono.map((f) => f.name),
	display: FONT_CATALOG.display.map((f) => f.name),
};

// Cache for loaded fonts
const loadedFonts = new Set<string>();

/**
 * Extract font family name from CSS font-family value
 * e.g. '"Inter", sans-serif' -> 'Inter'
 */
export function extractFontFamily(fontValue: string): string | null {
	if (!fontValue) return null;

	// Remove quotes and get first font family
	const match = fontValue.match(/^["']?([^"',]+)["']?/);
	if (!match) return null;

	const fontName = match[1].trim();

	// Check if it's a system font
	const systemFonts = [
		"ui-sans-serif",
		"ui-serif",
		"ui-monospace",
		"system-ui",
		"-apple-system",
		"BlinkMacSystemFont",
		"sans-serif",
		"serif",
		"monospace",
	];
	if (systemFonts.includes(fontName.toLowerCase())) return null;

	return fontName;
}

/**
 * Check if a font is a Google Font we support
 */
export function isGoogleFont(fontName: string): boolean {
	return ALL_FONTS.some(
		(f) => f.name.toLowerCase() === fontName.toLowerCase(),
	);
}

/**
 * Get font info by name
 */
export function getFontInfo(fontName: string) {
	return ALL_FONTS.find(
		(f) => f.name.toLowerCase() === fontName.toLowerCase(),
	);
}

/**
 * Build Google Fonts URL for a font
 */
export function buildGoogleFontUrl(fontName: string, weights?: readonly number[]): string {
	const fontInfo = getFontInfo(fontName);
	const fontWeights = weights || fontInfo?.weights || [400, 500, 600, 700];

	const encodedFamily = encodeURIComponent(fontName);
	const weightsParam = fontWeights.join(";");

	return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weightsParam}&display=swap`;
}

/**
 * Load a Google Font dynamically
 */
export function loadGoogleFont(fontName: string): void {
	if (typeof window === "undefined") return;
	if (loadedFonts.has(fontName)) return;

	const fontInfo = getFontInfo(fontName);
	if (!fontInfo) return;

	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = buildGoogleFontUrl(fontName, fontInfo.weights);
	document.head.appendChild(link);

	loadedFonts.add(fontName);
}

/**
 * Load all fonts from a theme (Google Fonts and on-chain fonts)
 */
export async function loadThemeFonts(theme: {
	styles: {
		light: Record<string, string>;
		dark: Record<string, string>;
	};
}): Promise<void> {
	const fontKeys = ["font-sans", "font-serif", "font-mono"] as const;
	const onChainLoads: Promise<string>[] = [];

	for (const key of fontKeys) {
		const lightValue = theme.styles.light[key];
		const darkValue = theme.styles.dark[key];

		for (const value of [lightValue, darkValue]) {
			if (!value) continue;

			// Check if it's an on-chain font
			if (isOnChainFont(value)) {
				const origin = extractOriginFromPath(value);
				if (origin) {
					onChainLoads.push(
						loadFontByOrigin(origin).then((familyName) => {
							// Update CSS custom property with the loaded font family
							const slot = key.replace("font-", "") as "sans" | "serif" | "mono";
							document.documentElement.style.setProperty(
								`--font-${slot}`,
								`"${familyName}", ${SYSTEM_FONTS[slot]}`
							);
							return familyName;
						})
					);
				}
			} else {
				// Google Font or system font
				const fontName = extractFontFamily(value);
				if (fontName && isGoogleFont(fontName)) {
					loadGoogleFont(fontName);
				}
			}
		}
	}

	// Wait for all on-chain fonts to load
	if (onChainLoads.length > 0) {
		await Promise.all(onChainLoads);
	}
}

/**
 * Build CSS font-family value with fallbacks
 */
export function buildFontFamily(
	fontName: string,
	category: "sans" | "serif" | "mono",
): string {
	return `"${fontName}", ${SYSTEM_FONTS[category]}`;
}

/**
 * Get AI-friendly font documentation for prompts
 */
export function getFontDocumentation(): string {
	return `## Available Fonts

Fonts can be specified as Google Font names or on-chain font paths.

### Google Fonts

#### Sans-Serif Fonts (--font-sans)
${FONT_NAMES.sans.join(", ")}

#### Serif Fonts (--font-serif)
${FONT_NAMES.serif.join(", ")}

#### Monospace Fonts (--font-mono)
${FONT_NAMES.mono.join(", ")}

#### Display/Decorative Fonts
${FONT_NAMES.display.join(", ")}

### On-Chain Fonts
Reference inscribed fonts using the path format: /content/{txid}_{vout}
Example: /content/abc123def456_0

These fonts are loaded from ORDFS (Ordinals File System) at runtime.

### Font Format
Google Fonts: "FontName", fallback-stack
Example: "Inter", ui-sans-serif, system-ui, sans-serif

On-Chain: /content/{origin}
Example: /content/abc123def_0

### Recommendations
- Sans-serif: Inter, DM Sans, Space Grotesk for modern UI
- Serif: Playfair Display for elegant headings, Lora for readable body
- Monospace: JetBrains Mono, Fira Code for code blocks
- Display: Use sparingly for headings only
- On-chain: Use for unique custom fonts inscribed on blockchain`;
}
