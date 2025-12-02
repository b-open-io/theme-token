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
      json?: unknown;
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

export interface Utxo {
  satoshis: number;
  script: string;
  txid: string;
  vout: number;
}

export interface SignatureRequest {
  prevTxid: string;
  outputIndex: number;
  inputIndex: number;
  satoshis: number;
  address: string | string[];
  script?: string;
  sigHashType?: number;
}

export interface SignatureResponse {
  inputIndex: number;
  sig: string;
  pubKey: string;
  sigHashType: number;
}

export interface GetSignaturesRequest {
  rawtx: string;
  sigRequests: SignatureRequest[];
  format?: "tx" | "beef" | "ef";
}

export interface BroadcastRequest {
  rawtx: string;
  format?: "tx" | "beef" | "ef";
  fund?: boolean;
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
  getPaymentUtxos: () => Promise<Utxo[]>;
  inscribe: (inscriptions: InscribeRequest[]) => Promise<InscribeResponse>;
  transferOrdinal: (req: TransferOrdinalRequest) => Promise<string>; // returns txid
  purchaseOrdinal: (req: PurchaseOrdinalRequest) => Promise<string>; // returns txid
  getSignatures: (req: GetSignaturesRequest) => Promise<SignatureResponse[]>;
  broadcast: (req: BroadcastRequest) => Promise<string>; // returns txid
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
 * Queries the GorillaPool market API for ordinal lock listings
 */
export async function fetchMarketListings(): Promise<MarketListing[]> {
  try {
    // Query the market API - limit to JSON types which theme tokens are
    const response = await fetch(
      `${ORDINALS_API}/market?limit=100&dir=DESC&type=application/json`
    );

    if (!response.ok) {
      console.error("[Market] API error:", response.status);
      return [];
    }

    const results = await response.json();

    // Map the API response to our MarketListing interface
    return results.map((item: {
      txid: string;
      vout: number;
      outpoint: string;
      owner: string;
      origin?: {
        outpoint: string;
        data?: {
          insc?: { file?: { type?: string } };
          map?: Record<string, string>;
        };
      };
      data?: {
        list?: { price: number };
        insc?: { file?: { type?: string } };
        map?: Record<string, string>;
      };
    }) => ({
      outpoint: item.outpoint,
      origin: item.origin?.outpoint || item.outpoint,
      price: item.data?.list?.price || 0,
      owner: item.owner,
      data: {
        insc: item.origin?.data?.insc || item.data?.insc,
        map: item.origin?.data?.map || item.data?.map,
      },
    }));
  } catch (err) {
    console.error("[Market] Failed to fetch listings:", err);
    return [];
  }
}

/**
 * Fetch theme token listings from the marketplace
 * First filters by map.app="ThemeToken", then validates the JSON content
 */
export async function fetchThemeMarketListings(): Promise<ThemeMarketListing[]> {
  const listings = await fetchMarketListings();
  const themeListings: ThemeMarketListing[] = [];

  // Filter for potential theme tokens first (by map metadata)
  const potentialThemes = listings.filter(
    (l) => l.data?.map?.app === "ThemeToken"
  );

  const { validateThemeToken } = await import("./schema");

  for (const listing of potentialThemes) {
    try {
      // Try to fetch the content from ordfs
      const content = await fetchOrdinalContent(listing.origin);
      if (content) {
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
