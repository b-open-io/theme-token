/**
 * Default Theme Module
 *
 * Single source of truth for the canonical default theme origin.
 * Theme data is fetched from chain and cached - never hardcoded.
 */

import { fetchThemeByOrigin, type ThemeToken } from "@theme-token/sdk";

/**
 * Canonical default theme origin (on-chain)
 * Toast & Jamify theme - a purple/blue music-focused theme
 */
export const DEFAULT_THEME_ORIGIN =
	"1ddd3a1d97a22c737ea180954a1f47800b53c9c657c592e21315e0e9b162c83d_0";

/**
 * Fetch the default theme from chain
 * Called at build time or when cache is empty
 */
export async function fetchDefaultTheme(): Promise<ThemeToken | null> {
	try {
		const published = await fetchThemeByOrigin(DEFAULT_THEME_ORIGIN);
		return published?.theme ?? null;
	} catch (error) {
		console.error("[default-theme] Failed to fetch from chain:", error);
		return null;
	}
}
