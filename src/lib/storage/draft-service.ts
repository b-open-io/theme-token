/**
 * Draft Service
 *
 * Unified CRUD operations for all draft types.
 * Combines Vercel Blob (binary storage) with Vercel KV (metadata).
 */

import { kv } from "@vercel/kv";
import { deleteBlob, generateDraftId, uploadBase64Blob } from "./blob-service";
import { calculateExpiresAt } from "./tier-limits";
import {
	canCreateDraft,
	decrementDraftCount,
	getUserStorageRecord,
	incrementDraftCount,
} from "./user-storage";
import {
	type CreateDraftRequest,
	type Draft,
	type DraftListResponse,
	type DraftMetadata,
	type DraftType,
	KV_KEYS,
} from "./types";

/**
 * Create a new draft
 *
 * For binary assets (wallpapers, patterns, fonts), pass base64Data and mimeType.
 * For JSON assets (themes), pass data directly.
 */
export async function createDraft(
	userId: string,
	request: CreateDraftRequest,
	binaryData?: {
		base64: string;
		mimeType: string;
	},
): Promise<Draft> {
	const id = generateDraftId(request.type);
	let blobUrl: string | undefined;
	let sizeBytes = 0;

	// For binary assets, upload to Blob first
	if (binaryData) {
		// Check if user can create this draft
		const buffer = Buffer.from(binaryData.base64, "base64");
		sizeBytes = buffer.length;

		const canCreate = await canCreateDraft(userId, request.type, sizeBytes);
		if (!canCreate.allowed) {
			throw new Error(canCreate.reason);
		}

		const result = await uploadBase64Blob(
			userId,
			request.type,
			id,
			binaryData.base64,
			binaryData.mimeType,
		);
		blobUrl = result.url;
		sizeBytes = result.size;
	} else if (request.data) {
		// For JSON data, calculate size
		sizeBytes = JSON.stringify(request.data).length;

		const canCreate = await canCreateDraft(userId, request.type, sizeBytes);
		if (!canCreate.allowed) {
			throw new Error(canCreate.reason);
		}
	}

	// Get user's tier for expiration calculation
	const userRecord = await getUserStorageRecord(userId);
	const expiresAt = calculateExpiresAt(userRecord.tier);

	// Create metadata
	const metadata: DraftMetadata = {
		id,
		userId,
		type: request.type,
		name: request.name,
		blobUrl,
		data: binaryData ? undefined : request.data,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		expiresAt: expiresAt ?? Date.now() + 365 * 24 * 60 * 60 * 1000, // Fallback: 1 year
		sizeBytes,
		mimeType: binaryData?.mimeType ?? "application/json",
		prompt: request.metadata?.prompt,
		style: request.metadata?.style,
		provider: request.metadata?.provider,
		model: request.metadata?.model,
		aspectRatio: request.metadata?.aspectRatio,
		sourceType: request.metadata?.sourceType,
		sourceOrigin: request.metadata?.sourceOrigin,
	};

	// Store metadata in KV
	const key = KV_KEYS.draft(request.type, userId, id);
	await kv.set(key, metadata);

	// Update user storage counts
	await incrementDraftCount(userId, request.type, sizeBytes);

	return {
		...metadata,
		content: binaryData ? blobUrl : request.data,
	};
}

/**
 * Get a draft by ID
 */
export async function getDraft(
	userId: string,
	type: DraftType,
	id: string,
): Promise<Draft | null> {
	const key = KV_KEYS.draft(type, userId, id);
	const metadata = await kv.get<DraftMetadata>(key);

	if (!metadata) {
		return null;
	}

	// Check if expired
	if (metadata.expiresAt && metadata.expiresAt < Date.now()) {
		// Auto-delete expired drafts
		await deleteDraft(userId, type, id);
		return null;
	}

	return {
		...metadata,
		content: metadata.blobUrl ?? metadata.data,
	};
}

/**
 * List drafts for a user by type
 */
export async function listDrafts(
	userId: string,
	type: DraftType,
	options?: {
		limit?: number;
		cursor?: string;
	},
): Promise<DraftListResponse> {
	const limit = options?.limit ?? 20;
	const prefix = `drafts:${type}:${userId}:`;

	// Scan for all draft keys
	const keys: string[] = [];
	const cursor = options?.cursor ?? "0";

	const [nextCursor, foundKeys] = await kv.scan(cursor, {
		match: `${prefix}*`,
		count: limit + 1, // Fetch one extra to check for more
	});

	keys.push(...foundKeys);

	// Fetch all metadata in parallel
	const drafts: DraftMetadata[] = [];
	const now = Date.now();
	const expiredIds: string[] = [];

	if (keys.length > 0) {
		const results = await kv.mget<DraftMetadata[]>(...keys);

		for (const metadata of results) {
			if (metadata) {
				// Check expiration
				if (metadata.expiresAt && metadata.expiresAt < now) {
					expiredIds.push(metadata.id);
				} else {
					drafts.push(metadata);
				}
			}
		}
	}

	// Clean up expired drafts in background
	if (expiredIds.length > 0) {
		for (const id of expiredIds) {
			deleteDraft(userId, type, id).catch(console.error);
		}
	}

	// Sort by createdAt descending (newest first)
	drafts.sort((a, b) => b.createdAt - a.createdAt);

	// Get user storage info for usage
	const userRecord = await getUserStorageRecord(userId);
	const draftKey = `${type}s` as keyof typeof userRecord.draftsCount;

	return {
		drafts: drafts.slice(0, limit),
		usage: {
			count: userRecord.draftsCount[draftKey],
			limit: 5, // Will be overridden by tier limits in API response
			bytesUsed: userRecord.blobBytesUsed,
			bytesLimit: 50 * 1024 * 1024, // Will be overridden
		},
		hasMore: keys.length > limit || nextCursor !== "0",
		nextCursor: nextCursor !== "0" ? nextCursor : undefined,
	};
}

/**
 * Delete a draft
 */
export async function deleteDraft(
	userId: string,
	type: DraftType,
	id: string,
): Promise<boolean> {
	const key = KV_KEYS.draft(type, userId, id);
	const metadata = await kv.get<DraftMetadata>(key);

	if (!metadata) {
		return false;
	}

	// Delete blob if exists
	if (metadata.blobUrl) {
		try {
			await deleteBlob(metadata.blobUrl);
		} catch (error) {
			console.error("Failed to delete blob:", error);
			// Continue with metadata deletion even if blob delete fails
		}
	}

	// Delete metadata from KV
	await kv.del(key);

	// Update user storage counts
	await decrementDraftCount(userId, type, metadata.sizeBytes);

	return true;
}

/**
 * Update draft metadata (not content)
 */
export async function updateDraftMetadata(
	userId: string,
	type: DraftType,
	id: string,
	updates: Partial<Pick<DraftMetadata, "name" | "prompt" | "style">>,
): Promise<DraftMetadata | null> {
	const key = KV_KEYS.draft(type, userId, id);
	const metadata = await kv.get<DraftMetadata>(key);

	if (!metadata) {
		return null;
	}

	const updated: DraftMetadata = {
		...metadata,
		...updates,
		updatedAt: Date.now(),
	};

	await kv.set(key, updated);
	return updated;
}

/**
 * Delete all expired drafts for a user
 * Called by cleanup cron job
 */
export async function deleteExpiredDrafts(userId: string): Promise<number> {
	let deletedCount = 0;
	const types: DraftType[] = ["theme", "wallpaper", "pattern", "font"];

	for (const type of types) {
		const { drafts } = await listDrafts(userId, type, { limit: 100 });
		// listDrafts already filters and deletes expired ones
		// but we can be explicit here
		for (const draft of drafts) {
			if (draft.expiresAt && draft.expiresAt < Date.now()) {
				await deleteDraft(userId, type, draft.id);
				deletedCount++;
			}
		}
	}

	return deletedCount;
}

/**
 * Get all draft IDs for a user (for cleanup/migration)
 */
export async function getAllDraftIds(
	userId: string,
): Promise<{ type: DraftType; id: string }[]> {
	const results: { type: DraftType; id: string }[] = [];
	const types: DraftType[] = ["theme", "wallpaper", "pattern", "font"];

	for (const type of types) {
		const { drafts } = await listDrafts(userId, type, { limit: 100 });
		for (const draft of drafts) {
			results.push({ type, id: draft.id });
		}
	}

	return results;
}
