"use client";

import { use, useCallback, useEffect, useState } from "react";
import {
	ArrowLeft,
	Copy,
	Download,
	ExternalLink,
	Loader2,
	Palette,
	RefreshCw,
	ShoppingCart,
	Sparkles,
	Type,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBsvRateContext } from "@/hooks/use-bsv-rate-context";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import {
	loadFontByOrigin,
	getCachedFont,
	fetchFontMetadata,
	type FontMetadata,
} from "@/lib/font-loader";
import { fetchFontMarketListings, type FontMarketListing } from "@/lib/yours-wallet";

// Sample text for font preview
const PANGRAM = "The quick brown fox jumps over the lazy dog";
const ALPHABET_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ALPHABET_LOWER = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SPECIAL = "!@#$%^&*()_+-=[]{}|;':\",./<>?";

// Preview size options
const PREVIEW_SIZES = [12, 16, 24, 36, 48, 72];

// Format satoshis as BSV
function formatBSV(sats: number): string {
	const bsv = sats / 100_000_000;
	if (bsv < 0.001) return bsv.toFixed(8);
	if (bsv < 1) return bsv.toFixed(4);
	return bsv.toFixed(2);
}

export default function FontPreviewPage({
	params,
}: {
	params: Promise<{ origin: string }>;
}) {
	const { origin } = use(params);
	const { status, connect } = useYoursWallet();
	const { formatUsd } = useBsvRateContext();

	const [fontFamily, setFontFamily] = useState<string | null>(null);
	const [metadata, setMetadata] = useState<FontMetadata | null>(null);
	const [listing, setListing] = useState<FontMarketListing | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [purchasing, setPurchasing] = useState(false);
	const [customText, setCustomText] = useState(PANGRAM);
	const [selectedSize, setSelectedSize] = useState(36);

	const isConnected = status === "connected";

	// Load font and metadata
	const loadFont = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			// Check cache first
			const cached = getCachedFont(origin);
			if (cached) {
				setFontFamily(cached.familyName);
				if (cached.metadata) {
					setMetadata(cached.metadata);
				}
			}

			// Load the font
			const family = await loadFontByOrigin(origin);
			setFontFamily(family);

			// Try to fetch metadata separately
			const meta = await fetchFontMetadata(origin);
			if (meta) {
				setMetadata(meta);
			}
		} catch (err) {
			console.error("[FontPreview] Failed to load font:", err);
			setError("Failed to load font. The origin may be invalid.");
		} finally {
			setIsLoading(false);
		}
	}, [origin]);

	// Check if font is listed for sale
	const checkListing = useCallback(async () => {
		try {
			const listings = await fetchFontMarketListings();
			const found = listings.find((l) => l.origin === origin);
			if (found) {
				setListing(found);
				// Use listing metadata if available
				if (!metadata && found.metadata) {
					setMetadata(found.metadata);
				}
			}
		} catch (err) {
			console.error("[FontPreview] Failed to check listing:", err);
		}
	}, [origin, metadata]);

	useEffect(() => {
		loadFont();
		checkListing();
	}, [loadFont, checkListing]);

	const handlePurchase = async () => {
		if (!isConnected || !listing) return;

		setPurchasing(true);
		try {
			const wallet = window.yours;
			if (!wallet) throw new Error("Wallet not available");

			await wallet.purchaseOrdinal({
				outpoint: listing.outpoint,
				marketplaceRate: 0.02,
				marketplaceAddress: "15q8YQSqUa9uTh6gh4AVixxq29xkpBBP9z",
			});

			toast.success("Purchase Complete", {
				description: `You now own "${metadata?.name || "this font"}"!`,
			});

			// Refresh listing status
			checkListing();
		} catch (err) {
			console.error("Purchase failed:", err);
			toast.error("Purchase Failed", {
				description: err instanceof Error ? err.message : "Unknown error",
			});
		} finally {
			setPurchasing(false);
		}
	};

	const copyOrigin = () => {
		navigator.clipboard.writeText(origin);
		toast.success("Copied", { description: "Origin copied to clipboard" });
	};

	const displayName = metadata?.name || listing?.metadata?.name || `Font ${origin.slice(0, 8)}`;

	return (
		<div className="container mx-auto max-w-6xl px-4 py-8">
			{/* Back Navigation */}
			<div className="mb-6">
				<Link
					href="/market/fonts"
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Font Market
				</Link>
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center py-20">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			) : error ? (
				<div className="rounded-xl border border-destructive/50 bg-destructive/10 p-8 text-center">
					<Type className="mx-auto mb-4 h-12 w-12 text-destructive opacity-50" />
					<h2 className="mb-2 text-lg font-semibold text-destructive">
						Font Not Found
					</h2>
					<p className="mb-4 text-sm text-destructive/80">{error}</p>
					<Button variant="outline" onClick={loadFont}>
						<RefreshCw className="mr-2 h-4 w-4" />
						Try Again
					</Button>
				</div>
			) : (
				<div className="grid gap-8 lg:grid-cols-3">
					{/* Main Preview Area */}
					<div className="lg:col-span-2 space-y-6">
						{/* Font Header */}
						<div className="rounded-xl border border-border bg-card p-6">
							<div className="mb-4 flex items-start justify-between">
								<div>
									<h1 className="text-2xl font-bold">{displayName}</h1>
									<p className="text-sm text-muted-foreground">
										{metadata?.author || "Unknown Author"}
									</p>
								</div>
								<div className="flex gap-2">
									{metadata?.aiGenerated && (
										<Badge variant="secondary">
											<Sparkles className="mr-1 h-3 w-3" />
											AI Generated
										</Badge>
									)}
									{metadata?.license && (
										<Badge variant="outline">{metadata.license}</Badge>
									)}
								</div>
							</div>

							{/* Large Preview */}
							<div
								className="mb-4 rounded-lg bg-muted/30 p-6 text-center"
								style={{
									fontFamily: fontFamily || "inherit",
									fontSize: `${selectedSize}px`,
								}}
							>
								{customText || PANGRAM}
							</div>

							{/* Size Selector */}
							<div className="flex flex-wrap items-center gap-2">
								<span className="text-xs text-muted-foreground">Size:</span>
								{PREVIEW_SIZES.map((size) => (
									<Button
										key={size}
										variant={selectedSize === size ? "default" : "outline"}
										size="sm"
										className="h-7 px-2 font-mono text-xs"
										onClick={() => setSelectedSize(size)}
									>
										{size}
									</Button>
								))}
							</div>
						</div>

						{/* Character Preview Tabs */}
						<div className="rounded-xl border border-border bg-card p-6">
							<Tabs defaultValue="pangram">
								<TabsList className="mb-4">
									<TabsTrigger value="pangram">Pangram</TabsTrigger>
									<TabsTrigger value="alphabet">Alphabet</TabsTrigger>
									<TabsTrigger value="custom">Custom</TabsTrigger>
								</TabsList>

								<TabsContent value="pangram" className="space-y-4">
									{[24, 18, 14, 12].map((size) => (
										<div
											key={size}
											className="border-b border-border pb-2 last:border-0"
											style={{
												fontFamily: fontFamily || "inherit",
												fontSize: `${size}px`,
											}}
										>
											<span className="mr-2 font-mono text-[10px] text-muted-foreground">
												{size}px
											</span>
											{PANGRAM}
										</div>
									))}
								</TabsContent>

								<TabsContent value="alphabet" className="space-y-4">
									<div
										className="text-2xl"
										style={{ fontFamily: fontFamily || "inherit" }}
									>
										{ALPHABET_UPPER}
									</div>
									<div
										className="text-2xl"
										style={{ fontFamily: fontFamily || "inherit" }}
									>
										{ALPHABET_LOWER}
									</div>
									<div
										className="text-2xl"
										style={{ fontFamily: fontFamily || "inherit" }}
									>
										{NUMBERS}
									</div>
									<div
										className="text-lg"
										style={{ fontFamily: fontFamily || "inherit" }}
									>
										{SPECIAL}
									</div>
								</TabsContent>

								<TabsContent value="custom">
									<textarea
										value={customText}
										onChange={(e) => setCustomText(e.target.value)}
										placeholder="Type your own text..."
										className="h-32 w-full resize-none rounded border border-border bg-transparent p-3 focus:border-primary focus:outline-none"
										style={{
											fontFamily: fontFamily || "inherit",
											fontSize: `${selectedSize}px`,
										}}
									/>
								</TabsContent>
							</Tabs>
						</div>
					</div>

					{/* Sidebar */}
					<div className="space-y-4">
						{/* Purchase Card */}
						{listing && (
							<div className="rounded-xl border border-border bg-card p-4">
								<div className="mb-4 text-center">
									<p className="text-2xl font-bold">
										{formatUsd(listing.price) || `${formatBSV(listing.price)} BSV`}
									</p>
									{formatUsd(listing.price) && (
										<p className="text-sm text-muted-foreground">
											{formatBSV(listing.price)} BSV
										</p>
									)}
								</div>
								<Button
									className="w-full"
									disabled={purchasing}
									onClick={() =>
										isConnected ? handlePurchase() : connect()
									}
								>
									{purchasing ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Purchasing...
										</>
									) : !isConnected ? (
										"Connect Wallet"
									) : (
										<>
											<ShoppingCart className="mr-2 h-4 w-4" />
											Buy Now
										</>
									)}
								</Button>
							</div>
						)}

						{/* Metadata Card */}
						<div className="rounded-xl border border-border bg-card p-4">
							<h3 className="mb-3 font-semibold">Font Details</h3>
							<dl className="space-y-2 text-sm">
								<div className="flex justify-between">
									<dt className="text-muted-foreground">Style</dt>
									<dd className="font-mono">
										{metadata?.style || "normal"}
									</dd>
								</div>
								<div className="flex justify-between">
									<dt className="text-muted-foreground">Weight</dt>
									<dd className="font-mono">
										{metadata?.weight || "400"}
									</dd>
								</div>
								{metadata?.glyphCount && (
									<div className="flex justify-between">
										<dt className="text-muted-foreground">Glyphs</dt>
										<dd className="font-mono">{metadata.glyphCount}</dd>
									</div>
								)}
								{metadata?.license && (
									<div className="flex justify-between">
										<dt className="text-muted-foreground">License</dt>
										<dd>{metadata.license}</dd>
									</div>
								)}
							</dl>
						</div>

						{/* Origin Card */}
						<div className="rounded-xl border border-border bg-card p-4">
							<h3 className="mb-3 font-semibold">On-Chain Data</h3>
							<div className="rounded bg-muted/30 p-2">
								<p className="mb-1 break-all font-mono text-[10px] text-muted-foreground">
									{origin}
								</p>
								<div className="flex gap-2">
									<Button
										variant="ghost"
										size="sm"
										className="h-7 text-xs"
										onClick={copyOrigin}
									>
										<Copy className="mr-1 h-3 w-3" />
										Copy
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="h-7 text-xs"
										asChild
									>
										<a
											href={`https://ordfs.network/content/${origin}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											<ExternalLink className="mr-1 h-3 w-3" />
											View
										</a>
									</Button>
								</div>
							</div>
						</div>

						{/* Actions */}
						<div className="space-y-2">
							<Button variant="outline" className="w-full" asChild>
								<Link href={`/studio/theme?font=${origin}`}>
									<Palette className="mr-2 h-4 w-4" />
									Use in Theme
								</Link>
							</Button>
							<Button variant="outline" className="w-full" asChild>
								<a
									href={`https://ordfs.network/content/${origin}`}
									download
									target="_blank"
									rel="noopener noreferrer"
								>
									<Download className="mr-2 h-4 w-4" />
									Download Font
								</a>
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
