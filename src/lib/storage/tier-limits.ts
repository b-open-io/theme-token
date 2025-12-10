/**
 * Storage Tier Definitions and Limits
 *
 * Subscription model:
 * - Free: Pay-as-you-go, limited storage
 * - Basic/Pro/Unlimited: NFT-gated tiers with discounts + more storage
 * - NFTs are resellable on secondary market
 */

import type { StorageTier } from "./types";

export interface TierLimits {
	tier: StorageTier;
	name: string;
	description: string;

	// NFT pricing (in satoshis, 0 = free tier)
	nftPriceSats: number;

	// Draft limits per type
	draftsPerType: number | null; // null = unlimited

	// Blob storage limit in bytes
	blobStorageBytes: number;

	// Retention period in days (drafts auto-delete after this)
	retentionDays: number | null; // null = unlimited

	// Generation cost discount (0-1, e.g., 0.2 = 20% off)
	generationDiscount: number;
}

/**
 * Tier definitions
 * NFT prices are approximate USD equivalents in sats
 * (will be calculated dynamically based on BSV/USD rate)
 */
export const TIER_LIMITS: Record<StorageTier, TierLimits> = {
	free: {
		tier: "free",
		name: "Free",
		description: "Pay-as-you-go with limited storage",
		nftPriceSats: 0,
		draftsPerType: 5,
		blobStorageBytes: 50 * 1024 * 1024, // 50 MB
		retentionDays: 30,
		generationDiscount: 0,
	},
	basic: {
		tier: "basic",
		name: "Basic",
		description: "More storage, 20% off generations",
		nftPriceSats: 2_000_000, // ~$20 at $0.00001/sat
		draftsPerType: 25,
		blobStorageBytes: 500 * 1024 * 1024, // 500 MB
		retentionDays: 90,
		generationDiscount: 0.2,
	},
	pro: {
		tier: "pro",
		name: "Pro",
		description: "Generous storage, 40% off generations",
		nftPriceSats: 5_000_000, // ~$50
		draftsPerType: 100,
		blobStorageBytes: 5 * 1024 * 1024 * 1024, // 5 GB
		retentionDays: 365,
		generationDiscount: 0.4,
	},
	unlimited: {
		tier: "unlimited",
		name: "Unlimited",
		description: "Unlimited drafts, 50% off generations",
		nftPriceSats: 10_000_000, // ~$100
		draftsPerType: null, // unlimited
		blobStorageBytes: 50 * 1024 * 1024 * 1024, // 50 GB
		retentionDays: null, // unlimited
		generationDiscount: 0.5,
	},
};

/**
 * Get limits for a tier
 */
export function getTierLimits(tier: StorageTier): TierLimits {
	return TIER_LIMITS[tier];
}

/**
 * Check if draft count is within tier limits
 */
export function isWithinDraftLimit(
	tier: StorageTier,
	currentCount: number,
): boolean {
	const limits = getTierLimits(tier);
	if (limits.draftsPerType === null) return true;
	return currentCount < limits.draftsPerType;
}

/**
 * Check if blob storage is within tier limits
 */
export function isWithinStorageLimit(
	tier: StorageTier,
	currentBytes: number,
	additionalBytes: number,
): boolean {
	const limits = getTierLimits(tier);
	return currentBytes + additionalBytes <= limits.blobStorageBytes;
}

/**
 * Calculate expiration timestamp based on tier
 */
export function calculateExpiresAt(tier: StorageTier): number | null {
	const limits = getTierLimits(tier);
	if (limits.retentionDays === null) return null;
	return Date.now() + limits.retentionDays * 24 * 60 * 60 * 1000;
}

/**
 * Calculate discounted generation cost
 */
export function calculateDiscountedCost(
	tier: StorageTier,
	baseCostSats: number,
): number {
	const limits = getTierLimits(tier);
	return Math.round(baseCostSats * (1 - limits.generationDiscount));
}

/**
 * Format bytes for display
 */
export function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format days for display
 */
export function formatRetention(days: number | null): string {
	if (days === null) return "Forever";
	if (days === 1) return "1 day";
	if (days < 30) return `${days} days`;
	if (days < 365) return `${Math.round(days / 30)} months`;
	return `${Math.round(days / 365)} year${days >= 730 ? "s" : ""}`;
}

/**
 * Get tier display info for pricing page
 */
export function getTierDisplayInfo(tier: StorageTier) {
	const limits = getTierLimits(tier);
	return {
		...limits,
		draftsDisplay:
			limits.draftsPerType === null
				? "Unlimited"
				: `${limits.draftsPerType} per type`,
		storageDisplay: formatBytes(limits.blobStorageBytes),
		retentionDisplay: formatRetention(limits.retentionDays),
		discountDisplay:
			limits.generationDiscount > 0
				? `${Math.round(limits.generationDiscount * 100)}% off`
				: "Full price",
	};
}
