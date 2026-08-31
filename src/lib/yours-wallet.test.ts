import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";
import {
	fetchFontMarketListings,
	fetchImageMarketListings,
	getImageMarketAssetType,
	isFontMarketAsset,
} from "./yours-wallet";

const ORIGIN = `${"a".repeat(64)}_1`;

afterEach(() => mock.restore());

function packageListing(kind: "font" | "pattern", mediaType: string) {
	return {
		outpoint: `${"b".repeat(64)}_0`,
		owner: "owner",
		origin: {
			outpoint: ORIGIN,
			data: {
				insc: { file: { type: "ord-fs/json", size: 42 } },
				map: {
					app: "theme-token",
					type: "theme-token:asset",
					kind,
					mediaType,
					name: "Test Asset",
				},
			},
		},
		data: { list: { price: 1000 } },
	};
}

describe("image marketplace asset classification", () => {
	it("maps current asset kinds into existing marketplace categories", () => {
		expect(
			getImageMarketAssetType({
				app: "theme-token",
				type: "theme-token:asset",
				kind: "pattern",
			}),
		).toBe("tile");
		expect(
			getImageMarketAssetType({
				app: "theme-token",
				type: "theme-token:asset",
				kind: "wallpaper",
			}),
		).toBe("wallpaper");
	});

	it("preserves legacy categories and rejects unrelated records", () => {
		for (const type of ["tile", "wallpaper", "icon"] as const) {
			expect(getImageMarketAssetType({ app: "theme-token", type })).toBe(type);
		}
		expect(
			getImageMarketAssetType({ app: "other", type: "tile" }),
		).toBeUndefined();
		expect(
			getImageMarketAssetType({ app: "theme-token", type: "registry:file" }),
		).toBeUndefined();
	});
});

describe("packaged marketplace assets", () => {
	it("finds a packaged image and uses its declared media type and content URL", async () => {
		const fetchMock = spyOn(globalThis, "fetch").mockImplementation(
			async (input) =>
				new Response(
					JSON.stringify(
						String(input).includes("type=ord-fs%2Fjson")
							? [packageListing("pattern", "image/svg+xml")]
							: [],
					),
				),
		);

		const listings = await fetchImageMarketListings();

		expect(
			fetchMock.mock.calls.some(([url]) =>
				String(url).includes("ord-fs%2Fjson"),
			),
		).toBe(true);
		expect(listings).toHaveLength(1);
		expect(listings[0]?.metadata).toMatchObject({
			assetType: "tile",
			contentType: "image/svg+xml",
		});
		expect(listings[0]?.previewUrl).toBe(
			`https://api.1sat.app/content/${ORIGIN}`,
		);
	});

	it("finds current packaged fonts while preserving legacy font metadata", async () => {
		expect(isFontMarketAsset({ app: "theme-token", type: "font" })).toBe(true);
		expect(
			isFontMarketAsset({ app: "theme-token", type: "registry:font" }),
		).toBe(true);

		spyOn(globalThis, "fetch").mockImplementation(
			async (input) =>
				new Response(
					JSON.stringify(
						String(input).includes("type=ord-fs%2Fjson")
							? [packageListing("font", "font/woff2")]
							: [],
					),
				),
		);

		const listings = await fetchFontMarketListings();
		expect(listings).toHaveLength(1);
		expect(listings[0]?.metadata).toMatchObject({
			name: "Test Asset",
			mediaType: "font/woff2",
		});
	});
});
