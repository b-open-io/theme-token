import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

const HISTORY_KEY = "market:history";

interface PriceSnapshot {
	origin: string;
	price: number;
	timestamp: number;
}

interface MarketSnapshot {
	timestamp: number;
	totalListings: number;
	floorPrice: number;
	listings: PriceSnapshot[];
}

interface MarketHistory {
	snapshots: MarketSnapshot[];
	lastUpdated: number;
}

interface ThemeWithChange {
	origin: string;
	price: number;
	priceChange24h: number | null;
	priceChangeAbsolute: number | null;
}

interface MarketStats {
	totalListings: number;
	floorPrice: number;
	floorPriceChange24h: number | null;
	totalVolume: number;
	volumeChange24h: number | null;
	themesWithChanges: ThemeWithChange[];
	lastUpdated: number;
}

function getSnapshot24hAgo(history: MarketHistory): MarketSnapshot | null {
	const targetTime = Date.now() - 24 * 60 * 60 * 1000;

	let closest: MarketSnapshot | null = null;
	let closestDiff = Number.POSITIVE_INFINITY;

	for (const snapshot of history.snapshots) {
		const diff = Math.abs(snapshot.timestamp - targetTime);
		if (diff < closestDiff) {
			closestDiff = diff;
			closest = snapshot;
		}
	}

	// Only use if within 2 hours of target
	if (closest && closestDiff < 2 * 60 * 60 * 1000) {
		return closest;
	}

	return null;
}

function calcPercentChange(current: number, previous: number): number | null {
	if (previous === 0) return null;
	return ((current - previous) / previous) * 100;
}

// Get market stats with price changes
export async function GET() {
	try {
		const history: MarketHistory | null = await kv.get(HISTORY_KEY);

		if (!history || history.snapshots.length === 0) {
			return NextResponse.json({
				totalListings: 0,
				floorPrice: 0,
				floorPriceChange24h: null,
				totalVolume: 0,
				volumeChange24h: null,
				themesWithChanges: [],
				lastUpdated: 0,
			} satisfies MarketStats);
		}

		// Get latest snapshot
		const latest = history.snapshots[history.snapshots.length - 1];
		const snapshot24h = getSnapshot24hAgo(history);

		const prices = latest.listings.map((l) => l.price);
		const totalVolume = prices.reduce((sum, p) => sum + p, 0);

		// Calculate floor price change
		const floorPriceChange24h = snapshot24h
			? calcPercentChange(latest.floorPrice, snapshot24h.floorPrice)
			: null;

		// Calculate volume change
		const prevVolume = snapshot24h
			? snapshot24h.listings.reduce((sum, l) => sum + l.price, 0)
			: null;
		const volumeChange24h =
			prevVolume !== null ? calcPercentChange(totalVolume, prevVolume) : null;

		// Build price map from 24h ago
		const priceMap24h = new Map<string, number>();
		if (snapshot24h) {
			for (const listing of snapshot24h.listings) {
				priceMap24h.set(listing.origin, listing.price);
			}
		}

		// Calculate per-theme changes
		const themesWithChanges: ThemeWithChange[] = latest.listings.map(
			(listing) => {
				const prevPrice = priceMap24h.get(listing.origin);
				const priceChange24h =
					prevPrice !== undefined
						? calcPercentChange(listing.price, prevPrice)
						: null;
				const priceChangeAbsolute =
					prevPrice !== undefined ? listing.price - prevPrice : null;

				return {
					origin: listing.origin,
					price: listing.price,
					priceChange24h,
					priceChangeAbsolute,
				};
			},
		);

		const stats: MarketStats = {
			totalListings: latest.totalListings,
			floorPrice: latest.floorPrice,
			floorPriceChange24h,
			totalVolume,
			volumeChange24h,
			themesWithChanges,
			lastUpdated: history.lastUpdated,
		};

		return NextResponse.json(stats);
	} catch (error) {
		console.error("[Market Stats] Error:", error);
		return NextResponse.json(
			{ error: "Failed to get market stats" },
			{ status: 500 },
		);
	}
}
