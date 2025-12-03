"use client";

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
import { RemixCard } from "@/components/market/remix-card";
import { ThemeCard } from "@/components/market/theme-card";

const DEFAULT_FILTERS: FilterState = {
	primaryColor: null,
	radius: null,
	fontTypes: [],
	priceRange: [0, 10],
};

export default function BrowsePage() {
	const { status, connect } = useYoursWallet();
	const { mode } = useTheme();
	const [listings, setListings] = useState<ThemeMarketListing[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [purchasing, setPurchasing] = useState<string | null>(null);
	const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

	const isConnected = status === "connected";

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

			console.log("Purchase successful:", txid);
			await loadListings();
		} catch (err) {
			console.error("Purchase failed:", err);
			setError(err instanceof Error ? err.message : "Purchase failed");
		} finally {
			setPurchasing(null);
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
		return Math.ceil(Math.max(...listings.map((l) => l.price / 100000000)) * 100) / 100;
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
		<div className="min-h-[calc(100vh-12rem)]">
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
				{/* Sidebar - Desktop */}
				<aside className="hidden lg:block lg:col-span-3 xl:col-span-2">
					<div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4">
						<FilterContent />
					</div>
				</aside>

				{/* Main Content */}
				<main className="lg:col-span-9 xl:col-span-10">
					{/* Header */}
					<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
						<div>
							<h2 className="text-2xl font-bold">Available Themes</h2>
							<p className="text-sm text-muted-foreground">
								{filteredListings.length} theme
								{filteredListings.length !== 1 ? "s" : ""} found
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
					) : listings.length === 0 ? (
						<div className="rounded-xl border border-dashed border-border py-20 text-center">
							<ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
							<h3 className="mb-2 text-lg font-semibold">
								No listings available
							</h3>
							<p className="text-muted-foreground">
								The marketplace is currently empty. Be the first to list a
								theme!
							</p>
						</div>
					) : filteredListings.length === 0 ? (
						<div className="rounded-xl border border-dashed border-border py-20 text-center">
							<Filter className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
							<h3 className="mb-2 text-lg font-semibold">
								No themes match your filters
							</h3>
							<p className="mb-4 text-muted-foreground">
								Try adjusting your filters or create a custom theme
							</p>
							<Button
								variant="outline"
								onClick={() => setFilters(DEFAULT_FILTERS)}
							>
								Clear filters
							</Button>
						</div>
					) : (
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
									/>
								</motion.div>
							))}

							{/* Remix Card - Always at the end */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: filteredListings.length * 0.05 }}
							>
								<RemixCard filters={filters} />
							</motion.div>
						</div>
					)}
				</main>
			</div>
		</div>
	);
}
