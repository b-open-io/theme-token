"use client";

import { useCallback, useEffect, useState } from "react";

export interface ThemeWithChange {
	origin: string;
	price: number;
	priceChange24h: number | null;
	priceChangeAbsolute: number | null;
}

export interface MarketStats {
	totalListings: number;
	floorPrice: number;
	floorPriceChange24h: number | null;
	totalVolume: number;
	volumeChange24h: number | null;
	themesWithChanges: ThemeWithChange[];
	lastUpdated: number;
}

interface UseMarketHistoryOptions {
	listings: Array<{ origin: string; price: number }>;
}

interface UseMarketHistoryReturn {
	stats: MarketStats | null;
	trending: ThemeWithChange[];
	featured: ThemeWithChange | undefined;
	getPriceChange: (origin: string) => number | null;
	isLoading: boolean;
}

export function useMarketHistory({
	listings,
}: UseMarketHistoryOptions): UseMarketHistoryReturn {
	const [serverStats, setServerStats] = useState<MarketStats | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Fetch stats from server API
	useEffect(() => {
		async function fetchStats() {
			try {
				const response = await fetch("/api/market/stats");
				if (response.ok) {
					const data: MarketStats = await response.json();
					setServerStats(data);
				}
			} catch (error) {
				console.error("[useMarketHistory] Failed to fetch stats:", error);
			} finally {
				setIsLoading(false);
			}
		}

		fetchStats();
	}, []);

	// Merge server stats with current listings
	// Server provides historical price changes, current listings provide live data
	const stats: MarketStats | null = serverStats
		? {
				...serverStats,
				// Use current listing count if available
				totalListings:
					listings.length > 0 ? listings.length : serverStats.totalListings,
				// Recalculate floor from current listings if available
				floorPrice:
					listings.length > 0
						? Math.min(...listings.map((l) => l.price))
						: serverStats.floorPrice,
				// Merge price changes from server with current listings
				themesWithChanges: listings.map((listing) => {
					const serverTheme = serverStats.themesWithChanges.find(
						(t) => t.origin === listing.origin,
					);
					return {
						origin: listing.origin,
						price: listing.price,
						priceChange24h: serverTheme?.priceChange24h ?? null,
						priceChangeAbsolute: serverTheme?.priceChangeAbsolute ?? null,
					};
				}),
			}
		: listings.length > 0
			? {
					totalListings: listings.length,
					floorPrice: Math.min(...listings.map((l) => l.price)),
					floorPriceChange24h: null,
					totalVolume: listings.reduce((sum, l) => sum + l.price, 0),
					volumeChange24h: null,
					themesWithChanges: listings.map((l) => ({
						origin: l.origin,
						price: l.price,
						priceChange24h: null,
						priceChangeAbsolute: null,
					})),
					lastUpdated: 0,
				}
			: null;

	// Get trending themes (sorted by positive price change)
	const trending: ThemeWithChange[] = stats
		? [...stats.themesWithChanges]
				.filter((t) => t.priceChange24h !== null)
				.sort((a, b) => (b.priceChange24h ?? 0) - (a.priceChange24h ?? 0))
				.slice(0, 8)
		: [];

	// Get featured theme (highest priced)
	const featured: ThemeWithChange | undefined = stats
		? [...stats.themesWithChanges].sort((a, b) => b.price - a.price)[0]
		: undefined;

	// Helper to get price change for a specific theme
	const getPriceChange = useCallback(
		(origin: string): number | null => {
			if (!stats) return null;
			const theme = stats.themesWithChanges.find((t) => t.origin === origin);
			return theme?.priceChange24h ?? null;
		},
		[stats],
	);

	return {
		stats,
		trending,
		featured,
		getPriceChange,
		isLoading,
	};
}
