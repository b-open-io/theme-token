"use client";

import type { ThemeToken } from "@theme-token/sdk";
import { motion } from "framer-motion";
import {
	AlertCircle,
	Filter,
	Loader2,
	RefreshCw,
	ShoppingCart,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { useMarketHistory } from "@/hooks/use-market-history";
import {
	getColorDistance,
	parseOklch,
	type OklchColor,
} from "@/lib/color-utils";
import {
	fetchThemeMarketListings,
	type ThemeMarketListing,
} from "@/lib/yours-wallet";
import {
	FilterSidebar,
	type FilterState,
} from "@/components/market/filter-sidebar";
import { GenerateCard } from "@/components/market/generate-card";
import { PurchaseSuccessModal } from "@/components/market/purchase-success-modal";
import { ThemeCard } from "@/components/market/theme-card";
import { TrendingRail } from "@/components/market/trending-rail";

const DEFAULT_FILTERS: FilterState = {
	primaryColor: null,
	radius: null,
	fontTypes: [],
	priceRange: [0, 10],
};

interface PurchaseSuccess {
	txid: string;
	theme: ThemeToken;
}

export default function BrowsePage() {
	const { status, connect, addPendingTheme } = useYoursWallet();
	const { mode, applyThemeAnimated } = useTheme();
	const [listings, setListings] = useState<ThemeMarketListing[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [purchasing, setPurchasing] = useState<string | null>(null);
	const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
	const [purchaseSuccess, setPurchaseSuccess] = useState<PurchaseSuccess | null>(null);

	const isConnected = status === "connected";

	// Market history for stats and trending
	const { stats, trending, getPriceChange } = useMarketHistory({
		listings: listings.map((l) => ({ origin: l.origin, price: l.price })),
	});

	// Build trending items with full theme data
	const trendingItems = useMemo(() => {
		return trending
			.map((t) => {
				const listing = listings.find((l) => l.origin === t.origin);
				if (!listing) return null;
				return { ...t, theme: listing.theme };
			})
			.filter((t): t is NonNullable<typeof t> => t !== null);
	}, [trending, listings]);

	useEffect(() => {
		loadListings();
	}, []);

	async function loadListings() {
		setIsLoading(true);
		setError(null);
		try {
			const data = await fetchThemeMarketListings();
			setListings(data);
			// Update max price in filters
			if (data.length > 0) {
				const maxPrice = Math.max(...data.map((l) => l.price / 100000000));
				setFilters((f) => ({
					...f,
					priceRange: [0, Math.ceil(maxPrice * 100) / 100],
				}));
			}
		} catch (err) {
			setError("Failed to load marketplace listings");
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	}

	const handlePurchase = async (listing: ThemeMarketListing) => {
		if (!isConnected) return;

		setPurchasing(listing.outpoint);
		try {
			const wallet = window.yours;
			if (!wallet) throw new Error("Wallet not available");

			const txid = await wallet.purchaseOrdinal({
				outpoint: listing.outpoint,
				marketplaceRate: 0.02,
				marketplaceAddress: "15q8YQSqUa9uTh6gh4AVixxq29xkpBBP9z",
			});

			// Add to pending themes for immediate ownership (before wallet confirms UTXO)
			addPendingTheme(listing.theme, txid);

			// Show success modal
			setPurchaseSuccess({ txid, theme: listing.theme });

			// Refresh listings in background
			loadListings();
		} catch (err) {
			console.error("Purchase failed:", err);
			setError(err instanceof Error ? err.message : "Purchase failed");
		} finally {
			setPurchasing(null);
		}
	};

	const handleApplyPurchasedTheme = () => {
		if (purchaseSuccess) {
			// Create a synthetic mouse event for the animation
			const syntheticEvent = new MouseEvent("click", {
				clientX: window.innerWidth / 2,
				clientY: window.innerHeight / 2,
			}) as unknown as React.MouseEvent;
			applyThemeAnimated(purchaseSuccess.theme, syntheticEvent);
		}
	};

	// Filter and sort listings
	const filteredListings = useMemo(() => {
		let result = [...listings];

		// Filter by price
		result = result.filter((listing) => {
			const priceInBsv = listing.price / 100000000;
			return priceInBsv <= filters.priceRange[1];
		});

		// Filter by radius
		if (filters.radius) {
			result = result.filter((listing) => {
				const themeRadius = listing.theme.styles[mode].radius;
				return themeRadius === filters.radius;
			});
		}

		// Filter by font type
		if (filters.fontTypes.length > 0) {
			result = result.filter((listing) => {
				const styles = listing.theme.styles[mode];
				return filters.fontTypes.some((fontType) => {
					if (fontType === "sans" && styles["font-sans"]) return true;
					if (fontType === "serif" && styles["font-serif"]) return true;
					if (fontType === "mono" && styles["font-mono"]) return true;
					return false;
				});
			});
		}

		// Sort by color distance if color filter is active
		if (filters.primaryColor) {
			result = result
				.map((listing) => {
					const primaryStr = listing.theme.styles[mode].primary;
					const primaryOklch = parseOklch(primaryStr);
					const distance = primaryOklch
						? getColorDistance(filters.primaryColor as OklchColor, primaryOklch)
						: Infinity;
					return { listing, distance };
				})
				.filter(({ distance }) => distance < 50) // Only show reasonably close matches
				.sort((a, b) => a.distance - b.distance)
				.map(({ listing }) => listing);
		}

		return result;
	}, [listings, filters, mode]);

	const maxPrice = useMemo(() => {
		if (listings.length === 0) return 10;
		return (
			Math.ceil(Math.max(...listings.map((l) => l.price / 100000000)) * 100) /
			100
		);
	}, [listings]);

	const FilterContent = useCallback(
		() => (
			<FilterSidebar
				filters={filters}
				onFiltersChange={setFilters}
				maxPrice={maxPrice}
			/>
		),
		[filters, maxPrice],
	);

	return (
		<>
			{/* Trending Rail */}
			{!isLoading && trendingItems.length > 0 && (
				<div className="mb-6">
					<TrendingRail items={trendingItems} mode={mode} />
				</div>
			)}

			{/* Main Grid */}
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
				{/* Sidebar - Desktop */}
				<aside className="hidden lg:block lg:col-span-3 xl:col-span-2">
					<div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4">
						<FilterContent />
					</div>
				</aside>

				{/* Main Content */}
				<main className="lg:col-span-9 xl:col-span-10">
					{/* Header */}
					<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
						<div>
							<h2 className="text-xl font-semibold">All Themes</h2>
							<p className="text-sm text-muted-foreground">
								{filteredListings.length} theme
								{filteredListings.length !== 1 ? "s" : ""} available
								{filters.primaryColor && " matching your color"}
							</p>
						</div>
						<div className="flex items-center gap-2">
							{/* Mobile Filter Button */}
							<Sheet>
								<SheetTrigger asChild>
									<Button variant="outline" size="sm" className="lg:hidden">
										<Filter className="mr-2 h-4 w-4" />
										Filters
									</Button>
								</SheetTrigger>
								<SheetContent side="left" className="w-80">
									<SheetHeader>
										<SheetTitle>Filters</SheetTitle>
									</SheetHeader>
									<div className="mt-6">
										<FilterContent />
									</div>
								</SheetContent>
							</Sheet>

							<Button
								variant="outline"
								size="sm"
								onClick={loadListings}
								disabled={isLoading}
							>
								<RefreshCw
									className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
								/>
								Refresh
							</Button>
						</div>
					</div>

					{error && (
						<div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
							<AlertCircle className="h-5 w-5" />
							{error}
						</div>
					)}

					{isLoading ? (
						<div className="flex items-center justify-center py-20">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : (
						<>
							{/* Show message when no themes match */}
							{listings.length > 0 && filteredListings.length === 0 && (
								<div className="mb-6 flex items-center justify-between rounded-lg border border-muted bg-muted/30 p-4">
									<div className="flex items-center gap-3">
										<Filter className="h-5 w-5 text-muted-foreground" />
										<div>
											<p className="text-sm font-medium">
												No themes match your filters
											</p>
											<p className="text-xs text-muted-foreground">
												Generate a custom theme with AI or adjust filters
											</p>
										</div>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setFilters(DEFAULT_FILTERS)}
									>
										Clear filters
									</Button>
								</div>
							)}

							{/* Theme grid - always show with RemixCard */}
							<div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
								{filteredListings.map((listing, index) => (
									<motion.div
										key={listing.outpoint}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
									>
										<ThemeCard
											theme={listing.theme}
											origin={listing.origin}
											price={listing.price}
											mode={mode}
											isConnected={isConnected}
											isPurchasing={purchasing === listing.outpoint}
											onPurchase={() => handlePurchase(listing)}
											onConnect={connect}
											onApplyTheme={(e) =>
												applyThemeAnimated(listing.theme, e)
											}
											priceChange={getPriceChange(listing.origin)}
										/>
									</motion.div>
								))}

								{/* AI Generate Card - Always visible */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: filteredListings.length * 0.05 }}
								>
									<GenerateCard filters={filters} />
								</motion.div>
							</div>

							{/* Empty marketplace state */}
							{listings.length === 0 && (
								<div className="mt-8 rounded-xl border border-dashed border-border py-12 text-center">
									<ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
									<h3 className="mb-2 text-lg font-semibold">
										Marketplace is empty
									</h3>
									<p className="text-muted-foreground">
										Be the first to list a theme!
									</p>
								</div>
							)}
						</>
					)}
				</main>
			</div>

			{/* Purchase Success Modal */}
			{purchaseSuccess && (
				<PurchaseSuccessModal
					isOpen={true}
					onClose={() => setPurchaseSuccess(null)}
					onApplyNow={handleApplyPurchasedTheme}
					txid={purchaseSuccess.txid}
					theme={purchaseSuccess.theme}
				/>
			)}
		</>
	);
}
