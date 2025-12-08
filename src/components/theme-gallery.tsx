"use client";

import type { ThemeToken } from "@theme-token/sdk";
import { motion } from "framer-motion";
import { ArrowRight, Eye, Loader2, ShoppingCart, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BuyThemeModal } from "@/components/market/buy-theme-modal";
import { PurchaseSuccessModal } from "@/components/market/purchase-success-modal";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { fetchCachedThemes, type CachedTheme } from "@/lib/themes-cache";
import { fetchThemeMarketListings, type ThemeMarketListing } from "@/lib/yours-wallet";

function formatPrice(satoshis: number): string {
	const bsv = satoshis / 100_000_000;
	if (bsv >= 1) return `${bsv.toFixed(2)} BSV`;
	if (bsv >= 0.01) return `${(bsv * 1000).toFixed(1)}m BSV`;
	return `${satoshis.toLocaleString()} sats`;
}

// Custom event for theme remixing (works on same page)
export const REMIX_THEME_EVENT = "remix-theme";

// LocalStorage key for cross-page theme loading
const REMIX_STORAGE_KEY = "theme-token-remix";

export interface StoredRemixTheme {
	theme: ThemeToken;
	source?: "ai-generate" | "remix";
	txid?: string;
}

export function dispatchRemixTheme(theme: ThemeToken) {
	window.dispatchEvent(new CustomEvent(REMIX_THEME_EVENT, { detail: theme }));
}

export function storeRemixTheme(
	theme: ThemeToken,
	metadata?: { source?: "ai-generate" | "remix"; txid?: string },
) {
	const data: StoredRemixTheme = {
		theme,
		source: metadata?.source,
		txid: metadata?.txid,
	};
	localStorage.setItem(REMIX_STORAGE_KEY, JSON.stringify(data));
}

export function getAndClearRemixTheme(): StoredRemixTheme | null {
	const stored = localStorage.getItem(REMIX_STORAGE_KEY);
	if (stored) {
		localStorage.removeItem(REMIX_STORAGE_KEY);
		try {
			const data = JSON.parse(stored);
			// Handle legacy format (just ThemeToken)
			if (data.styles) {
				return { theme: data };
			}
			return data as StoredRemixTheme;
		} catch {
			return null;
		}
	}
	return null;
}

function ThemeCard({
	theme,
	origin,
	listing,
	onRemix,
	onBuy,
}: {
	theme: ThemeToken;
	origin: string;
	listing?: ThemeMarketListing;
	onRemix?: () => void;
	onBuy?: () => void;
}) {
	const { mode } = useTheme();
	const router = useRouter();
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

	const handleStripeClick = (e: React.MouseEvent) => {
		e.preventDefault();
		router.push(`/preview/${origin}`, { scroll: false });
	};

	return (
		<div className="group relative flex-shrink-0 rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg">
			{/* Color stripes - clickable to preview */}
			<div
				className="relative flex h-32 w-52 cursor-pointer overflow-hidden rounded-t-xl"
				onClick={handleStripeClick}
				style={{ viewTransitionName: `theme-stripe-${origin}` } as React.CSSProperties}
			>
				{colors.map((color, i) => (
					<div
						key={i}
						className="flex-1"
						style={{ backgroundColor: color }}
					/>
				))}
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
						<Badge className="bg-primary text-primary-foreground border-0 shadow-lg gap-1 text-[10px] hover:bg-primary/90 cursor-pointer">
							<ShoppingCart className="h-2.5 w-2.5" fill="currentColor" />
							{formatPrice(listing.price)}
						</Badge>
					</button>
				)}
				<div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/10">
					<Eye className="h-8 w-8 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 drop-shadow-md" />
				</div>
			</div>
			
			{/* Theme name and remix button */}
			<div className="flex items-center justify-between gap-3 p-3">
				<Link
					href={`/preview/${origin}`}
					className="flex-1 truncate text-sm font-medium hover:text-primary"
					title={theme.name}
				>
					{theme.name}
				</Link>
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onRemix?.();
					}}
					className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100 hover:bg-primary/20"
				>
					<Sparkles className="h-3 w-3" />
					Remix
				</button>
			</div>
		</div>
	);
}

export function ThemeGallery() {
	const router = useRouter();
	const [publishedThemes, setPublishedThemes] = useState<CachedTheme[]>([]);
	const [listings, setListings] = useState<ThemeMarketListing[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [buyListing, setBuyListing] = useState<ThemeMarketListing | null>(null);
	const [successModal, setSuccessModal] = useState<{ theme: ThemeToken; txid: string } | null>(null);

	// Map of origin -> listing for quick lookup
	const listingsByOrigin = useMemo(() => {
		const map = new Map<string, ThemeMarketListing>();
		for (const listing of listings) {
			map.set(listing.origin, listing);
		}
		return map;
	}, [listings]);

	useEffect(() => {
		Promise.all([
			fetchCachedThemes(),
			fetchThemeMarketListings(),
		]).then(([themes, marketListings]) => {
			setPublishedThemes(themes);
			setListings(marketListings);
		}).finally(() => setIsLoading(false));
	}, []);

	const handleRemix = (theme: ThemeToken) => {
		// Store theme for the studio page to pick up
		storeRemixTheme(theme);
		// Navigate to theme studio
		router.push("/studio/theme");
	};

	const handlePurchaseComplete = (txid: string) => {
		if (buyListing) {
			setSuccessModal({ theme: buyListing.theme, txid });
			// Remove from listings since it's sold
			setListings((prev) => prev.filter((l) => l.origin !== buyListing.origin));
		}
	};

	return (
		<section className="border-y border-border bg-muted/30 py-8">
			<div className="mx-auto max-w-7xl">
				{/* Header */}
				<div className="mb-4 flex items-center justify-between px-6">
					<h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
						Published Themes
					</h3>
					<Link
						href="/themes"
						className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
					>
						Browse All
						<ArrowRight className="h-4 w-4" />
					</Link>
				</div>

				{/* Horizontal scroll container */}
				<div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
					{isLoading ? (
						<div className="flex items-center gap-2 text-muted-foreground">
							<Loader2 className="h-4 w-4 animate-spin" />
							<span className="text-sm">Loading themes...</span>
						</div>
					) : publishedThemes.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No themes published yet. Be the first!
						</p>
					) : (
						publishedThemes.map((published) => {
							const listing = listingsByOrigin.get(published.origin);
							return (
								<motion.div
									key={published.origin}
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.3 }}
								>
									<ThemeCard
										theme={published.theme}
										origin={published.origin}
										listing={listing}
										onRemix={() => handleRemix(published.theme)}
										onBuy={() => listing && setBuyListing(listing)}
									/>
								</motion.div>
							);
						})
					)}

					{/* "More" card linking to themes browse */}
					<Link
						href="/themes"
						className="group flex w-52 flex-shrink-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card/30 transition-all hover:border-primary/50 hover:bg-muted"
					>
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary/10">
							<ArrowRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
						</div>
						<p className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
							View all themes
						</p>
					</Link>
				</div>
			</div>

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
		</section>
	);
}
