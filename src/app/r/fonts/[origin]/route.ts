import { normalizeOriginRouteParam } from "@/lib/outpoint";

const ORIGIN_PATTERN = /^[0-9a-f]{64}_\d+$/;

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ origin: string }> },
) {
	const origin = normalizeOriginRouteParam((await params).origin);
	if (!ORIGIN_PATTERN.test(origin)) {
		return new Response("Invalid font origin", { status: 400 });
	}

	const family = `tt-${origin.slice(0, 8)}`;
	const css = `@font-face {
  font-family: "${family}";
  src: url("https://api.1sat.app/content/${origin}") format("woff2");
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
