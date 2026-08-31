import { describe, expect, it } from "bun:test";
import {
	buildFontMetadata,
	buildImageMetadata,
	buildTileMetadata,
	getPublishedAssetKind,
	isThemeRegistryType,
} from "./asset-metadata";

describe("raw asset metadata", () => {
	it("uses the shared registry asset type with explicit kind and media type", () => {
		expect(buildTileMetadata({ name: "dots" })).toMatchObject({
			type: "registry:asset",
			kind: "pattern",
			mediaType: "image/svg+xml",
		});
		expect(
			buildFontMetadata({ name: "Display", mediaType: "font/woff2" }),
		).toMatchObject({
			type: "registry:asset",
			kind: "font",
			mediaType: "font/woff2",
		});
		expect(
			buildImageMetadata({
				name: "hero",
				kind: "wallpaper",
				mediaType: "image/webp",
			}),
		).toMatchObject({
			type: "registry:asset",
			kind: "wallpaper",
			mediaType: "image/webp",
		});
	});

	it("keeps legacy registry asset types discoverable", () => {
		expect(
			getPublishedAssetKind({ app: "theme-token", type: "registry:font" }),
		).toBe("font");
		expect(
			getPublishedAssetKind({ app: "theme-token", type: "registry:file" }),
		).toBe("pattern");
		expect(
			getPublishedAssetKind({ type: "theme-token:asset", kind: "pattern" }),
		).toBe("pattern");
		expect(
			getPublishedAssetKind({ app: "another-app", type: "registry:file" }),
		).toBeUndefined();
	});

	it("uses one theme concept while accepting immutable legacy records", () => {
		expect(isThemeRegistryType("registry:theme")).toBe(true);
		expect(isThemeRegistryType("registry:style")).toBe(true);
		expect(isThemeRegistryType("registry:file")).toBe(false);
	});
});
