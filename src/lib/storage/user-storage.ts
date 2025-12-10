/**
 * User Storage Record Management
 *
 * Tracks user storage usage, tier, and subscription NFT.
 * Stored in Vercel KV for fast access.
 */

import { kv } from "@vercel/kv";
import { getTierLimits } from "./tier-limits";
import {
	KV_KEYS,
	type DraftType,
	type StorageTier,
	type StorageUsage,
	type UserStorageRecord,
} from "./types";

const DEFAULT_TIER: StorageTier = "free";

/**
 * Get or create user storage record
 */
export async function getUserStorageRecord(
	userId: string,
): Promise<UserStorageRecord> {
	const key = KV_KEYS.userStorage(userId);
	const existing = await kv.get<UserStorageRecord>(key);

	if (existing) {
		// Migrate old records that don't have registries field
		if (existing.draftsCount && !('registries' in existing.draftsCount)) {
			// Type assertion for old record format
			const oldDraftsCount = existing.draftsCount as unknown as {
				themes: number;
				wallpapers: number;
				patterns: number;
				fonts: number;
			};
			const migrated: UserStorageRecord = {
				...existing,
				draftsCount: {
					themes: oldDraftsCount.themes || 0,
					wallpapers: oldDraftsCount.wallpapers || 0,
					patterns: oldDraftsCount.patterns || 0,
					fonts: oldDraftsCount.fonts || 0,
					registries: 0,
				},
			};
			await kv.set(key, migrated);
			return migrated;
		}
		return existing;
	}

	// Create new record for first-time user
	const newRecord: UserStorageRecord = {
		userId,
		tier: DEFAULT_TIER,
		draftsCount: {
			themes: 0,
			wallpapers: 0,
			patterns: 0,
			fonts: 0,
			registries: 0,
		},
		blobBytesUsed: 0,
		createdAt: Date.now(),
		lastActiveAt: Date.now(),
	};

	await kv.set(key, newRecord);
	return newRecord;
}

/**
 * Update user storage record
 */
export async function updateUserStorageRecord(
	userId: string,
	updates: Partial<Omit<UserStorageRecord, "userId" | "createdAt">>,
): Promise<UserStorageRecord> {
	const current = await getUserStorageRecord(userId);
	const updated: UserStorageRecord = {
		...current,
		...updates,
		lastActiveAt: Date.now(),
	};

	await kv.set(KV_KEYS.userStorage(userId), updated);
	return updated;
}

/**
 * Increment draft count for a type
 */
export async function incrementDraftCount(
	userId: string,
	type: DraftType,
	bytes: number,
): Promise<UserStorageRecord> {
	const current = await getUserStorageRecord(userId);

	const draftKey = `${type}s` as keyof typeof current.draftsCount;
	const updated: UserStorageRecord = {
		...current,
		draftsCount: {
			...current.draftsCount,
			[draftKey]: current.draftsCount[draftKey] + 1,
		},
		blobBytesUsed: current.blobBytesUsed + bytes,
		lastActiveAt: Date.now(),
	};

	await kv.set(KV_KEYS.userStorage(userId), updated);
	return updated;
}

/**
 * Decrement draft count for a type
 */
export async function decrementDraftCount(
	userId: string,
	type: DraftType,
	bytes: number,
): Promise<UserStorageRecord> {
	const current = await getUserStorageRecord(userId);

	const draftKey = `${type}s` as keyof typeof current.draftsCount;
	const updated: UserStorageRecord = {
		...current,
		draftsCount: {
			...current.draftsCount,
			[draftKey]: Math.max(0, current.draftsCount[draftKey] - 1),
		},
		blobBytesUsed: Math.max(0, current.blobBytesUsed - bytes),
		lastActiveAt: Date.now(),
	};

	await kv.set(KV_KEYS.userStorage(userId), updated);
	return updated;
}

/**
 * Update user tier (e.g., after NFT verification)
 */
export async function updateUserTier(
	userId: string,
	tier: StorageTier,
	subscriptionNftOrigin?: string,
): Promise<UserStorageRecord> {
	return updateUserStorageRecord(userId, {
		tier,
		subscriptionNftOrigin,
	});
}

/**
 * Get full storage usage info with limits
 */
export async function getStorageUsage(userId: string): Promise<StorageUsage> {
	const record = await getUserStorageRecord(userId);
	const limits = getTierLimits(record.tier);

	const draftsLimit = limits.draftsPerType ?? Number.POSITIVE_INFINITY;
	const bytesLimit = limits.blobStorageBytes;

	const totalDrafts =
		record.draftsCount.themes +
		record.draftsCount.wallpapers +
		record.draftsCount.patterns +
		record.draftsCount.fonts +
		record.draftsCount.registries;

	const totalDraftLimit =
		limits.draftsPerType === null ? Number.POSITIVE_INFINITY : limits.draftsPerType * 5;

	return {
		tier: record.tier,
		tierExpiresAt: null, // NFT-based, doesn't expire
		subscriptionNftOrigin: record.subscriptionNftOrigin,

		usage: {
			themes: { count: record.draftsCount.themes, limit: draftsLimit },
			wallpapers: { count: record.draftsCount.wallpapers, limit: draftsLimit },
			patterns: { count: record.draftsCount.patterns, limit: draftsLimit },
			fonts: { count: record.draftsCount.fonts, limit: draftsLimit },
			registries: { count: record.draftsCount.registries, limit: draftsLimit },
			blob: { bytesUsed: record.blobBytesUsed, bytesLimit },
		},

		totalDrafts,
		totalDraftLimit,
		percentUsed: Math.round(
			(record.blobBytesUsed / bytesLimit) * 100,
		),
	};
}

/**
 * Check if user can create a new draft
 */
export async function canCreateDraft(
	userId: string,
	type: DraftType,
	sizeBytes: number,
): Promise<{ allowed: boolean; reason?: string }> {
	const record = await getUserStorageRecord(userId);
	const limits = getTierLimits(record.tier);

	// Check draft count limit
	const draftKey = `${type}s` as keyof typeof record.draftsCount;
	if (
		limits.draftsPerType !== null &&
		record.draftsCount[draftKey] >= limits.draftsPerType
	) {
		return {
			allowed: false,
			reason: `Draft limit reached (${limits.draftsPerType} ${type}s). Delete drafts or upgrade your subscription.`,
		};
	}

	// Check storage limit
	if (record.blobBytesUsed + sizeBytes > limits.blobStorageBytes) {
		return {
			allowed: false,
			reason: `Storage limit reached. Delete drafts or upgrade your subscription.`,
		};
	}

	return { allowed: true };
}

/**
 * Recalculate storage usage from actual blob storage
 * Useful for fixing inconsistencies
 */
export async function recalculateStorageUsage(
	userId: string,
	actualBlobBytes: number,
	actualDraftCounts: {
		themes: number;
		wallpapers: number;
		patterns: number;
		fonts: number;
		registries: number;
	},
): Promise<UserStorageRecord> {
	return updateUserStorageRecord(userId, {
		blobBytesUsed: actualBlobBytes,
		draftsCount: actualDraftCounts,
	});
}
