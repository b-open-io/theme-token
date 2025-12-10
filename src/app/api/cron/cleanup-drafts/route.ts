/**
 * Cleanup Expired Drafts Cron Job
 *
 * This endpoint is called by Vercel Cron to delete expired drafts.
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-drafts",
 *     "schedule": "0 3 * * *"  // Daily at 3 AM UTC
 *   }]
 * }
 */

import { type NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { deleteDraft, type DraftMetadata, type DraftType } from "@/lib/storage";

// Vercel Cron authorization
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * POST /api/cron/cleanup-drafts
 * Delete all expired drafts across all users
 */
export async function POST(request: NextRequest) {
	// Verify cron secret (Vercel adds this header)
	const authHeader = request.headers.get("authorization");
	if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const now = Date.now();
		let totalDeleted = 0;
		const types: DraftType[] = ["theme", "wallpaper", "pattern", "font"];

		// Scan through all drafts and delete expired ones
		// This is a simple implementation - for large scale, consider batching
		for (const type of types) {
			let cursor = "0";
			do {
				const [nextCursor, keys] = await kv.scan(cursor, {
					match: `drafts:${type}:*`,
					count: 100,
				});
				cursor = nextCursor;

				if (keys.length > 0) {
					const drafts = await kv.mget<DraftMetadata[]>(...keys);

					for (const draft of drafts) {
						if (draft && draft.expiresAt && draft.expiresAt < now) {
							try {
								await deleteDraft(draft.userId, draft.type, draft.id);
								totalDeleted++;
							} catch (error) {
								console.error(`Failed to delete draft ${draft.id}:`, error);
							}
						}
					}
				}
			} while (cursor !== "0");
		}

		return NextResponse.json({
			success: true,
			deletedCount: totalDeleted,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Cleanup cron error:", error);
		return NextResponse.json(
			{ error: "Cleanup failed" },
			{ status: 500 },
		);
	}
}

/**
 * GET /api/cron/cleanup-drafts
 * Health check / manual trigger (requires auth)
 */
export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("authorization");
	if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
		return NextResponse.json({
			status: "ok",
			message: "Cleanup endpoint ready. Use POST to trigger cleanup.",
		});
	}

	// If authorized, trigger cleanup
	return POST(request);
}
