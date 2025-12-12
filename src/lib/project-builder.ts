/**
 * Project Builder - Build registry:base bundles for on-chain inscription
 *
 * Creates multi-output bundles that include:
 * - Font files (woff2)
 * - Icon sprites (svg)
 * - Wallpapers (png)
 * - Project manifest (json) with {{vout:N}} references
 */

import { Utils } from "@bsv/sdk";
import type { ThemeToken } from "@theme-token/sdk";
import type { BundleItem } from "@/hooks/use-yours-wallet";
import {
	type ProjectManifest,
	type ProjectConfig,
	type ProjectBundle,
	type ProjectAsset,
	type IconLibrary,
	createProjectManifest,
	ICON_LIBRARY_PACKAGES,
} from "./project-types";

/** Unicode-safe base64 encoding */
function toBase64(str: string): string {
	return Utils.toBase64(Utils.toArray(str, "utf8"));
}

/**
 * Asset to include in a project bundle
 */
export interface ProjectBundleAsset {
	/** Asset type */
	type: "font" | "icons" | "wallpaper";
	/** Base64-encoded asset data */
	base64Data: string;
	/** MIME type */
	mimeType: string;
	/** Slot identifier (e.g., "sans" for fonts) */
	slot?: string;
	/** Icon library name (for icons type) */
	library?: IconLibrary;
	/** Display name */
	name?: string;
}

/**
 * Options for building a project bundle
 */
export interface BuildProjectBundleOptions {
	/** Base theme for the project */
	theme: ThemeToken;
	/** Project configuration */
	config: Partial<ProjectConfig>;
	/** Assets to bundle (fonts, icons, wallpaper) */
	assets?: ProjectBundleAsset[];
	/** Author identifier (paymail or identity) */
	author?: string;
}

/**
 * Result of building a project bundle
 */
export interface ProjectBundleResult {
	/** Items ready for inscribeBundle() - assets first, manifest last */
	items: BundleItem[];
	/** The project manifest with {{vout:N}} references */
	manifest: ProjectManifest;
	/** Mapping of asset types to vout indices */
	assetVouts: Map<string, number>;
}

/**
 * Build a project bundle for on-chain inscription
 *
 * Structure:
 * - vout 0..N-1: Asset files (fonts, icons, wallpapers)
 * - vout N: Project manifest (application/json)
 *
 * @example
 * ```ts
 * const { items, manifest } = buildProjectBundle({
 *   theme: myTheme,
 *   config: { iconLibrary: "hugeicons", menuAccent: "bold" },
 *   assets: [
 *     { type: "font", base64Data: fontData, mimeType: "font/woff2", slot: "sans" },
 *     { type: "icons", base64Data: spriteData, mimeType: "image/svg+xml", library: "hugeicons" },
 *   ],
 * });
 *
 * // items[0] = font at vout 0
 * // items[1] = icons at vout 1
 * // items[2] = manifest at vout 2 with registryDependencies: ["utils", "{{vout:0}}"]
 *
 * const result = await inscribeBundle(items);
 * // Use: bunx shadcn create --preset "https://themetoken.dev/init?project={origin}"
 * ```
 */
export function buildProjectBundle(
	options: BuildProjectBundleOptions,
): ProjectBundleResult {
	const { theme, config, assets = [], author } = options;

	// Track vout assignments
	const assetVouts = new Map<string, number>();
	const bundleAssets: ProjectAsset[] = [];
	const items: BundleItem[] = [];

	// Add assets first (vout 0, 1, 2...)
	for (const asset of assets) {
		const vout = items.length;
		const key = asset.type === "font" ? `font-${asset.slot}` : asset.type;
		assetVouts.set(key, vout);

		bundleAssets.push({
			vout,
			type: asset.type,
			...(asset.slot && { slot: asset.slot }),
			...(asset.library && { library: asset.library }),
		});

		items.push({
			type: asset.type === "icons" ? "file" : asset.type,
			base64Data: asset.base64Data,
			mimeType: asset.mimeType,
			name: asset.name,
			metadata: {
				projectAsset: "true",
				assetType: asset.type,
				...(asset.slot && { slot: asset.slot }),
				...(asset.library && { library: asset.library }),
			},
		});
	}

	// Build registry dependencies with vout references for fonts
	const registryDependencies: string[] = ["utils"];
	for (const asset of assets) {
		if (asset.type === "font" && asset.slot) {
			const vout = assetVouts.get(`font-${asset.slot}`);
			if (vout !== undefined) {
				registryDependencies.push(`{{vout:${vout}}}`);
			}
		}
	}

	// Create bundle metadata
	const bundle: ProjectBundle | undefined =
		bundleAssets.length > 0
			? {
					version: 2,
					assets: bundleAssets,
				}
			: undefined;

	// Create manifest
	const manifest = createProjectManifest(theme, config, bundle);

	// Update registryDependencies with font references
	manifest.registryDependencies = registryDependencies;

	// Add icon library dependencies based on config
	const iconLibrary = config.iconLibrary ?? "lucide";
	const iconDeps = ICON_LIBRARY_PACKAGES[iconLibrary];
	manifest.dependencies = [
		...manifest.dependencies.filter(
			(d) => !Object.values(ICON_LIBRARY_PACKAGES).flat().includes(d),
		),
		...iconDeps,
	];

	// Convert manifest to base64 for inscription
	const manifestJson = JSON.stringify(manifest, null, 2);
	const manifestBase64 = toBase64(manifestJson);

	items.push({
		type: "file",
		base64Data: manifestBase64,
		mimeType: "application/json",
		name: manifest.name,
		metadata: {
			registryType: "registry:base",
			...(author && { author }),
		},
	});

	return {
		items,
		manifest,
		assetVouts,
	};
}

/**
 * Estimate the transaction size for a project bundle
 */
export function estimateProjectBundleSize(items: BundleItem[]): number {
	return items.reduce((total, item) => {
		const cleanBase64 = item.base64Data.replace(/^data:[^;]+;base64,/, "");
		const dataSize = Math.floor((cleanBase64.length * 3) / 4);
		// Add overhead for inscription envelope and metadata
		return total + dataSize + 300;
	}, 0);
}

/**
 * Get required dependencies for a project configuration
 */
export function getProjectDependencies(config: Partial<ProjectConfig>): string[] {
	const baseDeps = [
		"shadcn@latest",
		"class-variance-authority",
		"tw-animate-css",
	];

	const iconLibrary = config.iconLibrary ?? "lucide";
	const iconDeps = ICON_LIBRARY_PACKAGES[iconLibrary];

	return [...baseDeps, ...iconDeps];
}
