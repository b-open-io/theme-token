/**
 * Yours Wallet Provider Types
 * https://yours-wallet.gitbook.io/provider-api
 */

export interface OrdinalData {
  types?: string[];
  insc?: {
    file?: {
      type?: string;
      size?: number;
    };
  };
  map?: Record<string, unknown>;
}

export interface Origin {
  outpoint: string;
  nonce?: number;
  data?: OrdinalData;
  num?: string;
  map?: Record<string, unknown>;
}

export interface Ordinal {
  txid: string;
  vout: number;
  outpoint: string;
  satoshis: number;
  owner?: string;
  script?: string;
  spend?: string;
  origin?: Origin;
  height: number;
  idx: number;
  data: OrdinalData;
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

export interface Addresses {
  bsvAddress: string;
  ordAddress: string;
  identityAddress: string;
}

export interface Balance {
  bsv: number;
  satoshis: number;
  usdInCents: number;
}

export interface InscribeRequest {
  address: string;
  base64Data: string;
  mimeType: string;
  map?: Record<string, string>;
  satoshis?: number;
}

export interface InscribeResponse {
  txid: string;
  rawtx: string;
}

export interface TransferOrdinalRequest {
  address: string;
  origin: string;
  outpoint: string;
}

export interface PurchaseOrdinalRequest {
  outpoint: string;
  marketplaceRate?: number;
  marketplaceAddress?: string;
}

export interface SocialProfile {
  displayName: string;
  avatar: string;
}

export type WalletEvent = "switchAccount" | "signedOut";

export interface YoursWallet {
  isConnected: () => Promise<boolean>;
  connect: () => Promise<string>; // returns identity pubkey
  disconnect: () => Promise<void>;
  getAddresses: () => Promise<Addresses>;
  getBalance: () => Promise<Balance>;
  getSocialProfile: () => Promise<SocialProfile>;
  getOrdinals: (opts?: GetOrdinalsOptions) => Promise<PaginatedOrdinalsResponse>;
  inscribe: (inscriptions: InscribeRequest[]) => Promise<InscribeResponse>;
  transferOrdinal: (req: TransferOrdinalRequest) => Promise<string>; // returns txid
  purchaseOrdinal: (req: PurchaseOrdinalRequest) => Promise<string>; // returns txid
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

// GorillaPool 1Sat Ordinals API
const ORDINALS_API = "https://ordinals.gorillapool.io/api";

export interface MarketListing {
  outpoint: string;
  origin: string;
  price: number; // satoshis
  owner: string;
  data?: {
    insc?: {
      file?: {
        type?: string;
      };
    };
    map?: Record<string, string>;
  };
}

export interface ThemeMarketListing extends MarketListing {
  theme: import("./schema").ThemeToken;
}

/**
 * Fetch all ordinal lock listings (marketplace)
 * Note: This queries the lock UTXOs, not a dedicated market endpoint
 */
export async function fetchMarketListings(): Promise<MarketListing[]> {
  // TODO: Query for ordinal lock UTXOs with theme token content
  // The API structure for market listings isn't well documented
  // For now return empty - needs further investigation
  return [];
}

/**
 * Fetch theme token listings from the marketplace
 */
export async function fetchThemeMarketListings(): Promise<ThemeMarketListing[]> {
  const listings = await fetchMarketListings();
  const themeListings: ThemeMarketListing[] = [];

  for (const listing of listings) {
    try {
      const content = await fetchOrdinalContent(listing.origin);
      if (content) {
        const { validateThemeToken } = await import("./schema");
        const result = validateThemeToken(content);
        if (result.valid) {
          themeListings.push({
            ...listing,
            theme: result.theme,
          });
        }
      }
    } catch {
      // Skip invalid listings
    }
  }

  return themeListings;
}

/**
 * Fetch inscription details by origin/outpoint
 */
export async function fetchInscription(origin: string): Promise<unknown> {
  try {
    const response = await fetch(`${ORDINALS_API}/inscriptions/origin/${origin}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
