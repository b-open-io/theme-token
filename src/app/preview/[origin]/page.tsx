import { type ThemeToken, validateThemeToken, getOrdfsUrl } from "@theme-token/sdk";
import { kv } from "@vercel/kv";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { PreviewClient } from "./preview-client";
import type { CachedTheme } from "@/app/api/themes/cache/route";

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
    const searchRes = await fetch("https://ordinals.gorillapool.io/api/inscriptions/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ map: { type: "theme" } }),
      next: { revalidate: 300 }, // Check every 5 minutes
    });
    if (searchRes.ok) {
      const results = await searchRes.json();
      isOnChain = Array.isArray(results) && results.some(
        (item: { origin?: { outpoint?: string } }) => item.origin?.outpoint === origin
      );
    }
  } catch {
    // Ignore chain check errors
  }

  // If found in cache, return with appropriate source
  if (cachedTheme) {
    return {
      theme: cachedTheme.theme,
      source: isOnChain ? "chain" : "cache",
      owner: cachedTheme.owner,
    };
  }

  // Fall back to ORDFS (direct inscription fetch)
  try {
    const response = await fetch(getOrdfsUrl(origin), {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    const result = validateThemeToken(json);

    if (!result.valid) {
      return null;
    }

    return {
      theme: result.theme,
      source: isOnChain ? "chain" : "ordfs",
    };
  } catch {
    return null;
  }
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
  const imageUrl = `/og/${origin}.png`;

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
