/**
 * Font Loader - Load on-chain fonts from ORDFS by origin
 *
 * Re-exports core font loading from @theme-token/sdk and adds
 * website-specific extensions like metadata fetching.
 */

import {
	clearFontCache,
	extractOrigin,
	getCachedFont,
	isFontLoaded,
	isOnChainPath,
	type LoadedFont,
	loadFontByOrigin,
} from "@theme-token/sdk";

import {
	extractUploadedFontId,
	isUploadedFontPath,
	useFontUploadStore,
} from "@/lib/stores/font-upload-store";
import { fetchOrdinalsMetadata } from "@/lib/yours-wallet";

// Re-export SDK functions with legacy names for backward compatibility
export {
	clearFontCache,
	getCachedFont,
	isFontLoaded,
	type LoadedFont,
	loadFontByOrigin,
};

// Alias exports to match previous API names
export const isOnChainFont = isOnChainPath;
export const extractOriginFromPath = extractOrigin;

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
 * Fetch font metadata (the on-chain MAP record) for a font package.
 *
 * Read from the GorillaPool index rather than the bare ORDFS origin: font
 * packages are `ord-fs/json` directories, so a bare-origin fetch resolves the
 * directory (not the MAP) — the MAP lives on the directory inscription, which
 * the index returns directly. Website-specific, not in the SDK.
 */
export async function fetchFontMetadata(
	origin: string,
): Promise<FontMetadata | null> {
	try {
		const [meta] = await fetchOrdinalsMetadata([origin]);
		const map = meta?.map;
		if (!map) return null;

		const str = (v: unknown): string | undefined =>
			typeof v === "string" ? v : undefined;

		return {
			name: str(map.name) ?? "Unknown Font",
			author: str(map.author),
			license: str(map.license),
			weight: str(map["font.weight"]) ?? str(map.weight) ?? "400",
			style: str(map.style) ?? "normal",
			prompt: str(map.prompt),
			glyphCount: str(map.glyphCount)
				? Number.parseInt(str(map.glyphCount) as string, 10)
				: undefined,
		};
	} catch {
		return null;
	}
}

/**
 * Load fonts for a theme's style mode
 * Uses SDK's loadFontByOrigin for on-chain fonts
 * Also handles uploaded fonts from the font upload store
 */
export async function loadThemeFonts(styles: {
	"font-sans"?: string;
	"font-heading"?: string;
	"font-serif"?: string;
	"font-mono"?: string;
}): Promise<Record<string, string>> {
	const loads: Promise<{ slot: string; familyName: string } | null>[] = [];
	const resolved: Record<string, string> = {};

	const slots = ["sans", "heading", "serif", "mono"] as const;

	for (const slot of slots) {
		const fontKey = `font-${slot}` as keyof typeof styles;
		const fontValue = styles[fontKey];

		if (!fontValue || typeof fontValue !== "string") continue;

		// Handle uploaded fonts (not yet inscribed)
		if (isUploadedFontPath(fontValue)) {
			const fontId = extractUploadedFontId(fontValue);
			if (fontId) {
				loads.push(
					(async () => {
						try {
							const store = useFontUploadStore.getState();
							const familyName = await store.loadFontForPreview(fontId);
							// Update CSS custom property
							document.documentElement.style.setProperty(
								`--font-${slot}`,
								`"${familyName}", system-ui, sans-serif`,
							);
							return { slot, familyName };
						} catch {
							return null;
						}
					})(),
				);
			}
			continue;
		}

		// Handle on-chain fonts
		if (isOnChainPath(fontValue)) {
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
		// If not an on-chain or uploaded path, the existing Google Font handling in fonts.ts applies
	}

	const results = await Promise.all(loads);
	for (const result of results) {
		if (result) {
			resolved[result.slot] = result.familyName;
		}
	}

	return resolved;
}
