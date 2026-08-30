import { describe, expect, test } from "bun:test";
import {
	normalizeOriginRouteParam,
	normalizeOutpoint,
	sameOutpoint,
} from "@/lib/outpoint";

const TXID = "a".repeat(64);

describe("outpoint normalization", () => {
	test("normalizes BRC-100 period outpoints", () => {
		expect(normalizeOutpoint(`${TXID}.2`)).toBe(`${TXID}_2`);
		expect(sameOutpoint(`${TXID}.2`, `${TXID}_2`)).toBe(true);
	});

	test("strips registry and social-image route extensions", () => {
		expect(normalizeOriginRouteParam(`${TXID}_1.json`)).toBe(`${TXID}_1`);
		expect(normalizeOriginRouteParam(`${TXID}_1.png`)).toBe(`${TXID}_1`);
	});
});
