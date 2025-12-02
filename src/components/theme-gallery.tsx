"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "@/components/theme-provider";
import { type ThemeToken, fetchPublishedThemes, type PublishedTheme } from "@theme-token/sdk";
import { ArrowRight, Sparkles, Loader2, Eye } from "lucide-react";

// Custom event for theme remixing (works on same page)
export const REMIX_THEME_EVENT = "remix-theme";

// LocalStorage key for cross-page theme loading
const REMIX_STORAGE_KEY = "theme-token-remix";

export function dispatchRemixTheme(theme: ThemeToken) {
  window.dispatchEvent(new CustomEvent(REMIX_THEME_EVENT, { detail: theme }));
}

export function storeRemixTheme(theme: ThemeToken) {
  localStorage.setItem(REMIX_STORAGE_KEY, JSON.stringify(theme));
}

export function getAndClearRemixTheme(): ThemeToken | null {
  const stored = localStorage.getItem(REMIX_STORAGE_KEY);
  if (stored) {
    localStorage.removeItem(REMIX_STORAGE_KEY);
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

function ThemeCard({
  theme,
  origin,
  onRemix,
}: {
  theme: ThemeToken;
  origin: string;
  onRemix?: () => void;
}) {
  const { mode } = useTheme();
  const colors = [
    theme.styles[mode].primary,
    theme.styles[mode].secondary,
    theme.styles[mode].accent,
    theme.styles[mode].background,
  ];

  return (
    <div className="group flex-shrink-0 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-md">
      {/* Color stripes - clickable to preview */}
      <Link href={`/preview/${origin}`}>
        <div className="relative mb-2 flex h-12 w-32 cursor-pointer overflow-hidden rounded-md">
          {colors.map((color, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: color }} />
          ))}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/30">
            <Eye className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </div>
      </Link>
      {/* Theme name and remix button */}
      <div className="flex items-center justify-between gap-2">
        <Link href={`/preview/${origin}`} className="text-sm font-medium hover:text-primary">
          {theme.name}
        </Link>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemix?.();
          }}
          className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100 hover:bg-primary/20"
        >
          <Sparkles className="h-3 w-3" />
          Remix
        </button>
      </div>
    </div>
  );
}

export function ThemeGallery() {
  const router = useRouter();
  const [publishedThemes, setPublishedThemes] = useState<PublishedTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPublishedThemes()
      .then(setPublishedThemes)
      .finally(() => setIsLoading(false));
  }, []);

  const handleRemix = (theme: ThemeToken) => {
    // Store theme for the studio page to pick up
    storeRemixTheme(theme);
    // Navigate to studio
    router.push("/studio");
  };

  return (
    <section className="border-y border-border bg-muted/30 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between px-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Published Themes
          </h3>
          <Link
            href="/market"
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Browse Market
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Horizontal scroll container */}
        <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading themes...</span>
            </div>
          ) : publishedThemes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No themes published yet. Be the first!
            </p>
          ) : (
            publishedThemes.map((published) => (
              <motion.div
                key={published.origin}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ThemeCard
                  theme={published.theme}
                  origin={published.origin}
                  onRemix={() => handleRemix(published.theme)}
                />
              </motion.div>
            ))
          )}

          {/* "More" card linking to market */}
          <Link
            href="/market"
            className="flex flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-card/50 px-8 py-6 transition-all hover:border-primary/50 hover:bg-muted"
          >
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                View all
              </p>
              <ArrowRight className="mx-auto mt-1 h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
