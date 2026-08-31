import { describe, expect, test } from "bun:test";
import { GET } from "./route";

const TXID = "a".repeat(64);

describe("on-chain font stylesheet", () => {
	test("emits immutable font-face CSS for a normalized origin", async () => {
		const response = await GET(new Request("https://themetoken.dev"), {
			params: Promise.resolve({ origin: `${TXID}.2.css` }),
		});
		const css = await response.text();

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe(
			"text/css; charset=utf-8",
		);
		expect(css).toContain('font-family: "tt-aaaaaaaa"');
		expect(css).toContain(`api.1sat.app/content/${TXID}_2`);
	});

	test("rejects invalid origins before constructing CSS", async () => {
		const response = await GET(new Request("https://themetoken.dev"), {
			params: Promise.resolve({ origin: "not-an-origin.css" }),
		});

		expect(response.status).toBe(400);
	});
});
