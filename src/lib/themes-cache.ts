import type { ThemeToken } from "@theme-token/sdk";

export interface CachedTheme {
	origin: string;
	theme: ThemeToken;
	inscribedAt: number;
	owner?: string;
}

interface CacheResponse {
	themes: CachedTheme[];
	cached: boolean;
	lastSynced: number;
}

/**
 * Fetch published themes from our Vercel KV cache
 * Falls back to live API if cache miss, and includes recently inscribed themes
 */
export async function fetchCachedThemes(): Promise<CachedTheme[]> {
	try {
		const response = await fetch("/api/themes/cache", {
			next: { revalidate: 60 }, // ISR: revalidate every 60s
		});

		if (!response.ok) {
			throw new Error(`Cache API error: ${response.status}`);
		}

		const data: CacheResponse = await response.json();
		return data.themes;
	} catch (error) {
		console.error("[themes-cache] Failed to fetch:", error);
		// Return empty array - components should handle gracefully
		return [];
	}
}

/**
 * Add a theme to the cache (called after inscription)
 */
export async function addThemeToCache(
	txid: string,
	theme: ThemeToken,
	owner?: string
): Promise<boolean> {
	try {
		const response = await fetch("/api/themes/cache", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ txid, theme, owner }),
		});

		return response.ok;
	} catch (error) {
		console.error("[themes-cache] Failed to add theme:", error);
		return false;
	}
}


