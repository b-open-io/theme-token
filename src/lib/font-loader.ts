/**
 * Font Loader - Load on-chain fonts from ORDFS by origin
 *
 * Fetches WOFF2 font files inscribed on the blockchain and registers
 * them as FontFace objects for use in themes.
 *
 * Font values can be:
 * - Google Font name: "Inter", "Roboto"
 * - System font: "system-ui", "Arial"
 * - On-chain path: "/content/{outpoint}" - loads from ORDFS
 */

const ORDFS_BASE = "https://ordfs.network";

/**
 * Check if a font value is an on-chain path
 */
export function isOnChainFont(fontValue: string): boolean {
	return fontValue.startsWith("/content/");
}

/**
 * Extract the outpoint/origin from an on-chain font path
 * e.g., "/content/abc123_0" -> "abc123_0"
 */
export function extractOriginFromPath(fontPath: string): string | null {
	if (!fontPath.startsWith("/content/")) return null;
	return fontPath.slice("/content/".length);
}

export interface LoadedFont {
	origin: string;
	familyName: string;
	fontFace: FontFace;
	metadata?: FontMetadata;
}

export interface FontMetadata {
	name: string;
	author?: string;
	license?: string;
	weight?: string;
	style?: string;
	aiGenerated?: boolean;
	glyphCount?: number;
}

// Memory cache for loaded fonts
const fontCache = new Map<string, LoadedFont>();

// Loading promises to prevent duplicate fetches
const loadingPromises = new Map<string, Promise<string>>();

/**
 * Generate a unique font family name from an origin
 */
function generateFamilyName(origin: string): string {
	// Use first 8 chars of origin for a readable unique name
	return `OnChain-${origin.slice(0, 8)}`;
}

/**
 * Fetch font metadata from ORDFS (MAP data)
 */
export async function fetchFontMetadata(
	origin: string,
): Promise<FontMetadata | null> {
	try {
		// Fetch the ordinal data which includes MAP metadata
		const response = await fetch(`${ORDFS_BASE}/${origin}`);
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
				aiGenerated: data.map.aiGenerated === "true",
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
 * Load a font from ORDFS by its origin and register it
 * Returns the generated font family name for use in CSS
 */
export async function loadFontByOrigin(origin: string): Promise<string> {
	// Return cached font family name if already loaded
	const cached = fontCache.get(origin);
	if (cached) {
		return cached.familyName;
	}

	// If already loading, wait for that promise
	const existing = loadingPromises.get(origin);
	if (existing) {
		return existing;
	}

	// Create loading promise
	const loadPromise = (async () => {
		try {
			// Fetch font file from ORDFS
			const response = await fetch(`${ORDFS_BASE}/content/${origin}`);
			if (!response.ok) {
				throw new Error(`Failed to fetch font: ${response.status}`);
			}

			const buffer = await response.arrayBuffer();

			// Determine format from content-type
			const contentType = response.headers.get("content-type") || "font/woff2";
			let format = "woff2";
			if (contentType.includes("woff2")) format = "woff2";
			else if (contentType.includes("woff")) format = "woff";
			else if (contentType.includes("ttf") || contentType.includes("truetype"))
				format = "truetype";
			else if (contentType.includes("otf") || contentType.includes("opentype"))
				format = "opentype";

			// Generate unique family name
			const familyName = generateFamilyName(origin);

			// Create FontFace and load it
			const fontFace = new FontFace(familyName, buffer, {
				style: "normal",
				weight: "400",
			});

			await fontFace.load();
			document.fonts.add(fontFace);

			// Cache the result
			const loadedFont: LoadedFont = {
				origin,
				familyName,
				fontFace,
			};
			fontCache.set(origin, loadedFont);

			return familyName;
		} finally {
			loadingPromises.delete(origin);
		}
	})();

	loadingPromises.set(origin, loadPromise);
	return loadPromise;
}

/**
 * Get a cached font by origin (doesn't load if not cached)
 */
export function getCachedFont(origin: string): LoadedFont | undefined {
	return fontCache.get(origin);
}

/**
 * Check if a font is cached
 */
export function isFontCached(origin: string): boolean {
	return fontCache.has(origin);
}

/**
 * Clear font cache (useful for testing or memory management)
 */
export function clearFontCache(): void {
	// Remove all fonts from document.fonts
	for (const loaded of fontCache.values()) {
		document.fonts.delete(loaded.fontFace);
	}
	fontCache.clear();
}

/**
 * Load fonts for a theme's style mode
 * Detects on-chain fonts by checking for "/content/" prefix
 * Returns an object mapping slots to their resolved font family names
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

		if (fontValue && typeof fontValue === "string" && isOnChainFont(fontValue)) {
			// Extract origin from path like "/content/abc123_0"
			const origin = extractOriginFromPath(fontValue);
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

/**
 * Get ORDFS content URL for a font origin
 */
export function getFontContentUrl(origin: string): string {
	return `${ORDFS_BASE}/content/${origin}`;
}

/**
 * Get ORDFS metadata URL for a font origin
 */
export function getFontMetadataUrl(origin: string): string {
	return `${ORDFS_BASE}/${origin}`;
}
