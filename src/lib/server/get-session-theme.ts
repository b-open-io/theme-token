/**
 * Server-side theme fetching utilities
 *
 * Used by the root layout to fetch theme data for SSR injection.
 */

import { fetchThemeByOrigin, type ThemeToken } from "@theme-token/sdk";
import type { CachedTheme } from "@/lib/themes-cache";
import { DEFAULT_THEME_ORIGIN, fetchDefaultTheme } from "@/lib/default-theme";

/** Cookie name for theme session */
export const THEME_SESSION_COOKIE = "theme-session";

// Production URL constant - no env var needed
const BASE_URL = process.env.NODE_ENV === "production"
	? "https://themetoken.dev"
	: "http://localhost:3033";
const CACHE_API_URL = `${BASE_URL}/api/themes/cache`;

interface CacheResponse {
	themes: CachedTheme[];
	cached: boolean;
	lastSynced: number;
}

/**
 * Fetch cached themes server-side
 *
 * Uses absolute URL since this runs on the server.
 */
export async function fetchCachedThemesServer(): Promise<CachedTheme[]> {
	try {
		const response = await fetch(CACHE_API_URL, {
			next: { revalidate: 60 }, // ISR: revalidate every 60s
		});

		if (!response.ok) {
			console.error("[server] Cache API error:", response.status);
			return [];
		}

		const data: CacheResponse = await response.json();
		return data.themes;
	} catch (error) {
		console.error("[server] Failed to fetch cached themes:", error);
		return [];
	}
}

/**
 * Get a random theme from the cache
 *
 * If cache is empty, fetches the default theme from chain and caches it.
 */
export async function getRandomCachedTheme(): Promise<CachedTheme | null> {
	const themes = await fetchCachedThemesServer();

	if (themes.length === 0) {
		// Cache is empty - fetch default theme from chain and cache it
		const defaultTheme = await fetchDefaultTheme();
		if (defaultTheme) {
			// Add to cache for future requests
			await addThemeToCache(DEFAULT_THEME_ORIGIN, defaultTheme);
			return {
				origin: DEFAULT_THEME_ORIGIN,
				theme: defaultTheme,
				inscribedAt: Date.now(),
			};
		}
		return null;
	}

	const randomIndex = Math.floor(Math.random() * themes.length);
	return themes[randomIndex];
}

/**
 * Add a theme to the server-side cache
 */
async function addThemeToCache(origin: string, theme: ThemeToken): Promise<void> {
	try {
		await fetch(CACHE_API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ origin, theme }),
		});
	} catch (error) {
		console.error("[server] Failed to add theme to cache:", error);
	}
}

/**
 * Fetch a specific theme by origin
 *
 * First checks cache, then falls back to direct fetch from chain.
 * Caches the result if fetched from chain.
 */
export async function getThemeByOrigin(origin: string): Promise<ThemeToken | null> {
	// Try cache first
	const cachedThemes = await fetchCachedThemesServer();
	const cached = cachedThemes.find((t) => t.origin === origin);
	if (cached) {
		return cached.theme;
	}

	// Fall back to direct fetch from chain
	const published = await fetchThemeByOrigin(origin);
	if (published?.theme) {
		// Cache it for future requests
		await addThemeToCache(origin, published.theme);
		return published.theme;
	}

	return null;
}

/**
 * Session theme data stored in cookie
 */
export interface ThemeSession {
	/** Theme origin ID (e.g., "abc123_0") */
	origin: string;
	/** When the session was created */
	assignedAt: number;
}

/**
 * Parse theme session from cookie value
 */
export function parseThemeSession(cookieValue: string | undefined): ThemeSession | null {
	if (!cookieValue) return null;

	try {
		const parsed = JSON.parse(cookieValue);
		if (typeof parsed.origin === "string" && typeof parsed.assignedAt === "number") {
			return parsed as ThemeSession;
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * Create a theme session value for cookie
 */
export function createThemeSession(origin: string): ThemeSession {
	return {
		origin,
		assignedAt: Date.now(),
	};
}
