/**
 * Unified Cloud Storage Types
 *
 * Storage architecture:
 * - Vercel Blob: Binary assets (images, fonts, SVGs)
 * - Vercel KV: Metadata, usage tracking, tier info
 * - localStorage: Offline cache, anonymous fallback
 * - Blockchain: Permanent inscriptions (1Sat Ordinals)
 */

export type DraftType = "theme" | "wallpaper" | "pattern" | "font" | "registry";
export type StorageTier = "free" | "basic" | "pro" | "unlimited";

/**
 * User storage record stored in Vercel KV
 * Key: `user:storage:{ordAddress}`
 */
export interface UserStorageRecord {
	userId: string; // ordAddress
	tier: StorageTier;
	subscriptionNftOrigin?: string; // NFT origin if subscribed

	draftsCount: {
		themes: number;
		wallpapers: number;
		patterns: number;
		fonts: number;
		registries: number;
	};
	blobBytesUsed: number;

	createdAt: number;
	lastActiveAt: number;
}

/**
 * Draft metadata stored in Vercel KV
 * Key: `drafts:{type}:{ordAddress}:{id}`
 */
export interface DraftMetadata {
	id: string;
	userId: string; // ordAddress
	type: DraftType;
	name: string;

	// Storage location
	blobUrl?: string; // Vercel Blob URL for binary assets
	// biome-ignore lint/suspicious/noExplicitAny: JSON data varies by type
	data?: any; // JSON data (theme styles, pattern params)

	// Timestamps
	createdAt: number;
	updatedAt: number;
	expiresAt: number; // Auto-delete timestamp based on tier

	// Size tracking
	sizeBytes: number;
	mimeType: string;

	// Generation metadata
	prompt?: string;
	style?: string;
	provider?: string;
	model?: string;
	aspectRatio?: string;

	// Source tracking
	sourceType?: "ai" | "upload" | "remix";
	sourceOrigin?: string; // If remixed from inscribed asset
}

/**
 * Draft with full data (returned from API)
 */
export interface Draft extends DraftMetadata {
	// For binary assets, this is the blob URL
	// For JSON assets (themes), this is the full data
	content?: string | object;
}

/**
 * Create draft request
 */
export interface CreateDraftRequest {
	type: DraftType;
	name: string;
	data?: object; // For JSON data (themes, pattern params)
	// File handled separately via multipart for binary assets
	metadata?: {
		prompt?: string;
		style?: string;
		provider?: string;
		model?: string;
		aspectRatio?: string;
		sourceType?: "ai" | "upload" | "remix";
		sourceOrigin?: string;
	};
}

/**
 * Storage usage response
 */
export interface StorageUsage {
	tier: StorageTier;
	tierExpiresAt: number | null;
	subscriptionNftOrigin?: string;

	usage: {
		themes: { count: number; limit: number };
		wallpapers: { count: number; limit: number };
		patterns: { count: number; limit: number };
		fonts: { count: number; limit: number };
		registries: { count: number; limit: number };
		blob: { bytesUsed: number; bytesLimit: number };
	};

	// Calculated
	totalDrafts: number;
	totalDraftLimit: number;
	percentUsed: number;
}

/**
 * Draft list response
 */
export interface DraftListResponse {
	drafts: DraftMetadata[];
	usage: {
		count: number;
		limit: number;
		bytesUsed: number;
		bytesLimit: number;
	};
	hasMore: boolean;
	nextCursor?: string;
}

/**
 * localStorage keys for anonymous/offline storage
 */
export const LOCAL_STORAGE_KEYS = {
	themeDrafts: "theme-token-drafts",
	wallpaperDrafts: "theme-token-wallpaper-drafts",
	patternParams: "pattern-state",
	fontUploads: "theme-token-font-uploads",
	migrationComplete: "theme-token-migration-complete",
} as const;

/**
 * KV key patterns
 */
export const KV_KEYS = {
	userStorage: (userId: string) => `user:storage:${userId}`,
	draft: (type: DraftType, userId: string, id: string) =>
		`drafts:${type}:${userId}:${id}`,
	draftList: (type: DraftType, userId: string) => `drafts:${type}:${userId}:*`,
	inscribed: (type: DraftType, userId: string) =>
		`inscribed:${type}:${userId}`,
} as const;

/**
 * Blob path patterns
 */
export const BLOB_PATHS = {
	draft: (userId: string, type: DraftType, id: string, ext: string) =>
		`drafts/${userId}/${type}/${id}.${ext}`,
} as const;
