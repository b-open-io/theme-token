"use client";

import { AlertCircle, Check, Loader2, Tag } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type OwnedTheme, useYoursWallet } from "@/hooks/use-yours-wallet";
import { fetchThemeMarketListings } from "@/lib/yours-wallet";
import { formatBSV, ThemeStripes } from "@/components/market/theme-stripes";

export default function SellPage() {
	const {
		status,
		connect,
		ownedThemes,
		listTheme,
		isListing,
		error: walletError,
	} = useYoursWallet();
	const { mode } = useTheme();
	const [listedOrigins, setListedOrigins] = useState<Set<string>>(new Set());
	const [selectedTheme, setSelectedTheme] = useState<OwnedTheme | null>(null);
	const [listingPrice, setListingPrice] = useState("");
	const [listingSuccess, setListingSuccess] = useState<string | null>(null);
	const [listingError, setListingError] = useState<string | null>(null);

	const isConnected = status === "connected";

	// Fetch listed origins to filter
	useEffect(() => {
		fetchThemeMarketListings().then((listings) => {
			setListedOrigins(new Set(listings.map((l) => l.origin)));
		});
	}, []);

	// Filter out already listed themes
	const availableToList = useMemo(
		() => ownedThemes.filter((t) => !listedOrigins.has(t.origin)),
		[ownedThemes, listedOrigins],
	);

	const handleList = async () => {
		if (!selectedTheme || !listingPrice) return;

		setListingError(null);
		try {
			const result = await listTheme(
				selectedTheme.outpoint,
				parseInt(listingPrice, 10),
			);
			if (result) {
				setListingSuccess(result.txid);
			}
		} catch (err) {
			console.error("[Sell] Listing error:", err);
			setListingError(err instanceof Error ? err.message : "Listing failed");
		}
	};

	if (!isConnected) {
		return (
			<div className="rounded-xl border border-dashed border-border py-20 text-center">
				<Tag className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
				<h3 className="mb-2 text-lg font-semibold">Connect Your Wallet</h3>
				<p className="mb-4 text-muted-foreground">
					Connect to list your themes for sale
				</p>
				<Button onClick={connect}>Connect Wallet</Button>
			</div>
		);
	}

	if (listingSuccess) {
		return (
			<div className="rounded-xl border border-green-500/50 bg-green-500/10 p-6 text-center">
				<Check className="mx-auto mb-3 h-12 w-12 text-green-600" />
				<h3 className="mb-2 font-semibold text-green-700 dark:text-green-300">
					Listed Successfully!
				</h3>
				<p className="mb-4 text-sm text-green-700/80 dark:text-green-300/80">
					Your theme has been listed on the marketplace.
				</p>
				<p className="mb-4 font-mono text-xs text-green-700/60 dark:text-green-300/60">
					TXID: {listingSuccess}
				</p>
				<Button
					variant="outline"
					onClick={() => {
						setListingSuccess(null);
						setSelectedTheme(null);
						setListingPrice("");
					}}
				>
					List Another Theme
				</Button>
			</div>
		);
	}

	if (availableToList.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-border py-20 text-center">
				<Tag className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
				<h3 className="mb-2 text-lg font-semibold">No themes to list</h3>
				<p className="mb-4 text-muted-foreground">
					{ownedThemes.length > 0
						? "All your themes are already listed on the marketplace"
						: "You need to own a theme token to list it for sale"}
				</p>
				<Link href="/studio">
					<Button>Create a Theme</Button>
				</Link>
			</div>
		);
	}

	return (
		<div>
			<div className="mb-6">
				<h2 className="text-2xl font-bold">List Theme for Sale</h2>
				<p className="text-muted-foreground">
					List your theme token on the decentralized marketplace
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Theme Selection */}
				<div>
					<h3 className="mb-4 font-semibold">Select Theme to List</h3>
					<div className="space-y-2">
						{availableToList.map((owned) => (
							<button
								type="button"
								key={owned.outpoint}
								onClick={() => setSelectedTheme(owned)}
								className={`w-full rounded-lg border p-4 text-left transition-colors ${
									selectedTheme?.outpoint === owned.outpoint
										? "border-primary bg-primary/5"
										: "border-border hover:border-primary/50"
								}`}
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<ThemeStripes
											styles={owned.theme.styles}
											mode={mode}
											size="md"
										/>
										<div>
											<div className="font-medium">{owned.theme.name}</div>
											<div className="text-xs text-muted-foreground">
												{owned.outpoint.slice(0, 8)}...
												{owned.outpoint.slice(-8)}
											</div>
										</div>
									</div>
									{selectedTheme?.outpoint === owned.outpoint && (
										<Check className="h-5 w-5 text-primary" />
									)}
								</div>
							</button>
						))}
					</div>
				</div>

				{/* Listing Form */}
				<div>
					<h3 className="mb-4 font-semibold">Set Price</h3>
					{selectedTheme ? (
						<div className="space-y-4">
							<div className="rounded-lg border border-border bg-muted/50 p-4">
								<div className="mb-2 flex items-center gap-3">
									<ThemeStripes
										styles={selectedTheme.theme.styles}
										mode={mode}
										size="lg"
									/>
									<div>
										<div className="font-medium">
											{selectedTheme.theme.name}
										</div>
										<Badge variant="outline" className="mt-1">
											Selected
										</Badge>
									</div>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="price">Price (satoshis)</Label>
								<Input
									id="price"
									type="number"
									min="1"
									placeholder="10000"
									value={listingPrice}
									onChange={(e) => setListingPrice(e.target.value)}
								/>
								{listingPrice && (
									<p className="text-xs text-muted-foreground">
										= {formatBSV(parseInt(listingPrice, 10) || 0)} BSV
									</p>
								)}
							</div>

							{(listingError || walletError) && (
								<div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
									<AlertCircle className="h-4 w-4" />
									{listingError || walletError}
								</div>
							)}

							<Button
								className="w-full"
								disabled={
									isListing || !listingPrice || parseInt(listingPrice, 10) < 1
								}
								onClick={handleList}
							>
								{isListing ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Creating Listing...
									</>
								) : (
									<>
										<Tag className="mr-2 h-4 w-4" />
										List for{" "}
										{listingPrice ? formatBSV(parseInt(listingPrice, 10)) : "0"}{" "}
										BSV
									</>
								)}
							</Button>
						</div>
					) : (
						<div className="rounded-lg border border-dashed border-border p-8 text-center">
							<p className="text-muted-foreground">
								Select a theme from the list to set its price
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
