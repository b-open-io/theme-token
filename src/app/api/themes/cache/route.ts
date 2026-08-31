import { type ThemeToken, validateThemeToken } from "@theme-token/sdk";
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { THEME_REGISTRY_TYPES } from "@/lib/asset-metadata";
import { getOrdfsUrl } from "@/lib/ordfs";
import { extractTxid } from "@/lib/registry-gateway";

const THEMES_CACHE_KEY = "themes:published";
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 day TTL - KV persists across deploys

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
// Supports pagination via ?cursor=<index>&limit=<number>
export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const forceRefresh = url.searchParams.get("refresh") === "true";
		const cursor = Number.parseInt(url.searchParams.get("cursor") || "0", 10);
		const limit = Math.min(
			Number.parseInt(url.searchParams.get("limit") || "12", 10),
			50,
		);

		// Check if KV is configured
		if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
			console.warn(
				"[Themes Cache] KV not configured, fetching from chain directly",
			);
			const freshThemes = await fetchFromChain();
			const paginated = freshThemes.slice(cursor, cursor + limit);
			return NextResponse.json({
				themes: paginated,
				nextCursor: cursor + limit < freshThemes.length ? cursor + limit : null,
				total: freshThemes.length,
				cached: false,
				lastSynced: Date.now(),
			});
		}

		// Always fetch existing cache for merging (even on force refresh)
		const existingCache: ThemesCache | null = await kv.get(THEMES_CACHE_KEY);

		// If cache exists, is fresh (< 5 min old), and not force refreshing, use it
		if (
			!forceRefresh &&
			existingCache &&
			Date.now() - existingCache.lastSynced < 5 * 60 * 1000
		) {
			const allThemes = existingCache.themes;
			const paginated = allThemes.slice(cursor, cursor + limit);
			return NextResponse.json({
				themes: paginated,
				nextCursor: cursor + limit < allThemes.length ? cursor + limit : null,
				total: allThemes.length,
				cached: true,
				lastSynced: existingCache.lastSynced,
			});
		}

		// Fetch fresh from GorillaPool
		const freshThemes = await fetchFromChain();

		// Merge: Keep ALL cached themes that aren't on-chain yet
		// (they may just not be indexed by GorillaPool, but are valid inscriptions)
		const chainOrigins = new Set(freshThemes.map((t) => t.origin));
		const chainTxids = new Set(
			freshThemes
				.map((t) => extractTxid(t.origin))
				.filter((txid): txid is string => txid !== null),
		);
		const notOnChain =
			existingCache?.themes.filter((t) => {
				const txid = extractTxid(t.origin);
				// Older clients cached the theme file (_0), while chain search returns
				// the package manifest (_1). Once either output from that transaction
				// is indexed, prefer the canonical fresh result over the stale alias.
				return txid ? !chainTxids.has(txid) : !chainOrigins.has(t.origin);
			}) || [];

		const mergedThemes = [...notOnChain, ...freshThemes];

		// Update cache
		const newCache: ThemesCache = {
			themes: mergedThemes,
			lastSynced: Date.now(),
		};
		await kv.set(THEMES_CACHE_KEY, newCache, { ex: CACHE_TTL_SECONDS });

		const paginated = mergedThemes.slice(cursor, cursor + limit);
		return NextResponse.json({
			themes: paginated,
			nextCursor: cursor + limit < mergedThemes.length ? cursor + limit : null,
			total: mergedThemes.length,
			cached: false,
			lastSynced: newCache.lastSynced,
		});
	} catch (error) {
		console.error("[Themes Cache] GET error:", error);
		// On KV failure, try to fetch directly from chain as fallback
		try {
			const freshThemes = await fetchFromChain();
			const url = new URL(request.url);
			const cursor = Number.parseInt(url.searchParams.get("cursor") || "0", 10);
			const limit = Math.min(
				Number.parseInt(url.searchParams.get("limit") || "12", 10),
				50,
			);
			const paginated = freshThemes.slice(cursor, cursor + limit);
			return NextResponse.json({
				themes: paginated,
				nextCursor: cursor + limit < freshThemes.length ? cursor + limit : null,
				total: freshThemes.length,
				cached: false,
				lastSynced: Date.now(),
				kvError: true,
			});
		} catch (chainError) {
			console.error("[Themes Cache] Chain fallback also failed:", chainError);
			return NextResponse.json(
				{ error: "Failed to fetch themes" },
				{ status: 500 },
			);
		}
	}
}

// POST - Add a newly inscribed theme to cache
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { txid, origin: providedOrigin, theme, owner } = body;

		// Accept either origin (full) or txid (legacy, assumes _0)
		const origin = providedOrigin || (txid ? `${txid}_0` : null);

		if (!origin || !theme) {
			return NextResponse.json(
				{ error: "Missing origin/txid or theme" },
				{ status: 400 },
			);
		}

		// Validate the theme
		const result = validateThemeToken(theme);
		if (!result.valid) {
			return NextResponse.json(
				{ error: "Invalid theme format" },
				{ status: 400 },
			);
		}
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
			{ status: 500 },
		);
	}
}

// Fetch current themes plus immutable records published under the older type.
async function fetchFromChain(): Promise<CachedTheme[]> {
	const ORDINALS_API = "https://ordinals.gorillapool.io/api";
	type ChainItem = {
		origin?: { outpoint?: string };
		height?: number;
		owner?: string;
	};

	const searches = await Promise.allSettled(
		THEME_REGISTRY_TYPES.map(async (type) => {
			const response = await fetch(`${ORDINALS_API}/inscriptions/search`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ map: { type } }),
				next: { revalidate: 60 },
			});
			if (!response.ok) {
				throw new Error(`GorillaPool API error: ${response.status}`);
			}
			const results: unknown = await response.json();
			if (!Array.isArray(results)) throw new Error("Invalid API response");
			return results as ChainItem[];
		}),
	);
	const resultSets = searches.flatMap((search) =>
		search.status === "fulfilled" ? [search.value] : [],
	);
	if (resultSets.length === 0) {
		throw new Error("GorillaPool theme searches failed");
	}
	const results = resultSets.flat();

	const seenOrigins = new Set<string>();
	const uniqueItems = results.filter((item: (typeof results)[number]) => {
		const o = item.origin?.outpoint;
		if (!o || seenOrigins.has(o)) return false;
		seenOrigins.add(o);
		return true;
	});

	async function loadTheme(
		item: (typeof results)[number],
	): Promise<CachedTheme | null> {
		try {
			const originOutpoint = item.origin?.outpoint;
			if (!originOutpoint) return null;
			// Themes are ord-fs/json directory packages: resolve theme.json via the
			// directory path (ORDFS resolves the `_N` pointer to the file).
			const contentResponse = await fetch(
				getOrdfsUrl(`${originOutpoint}/theme.json`),
				{ next: { revalidate: 3600 } },
			);
			if (!contentResponse.ok) return null;
			const content = await contentResponse.json();
			// Skip inscriptions without $schema (test/invalid inscriptions)
			if (!content.$schema) return null;
			const result = validateThemeToken(content);
			if (!result.valid) return null;
			return {
				origin: originOutpoint,
				theme: result.theme,
				inscribedAt: item.height ? item.height * 1000 : Date.now(),
				owner: item.owner,
			};
		} catch {
			return null;
		}
	}

	const themes: CachedTheme[] = [];
	const CONCURRENCY = 10;
	for (let i = 0; i < uniqueItems.length; i += CONCURRENCY) {
		const loaded = await Promise.all(
			uniqueItems.slice(i, i + CONCURRENCY).map(loadTheme),
		);
		for (const t of loaded) {
			if (t) themes.push(t);
		}
	}

	return themes;
}
