import { expect, test } from "bun:test";
import { createThemeToken } from "@theme-token/sdk";
import { THEME_TOKEN_V2_SCHEMA_URL } from "@/lib/registry-gateway";
import { GET } from "./route";

const TXID = "a".repeat(64);

test("v2 route distinguishes propagation misses from hard verification errors", async () => {
	const originalFetch = globalThis.fetch;
	let source: unknown = {
		...createThemeToken("Route errors", {}, {}),
		$schema: THEME_TOKEN_V2_SCHEMA_URL,
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
	globalThis.fetch = async (input) => {
		const url = String(input);
		if (url.endsWith("/theme.json")) return Response.json(source);
		if (!indexed) return new Response("not found", { status: 404 });
		return new Response("wrong bytes", {
			headers: { "Content-Type": "image/svg+xml" },
		});
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

		source = createThemeToken("Legacy v1", {}, {});
		const legacy = await GET(new Request("https://themetoken.dev"), context);
		expect(legacy.status).toBe(200);
		expect(await legacy.json()).toMatchObject({
			name: "legacy-v1",
			type: "registry:style",
		});
	} finally {
		globalThis.fetch = originalFetch;
	}
});
