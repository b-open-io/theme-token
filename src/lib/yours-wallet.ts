/**
 * Yours Wallet Provider Types
 * https://yours-wallet.gitbook.io/provider-api
 */

export interface OrdinalOrigin {
  outpoint: string;
  data?: {
    insc?: {
      file?: {
        type?: string;
      };
    };
  };
}

export interface Ordinal {
  origin: OrdinalOrigin;
  outpoint: string;
}

export interface PaginatedOrdinalsResponse {
  ordinals: Ordinal[];
  from?: string;
}

export interface GetOrdinalsOptions {
  from?: string;
  limit?: number;
  mimeType?: string;
}

export type WalletEvent = "switchAccount" | "signedOut";

export interface YoursWallet {
  isConnected: () => Promise<boolean>;
  connect: () => Promise<string>; // returns identity pubkey
  disconnect: () => Promise<void>;
  getOrdinals: (opts?: GetOrdinalsOptions) => Promise<PaginatedOrdinalsResponse>;
  on: (event: WalletEvent, callback: () => void) => void;
  removeListener: (event: WalletEvent, callback: () => void) => void;
}

declare global {
  interface Window {
    yours?: YoursWallet;
  }
}

/**
 * Get the Yours Wallet provider from window
 */
export function getYoursWallet(): YoursWallet | null {
  if (typeof window === "undefined") return null;
  return window.yours ?? null;
}

/**
 * Check if Yours Wallet is installed
 */
export function isYoursWalletInstalled(): boolean {
  return typeof window !== "undefined" && !!window.yours;
}

/**
 * Fetch ordinal content from ordfs.network
 */
export async function fetchOrdinalContent<T = unknown>(
  outpoint: string
): Promise<T | null> {
  try {
    const response = await fetch(
      `https://ordfs.network/content/${outpoint}`
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export const YOURS_WALLET_URL = "https://yours.org";
