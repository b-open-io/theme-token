import type { ThemeStyleProps, ThemeToken, ThemeBundle } from "@theme-token/sdk";
import type { BundleAssetType, BundleItem } from "@/hooks/use-yours-wallet";
import { Utils } from "@bsv/sdk";

/** Unicode-safe base64 encoding using @bsv/sdk */
function toBase64(str: string): string {
	return Utils.toBase64(Utils.toArray(str, "utf8"));
}

/**
 * Bundle Builder - Helpers for creating multi-output inscriptions
 *
 * Creates bundles with proper {{vout:N}} placeholder references that the
 * registry gateway will resolve to absolute ORDFS URLs at serve time.
 */

/** Asset slot types that can be bundled with a theme */
export type ThemeAssetSlot =
	| "sans"
	| "serif"
	| "mono"
	| "pattern"
	| "wallpaper";

/** Asset to include in a theme bundle */
export interface ThemeBundleAsset {
	/** Slot this asset fills (font-sans, pattern, etc.) */
	slot: ThemeAssetSlot;
	/** Base64-encoded asset data */
	base64Data: string;
	/** MIME type of the asset */
	mimeType: string;
	/** Optional name for metadata */
	name?: string;
}

/** Options for building a theme bundle */
export interface BuildThemeBundleOptions {
	/** The theme to bundle */
	theme: ThemeToken;
	/** Assets to include (will be inscribed before theme) */
	assets: ThemeBundleAsset[];
	/** Optional prompt that generated this bundle */
	prompt?: string;
	/** Optional provider (e.g., "gemini") */
	provider?: string;
	/** Optional model (e.g., "gemini-3-pro") */
	model?: string;
}

/** Result of building a theme bundle */
export interface ThemeBundleResult {
	/** Items ready for inscribeBundle() - assets first, theme last */
	items: BundleItem[];
	/** The theme JSON with {{vout:N}} references (what will be inscribed) */
	themeWithRefs: ThemeToken;
	/** Mapping of asset slots to vout indices */
	assetVouts: Record<ThemeAssetSlot, number>;
}

/** Map slot names to theme style properties */
const SLOT_TO_PROP: Record<ThemeAssetSlot, keyof ThemeStyleProps> = {
	sans: "font-sans",
	serif: "font-serif",
	mono: "font-mono",
	pattern: "background" as keyof ThemeStyleProps, // Stored as custom property
	wallpaper: "background" as keyof ThemeStyleProps, // Stored as custom property
};

/** Map slot names to bundle asset types */
const SLOT_TO_TYPE: Record<ThemeAssetSlot, BundleAssetType> = {
	sans: "font",
	serif: "font",
	mono: "font",
	pattern: "pattern",
	wallpaper: "wallpaper",
};

/**
 * Build a theme bundle with proper {{vout:N}} references
 *
 * Assets are placed first (vout 0, 1, 2...) so the theme (inscribed last)
 * can reference them with placeholders like {{vout:0}}.
 *
 * @example
 * ```ts
 * const { items, themeWithRefs } = buildThemeBundle({
 *   theme: myTheme,
 *   assets: [
 *     { slot: "sans", base64Data: fontBase64, mimeType: "font/woff2" },
 *     { slot: "pattern", base64Data: patternBase64, mimeType: "image/svg+xml" },
 *   ],
 * });
 *
 * // items[0] = font at vout 0
 * // items[1] = pattern at vout 1
 * // items[2] = theme at vout 2 with "font-sans": "{{vout:0}}", etc.
 *
 * const result = await inscribeBundle(items);
 * // result.origins = ["txid_0", "txid_1", "txid_2"]
 * ```
 */
export function buildThemeBundle(
	options: BuildThemeBundleOptions,
): ThemeBundleResult {
	const { theme, assets, prompt, provider, model } = options;

	// Track which vout each asset will be at
	const assetVouts: Record<ThemeAssetSlot, number> = {} as Record<
		ThemeAssetSlot,
		number
	>;

	// Build bundle items - assets first
	const items: BundleItem[] = assets.map((asset, index) => {
		assetVouts[asset.slot] = index;

		return {
			type: SLOT_TO_TYPE[asset.slot],
			base64Data: asset.base64Data,
			mimeType: asset.mimeType,
			name: asset.name,
			metadata: prompt ? { prompt } : undefined,
		};
	});

	// Build the theme with {{vout:N}} references
	const themeWithRefs = buildThemeWithVoutRefs(theme, assets, assetVouts);

	// Add bundle metadata to theme
	const bundleMetadata: ThemeBundle = {
		version: 1,
		assets: assets.map((asset, index) => ({
			vout: index,
			type: SLOT_TO_TYPE[asset.slot] as
				| "font"
				| "pattern"
				| "wallpaper"
				| "icon",
			slot: asset.slot,
		})),
	};

	// Merge bundle info into theme
	const finalTheme: ThemeToken = {
		...themeWithRefs,
		bundle: bundleMetadata,
	};

	// Convert theme to base64 for inscription
	const themeJson = JSON.stringify(finalTheme);
	const themeBase64 = toBase64(themeJson);

	// Add theme as last item
	items.push({
		type: "theme",
		base64Data: themeBase64,
		mimeType: "application/json",
		name: theme.name,
		metadata: {
			...(prompt && { prompt }),
			...(provider && { provider }),
			...(model && { model }),
		},
	});

	return {
		items,
		themeWithRefs: finalTheme,
		assetVouts,
	};
}

/**
 * Build theme with {{vout:N}} references for bundled assets
 */
function buildThemeWithVoutRefs(
	theme: ThemeToken,
	assets: ThemeBundleAsset[],
	assetVouts: Record<ThemeAssetSlot, number>,
): ThemeToken {
	const result = JSON.parse(JSON.stringify(theme)) as ThemeToken;

	// Update light and dark styles with vout references
	for (const mode of ["light", "dark"] as const) {
		const styles = result.styles[mode];
		if (!styles) continue;

		for (const asset of assets) {
			const vout = assetVouts[asset.slot];
			const voutRef = `{{vout:${vout}}}`;

			// Handle font slots
			if (
				asset.slot === "sans" ||
				asset.slot === "serif" ||
				asset.slot === "mono"
			) {
				const prop = SLOT_TO_PROP[asset.slot] as string;
				(styles as Record<string, string>)[prop] = voutRef;
			}

			// Handle pattern/wallpaper - store as custom CSS variable
			if (asset.slot === "pattern") {
				(styles as Record<string, string>)["--bg-pattern"] = voutRef;
			}
			if (asset.slot === "wallpaper") {
				(styles as Record<string, string>)["--hero-image"] = voutRef;
			}
		}
	}

	return result;
}

/**
 * Calculate the estimated transaction size for a bundle
 *
 * @param items Bundle items to estimate
 * @returns Estimated size in bytes
 */
export function estimateBundleSize(items: BundleItem[]): number {
	return items.reduce((total, item) => {
		// Estimate decoded base64 size
		const cleanBase64 = item.base64Data.replace(/^data:[^;]+;base64,/, "");
		const dataSize = Math.floor((cleanBase64.length * 3) / 4);
		// Add overhead for inscription envelope (~50 bytes) and metadata (~200 bytes)
		return total + dataSize + 250;
	}, 0);
}

/**
 * Calculate the inscription cost for a bundle
 *
 * @param itemCount Number of items in bundle
 * @returns Cost in satoshis
 */
export function calculateBundleCost(itemCount: number): number {
	// 1 sat per inscription output
	return itemCount;
}

// ============================================================================
// Block/Component Bundle Building
// ============================================================================

/** File entry from generated block/component (before inscription) */
export interface RegistryFile {
	path: string;
	type: string;
	content: string;
	vout?: number;
}

/** File entry in inscribed manifest (content omitted, vout reference only) */
export interface RegistryFileRef {
	path: string;
	type: string;
	vout: number;
}

/** Generated registry manifest (block or component) - input with content */
export interface RegistryManifest {
	name: string;
	type: "registry:block" | "registry:component";
	description: string;
	dependencies: string[];
	registryDependencies: string[];
	files: RegistryFile[];
}

/** Inscribed registry manifest - content replaced with vout refs */
export interface InscribedRegistryManifest {
	name: string;
	type: "registry:block" | "registry:component";
	description: string;
	dependencies: string[];
	registryDependencies: string[];
	files: RegistryFileRef[];
}

/** Options for building a block/component bundle */
export interface BuildRegistryBundleOptions {
	/** The manifest containing metadata and files */
	manifest: RegistryManifest;
	/** Optional author name */
	author?: string;
}

/** Result of building a registry bundle */
export interface RegistryBundleResult {
	/** Items ready for inscribeBundle() - manifest first, then files */
	items: BundleItem[];
	/** The manifest JSON with vout references (what will be inscribed at vout 0) */
	manifestWithRefs: InscribedRegistryManifest;
}

/**
 * Build a block/component bundle with proper {{vout:N}} references
 *
 * Structure:
 * - vout 0: Manifest JSON (application/json) with file references
 * - vout 1+: Code files (text/plain)
 *
 * @example
 * ```ts
 * const { items } = buildRegistryBundle({
 *   manifest: {
 *     name: "pricing-table",
 *     type: "registry:block",
 *     files: [
 *       { path: "pricing-table.tsx", type: "registry:block", content: "..." },
 *       { path: "hooks/use-pricing.ts", type: "registry:hook", content: "..." },
 *     ],
 *   },
 * });
 *
 * // items[0] = manifest at vout 0 with files[0].vout = 1, files[1].vout = 2
 * // items[1] = pricing-table.tsx at vout 1
 * // items[2] = use-pricing.ts at vout 2
 *
 * const result = await inscribeBundle(items);
 * // CLI fetches: themetoken.dev/r/blocks/{txid}_0
 * // Gateway hydrates content from _1, _2
 * ```
 */
export function buildRegistryBundle(
	options: BuildRegistryBundleOptions,
): RegistryBundleResult {
	const { manifest, author } = options;
	const items: BundleItem[] = [];

	// Build manifest with vout references
	// Files go at vout 1, 2, 3... (manifest is at vout 0)
	const manifestWithRefs: InscribedRegistryManifest = {
		name: manifest.name,
		type: manifest.type,
		description: manifest.description,
		dependencies: manifest.dependencies,
		registryDependencies: manifest.registryDependencies,
		files: manifest.files.map((file, index) => ({
			path: file.path,
			type: file.type,
			vout: index + 1, // vout 0 is manifest, files start at 1
			// content is NOT included - gateway will hydrate from vout
		})),
	};

	// First item: Manifest JSON at vout 0
	const manifestJson = JSON.stringify(manifestWithRefs, null, 2);
	const manifestBase64 = toBase64(manifestJson);

	items.push({
		type: manifest.type === "registry:block" ? "block" : "component",
		base64Data: manifestBase64,
		mimeType: "application/json",
		name: manifest.name,
		metadata: {
			registryType: manifest.type,
			...(author && { author }),
		},
	});

	// Remaining items: Code files at vout 1, 2, 3...
	for (const file of manifest.files) {
		const fileBase64 = toBase64(file.content);
		items.push({
			type: "file",
			base64Data: fileBase64,
			mimeType: "text/plain",
			name: file.path,
			metadata: {
				registryType: file.type,
				path: file.path,
			},
		});
	}

	return {
		items,
		manifestWithRefs,
	};
}
