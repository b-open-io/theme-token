import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

/**
 * Font Generation Status API
 *
 * Retrieves stored font generation data by job ID.
 * Used for polling status and recovering generations after navigation.
 *
 * Supports both:
 * - New job IDs (UUID format): font:{jobId}
 * - Legacy payment txids: font:generation:{origin}
 */

interface GenerationState {
	status: "generating" | "compiling" | "complete" | "failed";
	prompt: string;
	model: string;
	createdAt: number;
	completedAt?: number;
	isRemix: boolean;
	font?: {
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
		prompt?: string;
	};
	compiled?: {
		woff2Base64: string;
		otfBase64: string;
		woff2Size: number;
		otfSize: number;
		familyName: string;
		glyphCount: number;
	};
	error?: string;
}

// Legacy format for backwards compatibility
interface LegacyStoredGeneration {
	font: GenerationState["font"];
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
				{ error: "Job ID is required" },
				{ status: 400 }
			);
		}

		// Try new format first (job IDs)
		let cached = await kv.get<GenerationState>(`font:${origin}`);

		// Fall back to legacy format (payment txids)
		if (!cached) {
			const legacyCached = await kv.get<LegacyStoredGeneration>(`font:generation:${origin}`);
			if (legacyCached) {
				// Convert legacy format to new format
				cached = {
					status: "complete",
					prompt: legacyCached.prompt,
					model: legacyCached.model,
					createdAt: legacyCached.createdAt,
					completedAt: legacyCached.createdAt,
					isRemix: legacyCached.isRemix,
					font: legacyCached.font,
				};
			}
		}

		if (!cached) {
			return NextResponse.json(
				{ error: "Generation not found or expired", status: "not_found" },
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
