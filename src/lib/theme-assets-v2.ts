import { normalizeOutpoint } from "@/lib/outpoint";

const ORIGIN = /^[0-9a-f]{64}_(?:0|[1-9][0-9]*)$/;
const INTEGRITY = /^sha256:([0-9a-f]{64})$/;
const MEDIA_TYPE = /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/;
const CONTENT_GATEWAY = "https://api.1sat.app/content";

export type ThemeAssetSource =
	| { kind: "sibling"; vout: number; path?: string }
	| { kind: "origin"; origin: string; path?: string };

export interface ThemeAssetRender {
	mode?: "image" | "mask";
	repeat?: "repeat" | "no-repeat" | "repeat-x" | "repeat-y" | "space" | "round";
	size?: "auto" | "cover" | "contain";
	position?:
		| "center"
		| "top"
		| "bottom"
		| "left"
		| "right"
		| "top left"
		| "top right"
		| "bottom left"
		| "bottom right";
	color?: string;
}

export interface ThemeAssetV2 {
	role: string;
	kind: "font" | "pattern" | "wallpaper" | "icon";
	source: ThemeAssetSource;
	mediaType: string;
	integrity: string;
	delivery?: "linked" | "vendored";
	required?: boolean;
	render?: ThemeAssetRender;
}

const ASSET_KINDS = new Set(["font", "pattern", "wallpaper", "icon"]);
const ASSET_KEYS = new Set([
	"role",
	"kind",
	"source",
	"mediaType",
	"integrity",
	"delivery",
	"required",
	"render",
]);
const RENDER_VALUES = {
	mode: new Set(["image", "mask"]),
	repeat: new Set([
		"repeat",
		"no-repeat",
		"repeat-x",
		"repeat-y",
		"space",
		"round",
	]),
	size: new Set(["auto", "cover", "contain"]),
	position: new Set([
		"center",
		"top",
		"bottom",
		"left",
		"right",
		"top left",
		"top right",
		"bottom left",
		"bottom right",
	]),
} as const;
const MASK_COLOR =
	/^(?:currentColor|transparent|#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|var\(--[a-z0-9-]+\))$/;

function validRender(render: unknown): render is ThemeAssetRender {
	if (!render || typeof render !== "object" || Array.isArray(render))
		return false;
	const value = render as Record<string, unknown>;
	if (
		Object.keys(value).some((key) => !(key in RENDER_VALUES) && key !== "color")
	) {
		return false;
	}
	for (const key of Object.keys(RENDER_VALUES) as Array<
		keyof typeof RENDER_VALUES
	>) {
		if (
			value[key] !== undefined &&
			(typeof value[key] !== "string" || !RENDER_VALUES[key].has(value[key]))
		) {
			return false;
		}
	}
	return (
		value.color === undefined ||
		(typeof value.color === "string" && MASK_COLOR.test(value.color))
	);
}

/** Parse the v2 relationship array at the gateway trust boundary. */
export function parseThemeAssetsV2(input: unknown): ThemeAssetV2[] {
	if (!Array.isArray(input)) {
		throw new ThemeAssetError(
			"invalid_source",
			"Theme assets must be an array",
		);
	}

	return input.map((value, index) => {
		if (!value || typeof value !== "object") {
			throw new ThemeAssetError(
				"invalid_source",
				`Theme asset ${index} must be an object`,
			);
		}
		const asset = value as Record<string, unknown>;
		const source = asset.source as Record<string, unknown> | undefined;
		if (
			Object.keys(asset).some((key) => !ASSET_KEYS.has(key)) ||
			typeof asset.role !== "string" ||
			asset.role.length === 0 ||
			typeof asset.kind !== "string" ||
			!ASSET_KINDS.has(asset.kind) ||
			typeof asset.mediaType !== "string" ||
			typeof asset.integrity !== "string" ||
			!source ||
			(source.kind !== "sibling" && source.kind !== "origin") ||
			(asset.delivery !== undefined &&
				asset.delivery !== "linked" &&
				asset.delivery !== "vendored") ||
			(asset.required !== undefined && typeof asset.required !== "boolean") ||
			(asset.render !== undefined && !validRender(asset.render))
		) {
			throw new ThemeAssetError(
				"invalid_source",
				`Theme asset ${index} is invalid`,
			);
		}
		const sourceKeys =
			source.kind === "sibling"
				? ["kind", "vout", "path"]
				: ["kind", "origin", "path"];
		if (
			Object.keys(source).some((key) => !sourceKeys.includes(key)) ||
			(source.kind === "sibling" && typeof source.vout !== "number") ||
			(source.kind === "origin" && typeof source.origin !== "string") ||
			(source.path !== undefined && typeof source.path !== "string")
		) {
			throw new ThemeAssetError(
				"invalid_source",
				`Theme asset ${index} has an invalid source`,
			);
		}

		return asset as unknown as ThemeAssetV2;
	});
}

export interface AssetLocation {
	origin: string;
	path?: string;
}

export interface ResolvedAssetContent {
	bytes: Uint8Array;
	mediaType: string;
}

export interface ResolvedThemeAsset extends ResolvedAssetContent {
	asset: ThemeAssetV2;
	location: AssetLocation;
}

export type AssetContentResolver = (
	location: AssetLocation,
) => Promise<ResolvedAssetContent | undefined>;

export type ThemeAssetErrorCode =
	| "invalid_source"
	| "invalid_path"
	| "invalid_media_type"
	| "invalid_integrity"
	| "not_indexed"
	| "media_type_mismatch"
	| "integrity_mismatch"
	| "unsupported_delivery";

export class ThemeAssetError extends Error {
	readonly retryable: boolean;

	constructor(
		readonly code: ThemeAssetErrorCode,
		message: string,
	) {
		super(message);
		this.name = "ThemeAssetError";
		this.retryable = code === "not_indexed";
	}
}

function validatePath(path: string | undefined): string | undefined {
	if (path === undefined) return undefined;
	let decoded: string;
	try {
		decoded = decodeURIComponent(path);
	} catch {
		throw new ThemeAssetError("invalid_path", `Invalid ord-fs path: ${path}`);
	}
	if (
		path.length === 0 ||
		decoded !== path ||
		path.startsWith("/") ||
		path.includes("\\") ||
		path.includes("?") ||
		path.includes("#") ||
		Array.from(path).some((character) => {
			const code = character.charCodeAt(0);
			return code < 32 || code === 127;
		}) ||
		path
			.split("/")
			.some((segment) => segment === "" || segment === "." || segment === "..")
	) {
		throw new ThemeAssetError("invalid_path", `Invalid ord-fs path: ${path}`);
	}
	return path;
}

function validateLocation(location: AssetLocation): AssetLocation {
	if (!ORIGIN.test(location.origin)) {
		throw new ThemeAssetError(
			"invalid_source",
			`Asset origin must be canonical: ${location.origin}`,
		);
	}
	const path = validatePath(location.path);
	return { origin: location.origin, ...(path && { path }) };
}

export function locateThemeAsset(
	packageOrigin: string,
	source: ThemeAssetSource,
): AssetLocation {
	if (source.kind === "origin") {
		return validateLocation({ origin: source.origin, path: source.path });
	}

	const normalizedPackageOrigin = normalizeOutpoint(packageOrigin);
	if (!ORIGIN.test(normalizedPackageOrigin)) {
		throw new ThemeAssetError(
			"invalid_source",
			`Package origin must identify an output: ${packageOrigin}`,
		);
	}
	if (!Number.isSafeInteger(source.vout) || source.vout < 0) {
		throw new ThemeAssetError(
			"invalid_source",
			`Sibling vout must be a non-negative safe integer: ${source.vout}`,
		);
	}
	return validateLocation({
		origin: `${normalizedPackageOrigin.slice(0, 64)}_${source.vout}`,
		path: source.path,
	});
}

function canonicalMediaType(mediaType: string): string {
	return mediaType.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

async function sha256(bytes: Uint8Array): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes));
	return Array.from(new Uint8Array(digest), (byte) =>
		byte.toString(16).padStart(2, "0"),
	).join("");
}

export async function resolveThemeAsset(
	packageOrigin: string,
	asset: ThemeAssetV2,
	resolveContent: AssetContentResolver,
): Promise<ResolvedThemeAsset> {
	if (!MEDIA_TYPE.test(asset.mediaType)) {
		throw new ThemeAssetError(
			"invalid_media_type",
			`Asset mediaType must be canonical: ${asset.mediaType}`,
		);
	}
	const expectedHash = INTEGRITY.exec(asset.integrity)?.[1];
	if (!expectedHash) {
		throw new ThemeAssetError(
			"invalid_integrity",
			"Asset integrity must use lowercase sha256:<hex>",
		);
	}

	const location = locateThemeAsset(packageOrigin, asset.source);
	const content = await resolveContent(location);
	if (!content) {
		throw new ThemeAssetError(
			"not_indexed",
			`Asset is not available yet: ${location.origin}`,
		);
	}
	if (canonicalMediaType(content.mediaType) !== asset.mediaType) {
		throw new ThemeAssetError(
			"media_type_mismatch",
			`Expected ${asset.mediaType}, received ${content.mediaType}`,
		);
	}
	if ((await sha256(content.bytes)) !== expectedHash) {
		throw new ThemeAssetError(
			"integrity_mismatch",
			`Asset integrity mismatch: ${location.origin}`,
		);
	}

	return { asset, location, ...content };
}

export function assetContentUrl(location: AssetLocation): string {
	const validated = validateLocation(location);
	const path = validated.path
		? `/${validated.path.split("/").map(encodeURIComponent).join("/")}`
		: "";
	return `${CONTENT_GATEWAY}/${validated.origin}${path}`;
}

function vendoredFilename(resolved: ResolvedThemeAsset): string {
	if (resolved.location.path) return resolved.location.path;
	const extension =
		resolved.asset.mediaType === "image/svg+xml" ? "svg" : "txt";
	return `asset.${extension}`;
}

export type CompiledAssetDelivery =
	| { delivery: "linked"; url: string }
	| { delivery: "vendored"; content: string; target: string };

export function compileAssetDelivery(
	resolved: ResolvedThemeAsset,
): CompiledAssetDelivery {
	const location = validateLocation(resolved.location);
	if ((resolved.asset.delivery ?? "linked") === "linked") {
		return {
			delivery: "linked",
			url: assetContentUrl(location),
		};
	}

	const isUtf8Type =
		resolved.asset.mediaType === "image/svg+xml" ||
		resolved.asset.mediaType === "application/json" ||
		resolved.asset.mediaType.startsWith("text/");
	if (!isUtf8Type) {
		throw new ThemeAssetError(
			"unsupported_delivery",
			`Vendored delivery does not support ${resolved.asset.mediaType}`,
		);
	}

	let content: string;
	try {
		content = new TextDecoder("utf-8", { fatal: true }).decode(resolved.bytes);
	} catch {
		throw new ThemeAssetError(
			"unsupported_delivery",
			"Vendored asset is not valid UTF-8",
		);
	}
	return {
		delivery: "vendored",
		content,
		target: `~/public/theme-token/${location.origin}/${vendoredFilename(resolved)}`,
	};
}

const LEGACY_ROLES = {
	sans: ["font.sans", "font"],
	"font-sans": ["font.sans", "font"],
	serif: ["font.serif", "font"],
	"font-serif": ["font.serif", "font"],
	mono: ["font.mono", "font"],
	"font-mono": ["font.mono", "font"],
	pattern: ["background.page", "pattern"],
	"--bg-pattern": ["background.page", "pattern"],
	wallpaper: ["background.page", "wallpaper"],
	"--hero-image": ["background.page", "wallpaper"],
} as const;

export interface LegacyBundleAsset {
	vout: number;
	slot: string;
}

export interface NormalizedLegacyAsset {
	role: string;
	kind: "font" | "pattern" | "wallpaper";
	source: { kind: "sibling"; vout: number };
	verified: false;
}

/** Normalize known v1 bundle slots without pretending they satisfy v2 integrity. */
export function normalizeV1BundleAssets(
	assets: LegacyBundleAsset[],
): NormalizedLegacyAsset[] {
	return assets.flatMap(({ slot, vout }) => {
		const mapped = LEGACY_ROLES[slot as keyof typeof LEGACY_ROLES];
		if (!mapped || !Number.isSafeInteger(vout) || vout < 0) return [];
		return [
			{
				role: mapped[0],
				kind: mapped[1],
				source: { kind: "sibling" as const, vout },
				verified: false as const,
			},
		];
	});
}
