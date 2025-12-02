"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { useTheme } from "@/components/theme-provider";
import {
  type ThemeMarketListing,
  fetchThemeMarketListings,
} from "@/lib/yours-wallet";
import { Loader2, ShoppingCart, RefreshCw, AlertCircle } from "lucide-react";
import { ThemeStripes, formatBSV } from "../_components/theme-stripes";

export default function BrowsePage() {
  const { status, connect } = useYoursWallet();
  const { mode } = useTheme();
  const [listings, setListings] = useState<ThemeMarketListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const isConnected = status === "connected";

  useEffect(() => {
    loadListings();
  }, []);

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

  const handlePurchase = async (listing: ThemeMarketListing) => {
    if (!isConnected) return;

    setPurchasing(listing.outpoint);
    try {
      const wallet = window.yours;
      if (!wallet) throw new Error("Wallet not available");

      const txid = await wallet.purchaseOrdinal({
        outpoint: listing.outpoint,
        marketplaceRate: 0.02, // 2% commission
        marketplaceAddress: "15q8YQSqUa9uTh6gh4AVixxq29xkpBBP9z",
      });

      console.log("Purchase successful:", txid);
      await loadListings();
    } catch (err) {
      console.error("Purchase failed:", err);
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setPurchasing(null);
    }
  };

  return (
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
          onClick={loadListings}
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
          <h3 className="mb-2 text-lg font-semibold">No listings available</h3>
          <p className="text-muted-foreground">
            The marketplace is currently empty. Be the first to list a theme!
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
  );
}
