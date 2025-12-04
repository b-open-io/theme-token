"use client";

import { motion } from "framer-motion";
import {
	AlertCircle,
	Filter,
	Loader2,
	RefreshCw,
	Sparkles,
	Type,
	Wand2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
	fetchFontMarketListings,
	type FontMarketListing,
} from "@/lib/yours-wallet";
import { FontCard } from "@/components/market/font-card";
import { FontFilterSidebar } from "@/components/market/font-filter-sidebar";
import type { FontFilterState } from "@/lib/font-market";
import { DEFAULT_FONT_FILTERS } from "@/lib/font-market";

export default function FontBrowsePage() {
	const { status, connect } = useYoursWallet();
	const [listings, setListings] = useState<FontMarketListing[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [purchasing, setPurchasing] = useState<string | null>(null);
	const [filters, setFilters] = useState<FontFilterState>(DEFAULT_FONT_FILTERS);

	const isConnected = status === "connected";

	useEffect(() => {
		loadListings();
	}, []);

	async function loadListings() {
		setIsLoading(true);
		setError(null);
		try {
			const data = await fetchFontMarketListings();
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
			setError("Failed to load font listings");
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	}

	const handlePurchase = async (listing: FontMarketListing) => {
		if (!isConnected) return;

		setPurchasing(listing.outpoint);
		try {
			const wallet = window.yours;
			if (!wallet) throw new Error("Wallet not available");

			await wallet.purchaseOrdinal({
				outpoint: listing.outpoint,
				marketplaceRate: 0.02,
				marketplaceAddress: "15q8YQSqUa9uTh6gh4AVixxq29xkpBBP9z",
			});

			// Refresh listings
			loadListings();
		} catch (err) {
			console.error("Purchase failed:", err);
			setError(err instanceof Error ? err.message : "Purchase failed");
		} finally {
			setPurchasing(null);
		}
	};

	// Filter listings
	const filteredListings = useMemo(() => {
		let result = [...listings];

		// Filter by price
		result = result.filter((listing) => {
			const priceInBsv = listing.price / 100000000;
			return priceInBsv <= filters.priceRange[1];
		});

		// Filter by category (using style/weight metadata)
		if (filters.category.length > 0) {
			result = result.filter((listing) => {
				const style = listing.metadata.style?.toLowerCase() || "";
				const name = listing.metadata.name?.toLowerCase() || "";

				return filters.category.some((cat) => {
					if (cat === "sans-serif") {
						return (
							name.includes("sans") ||
							(!name.includes("serif") &&
								!name.includes("mono") &&
								!style.includes("serif"))
						);
					}
					if (cat === "serif") {
						return name.includes("serif") && !name.includes("sans");
					}
					if (cat === "mono") {
						return (
							name.includes("mono") ||
							name.includes("code") ||
							style.includes("mono")
						);
					}
					if (cat === "display") {
						return (
							name.includes("display") ||
							name.includes("headline") ||
							name.includes("decorative")
						);
					}
					return false;
				});
			});
		}

		// Filter by glyph count
		if (filters.glyphCountMin > 0) {
			result = result.filter(
				(listing) =>
					(listing.metadata.glyphCount || 0) >= filters.glyphCountMin
			);
		}

		return result;
	}, [listings, filters]);

	const maxPrice = useMemo(() => {
		if (listings.length === 0) return 10;
		return (
			Math.ceil(Math.max(...listings.map((l) => l.price / 100000000)) * 100) /
			100
		);
	}, [listings]);

	const FilterContent = useCallback(
		() => (
			<FontFilterSidebar
				filters={filters}
				onFiltersChange={setFilters}
				maxPrice={maxPrice}
			/>
		),
		[filters, maxPrice]
	);

	return (
		<>
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
							<h2 className="text-xl font-semibold">All Fonts</h2>
							<p className="text-sm text-muted-foreground">
								{filteredListings.length} font
								{filteredListings.length !== 1 ? "s" : ""} available
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
							{/* Show message when no fonts match */}
							{listings.length > 0 && filteredListings.length === 0 && (
								<div className="mb-6 flex items-center justify-between rounded-lg border border-muted bg-muted/30 p-4">
									<div className="flex items-center gap-3">
										<Filter className="h-5 w-5 text-muted-foreground" />
										<div>
											<p className="text-sm font-medium">
												No fonts match your filters
											</p>
											<p className="text-xs text-muted-foreground">
												Generate a custom font with AI or adjust filters
											</p>
										</div>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setFilters(DEFAULT_FONT_FILTERS)}
									>
										Clear filters
									</Button>
								</div>
							)}

							{/* Empty marketplace state - 2/3 + 1/3 layout */}
							{listings.length === 0 ? (
								<div className="grid gap-6 lg:grid-cols-3">
									{/* AI Generate Font Card - 1/3 */}
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
									>
										<GenerateFontCard />
									</motion.div>

									{/* Empty state message - 2/3 */}
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.05 }}
										className="lg:col-span-2"
									>
										<div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
											<Type className="mb-4 h-12 w-12 text-muted-foreground opacity-50" />
											<h3 className="mb-2 text-lg font-semibold">
												No fonts listed yet
											</h3>
											<p className="mb-4 text-muted-foreground">
												Be the first to create and list an AI-generated font!
											</p>
											<Button asChild>
												<Link href="/studio/font">
													<Sparkles className="mr-2 h-4 w-4" />
													Create Font
												</Link>
											</Button>
										</div>
									</motion.div>
								</div>
							) : (
								/* Font grid with listings */
								<div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
									{filteredListings.map((listing, index) => (
										<motion.div
											key={listing.outpoint}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.05 }}
										>
											<FontCard
												listing={listing}
												isConnected={isConnected}
												isPurchasing={purchasing === listing.outpoint}
												onPurchase={() => handlePurchase(listing)}
												onConnect={connect}
											/>
										</motion.div>
									))}

									{/* AI Generate Font Card */}
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: filteredListings.length * 0.05 }}
									>
										<GenerateFontCard />
									</motion.div>
								</div>
							)}
						</>
					)}
				</main>
			</div>
		</>
	);
}

// Card to link to font generation
function GenerateFontCard() {
	return (
		<Link href="/studio/font" className="block">
			<div className="flex h-full min-h-[280px] flex-col rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-5 transition-all hover:border-primary/50 hover:shadow-lg">
				{/* Header */}
				<div className="mb-4 flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<Wand2 className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h3 className="font-semibold">Generate with AI</h3>
						<p className="text-xs text-muted-foreground">Create unique fonts</p>
					</div>
				</div>

				{/* Preview area */}
				<div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg bg-muted/30 p-4">
					<Type className="h-12 w-12 text-primary/50" />
					<div className="text-center">
						<p className="text-sm font-medium">Create Your Own Font</p>
						<p className="text-xs text-muted-foreground">
							AI-powered font generation
						</p>
					</div>
				</div>

				{/* CTA */}
				<div className="mt-4">
					<Button className="w-full gap-2" size="sm">
						<Sparkles className="h-4 w-4" />
						Start Creating
					</Button>
				</div>
			</div>
		</Link>
	);
}
