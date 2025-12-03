import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

/**
 * Font Generation Retrieval API
 *
 * Retrieves stored font generation data by origin (payment txid).
 * Used for recovering generations after navigation/page refresh.
 */

interface StoredGeneration {
	font: {
		name: string;
		style: string;
		unitsPerEm: number;
		ascender: number;
		descender: number;
		capHeight: number;
		xHeight: number;
		glyphs: Array<{
			char: string;
			unicode: number;
			width: number;
			path: string;
		}>;
		generatedBy: string;
		generatedAt: string;
		isRemix: boolean;
	};
	prompt: string;
	model: string;
	createdAt: number;
	isRemix: boolean;
}

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ origin: string }> }
) {
	try {
		const { origin } = await params;

		if (!origin) {
			return NextResponse.json(
				{ error: "Origin is required" },
				{ status: 400 }
			);
		}

		const cached = await kv.get<StoredGeneration>(`font:generation:${origin}`);

		if (!cached) {
			return NextResponse.json(
				{ error: "Generation not found or expired" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			...cached,
			age: Date.now() - cached.createdAt,
		});
	} catch (error) {
		console.error("[font-generation] Error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to retrieve generation",
			},
			{ status: 500 }
		);
	}
}
