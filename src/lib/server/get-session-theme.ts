/**
 * Server-side theme fetching utilities
 *
 * Used by the root layout to fetch theme data for SSR injection.
 */

import { fetchThemeByOrigin, type ThemeToken } from "@theme-token/sdk";
import type { CachedTheme } from "@/lib/themes-cache";

/** Cookie name for theme session */
export const THEME_SESSION_COOKIE = "theme-session";

const CACHE_API_URL = process.env.VERCEL_URL
	? `https://${process.env.VERCEL_URL}/api/themes/cache`
	: process.env.NEXT_PUBLIC_BASE_URL
		? `${process.env.NEXT_PUBLIC_BASE_URL}/api/themes/cache`
		: "http://localhost:3033/api/themes/cache";

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
 * Returns null if cache is empty.
 */
export async function getRandomCachedTheme(): Promise<CachedTheme | null> {
	const themes = await fetchCachedThemesServer();
	if (themes.length === 0) return null;

	const randomIndex = Math.floor(Math.random() * themes.length);
	return themes[randomIndex];
}

/**
 * Fetch a specific theme by origin
 *
 * First checks cache, then falls back to direct fetch.
 */
export async function getThemeByOrigin(origin: string): Promise<ThemeToken | null> {
	// Try cache first
	const cachedThemes = await fetchCachedThemesServer();
	const cached = cachedThemes.find((t) => t.origin === origin);
	if (cached) {
		return cached.theme;
	}

	// Fall back to direct fetch
	const published = await fetchThemeByOrigin(origin);
	return published?.theme ?? null;
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
