"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getYoursWallet,
  isYoursWalletInstalled,
  fetchOrdinalContent,
  type YoursWallet,
  type Addresses,
  type Balance,
  type SocialProfile,
  type InscribeResponse,
  type Ordinal,
} from "@/lib/yours-wallet";
import { listOrdinal, type ListOrdinalResult } from "@/lib/list-ordinal";
import { type ThemeToken, validateThemeToken, THEME_TOKEN_SCHEMA_URL } from "@theme-token/sdk";
import { useTheme } from "@/components/theme-provider";

export type WalletStatus =
  | "not-installed"
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

// Theme token with ordinal metadata for listing
export interface OwnedTheme {
  theme: ThemeToken;
  outpoint: string;
  origin: string;
}

interface UseYoursWalletReturn {
  status: WalletStatus;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  themeTokens: ThemeToken[];
  ownedThemes: OwnedTheme[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  addresses: Addresses | null;
  balance: Balance | null;
  profile: SocialProfile | null;
  inscribeTheme: (theme: ThemeToken) => Promise<InscribeResponse | null>;
  isInscribing: boolean;
  listTheme: (outpoint: string, priceSatoshis: number) => Promise<ListOrdinalResult | null>;
  isListing: boolean;
}

export function useYoursWallet(): UseYoursWalletReturn {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [themeTokens, setThemeTokens] = useState<ThemeToken[]>([]);
  const [ownedThemes, setOwnedThemes] = useState<OwnedTheme[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addresses, setAddresses] = useState<Addresses | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [isInscribing, setIsInscribing] = useState(false);
  const [isListing, setIsListing] = useState(false);
  const walletRef = useRef<YoursWallet | null>(null);
  const { setAvailableThemes, resetTheme } = useTheme();

  // Event handlers
  const handleSwitchAccount = useCallback(() => {
    // Re-fetch ordinals when account switches
    fetchThemeTokens();
  }, []);

  const handleSignedOut = useCallback(() => {
    // Reset state when user signs out
    setStatus("disconnected");
    setThemeTokens([]);
    setOwnedThemes([]);
    setAvailableThemes([]);
    resetTheme();
    walletRef.current?.disconnect().catch(console.error);
  }, [setAvailableThemes, resetTheme]);

  // Fetch theme tokens from wallet
  const fetchThemeTokens = useCallback(async () => {
    const wallet = walletRef.current;
    if (!wallet) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get JSON ordinals - try without mimeType filter first, then filter client-side
      const response = await wallet.getOrdinals({
        limit: 100,
      });

      console.log("[ThemeToken] getOrdinals response:", response);

      const tokens: ThemeToken[] = [];
      const owned: OwnedTheme[] = [];
      // Response can be array directly or { ordinals: [] }
      const ordinals = Array.isArray(response) ? response : (response?.ordinals ?? []);

      // Fetch and validate each ordinal
      for (const ordinal of ordinals) {
        try {
          // JSON is in origin.data.insc.file.json (persists across transfers)
          const content = ordinal?.origin?.data?.insc?.file?.json;
          console.log("[ThemeToken] Ordinal:", ordinal.outpoint, "json:", content);

          if (content && typeof content === "object") {
            const result = validateThemeToken(content);
            console.log("[ThemeToken] Validation:", ordinal.outpoint, result);
            if (result.valid) {
              console.log("[ThemeToken] Valid theme:", result.theme.name);
              tokens.push(result.theme);
              owned.push({
                theme: result.theme,
                outpoint: ordinal.outpoint,
                origin: ordinal.origin?.outpoint || ordinal.outpoint,
              });
            }
          }
        } catch (err) {
          console.error("[ThemeToken] Error:", err);
        }
      }
      console.log("[ThemeToken] Found themes:", tokens.length);
      setThemeTokens(tokens);
      setOwnedThemes(owned);
      setAvailableThemes(tokens);
    } catch (err) {
      console.error("[ThemeToken] Error fetching ordinals:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch ordinals");
    } finally {
      setIsLoading(false);
    }
  }, [setAvailableThemes]);

  // Initialize and check connection status with retry for slow injection
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 500; // ms

    const initWallet = () => {
      if (!isYoursWalletInstalled()) {
        // Retry a few times in case wallet injects slowly
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initWallet, retryDelay);
          return;
        }
        setStatus("not-installed");
        return;
      }

      const wallet = getYoursWallet();
      if (!wallet) {
        setStatus("not-installed");
        return;
      }

      walletRef.current = wallet;

      // Set up event listeners
      wallet.on("switchAccount", handleSwitchAccount);
      wallet.on("signedOut", handleSignedOut);

      // Check if already connected
      wallet
        .isConnected()
        .then((connected) => {
          if (connected) {
            setStatus("connected");
            fetchThemeTokens();
          } else {
            setStatus("disconnected");
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Connection check failed");
          setStatus("error");
        });
    };

    initWallet();

    // Cleanup
    return () => {
      const wallet = walletRef.current;
      if (wallet) {
        wallet.removeListener("switchAccount", handleSwitchAccount);
        wallet.removeListener("signedOut", handleSignedOut);
      }
    };
  }, [handleSwitchAccount, handleSignedOut, fetchThemeTokens]);

  const connect = useCallback(async () => {
    const wallet = walletRef.current;
    if (!wallet) {
      setError("Wallet not available");
      return;
    }

    setStatus("connecting");
    setError(null);

    try {
      await wallet.connect();
      setStatus("connected");
      await fetchThemeTokens();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setStatus("error");
    }
  }, [fetchThemeTokens]);

  const disconnect = useCallback(async () => {
    const wallet = walletRef.current;
    if (!wallet) return;

    try {
      await wallet.disconnect();
      setStatus("disconnected");
      setThemeTokens([]);
      setOwnedThemes([]);
      setAvailableThemes([]);
      resetTheme();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disconnect failed");
    }
  }, [setAvailableThemes, resetTheme]);

  const refresh = useCallback(async () => {
    if (status === "connected") {
      await fetchThemeTokens();
    }
  }, [status, fetchThemeTokens]);

  // Fetch wallet info (addresses, balance, profile)
  const fetchWalletInfo = useCallback(async () => {
    const wallet = walletRef.current;
    if (!wallet) return;

    try {
      const [addrs, bal, prof] = await Promise.all([
        wallet.getAddresses(),
        wallet.getBalance(),
        wallet.getSocialProfile().catch(() => null),
      ]);
      setAddresses(addrs);
      setBalance(bal);
      if (prof) setProfile(prof);
    } catch (err) {
      console.error("Failed to fetch wallet info:", err);
    }
  }, []);

  // Inscribe a theme token
  const inscribeTheme = useCallback(
    async (theme: ThemeToken): Promise<InscribeResponse | null> => {
      const wallet = walletRef.current;
      if (!wallet || !addresses) {
        setError("Wallet not connected");
        return null;
      }

      setIsInscribing(true);
      setError(null);

      try {
        // Theme already has $schema (required field)
        const jsonString = JSON.stringify(theme);
        const base64Data = btoa(jsonString);

        const response = await wallet.inscribe([
          {
            address: addresses.ordAddress,
            base64Data,
            mimeType: "application/json",
            map: {
              app: "ThemeToken",
              type: "theme",
              name: theme.name,
            },
            satoshis: 1,
          },
        ]);

        // Refresh theme tokens after inscription
        await fetchThemeTokens();
        await fetchWalletInfo();

        return response;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Inscription failed");
        return null;
      } finally {
        setIsInscribing(false);
      }
    },
    [addresses, fetchThemeTokens, fetchWalletInfo]
  );

  // List a theme on the marketplace
  const listTheme = useCallback(
    async (outpoint: string, priceSatoshis: number): Promise<ListOrdinalResult | null> => {
      console.log("[listTheme] Starting, outpoint:", outpoint, "price:", priceSatoshis);

      const wallet = walletRef.current;
      if (!wallet) {
        console.error("[listTheme] Wallet not connected");
        setError("Wallet not connected");
        return null;
      }

      // Find the ordinal by outpoint
      console.log("[listTheme] ownedThemes:", ownedThemes);
      const ownedTheme = ownedThemes.find((t) => t.outpoint === outpoint);
      if (!ownedTheme) {
        console.error("[listTheme] Theme not found in wallet");
        setError("Theme not found in wallet");
        return null;
      }

      setIsListing(true);
      setError(null);

      try {
        // Get the ordinal details from the wallet
        console.log("[listTheme] Getting ordinals from wallet...");
        const response = await wallet.getOrdinals({ limit: 100 });
        console.log("[listTheme] Ordinals response:", response);
        const ordinals = Array.isArray(response) ? response : (response?.ordinals ?? []);
        const ordinal = ordinals.find((o) => o.outpoint === outpoint) as Ordinal | undefined;

        if (!ordinal) {
          console.error("[listTheme] Ordinal not found in response");
          throw new Error("Ordinal not found");
        }

        console.log("[listTheme] Found ordinal:", ordinal);
        console.log("[listTheme] Calling listOrdinal...");

        const result = await listOrdinal(wallet, {
          ordinal,
          priceSatoshis,
        });

        console.log("[listTheme] listOrdinal result:", result);

        // Refresh after listing
        await fetchThemeTokens();
        await fetchWalletInfo();

        return result;
      } catch (err) {
        console.error("[listTheme] Error:", err);
        setError(err instanceof Error ? err.message : "Listing failed");
        return null;
      } finally {
        setIsListing(false);
      }
    },
    [ownedThemes, fetchThemeTokens, fetchWalletInfo]
  );

  // Fetch wallet info when connected
  useEffect(() => {
    if (status === "connected") {
      fetchWalletInfo();
    } else {
      setAddresses(null);
      setBalance(null);
      setProfile(null);
    }
  }, [status, fetchWalletInfo]);

  return {
    status,
    error,
    connect,
    disconnect,
    themeTokens,
    ownedThemes,
    isLoading,
    refresh,
    addresses,
    balance,
    profile,
    inscribeTheme,
    isInscribing,
    listTheme,
    isListing,
  };
}
