import { Resvg } from "@resvg/resvg-js";
import { type NextRequest, NextResponse } from "next/server";

type FaviconShape = "glyph" | "badge";
type FaviconBackground = "transparent" | "theme" | "solid";

interface FaviconParams {
	shape: FaviconShape;
	background: FaviconBackground;
	foreground: string;
	backgroundColor: string;
	size: 32 | 64 | 128;
	padding: number;
	radius: number;
}

interface GenerateFaviconRequest {
	prompt: string;
	params: FaviconParams;
}

function getPromptGlyph(prompt: string): string {
	const t = prompt.trim();
	if (!t) return "T";
	const first = t[0]?.toUpperCase() ?? "T";
	return /[A-Z0-9]/.test(first) ? first : "T";
}

function buildFaviconSvg(prompt: string, params: FaviconParams): string {
	const size = params.size ?? 64;
	const pad = Math.max(0, Math.min(24, params.padding ?? 6));
	const r = Math.max(0, Math.min(64, params.radius ?? 12));
	const fg = params.foreground || "currentColor";

	const bgFill =
		params.background === "transparent"
			? null
			: params.background === "theme"
				? "hsl(var(--primary))"
				: params.backgroundColor || "#000000";

	const bgRect = bgFill
		? `<rect x="0" y="0" width="${size}" height="${size}" rx="${r}" fill="${bgFill}"/>`
		: "";

	const glyph = getPromptGlyph(prompt);
	const glyphFontSize = Math.floor(size * 0.56);
	const glyphY = Math.floor(size * 0.70);

	const glyphNode =
		params.shape === "glyph"
			? `<text x="${Math.floor(size / 2)}" y="${glyphY}" text-anchor="middle" font-size="${glyphFontSize}" font-family="ui-sans-serif, system-ui, -apple-system" fill="${fg}">${glyph}</text>`
			: `<g>
  <circle cx="${Math.floor(size / 2)}" cy="${Math.floor(size / 2)}" r="${Math.floor((size - pad * 2) / 2)}" fill="${fg}" opacity="0.12"/>
  <path d="M${Math.floor(size * 0.32)} ${Math.floor(size * 0.58)} L${Math.floor(size * 0.50)} ${Math.floor(size * 0.30)} L${Math.floor(size * 0.68)} ${Math.floor(size * 0.58)}" fill="none" stroke="${fg}" stroke-width="${Math.max(2, Math.floor(size * 0.06))}" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M${Math.floor(size * 0.50)} ${Math.floor(size * 0.30)} V${Math.floor(size * 0.76)}" fill="none" stroke="${fg}" stroke-width="${Math.max(2, Math.floor(size * 0.06))}" stroke-linecap="round"/>
</g>`;

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">${bgRect}${glyphNode}</svg>`;
}

function renderPngBase64(svg: string, width: number): string {
	const resvg = new Resvg(svg, {
		fitTo: { mode: "width", value: width },
		background: "transparent",
	});
	const png = resvg.render().asPng();
	return Buffer.from(png).toString("base64");
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as GenerateFaviconRequest;
		const params = body.params;

		if (!params) {
			return NextResponse.json({ error: "params are required" }, { status: 400 });
		}

		const svg = buildFaviconSvg(body.prompt || "", params);
		const sizes = [16, 32, 64, 128];
		const pngBySize: Record<number, string> = {};

		for (const s of sizes) {
			pngBySize[s] = renderPngBase64(svg, s);
		}

		return NextResponse.json({
			generated: {
				svg,
				pngBySize,
			},
			provider: "mock",
			prompt: body.prompt || "",
		});
	} catch (error) {
		console.error("Favicon generation error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to generate favicon",
			},
			{ status: 500 },
		);
	}
}
