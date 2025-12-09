"use client";

import type { ThemeToken } from "@theme-token/sdk";
import { ArrowRight, Eye, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, ViewTransition } from "react";
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
	onBuy,
}: {
	theme: ThemeToken;
	origin: string;
	listing?: ThemeMarketListing;
	onBuy?: () => void;
}) {
	const { mode } = useTheme();
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

	// Color stripes content (just the colors, no overlay)
	const colorStripes = (
		<div className="absolute inset-0 flex">
			{colors.map((color, i) => (
				<div
					key={i}
					className="flex-1"
					style={{ backgroundColor: color }}
				/>
			))}
		</div>
	);

	return (
		<Link
			href={`/preview/${origin}`}
			className="group relative flex-shrink-0 cursor-pointer rounded-lg border border-border bg-card transition-all hover:border-primary/50 hover:shadow-md"
		>
			<div className="relative flex h-16 w-40 overflow-hidden rounded-t-lg">
				{/* Color stripes - all get ViewTransition, duplicates handled by browser */}
				<ViewTransition name={`theme-stripe-${origin}`}>
					{colorStripes}
				</ViewTransition>
				{/* For Sale Badge */}
				{listing && (
					<button
						type="button"
						className="absolute top-1.5 right-1.5 z-10"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onBuy?.();
						}}
					>
						<Badge className="bg-primary text-primary-foreground border-0 shadow-lg gap-0.5 text-[9px] px-1.5 py-0.5 hover:bg-primary/90 cursor-pointer">
							<ShoppingCart className="h-2 w-2" fill="currentColor" />
							{formatPrice(listing.price)}
						</Badge>
					</button>
				)}
				<div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/10">
					<Eye className="h-5 w-5 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 drop-shadow-md" />
				</div>
			</div>

			{/* Theme name */}
			<div className="px-2 py-1.5">
				<p className="truncate text-xs font-medium" title={theme.name}>
					{theme.name}
				</p>
			</div>
		</Link>
	);
}

export function ThemeGallery() {
	const router = useRouter();
	const [publishedThemes, setPublishedThemes] = useState<CachedTheme[]>([]);
	const [listings, setListings] = useState<ThemeMarketListing[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [buyListing, setBuyListing] = useState<ThemeMarketListing | null>(null);
	const [successModal, setSuccessModal] = useState<{ theme: ThemeToken; txid: string } | null>(null);
	const [isHovered, setIsHovered] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

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

	const handlePurchaseComplete = (txid: string) => {
		if (buyListing) {
			setSuccessModal({ theme: buyListing.theme, txid });
			setListings((prev) => prev.filter((l) => l.origin !== buyListing.origin));
		}
	};

	// Calculate animation duration based on number of items
	const itemCount = publishedThemes.length;
	const baseSpeed = 30; // seconds for full scroll
	const duration = Math.max(baseSpeed, itemCount * 3);

	return (
		<section className="border-y border-border bg-muted/30 py-4 overflow-hidden">
			{/* Header */}
			<div className="mx-auto max-w-7xl mb-3 flex items-center justify-between px-6">
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

			{/* Marquee container */}
			<div
				ref={containerRef}
				className="relative"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{isLoading ? (
					<div className="flex gap-3 px-3">
						{Array.from({ length: 8 }).map((_, i) => (
							<div
								key={i}
								className="flex-shrink-0 rounded-lg border border-border bg-card"
							>
								{/* Skeleton color stripes - matches h-16 w-40 */}
								<div className="h-16 w-40 rounded-t-lg bg-muted animate-pulse" />
								{/* Skeleton theme name - matches px-2 py-1.5 */}
								<div className="px-2 py-1.5">
									<div className="h-4 w-24 rounded bg-muted animate-pulse" />
								</div>
							</div>
						))}
					</div>
				) : publishedThemes.length === 0 ? (
					<p className="text-center text-sm text-muted-foreground py-4">
						No themes published yet. Be the first!
					</p>
				) : (
					<div
						className="flex"
						style={{
							animationPlayState: isHovered ? "paused" : "running",
						}}
					>
						{/* Duplicate the content for seamless loop */}
						{[0, 1].map((setIndex) => (
							<div
								key={setIndex}
								className="flex gap-3 pr-3 animate-marquee"
								style={{
									animationDuration: `${duration}s`,
									animationPlayState: isHovered ? "paused" : "running",
								}}
							>
								{publishedThemes.map((published) => {
									const listing = listingsByOrigin.get(published.origin);
									return (
										<ThemeCard
											key={`${setIndex}-${published.origin}`}
											theme={published.theme}
											origin={published.origin}
											listing={listing}
											onBuy={() => listing && setBuyListing({ ...listing, origin: published.origin })}
										/>
									);
								})}
							</div>
						))}
					</div>
				)}

				{/* Fade edges */}
				<div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-muted/30 to-transparent" />
				<div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-muted/30 to-transparent" />
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
