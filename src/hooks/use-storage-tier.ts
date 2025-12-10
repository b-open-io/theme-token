"use client";

/**
 * Storage Tier Hook
 *
 * Provides access to user's storage tier information and usage.
 */

import { useCallback, useEffect, useState } from "react";
import { useYoursWallet } from "./use-yours-wallet";
import type { StorageTier, StorageUsage } from "@/lib/storage/types";

interface TierInfo {
	name: string;
	description: string;
	draftsDisplay: string;
	storageDisplay: string;
	retentionDisplay: string;
	discountDisplay: string;
}

interface StorageUsageWithTierInfo extends StorageUsage {
	tierInfo: TierInfo;
}

export function useStorageTier() {
	const { addresses, status } = useYoursWallet();
	const ordAddress = addresses?.ordAddress;
	const isConnected = status === "connected";
	const [usage, setUsage] = useState<StorageUsageWithTierInfo | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Fetch storage usage and tier info
	 */
	const fetchUsage = useCallback(async () => {
		if (!isConnected || !ordAddress) {
			setUsage(null);
			return null;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/user/storage?userId=${ordAddress}`);
			if (!response.ok) {
				throw new Error("Failed to fetch storage usage");
			}

			const data: StorageUsageWithTierInfo = await response.json();
			setUsage(data);
			return data;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to fetch usage";
			setError(message);
			return null;
		} finally {
			setLoading(false);
		}
	}, [isConnected, ordAddress]);

	// Auto-fetch on wallet connect
	useEffect(() => {
		if (isConnected && ordAddress) {
			fetchUsage();
		}
	}, [isConnected, ordAddress, fetchUsage]);

	/**
	 * Check if user can create a draft of a given type and size
	 */
	const canCreate = useCallback(
		(type: "theme" | "wallpaper" | "pattern" | "font", sizeBytes = 0): boolean => {
			if (!usage) return false;

			const typeUsage = usage.usage[`${type}s` as keyof typeof usage.usage];
			if ("count" in typeUsage && "limit" in typeUsage) {
				if (typeUsage.count >= typeUsage.limit) return false;
			}

			if (sizeBytes > 0) {
				if (usage.usage.blob.bytesUsed + sizeBytes > usage.usage.blob.bytesLimit) {
					return false;
				}
			}

			return true;
		},
		[usage],
	);

	/**
	 * Get tier upgrade recommendations
	 */
	const getUpgradeReason = useCallback((): string | null => {
		if (!usage) return null;
		if (usage.tier !== "free") return null;

		if (usage.percentUsed >= 80) {
			return "You're running low on storage. Upgrade to get more space.";
		}

		const typesAtLimit = [];
		for (const [key, value] of Object.entries(usage.usage)) {
			if (key !== "blob" && "count" in value && "limit" in value) {
				if (value.count >= value.limit * 0.8) {
					typesAtLimit.push(key.replace("s", ""));
				}
			}
		}

		if (typesAtLimit.length > 0) {
			return `You're running low on ${typesAtLimit.join(", ")} drafts. Upgrade to get more.`;
		}

		return null;
	}, [usage]);

	return {
		// Current tier
		tier: usage?.tier as StorageTier | undefined,
		tierInfo: usage?.tierInfo,

		// Usage stats
		usage,
		percentUsed: usage?.percentUsed ?? 0,
		totalDrafts: usage?.totalDrafts ?? 0,

		// State
		loading,
		error,

		// Actions
		fetchUsage,
		canCreate,
		getUpgradeReason,

		// Clear error
		clearError: () => setError(null),

		// Quick checks
		isCloudEnabled: isConnected && !!ordAddress,
		isPremium: usage?.tier !== "free",
		isNearLimit: (usage?.percentUsed ?? 0) >= 80,
	};
}
