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
 * Uses the recent inscriptions endpoint and filters for ThemeToken app
 */
export async function fetchPublishedThemes(): Promise<PublishedTheme[]> {
  const themes: PublishedTheme[] = [];
  const seenOrigins = new Set<string>();

  try {
    // Use the recent inscriptions endpoint - it properly includes origin data
    const response = await fetch(
      `${ORDINALS_API}/inscriptions/recent?limit=200`
    );

    if (response.ok) {
      const results: OrdinalResult[] = await response.json();

      for (const result of results) {
        try {
          // Skip non-ordinals (must be 1 sat)
          if (result.satoshis !== 1) continue;

          // Check if this is a ThemeToken via origin data map
          const mapData = result.origin?.data?.map || result.data?.map;
          if (mapData?.app !== "ThemeToken" || mapData?.type !== "theme") {
            continue;
          }

          // Skip if no origin or already seen
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
