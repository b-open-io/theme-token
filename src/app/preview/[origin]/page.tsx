import { type ThemeToken, validateThemeToken } from "@theme-token/sdk";
import { kv } from "@vercel/kv";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CachedTheme } from "@/app/api/themes/cache/route";
import { THEME_REGISTRY_TYPES } from "@/lib/asset-metadata";
import { getOrdfsUrl } from "@/lib/ordfs";
import { PreviewClient } from "./preview-client";

interface Props {
	params: Promise<{ origin: string }>;
	searchParams: Promise<{ tab?: string }>;
}

const THEMES_CACHE_KEY = "themes:published";

export type ThemeSource = "chain" | "cache" | "ordfs";

interface GetThemeResult {
	theme: ThemeToken;
	source: ThemeSource;
	owner?: string;
}

// Fetch theme data - check KV cache first, then ORDFS
async function getTheme(origin: string): Promise<GetThemeResult | null> {
	// First, try the KV cache (for recently inscribed themes not yet indexed)
	let cachedTheme: CachedTheme | undefined;
	try {
		if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
			const cache = await kv.get<{ themes: CachedTheme[] }>(THEMES_CACHE_KEY);
			cachedTheme = cache?.themes?.find((t) => t.origin === origin);
		}
	} catch (e) {
		console.warn("[Preview] KV cache check failed:", e);
	}

	// Check if theme is indexed on-chain by GorillaPool
	let isOnChain = false;
	try {
		const searches = await Promise.allSettled(
			THEME_REGISTRY_TYPES.map(async (type) => {
				const response = await fetch(
					"https://ordinals.gorillapool.io/api/inscriptions/search",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ map: { type } }),
						next: { revalidate: 300 },
					},
				);
				if (!response.ok) return [];
				const results: unknown = await response.json();
				return Array.isArray(results) ? results : [];
			}),
		);
		for (const search of searches) {
			if (search.status !== "fulfilled") continue;
			const results = search.value;
			isOnChain =
				Array.isArray(results) &&
				results.some(
					(item: { origin?: { outpoint?: string } }) =>
						item.origin?.outpoint === origin,
				);
			if (isOnChain) break;
		}
	} catch {
		// Ignore chain check errors
	}

	// Ask current 1sat-stack whether the package is already captured. Do not
	// cache a miss: a relay that returned 202 may make the directory available
	// moments later. This also lets cached themes graduate from "Pending
	// Indexing" to "Inscribed" before GorillaPool search catches up.
	let ordfsTheme: ThemeToken | null = null;
	try {
		const response = await fetch(getOrdfsUrl(`${origin}/theme.json`), {
			cache: "no-store",
		});
		if (response.ok) {
			const result = validateThemeToken(await response.json());
			if (result.valid) {
				ordfsTheme = result.theme;
			}
		}
	} catch {
		// The optimistic KV copy still makes a freshly inscribed theme usable.
	}

	if (cachedTheme) {
		return {
			theme: cachedTheme.theme,
			source: isOnChain ? "chain" : ordfsTheme ? "ordfs" : "cache",
			owner: cachedTheme.owner,
		};
	}

	return ordfsTheme
		? { theme: ordfsTheme, source: isOnChain ? "chain" : "ordfs" }
		: null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { origin } = await params;
	const result = await getTheme(origin);

	if (!result) {
		return {
			title: "Theme Not Found | Theme Token",
		};
	}

	const title = `${result.theme.name} | Theme Token`;
	const description = `Preview ${result.theme.name} by ${result.theme.author || "Unknown"}. Install this theme directly with the ShadCN CLI.`;
	// Versioned to invalidate social crawlers that cached the old route before
	// `.png` parameters were normalized to their underlying ordinal origin.
	const imageUrl = `/og/${origin}.png?v=2`;

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			images: [imageUrl],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [imageUrl],
		},
	};
}

export default async function PreviewPage({ params, searchParams }: Props) {
	const { origin } = await params;
	const { tab } = await searchParams;

	const result = await getTheme(origin);

	if (!result) {
		notFound();
	}

	return (
		<PreviewClient
			theme={result.theme}
			origin={origin}
			initialTab={tab}
			source={result.source}
			owner={result.owner}
		/>
	);
}
