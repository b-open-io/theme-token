/**
 * Font Loader - Load on-chain fonts from ORDFS by origin
 *
 * Re-exports core font loading from @theme-token/sdk and adds
 * website-specific extensions like metadata fetching.
 */

import {
	isOnChainPath,
	extractOrigin,
	loadFontByOrigin,
	isFontLoaded,
	getCachedFont,
	clearFontCache,
	getContentUrl,
	getOrdfsUrl,
	type LoadedFont,
} from "@theme-token/sdk";

// Re-export SDK functions with legacy names for backward compatibility
export {
	loadFontByOrigin,
	isFontLoaded,
	getCachedFont,
	clearFontCache,
	type LoadedFont,
};

// Alias exports to match previous API names
export const isOnChainFont = isOnChainPath;
export const extractOriginFromPath = extractOrigin;
export const getFontContentUrl = getContentUrl;

// Website-specific: Font metadata from MAP protocol
export interface FontMetadata {
	name: string;
	author?: string;
	license?: string;
	weight?: string;
	style?: string;
	prompt?: string;
	glyphCount?: number;
}

/**
 * Fetch font metadata from ORDFS (MAP data)
 * This is website-specific and not in the SDK
 */
export async function fetchFontMetadata(
	origin: string,
): Promise<FontMetadata | null> {
	try {
		// Fetch the ordinal data which includes MAP metadata
		const response = await fetch(getOrdfsUrl(origin));
		if (!response.ok) return null;

		// For fonts, the response might be binary, so we need to check content-type
		const contentType = response.headers.get("content-type");

		// If it's a font file, we need to fetch metadata from the API
		if (contentType?.includes("font")) {
			// Font binary - no metadata in this response
			return null;
		}

		// Try to parse as JSON (might be ordinal data with map)
		const data = await response.json();
		if (data?.map) {
			return {
				name: data.map.name || "Unknown Font",
				author: data.map.author,
				license: data.map.license,
				weight: data.map.weight || "400",
				style: data.map.style || "normal",
				prompt: data.map.prompt,
				glyphCount: data.map.glyphCount
					? parseInt(data.map.glyphCount)
					: undefined,
			};
		}

		return null;
	} catch {
		return null;
	}
}

/**
 * Get ORDFS metadata URL for a font origin
 * Re-exports SDK function for backwards compatibility
 */
export const getFontMetadataUrl = getOrdfsUrl;

/**
 * Load fonts for a theme's style mode
 * Uses SDK's loadFontByOrigin for on-chain fonts
 */
export async function loadThemeFonts(styles: {
	"font-sans"?: string;
	"font-serif"?: string;
	"font-mono"?: string;
}): Promise<Record<string, string>> {
	const loads: Promise<{ slot: string; familyName: string } | null>[] = [];
	const resolved: Record<string, string> = {};

	const slots = ["sans", "serif", "mono"] as const;

	for (const slot of slots) {
		const fontKey = `font-${slot}` as keyof typeof styles;
		const fontValue = styles[fontKey];

		if (fontValue && typeof fontValue === "string" && isOnChainPath(fontValue)) {
			// Extract origin from path like "/content/abc123_0"
			const origin = extractOrigin(fontValue);
			if (origin) {
				loads.push(
					loadFontByOrigin(origin).then((familyName) => {
						// Update CSS custom property with on-chain font
						document.documentElement.style.setProperty(
							`--font-${slot}`,
							`"${familyName}", system-ui, sans-serif`,
						);
						return { slot, familyName };
					}),
				);
			}
		}
		// If not an on-chain path, the existing Google Font handling in fonts.ts applies
	}

	const results = await Promise.all(loads);
	for (const result of results) {
		if (result) {
			resolved[result.slot] = result.familyName;
		}
	}

	return resolved;
}
