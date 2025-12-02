/**
 * Fetch published ThemeTokens from the blockchain
 */

import { type ThemeToken, validateThemeToken } from "./schema";

const ORDINALS_API = "https://ordinals.gorillapool.io/api";

interface OrdinalSearchResult {
  txid: string;
  vout: number;
  outpoint: string;
  origin: {
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
  try {
    // Search for ordinals with ThemeToken app tag
    const response = await fetch(
      `${ORDINALS_API}/inscriptions/search?map.app=ThemeToken&map.type=theme&limit=100`
    );

    if (!response.ok) {
      console.error("[fetchPublishedThemes] API error:", response.status);
      return [];
    }

    const results: OrdinalSearchResult[] = await response.json();
    const themes: PublishedTheme[] = [];

    for (const result of results) {
      try {
        const json = result.origin?.data?.insc?.file?.json;
        if (json) {
          const validation = validateThemeToken(json);
          if (validation.valid) {
            themes.push({
              theme: validation.theme,
              outpoint: result.outpoint,
              origin: result.origin.outpoint,
            });
          }
        }
      } catch {
        // Skip invalid themes
      }
    }

    return themes;
  } catch (err) {
    console.error("[fetchPublishedThemes] Error:", err);
    return [];
  }
}

/**
 * Fetch a specific theme by origin outpoint
 */
export async function fetchThemeByOrigin(
  origin: string
): Promise<PublishedTheme | null> {
  try {
    const response = await fetch(`${ORDINALS_API}/inscriptions/origin/${origin}`);

    if (!response.ok) {
      return null;
    }

    const result: OrdinalSearchResult = await response.json();
    const json = result.origin?.data?.insc?.file?.json;

    if (json) {
      const validation = validateThemeToken(json);
      if (validation.valid) {
        return {
          theme: validation.theme,
          outpoint: result.outpoint,
          origin: result.origin.outpoint,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}
