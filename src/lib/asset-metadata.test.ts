import { describe, expect, it } from "bun:test";
import {
	buildFontMetadata,
	buildImageMetadata,
	buildTileMetadata,
	getPublishedAssetKind,
} from "./asset-metadata";

describe("raw asset metadata", () => {
	it("uses the Theme Token namespace with explicit kind and media type", () => {
		expect(buildTileMetadata({ name: "dots" })).toMatchObject({
			type: "theme-token:asset",
			kind: "pattern",
			mediaType: "image/svg+xml",
		});
		expect(
			buildFontMetadata({ name: "Display", mediaType: "font/woff2" }),
		).toMatchObject({
			type: "theme-token:asset",
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
			type: "theme-token:asset",
			kind: "wallpaper",
			mediaType: "image/webp",
		});
	});

	it("keeps legacy registry asset types discoverable", () => {
		expect(getPublishedAssetKind({ type: "registry:font" })).toBe("font");
		expect(getPublishedAssetKind({ type: "registry:file" })).toBe("pattern");
		expect(
			getPublishedAssetKind({ type: "theme-token:asset", kind: "pattern" }),
		).toBe("pattern");
	});
});
