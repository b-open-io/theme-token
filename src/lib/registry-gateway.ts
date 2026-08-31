import {
	THEME_TOKEN_SCHEMA_URL,
	type ThemeToken,
	toShadcnRegistry,
	validateThemeToken,
} from "@theme-token/sdk";
import { getOrdfsUrl } from "@/lib/ordfs";
import {
	type AssetContentResolver,
	compileAssetDelivery,
	parseThemeAssetsV2,
	resolveThemeAsset,
	ThemeAssetError,
	type ThemeAssetV2,
} from "@/lib/theme-assets-v2";

export const THEME_TOKEN_V2_SCHEMA_URL =
	"https://themetoken.dev/v2/schema.json";

/**
 * Registry Gateway - Shared logic for serving shadcn registry items from the blockchain
 *
 * Handles:
 * - Fetching content from ORDFS (Ordinals File System)
 * - Hydrating multi-file registry items (blocks, components) with file contents via ORDFS directory traversal
 */

/**
 * Registry item types we support
 */
export type RegistryItemType =
	| "registry:base"
	| "registry:style"
	| "registry:block"
	| "registry:component"
	| "registry:hook"
	| "registry:lib"
	| "registry:ui"
	| "registry:page"
	| "registry:font"
	| "registry:theme"
	| "registry:item"
	| "registry:file";

/**
 * File entry in a registry manifest (inscribed JSON)
 */
export interface RegistryFileEntry {
	path: string;
	type: RegistryItemType;
	vout?: number; // Reference to sibling inscription output
	content?: string; // Already-embedded content (for single-file items)
	target?: string; // Alternative to vout: _N relative reference
}

/**
 * Registry manifest structure (what gets inscribed for multi-file items)
 */
export interface RegistryManifest {
	$schema?: string;
	name: string;
	type: RegistryItemType;
	description?: string;
	dependencies?: string[];
	registryDependencies?: string[];
	files: RegistryFileEntry[];
	cssVars?: Record<string, Record<string, string>>;
	css?: Record<string, unknown>;
	tailwind?: Record<string, unknown>;
}

export interface ThemeTokenV2Source extends Record<string, unknown> {
	$schema: typeof THEME_TOKEN_V2_SCHEMA_URL;
	assets?: unknown;
}

interface CompiledRegistryFile {
	path: string;
	type: "registry:file";
	target: string;
	content: string;
}

type CompiledRegistryItem = ReturnType<typeof toShadcnRegistry> & {
	files?: CompiledRegistryFile[];
	meta?: Record<string, unknown>;
};

const ASSET_ROLES = {
	"font.sans": "font",
	"font.serif": "font",
	"font.mono": "font",
	"font.heading": "font",
	"background.page": "background",
	"background.card": "background",
	"background.sidebar": "background",
	"icon.set": "icon",
} as const;

const FONT_FALLBACKS = {
	sans: "ui-sans-serif, system-ui, sans-serif",
	serif: "ui-serif, Georgia, serif",
	mono: "ui-monospace, SFMono-Regular, monospace",
	heading: "ui-sans-serif, system-ui, sans-serif",
} as const;

const V2_THEME_KEYS = new Set([
	"$schema",
	"name",
	"author",
	"styles",
	"assets",
	"css",
	"generation",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isThemeTokenV2Source(
	value: unknown,
): value is ThemeTokenV2Source {
	return isRecord(value) && value.$schema === THEME_TOKEN_V2_SCHEMA_URL;
}

function validateV2Theme(source: ThemeTokenV2Source): ThemeToken {
	if (Object.keys(source).some((key) => !V2_THEME_KEYS.has(key))) {
		throw new ThemeAssetError(
			"invalid_source",
			"Theme Token v2 contains an unknown property",
		);
	}
	const result = validateThemeToken({
		...source,
		$schema: THEME_TOKEN_SCHEMA_URL,
	});
	if (!result.valid) {
		throw new ThemeAssetError("invalid_source", result.error);
	}
	return result.theme;
}

function assetUrl(delivery: ReturnType<typeof compileAssetDelivery>): string {
	return delivery.delivery === "linked"
		? delivery.url
		: delivery.target.replace(/^~\/public/, "");
}

function addBackgroundCss(
	item: CompiledRegistryItem,
	asset: ThemeAssetV2,
	url: string,
) {
	const selectors = {
		"background.page": "body",
		"background.card": '[data-slot="card"]',
		"background.sidebar": '[data-slot="sidebar"]',
	} as const;
	const selector = selectors[asset.role as keyof typeof selectors];
	if (!selector) return;

	const render = asset.render ?? {};
	const masked = render.mode === "mask";
	const defaults =
		asset.kind === "wallpaper"
			? { repeat: "no-repeat", size: "cover", position: "center" }
			: { repeat: "repeat", size: "auto", position: "center" };
	const repeat = render.repeat ?? defaults.repeat;
	const size = render.size ?? defaults.size;
	const position = render.position ?? defaults.position;
	if (!masked) {
		item.css["@layer base"][selector] = {
			"background-image": `url("${url}")`,
			"background-repeat": repeat,
			"background-size": size,
			"background-position": position,
		};
		return;
	}

	item.css["@layer base"][selector] = { position: "relative" };
	item.css["@layer base"][`${selector}::before`] = {
		content: '""',
		position: selector === "body" ? "fixed" : "absolute",
		inset: "0",
		"pointer-events": "none",
		"background-color": render.color ?? "var(--primary)",
		"-webkit-mask-image": `url("${url}")`,
		"mask-image": `url("${url}")`,
		"-webkit-mask-repeat": repeat,
		"mask-repeat": repeat,
		"-webkit-mask-size": size,
		"mask-size": size,
		"-webkit-mask-position": position,
		"mask-position": position,
	};
}

/** Compile a v2 Theme Token source into installable, verified ShadCN output. */
export async function compileThemeTokenV2(
	source: ThemeTokenV2Source,
	packageOrigin: string,
	resolveContent: AssetContentResolver,
): Promise<CompiledRegistryItem> {
	const theme = validateV2Theme(source);
	const assets = parseThemeAssetsV2(source.assets);
	const item: CompiledRegistryItem = toShadcnRegistry(theme);
	const files: CompiledRegistryFile[] = [];
	const diagnostics: string[] = [];
	const provenance: Record<string, unknown>[] = [];

	for (const asset of assets) {
		const roleType = ASSET_ROLES[asset.role as keyof typeof ASSET_ROLES];
		if (!roleType) {
			diagnostics.push(`Ignored unsupported asset role: ${asset.role}`);
			continue;
		}
		if (
			(roleType === "font" && asset.kind !== "font") ||
			(roleType === "background" &&
				asset.kind !== "pattern" &&
				asset.kind !== "wallpaper") ||
			(roleType === "icon" && asset.kind !== "icon")
		) {
			throw new ThemeAssetError(
				"invalid_source",
				`Asset ${asset.role} cannot use kind ${asset.kind}`,
			);
		}
		if (
			(asset.kind === "font" && asset.mediaType !== "font/woff2") ||
			((asset.kind === "pattern" || asset.kind === "wallpaper") &&
				!asset.mediaType.startsWith("image/")) ||
			(asset.kind === "icon" &&
				!asset.mediaType.startsWith("image/") &&
				asset.mediaType !== "application/json")
		) {
			throw new ThemeAssetError(
				"invalid_media_type",
				`Asset kind ${asset.kind} cannot use ${asset.mediaType}`,
			);
		}
		if (
			(asset.render &&
				asset.kind !== "pattern" &&
				asset.kind !== "wallpaper") ||
			(asset.render?.color && asset.render.mode !== "mask")
		) {
			throw new ThemeAssetError(
				"invalid_source",
				`Asset ${asset.role} has incompatible render settings`,
			);
		}
		if (roleType === "icon") {
			if (asset.required === false) {
				diagnostics.push(
					"Ignored optional icon.set asset: ShadCN has no standard install target",
				);
				continue;
			}
			throw new ThemeAssetError(
				"unsupported_delivery",
				"ShadCN has no standard install target for icon.set assets",
			);
		}

		let resolved: Awaited<ReturnType<typeof resolveThemeAsset>>;
		try {
			resolved = await resolveThemeAsset(packageOrigin, asset, resolveContent);
		} catch (error) {
			if (
				error instanceof ThemeAssetError &&
				error.retryable &&
				asset.required === false
			) {
				diagnostics.push(`Optional asset is not available yet: ${asset.role}`);
				continue;
			}
			throw error;
		}

		const delivery = compileAssetDelivery(resolved);
		const url = assetUrl(delivery);
		if (delivery.delivery === "vendored") {
			files.push({
				path: delivery.target.replace(/^~\/public\//, ""),
				type: "registry:file",
				target: delivery.target,
				content: delivery.content,
			});
		}

		if (roleType === "font") {
			const slot = asset.role.slice(
				"font.".length,
			) as keyof typeof FONT_FALLBACKS;
			const family = `tt-${resolved.location.origin.slice(0, 8)}-${resolved.location.origin.split("_")[1]}`;
			const stylesheet = new URL(
				`https://themetoken.dev/r/fonts/${resolved.location.origin}.css`,
			);
			stylesheet.searchParams.set("family", family);
			if (resolved.location.path) {
				stylesheet.searchParams.set("path", resolved.location.path);
			}
			item.css[`@import url("${stylesheet.toString()}")`] = {};
			item.cssVars.theme[`font-${slot}`] =
				`"${family}", ${FONT_FALLBACKS[slot]}`;
		} else {
			addBackgroundCss(item, asset, url);
		}

		provenance.push({
			role: asset.role,
			kind: asset.kind,
			origin: resolved.location.origin,
			...(resolved.location.path && { path: resolved.location.path }),
			delivery: delivery.delivery,
			integrity: asset.integrity,
		});
	}

	if (files.length) item.files = files;
	item.meta = {
		themeToken: {
			version: 2,
			origin: packageOrigin,
			assets: provenance,
			...(diagnostics.length && { diagnostics }),
		},
	};
	return item;
}

/**
 * Extract txid from origin string (e.g., "abc123def456_3" -> "abc123def456")
 */
export function extractTxid(origin: string): string | null {
	const underscoreIndex = origin.lastIndexOf("_");
	if (underscoreIndex === -1) return null;
	return origin.slice(0, underscoreIndex);
}

/**
 * Extract vout from origin string (e.g., "abc123def456_3" -> 3)
 */
export function extractVout(origin: string): number | null {
	const underscoreIndex = origin.lastIndexOf("_");
	if (underscoreIndex === -1) return null;
	const voutStr = origin.slice(underscoreIndex + 1);
	const vout = parseInt(voutStr, 10);
	return Number.isNaN(vout) ? null : vout;
}

/**
 * Fetch content from ORDFS by origin
 */
export async function fetchFromOrdfs(origin: string): Promise<Response> {
	return fetch(getOrdfsUrl(origin));
}

/**
 * Fetch and parse JSON from ORDFS
 */
export async function fetchJsonFromOrdfs<T = unknown>(
	origin: string,
): Promise<T | null> {
	const response = await fetchFromOrdfs(origin);
	if (!response.ok) return null;
	return response.json() as Promise<T>;
}

/**
 * Fetch raw text content from ORDFS
 */
export async function fetchTextFromOrdfs(
	origin: string,
): Promise<string | null> {
	const response = await fetchFromOrdfs(origin);
	if (!response.ok) return null;
	return response.text();
}

/**
 * Hydrate a registry manifest by fetching file contents via ORDFS directory traversal
 *
 * For multi-file blocks/components, ORDFS resolves _N refs and nested directories
 * natively. This function fetches each file's content by path and injects it into the response.
 */
export async function hydrateRegistryManifest(
	manifest: RegistryManifest,
	origin: string,
): Promise<RegistryManifest> {
	const hydratedFiles = await Promise.all(
		manifest.files.map(async (file) => {
			if (file.content) return file;

			// Fetch file content via ORDFS directory traversal
			const content = await fetchTextFromOrdfs(`${origin}/${file.path}`);

			if (!content) {
				console.warn(
					`[Registry Gateway] Failed to fetch file at ${origin}/${file.path}`,
				);
				return file;
			}

			return {
				...file,
				content,
				vout: undefined,
				target: undefined,
			};
		}),
	);

	return {
		...manifest,
		files: hydratedFiles,
	};
}

/**
 * Convert a hydrated registry manifest to shadcn CLI-compatible format
 */
export function toShadcnRegistryItem(
	manifest: RegistryManifest,
): Record<string, unknown> {
	return {
		$schema: "https://ui.shadcn.com/schema/registry-item.json",
		name: manifest.name,
		type: manifest.type,
		description: manifest.description,
		dependencies: manifest.dependencies,
		registryDependencies: manifest.registryDependencies,
		files: manifest.files.map((file) => ({
			path: file.path,
			type: file.type,
			content: file.content,
		})),
		cssVars: manifest.cssVars,
		css: manifest.css,
		tailwind: manifest.tailwind,
	};
}

/**
 * Validate that a manifest has the required structure for a registry item
 */
export function validateRegistryManifest(
	data: unknown,
):
	| { valid: true; manifest: RegistryManifest }
	| { valid: false; error: string } {
	if (!data || typeof data !== "object") {
		return { valid: false, error: "Invalid data: expected object" };
	}

	const obj = data as Record<string, unknown>;

	if (typeof obj.name !== "string" || !obj.name) {
		return { valid: false, error: "Missing required field: name" };
	}

	if (typeof obj.type !== "string" || !obj.type) {
		return { valid: false, error: "Missing required field: type" };
	}

	const validTypes: RegistryItemType[] = [
		"registry:base",
		"registry:style",
		"registry:block",
		"registry:component",
		"registry:hook",
		"registry:lib",
		"registry:ui",
		"registry:page",
		"registry:font",
		"registry:theme",
		"registry:item",
		"registry:file",
	];

	if (!validTypes.includes(obj.type as RegistryItemType)) {
		return {
			valid: false,
			error: `Invalid type: ${obj.type}. Expected one of: ${validTypes.join(", ")}`,
		};
	}

	if (!Array.isArray(obj.files)) {
		return { valid: false, error: "Missing required field: files (array)" };
	}

	return { valid: true, manifest: obj as unknown as RegistryManifest };
}
