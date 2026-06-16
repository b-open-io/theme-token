import { describe, expect, test } from "bun:test";
import { extractTxid, extractVout } from "./registry-gateway";

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
