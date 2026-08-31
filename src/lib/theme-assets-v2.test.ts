import { describe, expect, test } from "bun:test";
import {
	assetContentUrl,
	compileAssetDelivery,
	locateThemeAsset,
	normalizeV1BundleAssets,
	resolveThemeAsset,
	ThemeAssetError,
	type ThemeAssetV2,
} from "./theme-assets-v2";

const TXID = "a".repeat(64);
const FONT_BYTES = new TextEncoder().encode("font bytes");
const FONT_HASH =
	"sha256:ee2e88308610019dce3856035fb572b7675dc9d4c990091374349476b5beecb1";

const fontAsset: ThemeAssetV2 = {
	role: "font.sans",
	kind: "font",
	source: { kind: "sibling", vout: 2, path: "fonts/my font.woff2" },
	mediaType: "font/woff2",
	integrity: FONT_HASH,
};

describe("Theme Token v2 asset resolution", () => {
	test("resolves sibling origins, verifies bytes, and compiles a linked URL", async () => {
		const resolved = await resolveThemeAsset(
			`${TXID}.9`,
			fontAsset,
			async (location) => {
				expect(location).toEqual({
					origin: `${TXID}_2`,
					path: "fonts/my font.woff2",
				});
				return { bytes: FONT_BYTES, mediaType: "font/woff2; charset=binary" };
			},
		);

		expect(compileAssetDelivery(resolved)).toEqual({
			delivery: "linked",
			url: `https://api.1sat.app/content/${TXID}_2/fonts/my%20font.woff2`,
		});
	});

	test("keeps canonical external origins unchanged", () => {
		const location = locateThemeAsset(`${TXID}_0`, {
			kind: "origin",
			origin: `${"b".repeat(64)}_3`,
		});
		expect(location.origin).toBe(`${"b".repeat(64)}_3`);
		expect(assetContentUrl(location)).toEndWith(`${"b".repeat(64)}_3`);
	});

	test("rejects traversal and non-canonical external origins", () => {
		for (const path of [
			"/asset.svg",
			"../asset.svg",
			"%2e%2e/asset.svg",
			"a//b",
			"a\\b",
			"a\0b",
		]) {
			expect(() =>
				locateThemeAsset(`${TXID}_0`, { kind: "sibling", vout: 0, path }),
			).toThrow(ThemeAssetError);
		}
		expect(() =>
			locateThemeAsset(`${TXID}_0`, {
				kind: "origin",
				origin: `${TXID}.1`,
			}),
		).toThrow(/canonical/);
		expect(() =>
			locateThemeAsset(`${TXID}_0`, {
				kind: "origin",
				origin: `${TXID}_01`,
			}),
		).toThrow(/canonical/);
		expect(() =>
			locateThemeAsset(`${TXID}_0`, { kind: "sibling", vout: -1 }),
		).toThrow(/non-negative/);
	});

	test("marks missing indexed content retryable", async () => {
		try {
			await resolveThemeAsset(`${TXID}_0`, fontAsset, async () => undefined);
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(ThemeAssetError);
			expect((error as ThemeAssetError).code).toBe("not_indexed");
			expect((error as ThemeAssetError).retryable).toBe(true);
		}
	});

	test("treats media type and integrity mismatches as hard failures", async () => {
		for (const [content, expectedCode] of [
			[{ bytes: FONT_BYTES, mediaType: "image/png" }, "media_type_mismatch"],
			[
				{ bytes: new Uint8Array([1]), mediaType: "font/woff2" },
				"integrity_mismatch",
			],
		]) {
			try {
				await resolveThemeAsset(
					`${TXID}_0`,
					fontAsset,
					async () => content as { bytes: Uint8Array; mediaType: string },
				);
				expect.unreachable();
			} catch (error) {
				expect(error).toBeInstanceOf(ThemeAssetError);
				expect((error as ThemeAssetError).code).toBe(expectedCode);
				expect((error as ThemeAssetError).retryable).toBe(false);
			}
		}
	});

	test("vendors verified UTF-8 but rejects binary vendoring", async () => {
		const svg = '<svg xmlns="http://www.w3.org/2000/svg"/>';
		const bytes = new TextEncoder().encode(svg);
		const hash = await crypto.subtle.digest("SHA-256", bytes);
		const integrity = `sha256:${Array.from(new Uint8Array(hash), (byte) =>
			byte.toString(16).padStart(2, "0"),
		).join("")}`;
		const asset: ThemeAssetV2 = {
			role: "background.page",
			kind: "pattern",
			source: { kind: "sibling", vout: 4, path: "pattern.svg" },
			mediaType: "image/svg+xml",
			integrity,
			delivery: "vendored",
		};
		const resolved = await resolveThemeAsset(`${TXID}_0`, asset, async () => ({
			bytes,
			mediaType: "image/svg+xml",
		}));
		expect(compileAssetDelivery(resolved)).toEqual({
			delivery: "vendored",
			content: svg,
			target: `~/public/theme-token/${TXID}_4/pattern.svg`,
		});

		expect(() =>
			compileAssetDelivery({
				...resolved,
				asset: { ...fontAsset, delivery: "vendored" },
			}),
		).toThrow(/does not support font\/woff2/);
		expect(() =>
			compileAssetDelivery({ ...resolved, bytes: new Uint8Array([255]) }),
		).toThrow(/not valid UTF-8/);
	});

	test("normalizes known v1 bundle slots as explicitly unverified", () => {
		expect(
			normalizeV1BundleAssets([
				{ slot: "font-sans", vout: 0 },
				{ slot: "pattern", vout: 1 },
				{ slot: "unknown", vout: 2 },
			]),
		).toEqual([
			{
				role: "font.sans",
				kind: "font",
				source: { kind: "sibling", vout: 0 },
				verified: false,
			},
			{
				role: "background.page",
				kind: "pattern",
				source: { kind: "sibling", vout: 1 },
				verified: false,
			},
		]);
	});
});
