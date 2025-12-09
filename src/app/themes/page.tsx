"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, RefreshCw, ShoppingCart, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BuyThemeModal } from "@/components/market/buy-theme-modal";
import { PurchaseSuccessModal } from "@/components/market/purchase-success-modal";
import { PageContainer } from "@/components/page-container";
import { useTheme } from "@/components/theme-provider";
import { storeRemixTheme } from "@/components/theme-gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type CachedTheme } from "@/lib/themes-cache";
import { fetchThemeMarketListings, type ThemeMarketListing } from "@/lib/yours-wallet";
import type { ThemeToken } from "@theme-token/sdk";

function formatPrice(satoshis: number): string {
	const bsv = satoshis / 100_000_000;
	if (bsv >= 1) return `${bsv.toFixed(2)} BSV`;
	if (bsv >= 0.01) return `${(bsv * 1000).toFixed(1)}m BSV`;
	return `${satoshis.toLocaleString()} sats`;
}

function ThemeCardSkeleton() {
	return (
		<div className="rounded-xl border border-border bg-card overflow-hidden">
			<div className="h-32 bg-muted animate-pulse" />
			<div className="p-4 space-y-3">
				<div className="flex items-start justify-between gap-2">
					<div className="space-y-2 flex-1">
						<div className="h-5 w-32 bg-muted animate-pulse rounded" />
						<div className="h-4 w-20 bg-muted animate-pulse rounded" />
					</div>
					<div className="h-7 w-16 bg-muted animate-pulse rounded" />
				</div>
				<div className="h-4 w-40 bg-muted animate-pulse rounded" />
			</div>
		</div>
	);
}

function ThemeCard({
	cached,
	listing,
	onRemix,
	onBuy,
}: {
	cached: CachedTheme;
	listing?: ThemeMarketListing;
	onRemix: () => void;
	onBuy?: () => void;
}) {
	const { mode } = useTheme();
	const { theme, origin } = cached;
	const colors = [
		theme.styles[mode].background,
		theme.styles[mode].card,
		theme.styles[mode].popover,
		theme.styles[mode].muted,
		theme.styles[mode].accent,
		theme.styles[mode].secondary,
		theme.styles[mode].primary,
		theme.styles[mode].destructive,
	];

	return (
		<div className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg animate-in fade-in duration-300">
			{/* Color Preview */}
			<Link href={`/preview/${origin}`}>
				<div
					className="relative h-32 cursor-pointer overflow-hidden"
					style={{ viewTransitionName: `theme-stripe-${origin}` } as React.CSSProperties}
				>
					<div className="absolute inset-0 flex">
						{colors.map((color, i) => (
							<div key={i} className="flex-1" style={{ backgroundColor: color }} />
						))}
					</div>
					{/* For Sale Badge - clickable */}
					{listing && (
						<button
							type="button"
							className="absolute top-2 right-2 z-10"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onBuy?.();
							}}
						>
							<Badge className="bg-primary text-primary-foreground border-0 shadow-lg gap-1 hover:bg-primary/90 cursor-pointer">
								<ShoppingCart className="h-3 w-3" fill="currentColor" />
								{formatPrice(listing.price)}
							</Badge>
						</button>
					)}
					<div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/40">
						<Eye className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
					</div>
				</div>
			</Link>

			{/* Info */}
			<div className="p-4">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<Link
							href={`/preview/${origin}`}
							className="block truncate font-semibold hover:text-primary"
						>
							{theme.name}
						</Link>
						{theme.author && (
							<p className="truncate text-sm text-muted-foreground">
								by {theme.author}
							</p>
						)}
					</div>
					<button
						type="button"
						onClick={onRemix}
						className="shrink-0 flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
					>
						<Sparkles className="h-3 w-3" />
						Remix
					</button>
				</div>

				{/* Origin */}
				<p className="mt-2 truncate font-mono text-xs text-muted-foreground">
					{origin.slice(0, 12)}...{origin.slice(-6)}
				</p>
			</div>
		</div>
	);
}

export default function ThemesPage() {
	const router = useRouter();
	const [buyListing, setBuyListing] = useState<ThemeMarketListing | null>(null);
	const [successModal, setSuccessModal] = useState<{ theme: ThemeToken; txid: string } | null>(null);

	// Fetch themes with TanStack Query
	const { data: themes = [], isLoading: themesLoading, refetch: refetchThemes } = useQuery({
		queryKey: ["themes"],
		queryFn: async () => {
			const res = await fetch("/api/themes/cache");
			const data = await res.json();
			return (data.themes || []) as CachedTheme[];
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	// Fetch listings with TanStack Query
	const { data: listings = [], refetch: refetchListings } = useQuery({
		queryKey: ["theme-listings"],
		queryFn: fetchThemeMarketListings,
		staleTime: 2 * 60 * 1000, // 2 minutes
	});

	// Map of origin -> listing for quick lookup
	const listingsByOrigin = useMemo(() => {
		const map = new Map<string, ThemeMarketListing>();
		for (const listing of listings) {
			map.set(listing.origin, listing);
		}
		return map;
	}, [listings]);

	const handleRefresh = async () => {
		// Force refresh from server
		await fetch("/api/themes/cache?refresh=true");
		refetchThemes();
		refetchListings();
	};

	const handleRemix = (cached: CachedTheme) => {
		storeRemixTheme(cached.theme, { source: "remix", txid: cached.origin });
		router.push("/studio/theme");
	};

	const handlePurchaseComplete = (txid: string) => {
		if (buyListing) {
			setSuccessModal({ theme: buyListing.theme, txid });
			refetchListings();
		}
	};

	// Count how many are for sale
	const forSaleCount = themes.filter(t => listingsByOrigin.has(t.origin)).length;

	return (
		<div className="min-h-screen">
			<PageContainer className="py-12">
				{/* Header */}
				<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Browse Themes</h1>
						<p className="mt-1 text-muted-foreground">
							All themes inscribed on the blockchain
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleRefresh}
							disabled={themesLoading}
						>
							<RefreshCw className={`mr-2 h-4 w-4 ${themesLoading ? "animate-spin" : ""}`} />
							Refresh
						</Button>
						<Button size="sm" asChild>
							<Link href="/studio/theme">
								<Sparkles className="mr-2 h-4 w-4" />
								Create Theme
							</Link>
						</Button>
					</div>
				</div>

				{/* Stats */}
				<div className="mb-8 flex items-center gap-6 text-sm text-muted-foreground">
					<span>
						<strong className="text-foreground">{themes.length}</strong> themes inscribed
					</span>
					{forSaleCount > 0 && (
						<span className="flex items-center gap-1 text-primary">
							<ShoppingCart className="h-3.5 w-3.5" fill="currentColor" />
							<strong>{forSaleCount}</strong> for sale
						</span>
					)}
				</div>

				{/* Grid */}
				{themesLoading ? (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{Array.from({ length: 8 }).map((_, i) => (
							<ThemeCardSkeleton key={i} />
						))}
					</div>
				) : themes.length === 0 ? (
					<div className="rounded-xl border border-dashed border-border py-20 text-center">
						<Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
						<h3 className="mb-2 text-lg font-semibold">No themes yet</h3>
						<p className="mb-4 text-muted-foreground">
							Be the first to inscribe a theme on the blockchain
						</p>
						<Button asChild>
							<Link href="/studio/theme">Create Theme</Link>
						</Button>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{themes.map((cached) => {
							const listing = listingsByOrigin.get(cached.origin);
							return (
								<ThemeCard
									key={cached.origin}
									cached={cached}
									listing={listing}
									onRemix={() => handleRemix(cached)}
									onBuy={() => listing && setBuyListing(listing)}
								/>
							);
						})}
					</div>
				)}
			</PageContainer>

			{/* Buy Modal */}
			{buyListing && (
				<BuyThemeModal
					isOpen={true}
					onClose={() => setBuyListing(null)}
					listing={buyListing}
					onPurchaseComplete={handlePurchaseComplete}
				/>
			)}

			{/* Success Modal */}
			{successModal && (
				<PurchaseSuccessModal
					isOpen={true}
					onClose={() => setSuccessModal(null)}
					theme={successModal.theme}
					txid={successModal.txid}
					onApplyNow={() => {
						storeRemixTheme(successModal.theme);
						router.push("/studio/theme");
					}}
				/>
			)}
		</div>
	);
}

