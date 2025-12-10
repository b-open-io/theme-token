import { type ThemeToken, validateThemeToken } from "@theme-token/sdk";
import { kv } from "@vercel/kv";
import { notFound } from "next/navigation";
import { PreviewClient } from "./preview-client";
import type { CachedTheme } from "@/app/api/themes/cache/route";

interface Props {
  params: Promise<{ origin: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const THEMES_CACHE_KEY = "themes:published";

// Fetch theme data - check KV cache first, then ORDFS
async function getTheme(origin: string): Promise<ThemeToken | null> {
  // First, try the KV cache (for recently inscribed themes not yet indexed)
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const cache = await kv.get<{ themes: CachedTheme[] }>(THEMES_CACHE_KEY);
      const cached = cache?.themes?.find((t) => t.origin === origin);
      if (cached) {
        return cached.theme;
      }
    }
  } catch (e) {
    console.warn("[Preview] KV cache check failed:", e);
  }

  // Fall back to ORDFS
  try {
    const response = await fetch(`https://ordfs.network/${origin}`, {
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

    return result.theme;
  } catch {
    return null;
  }
}

export default async function PreviewPage({ params, searchParams }: Props) {
  const { origin } = await params;
  const { tab } = await searchParams;

  const theme = await getTheme(origin);

  if (!theme) {
    notFound();
  }

  return <PreviewClient theme={theme} origin={origin} initialTab={tab} />;
}
