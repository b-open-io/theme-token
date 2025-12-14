import { type NextRequest, NextResponse } from "next/server";

type IconSetStyle = "outline" | "solid";

interface IconSetParams {
	style: IconSetStyle;
	strokeWidth: number;
	padding: number;
	size: 16 | 20 | 24;
}

interface GenerateIconSetRequest {
	prompt: string;
	iconNames: string[];
	params: IconSetParams;
}

function hashString(input: string): number {
	let h = 2166136261;
	for (let i = 0; i < input.length; i++) {
		h ^= input.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

function iconSvg({
	name,
	style,
	strokeWidth,
	padding,
}: {
	name: string;
	style: IconSetStyle;
	strokeWidth: number;
	padding: number;
}): string {
	const h = hashString(name);
	const variant = h % 6;
	const p = Math.max(0, Math.min(6, padding));
	const min = 0 + p;
	const max = 24 - p;
	const mid = 12;

	const strokeAttrs =
		style === "outline"
			? `fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`
			: `fill="currentColor"`;

	const body = (() => {
		switch (variant) {
			case 0:
				return style === "outline"
					? `<rect x="${min + 2}" y="${min + 2}" width="${max - min - 4}" height="${max - min - 4}" rx="4" ${strokeAttrs}/>`
					: `<rect x="${min + 2}" y="${min + 2}" width="${max - min - 4}" height="${max - min - 4}" rx="4" ${strokeAttrs}/>`;
			case 1:
				return style === "outline"
					? `<circle cx="${mid}" cy="${mid}" r="${(max - min) / 2 - 2}" ${strokeAttrs}/>`
					: `<circle cx="${mid}" cy="${mid}" r="${(max - min) / 2 - 2}" ${strokeAttrs}/>`;
			case 2:
				return style === "outline"
					? `<path d="M${mid} ${min + 2} L${max - 2} ${max - 2} H${min + 2} Z" ${strokeAttrs}/>`
					: `<path d="M${mid} ${min + 2} L${max - 2} ${max - 2} H${min + 2} Z" ${strokeAttrs}/>`;
			case 3:
				return style === "outline"
					? `<path d="M${min + 2} ${mid} H${max - 2} M${mid} ${min + 2} V${max - 2}" ${strokeAttrs}/>`
					: `<path d="M${min + 6} ${mid} H${max - 6} M${mid} ${min + 6} V${max - 6}" stroke="currentColor" stroke-width="${Math.max(2, strokeWidth)}" stroke-linecap="round"/>`;
			case 4:
				return style === "outline"
					? `<path d="M${min + 2} ${mid} C${min + 6} ${min + 2}, ${max - 6} ${max - 2}, ${max - 2} ${mid}" ${strokeAttrs}/>`
					: `<path d="M${min + 2} ${mid} C${min + 6} ${min + 2}, ${max - 6} ${max - 2}, ${max - 2} ${mid} C${max - 6} ${min + 2}, ${min + 6} ${max - 2}, ${min + 2} ${mid} Z" ${strokeAttrs}/>`;
			default:
				return style === "outline"
					? `<path d="M${min + 2} ${max - 4} L${mid} ${min + 2} L${max - 2} ${max - 4}" ${strokeAttrs}/>`
					: `<path d="M${min + 4} ${max - 4} L${mid} ${min + 4} L${max - 4} ${max - 4} Z" ${strokeAttrs}/>`;
		}
	})();

	return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as GenerateIconSetRequest;

		const iconNames = Array.isArray(body.iconNames)
			? body.iconNames.map((n) => String(n).trim()).filter(Boolean)
			: [];

		if (iconNames.length === 0) {
			return NextResponse.json({ error: "iconNames is required" }, { status: 400 });
		}

		const params = body.params;
		if (!params || !params.style || !params.strokeWidth || params.padding === undefined) {
			return NextResponse.json({ error: "params are required" }, { status: 400 });
		}

		const iconsByName: Record<string, string> = {};
		const statusByName: Record<string, "generated"> = {};

		for (const name of iconNames) {
			iconsByName[name] = iconSvg({
				name,
				style: params.style,
				strokeWidth: params.strokeWidth,
				padding: params.padding,
			});
			statusByName[name] = "generated";
		}

		return NextResponse.json({
			generated: {
				iconsByName,
				statusByName,
			},
			provider: "mock",
			prompt: body.prompt || "",
		});
	} catch (error) {
		console.error("Icon set generation error:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to generate icon set",
			},
			{ status: 500 },
		);
	}
}

