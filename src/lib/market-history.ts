/**
 * Market History - localStorage persistence for price tracking
 * Enables price change indicators and trending calculations
 */

const STORAGE_KEY = "theme-market-history";
const MAX_SNAPSHOTS = 168; // 7 days * 24 hours
const SNAPSHOT_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export interface PriceSnapshot {
	origin: string;
	price: number;
	timestamp: number;
}

export interface MarketSnapshot {
	timestamp: number;
	totalListings: number;
	floorPrice: number;
	listings: PriceSnapshot[];
}

export interface MarketHistory {
	snapshots: MarketSnapshot[];
	lastUpdated: number;
}

export interface ThemeWithChange {
	origin: string;
	price: number;
	priceChange24h: number | null; // percentage, null if no history
	priceChangeAbsolute: number | null; // sats difference
}

export interface MarketStats {
	totalListings: number;
	floorPrice: number;
	floorPriceChange24h: number | null;
	totalVolume: number; // sum of all prices (proxy for volume)
	volumeChange24h: number | null;
	themesWithChanges: ThemeWithChange[];
}

/**
 * Load market history from localStorage
 */
export function loadMarketHistory(): MarketHistory {
	if (typeof window === "undefined") {
		return { snapshots: [], lastUpdated: 0 };
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			return { snapshots: [], lastUpdated: 0 };
		}
		return JSON.parse(stored) as MarketHistory;
	} catch {
		return { snapshots: [], lastUpdated: 0 };
	}
}

/**
 * Save market history to localStorage
 */
export function saveMarketHistory(history: MarketHistory): void {
	if (typeof window === "undefined") return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
	} catch {
		// Storage full or unavailable - silently fail
	}
}

/**
 * Check if we should take a new snapshot (hourly)
 */
export function shouldTakeSnapshot(history: MarketHistory): boolean {
	const now = Date.now();
	return now - history.lastUpdated >= SNAPSHOT_INTERVAL_MS;
}

/**
 * Add a new snapshot to history
 */
export function addSnapshot(
	history: MarketHistory,
	listings: Array<{ origin: string; price: number }>,
): MarketHistory {
	const now = Date.now();

	const prices = listings.map((l) => l.price);
	const floorPrice = prices.length > 0 ? Math.min(...prices) : 0;

	const snapshot: MarketSnapshot = {
		timestamp: now,
		totalListings: listings.length,
		floorPrice,
		listings: listings.map((l) => ({
			origin: l.origin,
			price: l.price,
			timestamp: now,
		})),
	};

	// Add new snapshot and prune old ones
	const snapshots = [...history.snapshots, snapshot].slice(-MAX_SNAPSHOTS);

	return {
		snapshots,
		lastUpdated: now,
	};
}

/**
 * Get snapshot from approximately 24 hours ago
 */
function getSnapshot24hAgo(history: MarketHistory): MarketSnapshot | null {
	const targetTime = Date.now() - 24 * 60 * 60 * 1000;

	// Find closest snapshot to 24h ago
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

/**
 * Calculate percentage change
 */
function calcPercentChange(current: number, previous: number): number | null {
	if (previous === 0) return null;
	return ((current - previous) / previous) * 100;
}

/**
 * Calculate market stats including price changes
 */
export function calculateMarketStats(
	currentListings: Array<{ origin: string; price: number }>,
	history: MarketHistory,
): MarketStats {
	const prices = currentListings.map((l) => l.price);
	const totalListings = currentListings.length;
	const floorPrice = prices.length > 0 ? Math.min(...prices) : 0;
	const totalVolume = prices.reduce((sum, p) => sum + p, 0);

	const snapshot24h = getSnapshot24hAgo(history);

	// Calculate floor price change
	const floorPriceChange24h = snapshot24h
		? calcPercentChange(floorPrice, snapshot24h.floorPrice)
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
	const themesWithChanges: ThemeWithChange[] = currentListings.map(
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

	return {
		totalListings,
		floorPrice,
		floorPriceChange24h,
		totalVolume,
		volumeChange24h,
		themesWithChanges,
	};
}

/**
 * Get trending themes (sorted by positive price change)
 */
export function getTrendingThemes(
	stats: MarketStats,
	limit = 8,
): ThemeWithChange[] {
	return [...stats.themesWithChanges]
		.filter((t) => t.priceChange24h !== null)
		.sort((a, b) => (b.priceChange24h ?? 0) - (a.priceChange24h ?? 0))
		.slice(0, limit);
}

/**
 * Get featured theme (highest priced)
 */
export function getFeaturedTheme(
	stats: MarketStats,
): ThemeWithChange | undefined {
	if (stats.themesWithChanges.length === 0) return undefined;

	return [...stats.themesWithChanges].sort((a, b) => b.price - a.price)[0];
}
