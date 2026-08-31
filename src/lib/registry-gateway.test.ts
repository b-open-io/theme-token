import { describe, expect, test } from "bun:test";
import { createThemeToken } from "@theme-token/sdk";
import {
	compileThemeRegistryItem,
	extractTxid,
	extractVout,
} from "./registry-gateway";
import { ThemeAssetError } from "./theme-assets";

async function integrity(bytes: Uint8Array) {
	const hash = await crypto.subtle.digest("SHA-256", bytes);
	return `sha256:${Array.from(new Uint8Array(hash), (byte) =>
		byte.toString(16).padStart(2, "0"),
	).join("")}`;
}

describe("registry-gateway origin parsing", () => {
	const origin = `${"a".repeat(64)}_2`;

	test("extractTxid returns the txid for a valid origin", () => {
		expect(extractTxid(origin)).toBe("a".repeat(64));
	});

	test("extractVout returns the numeric vout", () => {
		expect(extractVout(origin)).toBe(2);
	});

	test("invalid origins return null", () => {
		expect(extractTxid("not-an-origin")).toBeNull();
		expect(extractVout("not-an-origin")).toBeNull();
	});

	test("extractVout returns null for non-numeric vout", () => {
		expect(extractVout("abc_xyz")).toBeNull();
	});

	test("extractTxid uses lastIndexOf (handles txids with underscores in input)", () => {
		// origin with two underscores: txid portion is everything before last _
		const multi = "aabbcc_ddee_3";
		expect(extractTxid(multi)).toBe("aabbcc_ddee");
		expect(extractVout(multi)).toBe(3);
	});
});

describe("Theme Token registry compiler", () => {
	const origin = `${"c".repeat(64)}_4`;

	test("emits verified linked CSS and targeted vendored files", async () => {
		const font = new TextEncoder().encode("woff2 bytes");
		const svg = new TextEncoder().encode(
			'<svg xmlns="http://www.w3.org/2000/svg"/>',
		);
		const source = {
			...createThemeToken("Assets", {}, {}),
			assets: [
				{
					role: "font.sans",
					kind: "font",
					source: { kind: "origin", origin: `${"d".repeat(64)}_2` },
					mediaType: "font/woff2",
					integrity: await integrity(font),
				},
				{
					role: "background.page",
					kind: "pattern",
					source: { kind: "sibling", vout: 1, path: "tile.svg" },
					mediaType: "image/svg+xml",
					integrity: await integrity(svg),
					delivery: "vendored",
					render: {
						mode: "mask",
						repeat: "space",
						size: "contain",
						position: "top right",
					},
				},
			],
		};

		const item = await compileThemeRegistryItem(
			source,
			origin,
			async (location) =>
				location.origin.startsWith("d")
					? { bytes: font, mediaType: "font/woff2" }
					: { bytes: svg, mediaType: "image/svg+xml" },
		);

		expect(item.files).toEqual([
			{
				path: `theme-token/${"c".repeat(64)}_1/tile.svg`,
				type: "registry:file",
				target: `~/public/theme-token/${"c".repeat(64)}_1/tile.svg`,
				content: new TextDecoder().decode(svg),
			},
		]);
		expect(item.css["@layer base"]["body::before"]["mask-image"]).toContain(
			`/theme-token/${"c".repeat(64)}_1/tile.svg`,
		);
		expect(item.css["@layer base"]["body::before"]).toMatchObject({
			"background-color": "var(--primary)",
			"mask-repeat": "space",
			"mask-size": "contain",
			"mask-position": "top right",
		});
		expect(item.cssVars.theme["font-sans"]).toContain("tt-dddddddd-2");
		const serialized = JSON.stringify(item);
		expect(serialized).toContain("/r/fonts/");
		expect(serialized).not.toContain('"registryDependencies":["_');
		expect(serialized).not.toContain('"registryDependencies":["/content/');
	});

	test("omits only unavailable optional assets with a diagnostic", async () => {
		const source = {
			...createThemeToken("Optional", {}, {}),
			assets: [
				{
					role: "background.page",
					kind: "pattern",
					source: { kind: "sibling", vout: 1 },
					mediaType: "image/svg+xml",
					integrity: `sha256:${"0".repeat(64)}`,
					required: false,
				},
			],
		};
		const item = await compileThemeRegistryItem(
			source,
			origin,
			async () => undefined,
		);

		expect(JSON.stringify(item.meta)).toContain("not available yet");
		expect(item.files).toBeUndefined();
	});

	test("keeps media and integrity failures hard", async () => {
		const bytes = new TextEncoder().encode("wrong");
		for (const [asset, expectedCode] of [
			[
				{
					role: "font.sans",
					kind: "font",
					source: { kind: "sibling", vout: 1 },
					mediaType: "font/woff",
					integrity: `sha256:${"0".repeat(64)}`,
				},
				"invalid_media_type",
			],
			[
				{
					role: "background.page",
					kind: "pattern",
					source: { kind: "sibling", vout: 2 },
					mediaType: "image/svg+xml",
					integrity: `sha256:${"0".repeat(64)}`,
				},
				"integrity_mismatch",
			],
		] as const) {
			try {
				await compileThemeRegistryItem(
					{
						...createThemeToken("Hard error", {}, {}),
						assets: [asset],
					},
					origin,
					async () => ({ bytes, mediaType: asset.mediaType }),
				);
				expect.unreachable();
			} catch (error) {
				expect(error).toBeInstanceOf(ThemeAssetError);
				expect((error as ThemeAssetError).code).toBe(expectedCode);
				expect((error as ThemeAssetError).retryable).toBe(false);
			}
		}
	});

	test("validates extension relationships and omits only optional unknown roles", async () => {
		try {
			await compileThemeRegistryItem(
				{
					...createThemeToken("Extension", {}, {}),
					assets: [
						{
							role: "example.custom",
							kind: "pattern",
							source: { kind: "origin", origin: "not-an-origin" },
							mediaType: "image/svg+xml",
							integrity: `sha256:${"0".repeat(64)}`,
						},
					],
				},
				origin,
				async () => undefined,
			);
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(ThemeAssetError);
			expect((error as ThemeAssetError).code).toBe("invalid_source");
		}

		const asset = {
			role: "example.custom",
			kind: "pattern" as const,
			source: { kind: "sibling" as const, vout: 1 },
			mediaType: "image/svg+xml",
			integrity: `sha256:${"0".repeat(64)}`,
		};
		try {
			await compileThemeRegistryItem(
				{ ...createThemeToken("Required", {}, {}), assets: [asset] },
				origin,
				async () => undefined,
			);
			expect.unreachable();
		} catch (error) {
			expect((error as ThemeAssetError).code).toBe("unsupported_delivery");
		}

		const optional = await compileThemeRegistryItem(
			{
				...createThemeToken("Optional", {}, {}),
				assets: [{ ...asset, required: false }],
			},
			origin,
			async () => undefined,
		);
		expect(JSON.stringify(optional.meta)).toContain(
			"Ignored unsupported asset role",
		);
	});
});
