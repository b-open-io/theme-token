import type { ThemeAsset, ThemeAssetSource } from "@theme-token/sdk";
import { normalizeOutpoint } from "@/lib/outpoint";

export type { ThemeAsset, ThemeAssetSource } from "@theme-token/sdk";

const ORIGIN = /^[0-9a-f]{64}_(?:0|[1-9][0-9]*)$/;
const INTEGRITY = /^sha256:([0-9a-f]{64})$/;
const MEDIA_TYPE = /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/;
const CONTENT_GATEWAY = "https://api.1sat.app/content";

export interface AssetLocation {
	origin: string;
	path?: string;
}

export interface ResolvedAssetContent {
	bytes: Uint8Array;
	mediaType: string;
}

export interface ResolvedThemeAsset extends ResolvedAssetContent {
	asset: ThemeAsset;
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
	asset: ThemeAsset,
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
