/**
 * User Storage API
 *
 * GET /api/user/storage?userId={ordAddress} - Get storage usage and tier info
 */

import { type NextRequest, NextResponse } from "next/server";
import { getStorageUsage, getTierDisplayInfo } from "@/lib/storage";

/**
 * GET /api/user/storage?userId={ordAddress}
 * Get user's storage usage and tier information
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");

		if (!userId) {
			return NextResponse.json(
				{ error: "userId (ordAddress) is required" },
				{ status: 400 },
			);
		}

		const usage = await getStorageUsage(userId);
		const tierInfo = getTierDisplayInfo(usage.tier);

		return NextResponse.json({
			...usage,
			tierInfo: {
				name: tierInfo.name,
				description: tierInfo.description,
				draftsDisplay: tierInfo.draftsDisplay,
				storageDisplay: tierInfo.storageDisplay,
				retentionDisplay: tierInfo.retentionDisplay,
				discountDisplay: tierInfo.discountDisplay,
			},
		});
	} catch (error) {
		console.error("Get storage usage error:", error);
		return NextResponse.json(
			{ error: "Failed to get storage usage" },
			{ status: 500 },
		);
	}
}
