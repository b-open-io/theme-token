/**
 * Fetch published ThemeTokens from the blockchain
 */

import { type ThemeToken, validateThemeToken } from "./schema";

const ORDINALS_API = "https://ordinals.gorillapool.io/api";

interface OrdinalResult {
  txid: string;
  vout: number;
  outpoint: string;
  satoshis: number;
  origin?: {
    outpoint: string;
    data?: {
      insc?: {
        file?: {
          type?: string;
          json?: unknown;
        };
      };
      map?: Record<string, string>;
    };
  };
  data?: {
    map?: Record<string, string>;
    insc?: {
      file?: {
        type?: string;
      };
    };
  };
}

export interface PublishedTheme {
  theme: ThemeToken;
  outpoint: string;
  origin: string;
}

/**
 * Fetch all published ThemeTokens from the blockchain
 * Uses the search endpoint with map.app filter to find all ThemeToken inscriptions
 */
export async function fetchPublishedThemes(): Promise<PublishedTheme[]> {
  const themes: PublishedTheme[] = [];
  const seenOrigins = new Set<string>();

  try {
    // Use search endpoint with base64-encoded query for map.app=ThemeToken
    const query = JSON.stringify({ map: { app: "ThemeToken" } });
    const encodedQuery = typeof window !== "undefined"
      ? btoa(query)
      : Buffer.from(query).toString("base64");

    const response = await fetch(
      `${ORDINALS_API}/inscriptions/search?q=${encodedQuery}&limit=100`
    );

    if (response.ok) {
      const results: OrdinalResult[] = await response.json();

      for (const result of results) {
        try {
          // Skip non-ordinals (must be 1 sat)
          if (result.satoshis !== 1) continue;

          // Get origin outpoint
          const originOutpoint = result.origin?.outpoint;
          if (!originOutpoint || seenOrigins.has(originOutpoint)) continue;

          // Check content type
          const fileType = result.origin?.data?.insc?.file?.type || result.data?.insc?.file?.type;
          if (fileType !== "application/json") continue;

          // Fetch actual theme content from ordfs
          const theme = await fetchThemeByOrigin(originOutpoint);
          if (theme) {
            themes.push({
              ...theme,
              outpoint: result.outpoint, // Current location
            });
            seenOrigins.add(originOutpoint);
          }
        } catch {
          // Skip invalid themes
        }
      }
    }
  } catch (err) {
    console.error("[fetchPublishedThemes] Fetch error:", err);
  }

  return themes;
}

/**
 * Fetch a specific theme by origin outpoint
 * Uses ordfs.network to fetch the content directly
 */
export async function fetchThemeByOrigin(
  origin: string
): Promise<PublishedTheme | null> {
  try {
    const response = await fetch(`https://ordfs.network/${origin}`);

    if (!response.ok) {
      return null;
    }

    const json = await response.json();

    if (json) {
      const validation = validateThemeToken(json);
      if (validation.valid) {
        return {
          theme: validation.theme,
          outpoint: origin,
          origin,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}
