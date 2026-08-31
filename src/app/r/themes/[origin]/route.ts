import { toShadcnRegistry, validateThemeToken } from "@theme-token/sdk";
import { NextResponse } from "next/server";
import { getOrdfsUrl } from "@/lib/ordfs";
import { normalizeOriginRouteParam } from "@/lib/outpoint";
import {
	compileThemeTokenV2,
	isThemeTokenV2Source,
} from "@/lib/registry-gateway";
import { getThemeByOrigin } from "@/lib/server/get-session-theme";
import {
	type AssetContentResolver,
	ThemeAssetError,
} from "@/lib/theme-assets-v2";

const resolveAssetContent: AssetContentResolver = async ({ origin, path }) => {
	try {
		const response = await fetch(
			getOrdfsUrl(`${origin}${path ? `/${path}` : ""}`),
			{ cache: "no-store" },
		);
		if (!response.ok) return undefined;
		return {
			bytes: new Uint8Array(await response.arrayBuffer()),
			mediaType: response.headers.get("content-type") ?? "",
		};
	} catch {
		return undefined;
	}
};

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ origin: string }> },
) {
	try {
		const { origin: originParam } = await params;
		const origin = normalizeOriginRouteParam(originParam);

		// Themes are ord-fs/json directory packages: theme.json lives at the
		// directory root. ORDFS resolves the `_N` directory pointer to the file.
		const response = await fetch(getOrdfsUrl(`${origin}/theme.json`), {
			cache: "no-store",
		});
		const source = response.ok ? await response.json() : undefined;
		if (isThemeTokenV2Source(source)) {
			const registryItem = await compileThemeTokenV2(
				source,
				origin,
				resolveAssetContent,
			);
			return NextResponse.json(registryItem, {
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "public, max-age=3600, s-maxage=31536000, immutable",
				},
			});
		}

		const result = response.ok
			? validateThemeToken(source)
			: { valid: false as const, error: "Theme not available from 1Sat yet" };
		const theme = result.valid ? result.theme : await getThemeByOrigin(origin);
		if (!theme) {
			return NextResponse.json({ error: "Theme not found" }, { status: 404 });
		}

		const registryItem = toShadcnRegistry(theme);
		return NextResponse.json(registryItem, {
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=3600, s-maxage=31536000, immutable",
			},
		});
	} catch (error) {
		if (error instanceof ThemeAssetError) {
			return NextResponse.json(
				{
					error: error.message,
					code: error.code,
					retryable: error.retryable,
				},
				{
					status: error.retryable ? 503 : 422,
					headers: {
						"Cache-Control": "no-store",
						...(error.retryable && { "Retry-After": "5" }),
					},
				},
			);
		}
		console.error("[Registry API] Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch theme" },
			{ status: 500 },
		);
	}
}
