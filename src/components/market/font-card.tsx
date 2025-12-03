"use client";

import {
	ExternalLink,
	Loader2,
	ShoppingCart,
	TrendingDown,
	TrendingUp,
	Type,
	Bot,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBsvRateContext } from "@/hooks/use-bsv-rate-context";
import { loadFontByOrigin, getCachedFont } from "@/lib/font-loader";
import type { FontMarketListing } from "@/lib/yours-wallet";

interface FontCardProps {
	listing: FontMarketListing;
	isConnected: boolean;
	isPurchasing: boolean;
	onPurchase: () => void;
	onConnect: () => void;
	priceChange?: number | null;
}

// Format satoshis as BSV
function formatBSV(sats: number): string {
	const bsv = sats / 100_000_000;
	if (bsv < 0.001) return bsv.toFixed(8);
	if (bsv < 1) return bsv.toFixed(4);
	return bsv.toFixed(2);
}

export function FontCard({
	listing,
	isConnected,
	isPurchasing,
	onPurchase,
	onConnect,
	priceChange,
}: FontCardProps) {
	const { origin, price, metadata } = listing;
	const hasChange = priceChange !== null && priceChange !== undefined;
	const isPositive = (priceChange ?? 0) >= 0;
	const { formatUsd } = useBsvRateContext();
	const usdPrice = formatUsd(price);

	// Font preview state - use cached font-loader
	const [fontFamily, setFontFamily] = useState<string>("inherit");
	const [isLoading, setIsLoading] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	// Lazy-load font on hover using centralized font-loader
	const loadFont = useCallback(async () => {
		if (fontFamily !== "inherit" || isLoading) return;

		// Check cache first
		const cached = getCachedFont(origin);
		if (cached) {
			setFontFamily(cached.familyName);
			return;
		}

		setIsLoading(true);
		try {
			const family = await loadFontByOrigin(origin);
			setFontFamily(family);
		} catch (err) {
			console.error("[FontCard] Failed to load font:", err);
		} finally {
			setIsLoading(false);
		}
	}, [origin, fontFamily, isLoading]);

	// Load on hover for lazy loading
	useEffect(() => {
		if (isHovered) {
			loadFont();
		}
	}, [isHovered, loadFont]);

	return (
		<div
			className="group flex flex-col gap-3"
			onMouseEnter={() => setIsHovered(true)}
		>
			{/* Live Preview Area */}
			<div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border bg-background shadow-sm transition-all group-hover:shadow-lg">
				{/* Font Preview - uses current theme colors */}
				<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-foreground">
					{!isLoading && fontFamily !== "inherit" ? (
						<div
							className="flex flex-col items-center gap-2"
							style={{ fontFamily }}
						>
							{/* Main sample */}
							<div className="text-3xl">Aa Bb Cc</div>

							{/* Alphabet previews - smaller */}
							<div className="flex flex-col items-center gap-1 text-[10px] opacity-60">
								<div className="max-w-full overflow-hidden truncate">
									ABCDEFGHIJKLMNOPQRSTUVWXYZ
								</div>
								<div className="max-w-full overflow-hidden truncate">
									abcdefghijklmnopqrstuvwxyz
								</div>
								<div className="max-w-full overflow-hidden truncate">
									0123456789
								</div>
							</div>
						</div>
					) : isLoading ? (
						<div className="flex items-center gap-2 text-muted-foreground">
							<Loader2 className="h-4 w-4 animate-spin" />
							<span className="text-sm">Loading font...</span>
						</div>
					) : (
						<div className="flex flex-col items-center gap-2">
							{/* Default "Aa" preview before hover loads font */}
							<div className="text-5xl font-normal text-muted-foreground/50">Aa</div>
							<span className="text-xs text-muted-foreground">Hover to preview</span>
						</div>
					)}
				</div>

				{/* Style badge */}
				<div className="absolute left-2 top-2 rounded bg-muted/80 px-2 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur-sm">
					{metadata.style || "normal"} {metadata.weight || "400"}
				</div>

				{/* Glyph count badge */}
				{metadata.glyphCount && (
					<div className="absolute right-2 top-2 flex items-center gap-1 rounded bg-muted/80 px-2 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur-sm">
						<Type className="h-3 w-3" />
						{metadata.glyphCount}
					</div>
				)}

				{/* AI Generated badge */}
				{metadata.aiGenerated && (
					<div className="absolute bottom-2 left-2 rounded bg-primary/20 px-2 py-1 font-mono text-[10px] text-primary backdrop-blur-sm">
						AI Generated
					</div>
				)}

				{/* Hover overlay */}
				<div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/20">
					<div className="flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100">
						<Type className="h-4 w-4" />
						Preview Font
					</div>
				</div>
			</div>

			{/* Metadata */}
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0 flex-1">
					<h3 className="truncate text-sm font-semibold">{metadata.name}</h3>
					<p className="text-xs text-muted-foreground">
						{metadata.author || "Unknown"} &middot;{" "}
						<span className="font-mono">{origin.slice(0, 8)}</span>
					</p>
				</div>
				<div className="text-right">
					<p className="font-mono text-sm font-semibold">
						{usdPrice || `${formatBSV(price)} BSV`}
					</p>
					{usdPrice && (
						<span className="font-mono text-[10px] text-muted-foreground">
							{formatBSV(price)} BSV
						</span>
					)}
					{hasChange && (
						<span
							className={`inline-flex items-center gap-0.5 font-mono text-[10px] font-medium ${
								isPositive ? "text-emerald-500" : "text-rose-500"
							}`}
						>
							{isPositive ? (
								<TrendingUp className="h-2.5 w-2.5" />
							) : (
								<TrendingDown className="h-2.5 w-2.5" />
							)}
							{isPositive ? "+" : ""}
							{priceChange?.toFixed(1)}%
						</span>
					)}
				</div>
			</div>

			{/* Actions */}
			<div className="flex gap-2">
				<Button variant="outline" size="sm" className="flex-1" asChild>
					<Link href={`/preview/font/${origin}`}>
						<ExternalLink className="mr-1.5 h-3.5 w-3.5" />
						Details
					</Link>
				</Button>
				<Button
					size="sm"
					className="flex-1"
					disabled={isPurchasing}
					onClick={() => (isConnected ? onPurchase() : onConnect())}
				>
					{isPurchasing ? (
						<>
							<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
							Buying...
						</>
					) : !isConnected ? (
						"Connect"
					) : (
						<>
							<ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
							Buy
						</>
					)}
				</Button>
			</div>
		</div>
	);
}
