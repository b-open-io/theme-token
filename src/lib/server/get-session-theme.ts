/**
 * Server-side theme fetching utilities
 *
 * Used by the root layout to fetch theme data for SSR injection.
 * Accesses KV cache directly - no HTTP calls.
 */

import { kv } from "@vercel/kv";
import { fetchThemeByOrigin, type ThemeToken, validateThemeToken, getOrdfsUrl } from "@theme-token/sdk";
import type { CachedTheme } from "@/lib/themes-cache";
import { DEFAULT_THEME_ORIGIN, fetchDefaultTheme } from "@/lib/default-theme";

/** Cookie name for theme session */
export const THEME_SESSION_COOKIE = "theme-session";

/** KV cache key for published themes */
const THEMES_CACHE_KEY = "themes:published";
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

interface ThemesCache {
	themes: CachedTheme[];
	lastSynced: number;
}

/**
 * Get cached themes directly from KV (no HTTP)
 */
async function getCachedThemesFromKV(): Promise<CachedTheme[]> {
	try {
		// Check if KV is configured
		if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
			console.warn("[SSR] KV not configured");
			return [];
		}

		const cache: ThemesCache | null = await kv.get(THEMES_CACHE_KEY);
		return cache?.themes ?? [];
	} catch (error) {
		console.error("[SSR] Failed to read KV cache:", error);
		return [];
	}
}

/**
 * Add a theme to KV cache directly
 */
async function addThemeToKVCache(origin: string, theme: ThemeToken, owner?: string): Promise<void> {
	try {
		if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
			return;
		}

		const cache: ThemesCache | null = await kv.get(THEMES_CACHE_KEY);
		const existingThemes = cache?.themes ?? [];

		// Check if already exists
		if (existingThemes.some((t) => t.origin === origin)) {
			return;
		}

		const newTheme: CachedTheme = {
			origin,
			theme,
			inscribedAt: Date.now(),
			owner,
		};

		const updatedCache: ThemesCache = {
			themes: [newTheme, ...existingThemes],
			lastSynced: cache?.lastSynced ?? Date.now(),
		};

		await kv.set(THEMES_CACHE_KEY, updatedCache, { ex: CACHE_TTL_SECONDS });
	} catch (error) {
		console.error("[SSR] Failed to add theme to KV cache:", error);
	}
}

/**
 * Get a random theme from the cache
 *
 * If cache is empty, fetches the default theme from chain and caches it.
 */
export async function getRandomCachedTheme(): Promise<CachedTheme | null> {
	const themes = await getCachedThemesFromKV();

	if (themes.length === 0) {
		// Cache is empty - fetch default theme from chain and cache it
		const defaultTheme = await fetchDefaultTheme();
		if (defaultTheme) {
			await addThemeToKVCache(DEFAULT_THEME_ORIGIN, defaultTheme);
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
 * Fetch a specific theme by origin
 *
 * First checks KV cache directly, then falls back to direct fetch from chain.
 * Caches the result if fetched from chain.
 */
export async function getThemeByOrigin(origin: string): Promise<ThemeToken | null> {
	// Try KV cache first
	const cachedThemes = await getCachedThemesFromKV();
	const cached = cachedThemes.find((t) => t.origin === origin);
	if (cached) {
		return cached.theme;
	}

	// Fall back to direct fetch from chain
	const published = await fetchThemeByOrigin(origin);
	if (published?.theme) {
		// Cache it for future requests
		await addThemeToKVCache(origin, published.theme);
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
