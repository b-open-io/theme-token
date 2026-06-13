/**
 * Unified Cloud Storage Library
 *
 * Exports all storage-related functionality.
 */

// Blob service
export {
	deleteAllUserBlobs,
	deleteBlob,
	deleteBlobs,
	generateDraftId,
	getUserBlobStorageUsed,
	listUserBlobs,
	uploadBase64Blob,
	uploadBlob,
} from "./blob-service";
// Draft service
export {
	createDraft,
	deleteDraft,
	deleteExpiredDrafts,
	getAllDraftIds,
	getDraft,
	listDrafts,
	updateDraftMetadata,
} from "./draft-service";

// Tier limits
export {
	calculateDiscountedCost,
	calculateExpiresAt,
	formatBytes,
	formatRetention,
	getTierDisplayInfo,
	getTierLimits,
	isWithinDraftLimit,
	isWithinStorageLimit,
	TIER_LIMITS,
} from "./tier-limits";
// Types
export type {
	CreateDraftRequest,
	Draft,
	DraftListResponse,
	DraftMetadata,
	DraftType,
	StorageTier,
	StorageUsage,
	UserStorageRecord,
} from "./types";
export { BLOB_PATHS, KV_KEYS, LOCAL_STORAGE_KEYS } from "./types";
// User storage
export {
	canCreateDraft,
	decrementDraftCount,
	getStorageUsage,
	getUserStorageRecord,
	incrementDraftCount,
	recalculateStorageUsage,
	updateUserStorageRecord,
	updateUserTier,
} from "./user-storage";
