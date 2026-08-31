import { normalizeOriginRouteParam } from "@/lib/outpoint";
import { assetContentUrl, ThemeAssetError } from "@/lib/theme-assets-v2";

const ORIGIN_PATTERN = /^[0-9a-f]{64}_(?:0|[1-9][0-9]*)$/;

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ origin: string }> },
) {
	const origin = normalizeOriginRouteParam((await params).origin);
	if (!ORIGIN_PATTERN.test(origin)) {
		return new Response("Invalid font origin", { status: 400 });
	}

	const url = new URL(request.url);
	const requestedFamily = url.searchParams.get("family");
	if (requestedFamily && !/^tt-[a-z0-9-]+$/.test(requestedFamily)) {
		return new Response("Invalid font family", { status: 400 });
	}
	const family = requestedFamily ?? `tt-${origin.slice(0, 8)}`;
	let contentUrl: string;
	try {
		contentUrl = assetContentUrl({
			origin,
			...(url.searchParams.has("path") && {
				path: url.searchParams.get("path") ?? undefined,
			}),
		});
	} catch (error) {
		if (error instanceof ThemeAssetError) {
			return new Response("Invalid font path", { status: 400 });
		}
		throw error;
	}
	const css = `@font-face {
  font-family: "${family}";
  src: url("${contentUrl}") format("woff2");
  font-display: swap;
}\n`;

	return new Response(css, {
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Cache-Control": "public, max-age=31536000, immutable",
			"Content-Type": "text/css; charset=utf-8",
		},
	});
}
