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
		expect(css).toContain('format("woff2")');
		expect(css).toContain(`api.1sat.app/content/${TXID}_2`);
	});

	test("rejects invalid origins before constructing CSS", async () => {
		const response = await GET(new Request("https://themetoken.dev"), {
			params: Promise.resolve({ origin: "not-an-origin.css" }),
		});

		expect(response.status).toBe(400);
	});

	test("supports a verified compiler's path and family without allowing traversal", async () => {
		const response = await GET(
			new Request(
				`https://themetoken.dev/r/fonts/${TXID}_2.css?family=tt-aaaaaaaa-2&path=fonts%2Fbrand.woff2`,
			),
			{ params: Promise.resolve({ origin: `${TXID}_2.css` }) },
		);
		const css = await response.text();

		expect(response.status).toBe(200);
		expect(css).toContain('font-family: "tt-aaaaaaaa-2"');
		expect(css).toContain(`${TXID}_2/fonts/brand.woff2`);

		const invalid = await GET(
			new Request(
				`https://themetoken.dev/r/fonts/${TXID}_2.css?path=..%2Fsecret`,
			),
			{ params: Promise.resolve({ origin: `${TXID}_2.css` }) },
		);
		expect(invalid.status).toBe(400);
	});
});
