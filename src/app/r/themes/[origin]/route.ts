import { NextResponse } from "next/server";
import { getOrdfsUrl } from "@/lib/ordfs";
import { normalizeOriginRouteParam } from "@/lib/outpoint";
import { compileThemeRegistryItem } from "@/lib/registry-gateway";
import { getThemeByOrigin } from "@/lib/server/get-session-theme";
import { type AssetContentResolver, ThemeAssetError } from "@/lib/theme-assets";

const MAX_ASSET_BYTES = 5 * 1024 * 1024;

async function readAssetBytes(response: Response): Promise<Uint8Array> {
	const declaredSize = Number(response.headers.get("content-length"));
	if (Number.isFinite(declaredSize) && declaredSize > MAX_ASSET_BYTES) {
		throw new ThemeAssetError(
			"unsupported_delivery",
			"Theme assets cannot exceed 5 MiB",
		);
	}
	if (!response.body) return new Uint8Array();

	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		total += value.byteLength;
		if (total > MAX_ASSET_BYTES) {
			await reader.cancel();
			throw new ThemeAssetError(
				"unsupported_delivery",
				"Theme assets cannot exceed 5 MiB",
			);
		}
		chunks.push(value);
	}
	const bytes = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return bytes;
}

const resolveAssetContent: AssetContentResolver = async ({ origin, path }) => {
	try {
		const response = await fetch(
			getOrdfsUrl(`${origin}${path ? `/${path}` : ""}`),
			{ cache: "no-store" },
		);
		if (!response.ok) return undefined;
		return {
			bytes: await readAssetBytes(response),
			mediaType: response.headers.get("content-type") ?? "",
		};
	} catch (error) {
		if (error instanceof ThemeAssetError) throw error;
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
		if (response.ok) {
			let source: unknown;
			try {
				source = await response.json();
			} catch {
				throw new ThemeAssetError(
					"invalid_source",
					"Theme Token contains invalid JSON",
				);
			}
			const registryItem = await compileThemeRegistryItem(
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

		const theme = await getThemeByOrigin(origin);
		if (!theme) {
			return NextResponse.json({ error: "Theme not found" }, { status: 404 });
		}

		const registryItem = await compileThemeRegistryItem(
			theme,
			origin,
			resolveAssetContent,
		);
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
