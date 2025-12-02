/**
 * Fetch published ThemeTokens from the blockchain
 */

import { type ThemeToken, validateThemeToken } from "./schema";

const ORDINALS_API = "https://ordinals.gorillapool.io/api";

// Known theme origins - for themes minted before search API indexing
const KNOWN_THEME_ORIGINS = [
  "b540df234cfe05262f9e76abf63d975b7b133a0dc9a2db2751f31d2524c986a9_0", // Gorilla Pool
];

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
 * Also includes known theme origins
 */
export async function fetchPublishedThemes(): Promise<PublishedTheme[]> {
  const themes: PublishedTheme[] = [];
  const seenOrigins = new Set<string>();

  // First, fetch known themes by origin
  for (const origin of KNOWN_THEME_ORIGINS) {
    try {
      const theme = await fetchThemeByOrigin(origin);
      if (theme && !seenOrigins.has(theme.origin)) {
        themes.push(theme);
        seenOrigins.add(theme.origin);
      }
    } catch {
      // Skip failed fetches
    }
  }

  // Then search for themes via API
  try {
    const response = await fetch(
      `${ORDINALS_API}/inscriptions/search?map.app=ThemeToken&map.type=theme&limit=100`
    );

    if (response.ok) {
      const results: OrdinalSearchResult[] = await response.json();

      for (const result of results) {
        try {
          if (seenOrigins.has(result.origin.outpoint)) continue;

          const json = result.origin?.data?.insc?.file?.json;
          if (json) {
            const validation = validateThemeToken(json);
            if (validation.valid) {
              themes.push({
                theme: validation.theme,
                outpoint: result.outpoint,
                origin: result.origin.outpoint,
              });
              seenOrigins.add(result.origin.outpoint);
            }
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
          outpoint: origin, // For direct fetches, outpoint is same as origin
          origin,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}
