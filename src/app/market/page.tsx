"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useYoursWallet, type OwnedTheme } from "@/hooks/use-yours-wallet";
import { useTheme } from "@/components/theme-provider";
import {
  type ThemeMarketListing,
  fetchThemeMarketListings,
} from "@/lib/yours-wallet";
import {
  Loader2,
  ShoppingCart,
  Tag,
  RefreshCw,
  Wallet,
  AlertCircle,
  Check,
} from "lucide-react";

// Color stripes for theme preview
function ThemeStripes({
  styles,
  mode,
  size = "md",
}: {
  styles: { light: Record<string, string>; dark: Record<string, string> };
  mode: "light" | "dark";
  size?: "sm" | "md" | "lg";
}) {
  const colors = [
    styles[mode].primary,
    styles[mode].secondary,
    styles[mode].accent,
    styles[mode].background,
  ];

  const sizeClasses = {
    sm: "h-4 w-8",
    md: "h-6 w-12",
    lg: "h-8 w-16",
  };

  return (
    <div
      className={`flex overflow-hidden rounded border border-border ${sizeClasses[size]}`}
    >
      {colors.map((color, i) => (
        <div key={i} className="flex-1" style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}

// Format satoshis to BSV
function formatBSV(satoshis: number): string {
  return (satoshis / 100_000_000).toFixed(8);
}

// Format satoshis to USD (approximate)
function formatUSD(satoshis: number, rate: number): string {
  const bsv = satoshis / 100_000_000;
  const usd = bsv * rate;
  return usd.toFixed(2);
}

export default function MarketPage() {
  const { status, connect, balance, themeTokens, ownedThemes, listTheme, isListing, error: walletError } = useYoursWallet();
  const { mode } = useTheme();
  const [listings, setListings] = useState<ThemeMarketListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listingError, setListingError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"browse" | "my-themes" | "sell">(
    "browse"
  );
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<OwnedTheme | null>(null);
  const [listingPrice, setListingPrice] = useState("");
  const [listingSuccess, setListingSuccess] = useState<string | null>(null);

  const isConnected = status === "connected";

  // Fetch market listings
  useEffect(() => {
    async function loadListings() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchThemeMarketListings();
        setListings(data);
      } catch (err) {
        setError("Failed to load marketplace listings");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadListings();
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const data = await fetchThemeMarketListings();
      setListings(data);
    } catch {
      setError("Failed to refresh listings");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (listing: ThemeMarketListing) => {
    if (!isConnected) return;

    setPurchasing(listing.outpoint);
    try {
      const wallet = window.yours;
      if (!wallet) throw new Error("Wallet not available");

      const txid = await wallet.purchaseOrdinal({
        outpoint: listing.outpoint,
        // Optional: Add marketplace fee
        // marketplaceRate: 0.02, // 2%
        // marketplaceAddress: "your-fee-address",
      });

      console.log("Purchase successful:", txid);
      // Refresh listings after purchase
      await handleRefresh();
    } catch (err) {
      console.error("Purchase failed:", err);
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Theme Token Market</h1>
          <p className="text-muted-foreground">
            Buy, sell, and trade theme tokens on the decentralized marketplace
          </p>
        </div>
        {/* Tab Navigation */}
        <div className="mb-8 flex gap-2 rounded-lg bg-muted p-1">
          <button
            onClick={() => setActiveTab("browse")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "browse"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingCart className="mr-2 inline h-4 w-4" />
            Browse Market
          </button>
          <button
            onClick={() => setActiveTab("my-themes")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "my-themes"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wallet className="mr-2 inline h-4 w-4" />
            My Themes
          </button>
          <button
            onClick={() => setActiveTab("sell")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "sell"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tag className="mr-2 inline h-4 w-4" />
            Sell Theme
          </button>
        </div>

        {/* Browse Market Tab */}
        {activeTab === "browse" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Available Themes</h2>
                <p className="text-muted-foreground">
                  Purchase theme tokens from the decentralized marketplace
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
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
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <motion.div
                    key={listing.outpoint}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <ThemeStripes
                        styles={listing.theme.styles}
                        mode={mode}
                        size="lg"
                      />
                      <Badge variant="secondary">
                        {formatBSV(listing.price)} BSV
                      </Badge>
                    </div>
                    <h3 className="mb-1 font-semibold">{listing.theme.name}</h3>
                    <p className="mb-4 text-xs text-muted-foreground">
                      {listing.origin.slice(0, 8)}...{listing.origin.slice(-8)}
                    </p>
                    <Button
                      className="w-full"
                      disabled={!isConnected || purchasing === listing.outpoint}
                      onClick={() => handlePurchase(listing)}
                    >
                      {purchasing === listing.outpoint ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Purchasing...
                        </>
                      ) : !isConnected ? (
                        "Connect Wallet"
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Purchase
                        </>
                      )}
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Themes Tab */}
        {activeTab === "my-themes" && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">My Theme Tokens</h2>
              <p className="text-muted-foreground">
                Theme tokens you own that can be applied or listed for sale
              </p>
            </div>

            {!isConnected ? (
              <div className="rounded-xl border border-dashed border-border py-20 text-center">
                <Wallet className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mb-2 text-lg font-semibold">
                  Connect Your Wallet
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Connect to see your theme tokens
                </p>
                <Button onClick={connect}>Connect Wallet</Button>
              </div>
            ) : themeTokens.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-20 text-center">
                <Wallet className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mb-2 text-lg font-semibold">No themes found</h3>
                <p className="mb-4 text-muted-foreground">
                  You don&apos;t own any theme tokens yet
                </p>
                <Link href="/#mint">
                  <Button>Inscribe a Theme</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {themeTokens.map((theme, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <ThemeStripes styles={theme.styles} mode={mode} size="lg" />
                      <Badge variant="outline">Owned</Badge>
                    </div>
                    <h3 className="mb-4 font-semibold">{theme.name}</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setActiveTab("sell")}
                      >
                        <Tag className="mr-2 h-4 w-4" />
                        List for Sale
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sell Tab */}
        {activeTab === "sell" && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">List Theme for Sale</h2>
              <p className="text-muted-foreground">
                List your theme token on the decentralized marketplace
              </p>
            </div>

            {!isConnected ? (
              <div className="rounded-xl border border-dashed border-border py-20 text-center">
                <Tag className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mb-2 text-lg font-semibold">
                  Connect Your Wallet
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Connect to list your themes for sale
                </p>
                <Button onClick={connect}>Connect Wallet</Button>
              </div>
            ) : listingSuccess ? (
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
            ) : ownedThemes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-20 text-center">
                <Tag className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mb-2 text-lg font-semibold">No themes to list</h3>
                <p className="mb-4 text-muted-foreground">
                  You need to own a theme token to list it for sale
                </p>
                <Link href="/studio">
                  <Button>Create a Theme</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Theme Selection */}
                <div>
                  <h3 className="mb-4 font-semibold">Select Theme to List</h3>
                  <div className="space-y-2">
                    {ownedThemes.map((owned) => (
                      <button
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
                                {owned.outpoint.slice(0, 8)}...{owned.outpoint.slice(-8)}
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
                            <div className="font-medium">{selectedTheme.theme.name}</div>
                            <Badge variant="outline" className="mt-1">Selected</Badge>
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
                            = {formatBSV(parseInt(listingPrice) || 0)} BSV
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
                        disabled={isListing || !listingPrice || parseInt(listingPrice) < 1}
                        onClick={async () => {
                          console.log("[Market] Listing theme:", selectedTheme.outpoint, "price:", listingPrice);
                          setListingError(null);
                          try {
                            const result = await listTheme(
                              selectedTheme.outpoint,
                              parseInt(listingPrice)
                            );
                            console.log("[Market] List result:", result);
                            if (result) {
                              setListingSuccess(result.txid);
                              handleRefresh();
                            }
                          } catch (err) {
                            console.error("[Market] Listing error:", err);
                            setListingError(err instanceof Error ? err.message : "Listing failed");
                          }
                        }}
                      >
                        {isListing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Listing...
                          </>
                        ) : (
                          <>
                            <Tag className="mr-2 h-4 w-4" />
                            List for {listingPrice ? formatBSV(parseInt(listingPrice)) : "0"} BSV
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
