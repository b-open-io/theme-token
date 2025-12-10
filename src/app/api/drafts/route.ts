/**
 * Drafts API
 *
 * POST /api/drafts - Create a new draft
 * GET /api/drafts?type={type} - List drafts by type
 */

import { type NextRequest, NextResponse } from "next/server";
import {
	createDraft,
	listDrafts,
	getStorageUsage,
	getTierLimits,
	type DraftType,
	type CreateDraftRequest,
} from "@/lib/storage";

const VALID_TYPES: DraftType[] = ["theme", "wallpaper", "pattern", "font"];

/**
 * POST /api/drafts
 * Create a new draft
 *
 * Body (JSON):
 * {
 *   userId: string (ordAddress)
 *   type: "theme" | "wallpaper" | "pattern" | "font"
 *   name: string
 *   data?: object (for themes, patterns)
 *   base64?: string (for binary assets)
 *   mimeType?: string (required if base64 provided)
 *   metadata?: { prompt?, style?, provider?, model?, aspectRatio?, sourceType?, sourceOrigin? }
 * }
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { userId, type, name, data, base64, mimeType, metadata } = body;

		// Validate required fields
		if (!userId || typeof userId !== "string") {
			return NextResponse.json(
				{ error: "userId (ordAddress) is required" },
				{ status: 400 },
			);
		}

		if (!type || !VALID_TYPES.includes(type)) {
			return NextResponse.json(
				{ error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
				{ status: 400 },
			);
		}

		if (!name || typeof name !== "string") {
			return NextResponse.json(
				{ error: "name is required" },
				{ status: 400 },
			);
		}

		// Validate binary data
		if (base64 && !mimeType) {
			return NextResponse.json(
				{ error: "mimeType is required when base64 is provided" },
				{ status: 400 },
			);
		}

		// Create the draft
		const draftRequest: CreateDraftRequest = {
			type,
			name,
			data,
			metadata,
		};

		const binaryData = base64 ? { base64, mimeType } : undefined;

		const draft = await createDraft(userId, draftRequest, binaryData);

		return NextResponse.json({ draft }, { status: 201 });
	} catch (error) {
		console.error("Create draft error:", error);

		if (error instanceof Error) {
			// Check if it's a limit error
			if (error.message.includes("limit")) {
				return NextResponse.json(
					{ error: error.message },
					{ status: 403 },
				);
			}
		}

		return NextResponse.json(
			{ error: "Failed to create draft" },
			{ status: 500 },
		);
	}
}

/**
 * GET /api/drafts?type={type}&userId={userId}&limit={limit}&cursor={cursor}
 * List drafts by type
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");
		const type = searchParams.get("type") as DraftType | null;
		const limit = Number.parseInt(searchParams.get("limit") || "20", 10);
		const cursor = searchParams.get("cursor") || undefined;

		if (!userId) {
			return NextResponse.json(
				{ error: "userId is required" },
				{ status: 400 },
			);
		}

		if (!type || !VALID_TYPES.includes(type)) {
			return NextResponse.json(
				{ error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
				{ status: 400 },
			);
		}

		// Get drafts
		const result = await listDrafts(userId, type, { limit, cursor });

		// Get full storage usage for accurate limits
		const usage = await getStorageUsage(userId);
		const tierLimits = getTierLimits(usage.tier);

		// Override usage limits with tier-accurate values
		// Map type to usage key (themes, wallpapers, patterns, fonts)
		const typeUsageMap = {
			theme: usage.usage.themes,
			wallpaper: usage.usage.wallpapers,
			pattern: usage.usage.patterns,
			font: usage.usage.fonts,
		};
		const typeUsage = typeUsageMap[type];
		result.usage = {
			count: typeUsage.count,
			limit: tierLimits.draftsPerType ?? Number.POSITIVE_INFINITY,
			bytesUsed: usage.usage.blob.bytesUsed,
			bytesLimit: tierLimits.blobStorageBytes,
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("List drafts error:", error);
		return NextResponse.json(
			{ error: "Failed to list drafts" },
			{ status: 500 },
		);
	}
}
