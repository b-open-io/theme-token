import { kv } from "@vercel/kv";
import { validateThemeToken, type ThemeToken } from "@theme-token/sdk";
import { NextResponse } from "next/server";

const THEMES_CACHE_KEY = "themes:published";
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour TTL, refreshed on access

export interface CachedTheme {
	origin: string;
	theme: ThemeToken;
	inscribedAt: number;
	owner?: string;
}

interface ThemesCache {
	themes: CachedTheme[];
	lastSynced: number;
}

// GET - Fetch cached themes (with fallback to live API)
export async function GET() {
	try {
		const cache: ThemesCache | null = await kv.get(THEMES_CACHE_KEY);

		// If cache exists and is fresh (< 5 min old), return it
		if (cache && Date.now() - cache.lastSynced < 5 * 60 * 1000) {
			return NextResponse.json({
				themes: cache.themes,
				cached: true,
				lastSynced: cache.lastSynced,
			});
		}

		// Fetch fresh from GorillaPool
		const freshThemes = await fetchFromChain();

		// Merge with any themes in cache that aren't on-chain yet (recently inscribed)
		const chainOrigins = new Set(freshThemes.map((t) => t.origin));
		const recentlyInscribed = cache?.themes.filter(
			(t) => !chainOrigins.has(t.origin) && Date.now() - t.inscribedAt < 60 * 60 * 1000
		) || [];

		const mergedThemes = [...recentlyInscribed, ...freshThemes];

		// Update cache
		const newCache: ThemesCache = {
			themes: mergedThemes,
			lastSynced: Date.now(),
		};
		await kv.set(THEMES_CACHE_KEY, newCache, { ex: CACHE_TTL_SECONDS });

		return NextResponse.json({
			themes: mergedThemes,
			cached: false,
			lastSynced: newCache.lastSynced,
		});
	} catch (error) {
		console.error("[Themes Cache] GET error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch themes" },
			{ status: 500 }
		);
	}
}

// POST - Add a newly inscribed theme to cache
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { txid, theme, owner } = body;

		if (!txid || !theme) {
			return NextResponse.json(
				{ error: "Missing txid or theme" },
				{ status: 400 }
			);
		}

		// Validate the theme
		const result = validateThemeToken(theme);
		if (!result.valid) {
			return NextResponse.json(
				{ error: "Invalid theme format" },
				{ status: 400 }
			);
		}

		const origin = `${txid}_0`;
		const newTheme: CachedTheme = {
			origin,
			theme: result.theme,
			inscribedAt: Date.now(),
			owner,
		};

		// Get existing cache
		const cache: ThemesCache | null = await kv.get(THEMES_CACHE_KEY);
		const existingThemes = cache?.themes || [];

		// Check if already exists
		if (existingThemes.some((t) => t.origin === origin)) {
			return NextResponse.json({ success: true, origin, alreadyExists: true });
		}

		// Add new theme at the beginning (most recent first)
		const updatedThemes = [newTheme, ...existingThemes];

		const newCache: ThemesCache = {
			themes: updatedThemes,
			lastSynced: cache?.lastSynced || Date.now(),
		};
		await kv.set(THEMES_CACHE_KEY, newCache, { ex: CACHE_TTL_SECONDS });

		return NextResponse.json({ success: true, origin });
	} catch (error) {
		console.error("[Themes Cache] POST error:", error);
		return NextResponse.json(
			{ error: "Failed to add theme to cache" },
			{ status: 500 }
		);
	}
}

// Fetch themes from GorillaPool API
async function fetchFromChain(): Promise<CachedTheme[]> {
	const ORDINALS_API = "https://ordinals.gorillapool.io/api";

	const response = await fetch(
		`${ORDINALS_API}/inscriptions?limit=100&type=application/json`,
		{ next: { revalidate: 60 } }
	);

	if (!response.ok) {
		throw new Error(`GorillaPool API error: ${response.status}`);
	}

	const results = await response.json();
	const themes: CachedTheme[] = [];

	for (const item of results) {
		try {
			const mapData = item.origin?.data?.map;
			if (mapData?.app !== "ThemeToken") continue;

			const content = item.origin?.data?.insc?.file?.json;
			if (!content) continue;

			const result = validateThemeToken(content);
			if (!result.valid) continue;

			themes.push({
				origin: item.origin?.outpoint || item.outpoint,
				theme: result.theme,
				inscribedAt: item.height ? item.height * 1000 : Date.now(), // Approximate
				owner: item.owner,
			});
		} catch {
			// Skip invalid
		}
	}

	return themes;
}

