"use client";

import type { ThemeToken } from "@theme-token/sdk";
import { motion } from "framer-motion";
import { ExternalLink, Loader2, ShoppingCart, Sparkles, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBsvRateContext } from "@/hooks/use-bsv-rate-context";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import type { ThemeMarketListing } from "@/lib/yours-wallet";
import { formatBSV } from "./theme-stripes";

interface BuyThemeModalProps {
	isOpen: boolean;
	onClose: () => void;
	listing: ThemeMarketListing;
	onPurchaseComplete?: (txid: string) => void;
}

function ThemePreview({ theme, mode }: { theme: ThemeToken; mode: "light" | "dark" }) {
	const styles = theme.styles[mode];
	
	return (
		<div
			className="relative aspect-video w-full overflow-hidden rounded-lg border"
			style={{ 
				backgroundColor: styles.background,
				borderColor: styles.border,
			}}
		>
			{/* Mini UI */}
			<div className="absolute inset-0 p-4 flex flex-col gap-3">
				{/* Header */}
				<div
					className="flex items-center justify-between border-b pb-2"
					style={{ borderColor: styles.border }}
				>
					<div
						className="h-2 w-16 rounded-full"
						style={{ backgroundColor: styles["muted-foreground"], opacity: 0.3 }}
					/>
					<div className="flex gap-1.5">
						<div className="h-3 w-3 rounded-full" style={{ backgroundColor: styles.primary }} />
						<div className="h-3 w-3 rounded-full" style={{ backgroundColor: styles.secondary }} />
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 space-y-2">
					<div
						className="h-8 w-full border"
						style={{ borderColor: styles.input, borderRadius: styles.radius || "0.5rem" }}
					/>
					<div className="flex gap-2">
						<div
							className="h-8 flex-1"
							style={{ backgroundColor: styles.secondary, borderRadius: styles.radius || "0.5rem" }}
						/>
						<div
							className="h-8 flex-[2] flex items-center justify-center text-xs font-medium"
							style={{
								backgroundColor: styles.primary,
								color: styles["primary-foreground"],
								borderRadius: styles.radius || "0.5rem",
							}}
						>
							Button
						</div>
					</div>
				</div>

				{/* Color bar */}
				<div className="flex h-2 gap-0.5 overflow-hidden rounded">
					{[styles.primary, styles.secondary, styles.accent, styles.muted].map((color, i) => (
						<div key={i} className="flex-1" style={{ backgroundColor: color }} />
					))}
				</div>
			</div>
		</div>
	);
}

export function BuyThemeModal({
	isOpen,
	onClose,
	listing,
	onPurchaseComplete,
}: BuyThemeModalProps) {
	const { status, connect, addPendingTheme } = useYoursWallet();
	const { formatUsd } = useBsvRateContext();
	const [isPurchasing, setIsPurchasing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isConnected = status === "connected";
	const { theme, origin, price, outpoint } = listing;
	const usdPrice = formatUsd(price);

	const handlePurchase = async () => {
		if (!isConnected) {
			connect();
			return;
		}

		setIsPurchasing(true);
		setError(null);

		try {
			const wallet = window.yours;
			if (!wallet) throw new Error("Wallet not available");

			const txid = await wallet.purchaseOrdinal({
				outpoint,
				marketplaceRate: 0.02,
				marketplaceAddress: "15q8YQSqUa9uTh6gh4AVixxq29xkpBBP9z",
			});

			// Add to pending themes for immediate ownership
			addPendingTheme(theme, txid);
			
			onPurchaseComplete?.(txid);
			onClose();
		} catch (err) {
			console.error("Purchase failed:", err);
			setError(err instanceof Error ? err.message : "Purchase failed");
		} finally {
			setIsPurchasing(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-md">
			<DialogHeader>
				<DialogTitle className="flex items-center gap-2">
					<ShoppingCart className="h-5 w-5 fill-current" />
					Buy Theme
				</DialogTitle>
			</DialogHeader>

				<div className="space-y-4">
					{/* Theme Preview */}
					<ThemePreview theme={theme} mode="dark" />

					{/* Theme Info */}
					<div className="flex items-start justify-between gap-4">
						<div>
							<h3 className="font-semibold text-lg">{theme.name}</h3>
							{theme.author && (
								<p className="text-sm text-muted-foreground">by {theme.author}</p>
							)}
							<p className="text-xs font-mono text-muted-foreground mt-1">
								{origin.slice(0, 12)}...{origin.slice(-6)}
							</p>
						</div>
						<div className="text-right">
							<p className="text-2xl font-bold">{formatBSV(price)}</p>
							{usdPrice && (
								<p className="text-sm text-muted-foreground">{usdPrice}</p>
							)}
						</div>
					</div>

					{/* Error */}
					{error && (
						<div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
							{error}
						</div>
					)}

					{/* Actions */}
					<div className="flex gap-3">
						<Button variant="outline" className="flex-1" asChild>
							<Link href={`/preview/${origin}`} onClick={onClose}>
								<Sparkles className="mr-2 h-4 w-4" />
								Preview
							</Link>
						</Button>
						<Button
							className="flex-1"
							disabled={isPurchasing}
							onClick={handlePurchase}
						>
						{isPurchasing ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : !isConnected ? (
							<>
								<Wallet className="mr-2 h-4 w-4 fill-current" />
								Connect
							</>
						) : (
							<>
								<ShoppingCart className="mr-2 h-4 w-4 fill-current" />
								Buy Now
							</>
						)}
						</Button>
					</div>

					{/* View on market link */}
					<div className="text-center">
						<Link
							href="/market/browse"
							onClick={onClose}
							className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
						>
							View in Marketplace
							<ExternalLink className="h-3 w-3" />
						</Link>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

