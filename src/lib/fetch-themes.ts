/**
 * Fetch published ThemeTokens from the blockchain
 */

import { type ThemeToken, validateThemeToken } from "./schema";

const ORDINALS_API = "https://ordinals.gorillapool.io/api";

interface OrdinalSearchResult {
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
}

export interface PublishedTheme {
  theme: ThemeToken;
  outpoint: string;
  origin: string;
}

/**
 * Fetch all published ThemeTokens from the blockchain
 * Searches for inscriptions with app="ThemeToken" in their map data
 */
export async function fetchPublishedThemes(): Promise<PublishedTheme[]> {
  const themes: PublishedTheme[] = [];
  const seenOrigins = new Set<string>();

  // Search for themes via GorillaPool API
  try {
    const response = await fetch(
      `${ORDINALS_API}/inscriptions/search?map.app=ThemeToken&map.type=theme&limit=100`
    );

    if (response.ok) {
      const results: OrdinalSearchResult[] = await response.json();

      for (const result of results) {
        try {
          // Skip if no origin or already seen
          const originOutpoint = result.origin?.outpoint;
          if (!originOutpoint || seenOrigins.has(originOutpoint)) continue;

          // Skip non-ordinals (must be 1 sat)
          if (result.satoshis !== 1) continue;

          // Try embedded JSON first
          const json = result.origin?.data?.insc?.file?.json;
          if (!json) {
            // Only fetch from ordfs if it's JSON content type
            const fileType = result.origin?.data?.insc?.file?.type;
            if (fileType === "application/json") {
              const theme = await fetchThemeByOrigin(originOutpoint);
              if (theme) {
                themes.push(theme);
                seenOrigins.add(originOutpoint);
              }
            }
            continue;
          }

          const validation = validateThemeToken(json);
          if (validation.valid) {
            themes.push({
              theme: validation.theme,
              outpoint: result.outpoint,
              origin: originOutpoint,
            });
            seenOrigins.add(originOutpoint);
          }
        } catch {
          // Skip invalid themes
        }
      }
    }
  } catch (err) {
    console.error("[fetchPublishedThemes] Search error:", err);
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
