"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getYoursWallet,
  isYoursWalletInstalled,
  fetchOrdinalContent,
  type YoursWallet,
  type Addresses,
  type Balance,
  type InscribeResponse,
} from "@/lib/yours-wallet";
import { type ThemeToken, validateThemeToken } from "@/lib/schema";
import { useTheme } from "@/components/theme-provider";

export type WalletStatus =
  | "not-installed"
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

interface UseYoursWalletReturn {
  status: WalletStatus;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  themeTokens: ThemeToken[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  addresses: Addresses | null;
  balance: Balance | null;
  inscribeTheme: (theme: ThemeToken) => Promise<InscribeResponse | null>;
  isInscribing: boolean;
}

export function useYoursWallet(): UseYoursWalletReturn {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [themeTokens, setThemeTokens] = useState<ThemeToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addresses, setAddresses] = useState<Addresses | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [isInscribing, setIsInscribing] = useState(false);
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
      // Get JSON ordinals
      const response = await wallet.getOrdinals({
        mimeType: "application/json",
        limit: 100,
      });

      const tokens: ThemeToken[] = [];

      // Fetch and validate each ordinal
      for (const ordinal of response.ordinals) {
        try {
          const content = await fetchOrdinalContent(ordinal.origin.outpoint);
          if (content) {
            const result = validateThemeToken(content);
            if (result.valid) {
              tokens.push(result.theme);
            }
          }
        } catch {
          // Skip invalid ordinals
        }
      }

      setThemeTokens(tokens);
      setAvailableThemes(tokens);
    } catch (err) {
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

  // Fetch wallet info (addresses and balance)
  const fetchWalletInfo = useCallback(async () => {
    const wallet = walletRef.current;
    if (!wallet) return;

    try {
      const [addrs, bal] = await Promise.all([
        wallet.getAddresses(),
        wallet.getBalance(),
      ]);
      setAddresses(addrs);
      setBalance(bal);
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
        // Prepare theme with blockchain source marker
        const themeWithSource: ThemeToken = {
          ...theme,
          source: "BLOCKCHAIN",
          $schema: "https://themetoken.dev/v1",
        };

        const jsonString = JSON.stringify(themeWithSource);
        const base64Data = btoa(jsonString);

        const response = await wallet.inscribe([
          {
            address: addresses.ordAddress,
            base64Data,
            mimeType: "application/json",
            map: {
              app: "ThemeToken",
              type: "theme",
              name: theme.label,
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

  // Fetch wallet info when connected
  useEffect(() => {
    if (status === "connected") {
      fetchWalletInfo();
    } else {
      setAddresses(null);
      setBalance(null);
    }
  }, [status, fetchWalletInfo]);

  return {
    status,
    error,
    connect,
    disconnect,
    themeTokens,
    isLoading,
    refresh,
    addresses,
    balance,
    inscribeTheme,
    isInscribing,
  };
}
