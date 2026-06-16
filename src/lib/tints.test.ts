import { describe, expect, test } from "bun:test";
import { hexToRgb, rgbToHex } from "./tints";

describe("tints color conversions", () => {
	test("rgbToHex produces lowercase hex for white", () => {
		expect(rgbToHex(255, 255, 255)).toBe("#ffffff");
	});

	test("rgbToHex produces lowercase hex for black", () => {
		expect(rgbToHex(0, 0, 0)).toBe("#000000");
	});

	test("rgbToHex zero-pads single-digit channels", () => {
		// r=0 -> "00", g=0 -> "00", b=255 -> "ff"
		expect(rgbToHex(0, 0, 255)).toBe("#0000ff");
	});

	test("hexToRgb parses a known color", () => {
		const result = hexToRgb("#3366ff");
		expect(result).not.toBeNull();
		// biome-ignore lint/style/noNonNullAssertion: guarded above
		expect(result!.r).toBe(0x33);
		// biome-ignore lint/style/noNonNullAssertion: guarded above
		expect(result!.g).toBe(0x66);
		// biome-ignore lint/style/noNonNullAssertion: guarded above
		expect(result!.b).toBe(0xff);
	});

	test("hexToRgb/rgbToHex round-trip", () => {
		const rgb = hexToRgb("#3366ff");
		expect(rgb).not.toBeNull();
		// biome-ignore lint/style/noNonNullAssertion: guarded above
		expect(rgbToHex(rgb!.r, rgb!.g, rgb!.b)).toBe("#3366ff");
	});

	test("hexToRgb returns null for an invalid hex string", () => {
		expect(hexToRgb("not-a-color")).toBeNull();
	});

	test("hexToRgb accepts hex without leading hash", () => {
		const result = hexToRgb("ff0000");
		expect(result).not.toBeNull();
		// biome-ignore lint/style/noNonNullAssertion: guarded above
		expect(result!.r).toBe(255);
		// biome-ignore lint/style/noNonNullAssertion: guarded above
		expect(result!.g).toBe(0);
		// biome-ignore lint/style/noNonNullAssertion: guarded above
		expect(result!.b).toBe(0);
	});
});
