"use client";

import { useCallback, useEffect, useState } from "react";
import {
	type MarketStats,
	type ThemeWithChange,
	addSnapshot,
	calculateMarketStats,
	getFeaturedTheme,
	getTrendingThemes,
	loadMarketHistory,
	saveMarketHistory,
	shouldTakeSnapshot,
} from "@/lib/market-history";

interface UseMarketHistoryOptions {
	listings: Array<{ origin: string; price: number }>;
	autoSnapshot?: boolean;
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
	autoSnapshot = true,
}: UseMarketHistoryOptions): UseMarketHistoryReturn {
	const [stats, setStats] = useState<MarketStats | null>(null);
	const [trending, setTrending] = useState<ThemeWithChange[]>([]);
	const [featured, setFeatured] = useState<ThemeWithChange | undefined>();
	const [isLoading, setIsLoading] = useState(true);

	// Calculate stats when listings change
	useEffect(() => {
		if (listings.length === 0) {
			setStats(null);
			setTrending([]);
			setFeatured(undefined);
			setIsLoading(false);
			return;
		}

		let history = loadMarketHistory();

		// Take new snapshot if needed
		if (autoSnapshot && shouldTakeSnapshot(history)) {
			history = addSnapshot(history, listings);
			saveMarketHistory(history);
		}

		// Calculate stats
		const calculatedStats = calculateMarketStats(listings, history);
		setStats(calculatedStats);
		setTrending(getTrendingThemes(calculatedStats));
		setFeatured(getFeaturedTheme(calculatedStats));
		setIsLoading(false);
	}, [listings, autoSnapshot]);

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
