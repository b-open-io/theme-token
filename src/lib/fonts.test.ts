import { describe, expect, test } from "bun:test";
import {
	SYSTEM_FONTS,
	sanitizeFontValue,
	sanitizeStyleModeFonts,
} from "./fonts";

describe("sanitizeFontValue", () => {
	test("passes through a valid font stack", () => {
		const v = '"Inter", ui-sans-serif, system-ui, sans-serif';
		expect(sanitizeFontValue(v, "sans")).toBe(v);
	});

	test("replaces value containing braces with the system stack", () => {
		expect(sanitizeFontValue('"X" { "type": "string" }', "serif")).toBe(
			SYSTEM_FONTS.serif,
		);
	});

	test("replaces value containing newline with the system stack", () => {
		expect(sanitizeFontValue("Arial\nsans-serif", "mono")).toBe(
			SYSTEM_FONTS.mono,
		);
	});

	test("replaces value containing quoted type key with the system stack", () => {
		expect(sanitizeFontValue('"type" is bad', "sans")).toBe(SYSTEM_FONTS.sans);
	});

	test("replaces value longer than 200 chars with the system stack", () => {
		const longValue = "a".repeat(201);
		expect(sanitizeFontValue(longValue, "serif")).toBe(SYSTEM_FONTS.serif);
	});

	test("returns undefined for undefined value", () => {
		expect(sanitizeFontValue(undefined, "mono")).toBeUndefined();
	});

	test("returns undefined for null value", () => {
		expect(sanitizeFontValue(null, "sans")).toBeUndefined();
	});

	test("replaces non-string value with the system stack", () => {
		expect(sanitizeFontValue(42, "sans")).toBe(SYSTEM_FONTS.sans);
	});
});

describe("sanitizeStyleModeFonts", () => {
	test("replaces garbage font-serif, keeps valid font-sans", () => {
		const mode = {
			"font-sans": '"Inter", sans-serif',
			"font-serif": 'bad {\n "type": "x" }',
		} as Record<string, string>;
		sanitizeStyleModeFonts(mode);
		expect(mode["font-serif"]).toBe(SYSTEM_FONTS.serif);
		expect(mode["font-sans"]).toBe('"Inter", sans-serif');
	});

	test("deletes absent font keys rather than setting them to undefined", () => {
		const mode = { "font-sans": '"Roboto", sans-serif' } as Record<
			string,
			string
		>;
		sanitizeStyleModeFonts(mode);
		// font-serif and font-mono were absent — they should remain absent
		expect("font-serif" in mode).toBe(false);
		expect("font-mono" in mode).toBe(false);
		expect(mode["font-sans"]).toBe('"Roboto", sans-serif');
	});
});
