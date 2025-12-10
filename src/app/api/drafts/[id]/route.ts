/**
 * Single Draft API
 *
 * GET /api/drafts/[id]?type={type}&userId={userId} - Get a draft
 * DELETE /api/drafts/[id]?type={type}&userId={userId} - Delete a draft
 * PATCH /api/drafts/[id] - Update draft metadata
 */

import { type NextRequest, NextResponse } from "next/server";
import {
	deleteDraft,
	getDraft,
	updateDraftMetadata,
	type DraftType,
} from "@/lib/storage";

const VALID_TYPES: DraftType[] = ["theme", "wallpaper", "pattern", "font"];

interface RouteParams {
	params: Promise<{ id: string }>;
}

/**
 * GET /api/drafts/[id]?type={type}&userId={userId}
 * Get a single draft
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params;
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");
		const type = searchParams.get("type") as DraftType | null;

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

		const draft = await getDraft(userId, type, id);

		if (!draft) {
			return NextResponse.json(
				{ error: "Draft not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ draft });
	} catch (error) {
		console.error("Get draft error:", error);
		return NextResponse.json(
			{ error: "Failed to get draft" },
			{ status: 500 },
		);
	}
}

/**
 * DELETE /api/drafts/[id]?type={type}&userId={userId}
 * Delete a draft
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params;
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");
		const type = searchParams.get("type") as DraftType | null;

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

		const deleted = await deleteDraft(userId, type, id);

		if (!deleted) {
			return NextResponse.json(
				{ error: "Draft not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Delete draft error:", error);
		return NextResponse.json(
			{ error: "Failed to delete draft" },
			{ status: 500 },
		);
	}
}

/**
 * PATCH /api/drafts/[id]
 * Update draft metadata
 *
 * Body:
 * {
 *   userId: string
 *   type: DraftType
 *   name?: string
 *   prompt?: string
 *   style?: string
 * }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params;
		const body = await request.json();
		const { userId, type, ...updates } = body;

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

		const updated = await updateDraftMetadata(userId, type, id, updates);

		if (!updated) {
			return NextResponse.json(
				{ error: "Draft not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ draft: updated });
	} catch (error) {
		console.error("Update draft error:", error);
		return NextResponse.json(
			{ error: "Failed to update draft" },
			{ status: 500 },
		);
	}
}
