"use client";

import { motion } from "framer-motion";
import {
	AlertCircle,
	Check,
	Copy,
	ExternalLink,
	Image,
	Loader2,
	RefreshCw,
	ShoppingCart,
	Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useBsvRateContext } from "@/hooks/use-bsv-rate-context";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import {
	fetchImageMarketListings,
	type ImageMarketListing,
} from "@/lib/yours-wallet";

// Format satoshis as BSV
function formatBSV(sats: number): string {
	const bsv = sats / 100_000_000;
	if (bsv < 0.001) return bsv.toFixed(8);
	if (bsv < 1) return bsv.toFixed(4);
	return bsv.toFixed(2);
}

// Format bytes to human readable
function formatBytes(bytes?: number): string {
	if (!bytes) return "Unknown size";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImageBrowsePage() {
	const { status, connect } = useYoursWallet();
	const { formatUsd } = useBsvRateContext();
	const [listings, setListings] = useState<ImageMarketListing[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [purchasing, setPurchasing] = useState<string | null>(null);
	const [copiedOrigin, setCopiedOrigin] = useState<string | null>(null);
	const [typeFilter, setTypeFilter] = useState<string>("all");

	const isConnected = status === "connected";

	useEffect(() => {
		loadListings();
	}, []);

	async function loadListings() {
		setIsLoading(true);
		setError(null);
		try {
			const data = await fetchImageMarketListings();
			setListings(data);
		} catch (err) {
			setError("Failed to load image listings");
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	}

	const handlePurchase = async (listing: ImageMarketListing) => {
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

	const copyOriginPath = async (origin: string) => {
		await navigator.clipboard.writeText(`/content/${origin}`);
		setCopiedOrigin(origin);
		setTimeout(() => setCopiedOrigin(null), 2000);
	};

	// Filter listings by content type
	const filteredListings = useMemo(() => {
		if (typeFilter === "all") return listings;
		return listings.filter((l) =>
			l.metadata.contentType.includes(typeFilter),
		);
	}, [listings, typeFilter]);

	// Get unique content types for filter
	const contentTypes = useMemo(() => {
		const types = new Set(listings.map((l) => {
			const type = l.metadata.contentType;
			if (type.includes("png")) return "png";
			if (type.includes("jpeg") || type.includes("jpg")) return "jpeg";
			if (type.includes("gif")) return "gif";
			if (type.includes("webp")) return "webp";
			if (type.includes("svg")) return "svg";
			return "other";
		}));
		return Array.from(types).sort();
	}, [listings]);

	return (
		<>
			{/* Main Content */}
			<div>
				{/* Header */}
				<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
					<div>
						<h2 className="text-xl font-semibold">Image Ordinals</h2>
						<p className="text-sm text-muted-foreground">
							{filteredListings.length} image{filteredListings.length !== 1 ? "s" : ""} available
							{" "}- Use in your theme as background images
						</p>
					</div>
					<div className="flex items-center gap-2">
						{/* Type Filter */}
						<select
							value={typeFilter}
							onChange={(e) => setTypeFilter(e.target.value)}
							className="h-9 rounded-md border border-input bg-background px-3 text-sm"
						>
							<option value="all">All Types</option>
							{contentTypes.map((type) => (
								<option key={type} value={type}>
									{type.toUpperCase()}
								</option>
							))}
						</select>

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
						{/* Info banner */}
						<div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
							<div className="flex items-start gap-3">
								<Image className="h-5 w-5 text-primary" />
								<div>
									<p className="text-sm font-medium">Use Images in Your Theme</p>
									<p className="text-xs text-muted-foreground">
										Copy the origin path (e.g., <code className="text-primary">/content/abc123_0</code>)
										and use it as a background image in your theme's <code>bg-image</code> property.
									</p>
								</div>
							</div>
						</div>

						{/* Image grid */}
						<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
							{filteredListings.map((listing, index) => (
								<motion.div
									key={listing.outpoint}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.02 }}
								>
									<ImageCard
										listing={listing}
										isConnected={isConnected}
										isPurchasing={purchasing === listing.outpoint}
										isCopied={copiedOrigin === listing.origin}
										onPurchase={() => handlePurchase(listing)}
										onConnect={connect}
										onCopyOrigin={() => copyOriginPath(listing.origin)}
										formatUsd={formatUsd}
									/>
								</motion.div>
							))}
						</div>

						{/* Empty state */}
						{listings.length === 0 && (
							<div className="mt-8 rounded-xl border border-dashed border-border py-12 text-center">
								<Image className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
								<h3 className="mb-2 text-lg font-semibold">
									No images listed yet
								</h3>
								<p className="text-muted-foreground">
									Check back later for image ordinals
								</p>
							</div>
						)}
					</>
				)}
			</div>
		</>
	);
}

// Image card component
interface ImageCardProps {
	listing: ImageMarketListing;
	isConnected: boolean;
	isPurchasing: boolean;
	isCopied: boolean;
	onPurchase: () => void;
	onConnect: () => void;
	onCopyOrigin: () => void;
	formatUsd: (sats: number) => string | null;
}

function ImageCard({
	listing,
	isConnected,
	isPurchasing,
	isCopied,
	onPurchase,
	onConnect,
	onCopyOrigin,
	formatUsd,
}: ImageCardProps) {
	const [imageError, setImageError] = useState(false);

	return (
		<div className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg">
			{/* Image Preview */}
			<div className="relative aspect-square bg-muted/30">
				{imageError ? (
					<div className="flex h-full items-center justify-center">
						<Image className="h-8 w-8 text-muted-foreground/50" />
					</div>
				) : (
					<img
						src={listing.previewUrl}
						alt={listing.metadata.name}
						className="h-full w-full object-cover"
						onError={() => setImageError(true)}
					/>
				)}

				{/* Copy button overlay */}
				<button
					type="button"
					onClick={onCopyOrigin}
					className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md bg-background/80 backdrop-blur transition-colors hover:bg-background"
					title="Copy origin path for theme"
				>
					{isCopied ? (
						<Check className="h-4 w-4 text-green-500" />
					) : (
						<Copy className="h-4 w-4" />
					)}
				</button>

				{/* View link overlay */}
				<a
					href={listing.previewUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-md bg-background/80 backdrop-blur transition-colors hover:bg-background"
					title="View full image"
				>
					<ExternalLink className="h-4 w-4" />
				</a>

				{/* Content type badge */}
				<div className="absolute bottom-2 left-2 rounded bg-background/80 px-2 py-0.5 font-mono text-[10px] backdrop-blur">
					{listing.metadata.contentType.split("/")[1]?.toUpperCase() || "IMAGE"}
				</div>
			</div>

			{/* Info */}
			<div className="flex flex-1 flex-col p-3">
				<p className="mb-1 truncate font-mono text-xs text-muted-foreground" title={listing.origin}>
					{listing.origin.slice(0, 8)}...{listing.origin.slice(-4)}
				</p>
				<p className="text-[10px] text-muted-foreground">
					{formatBytes(listing.metadata.size)}
				</p>

				{/* Price and action */}
				<div className="mt-auto flex items-center justify-between pt-2">
					<div>
						<p className="font-mono text-sm font-semibold">
							{formatUsd(listing.price) || `${formatBSV(listing.price)} BSV`}
						</p>
						{formatUsd(listing.price) && (
							<p className="font-mono text-[10px] text-muted-foreground">
								{formatBSV(listing.price)} BSV
							</p>
						)}
					</div>

					{isConnected ? (
						<Button
							size="sm"
							variant="outline"
							onClick={onPurchase}
							disabled={isPurchasing}
							className="h-7 text-xs"
						>
							{isPurchasing ? (
								<Loader2 className="h-3 w-3 animate-spin" />
							) : (
								<>
									<ShoppingCart className="mr-1 h-3 w-3" />
									Buy
								</>
							)}
						</Button>
					) : (
						<Button
							size="sm"
							variant="outline"
							onClick={onConnect}
							className="h-7 text-xs"
						>
							<Wallet className="mr-1 h-3 w-3" />
							Connect
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
