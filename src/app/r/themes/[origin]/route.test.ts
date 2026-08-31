import { expect, test } from "bun:test";
import { createThemeToken } from "@theme-token/sdk";
import { GET } from "./route";

const TXID = "a".repeat(64);

test("route distinguishes propagation misses from hard verification errors", async () => {
	const originalFetch = globalThis.fetch;
	let source: unknown = {
		...createThemeToken("Route errors", {}, {}),
		assets: [
			{
				role: "background.page",
				kind: "pattern",
				source: { kind: "sibling", vout: 1 },
				mediaType: "image/svg+xml",
				integrity: `sha256:${"0".repeat(64)}`,
			},
		],
	};
	let indexed = false;
	let themeResponse = () => Response.json(source);
	let assetResponse = () =>
		new Response("wrong bytes", {
			headers: { "Content-Type": "image/svg+xml" },
		});
	globalThis.fetch = async (input) => {
		const url = String(input);
		if (url.endsWith("/theme.json")) return themeResponse();
		if (!indexed) return new Response("not found", { status: 404 });
		return assetResponse();
	};

	try {
		const context = {
			params: Promise.resolve({ origin: `${TXID}_2.json` }),
		};
		const pending = await GET(new Request("https://themetoken.dev"), context);
		expect(pending.status).toBe(503);
		expect(pending.headers.get("retry-after")).toBe("5");
		expect(await pending.json()).toMatchObject({
			code: "not_indexed",
			retryable: true,
		});

		indexed = true;
		const invalid = await GET(new Request("https://themetoken.dev"), context);
		expect(invalid.status).toBe(422);
		expect(invalid.headers.get("retry-after")).toBeNull();
		expect(await invalid.json()).toMatchObject({
			code: "integrity_mismatch",
			retryable: false,
		});

		source = createThemeToken("Plain theme", {}, {});
		const plain = await GET(new Request("https://themetoken.dev"), context);
		expect(plain.status).toBe(200);
		expect(await plain.json()).toMatchObject({
			name: "plain-theme",
			type: "registry:style",
		});

		themeResponse = () =>
			new Response("{", { headers: { "Content-Type": "application/json" } });
		const malformed = await GET(new Request("https://themetoken.dev"), context);
		expect(malformed.status).toBe(422);
		expect(await malformed.json()).toMatchObject({ code: "invalid_source" });

		themeResponse = () => Response.json(source);
		source = {
			...createThemeToken("Large asset", {}, {}),
			assets: [
				{
					role: "background.page",
					kind: "pattern",
					source: { kind: "sibling", vout: 1 },
					mediaType: "image/svg+xml",
					integrity: `sha256:${"0".repeat(64)}`,
				},
			],
		};
		assetResponse = () => new Response(new Uint8Array(5 * 1024 * 1024 + 1));
		const oversized = await GET(new Request("https://themetoken.dev"), context);
		expect(oversized.status).toBe(422);
		expect(await oversized.json()).toMatchObject({
			code: "unsupported_delivery",
		});
	} finally {
		globalThis.fetch = originalFetch;
	}
});
