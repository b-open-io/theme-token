"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getYoursWallet,
  isYoursWalletInstalled,
  fetchOrdinalContent,
  type YoursWallet,
  type Ordinal,
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
}

export function useYoursWallet(): UseYoursWalletReturn {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [themeTokens, setThemeTokens] = useState<ThemeToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  // Initialize and check connection status
  useEffect(() => {
    if (!isYoursWalletInstalled()) {
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

    // Cleanup
    return () => {
      wallet.removeListener("switchAccount", handleSwitchAccount);
      wallet.removeListener("signedOut", handleSignedOut);
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

  return {
    status,
    error,
    connect,
    disconnect,
    themeTokens,
    isLoading,
    refresh,
  };
}
