"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/components/theme-provider";
import { exampleThemes } from "@/lib/schema";
import { ArrowRight } from "lucide-react";

function ThemeCard({
  theme,
  onClick,
}: {
  theme: (typeof exampleThemes)[0];
  onClick?: () => void;
}) {
  const { mode } = useTheme();
  const colors = [
    theme.styles[mode].primary,
    theme.styles[mode].secondary,
    theme.styles[mode].accent,
    theme.styles[mode].background,
  ];

  return (
    <button
      onClick={onClick}
      className="group flex-shrink-0 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-md"
    >
      {/* Color stripes */}
      <div className="mb-2 flex h-12 w-32 overflow-hidden rounded-md">
        {colors.map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>
      {/* Theme name */}
      <p className="text-left text-sm font-medium group-hover:text-primary">
        {theme.name}
      </p>
    </button>
  );
}

export function ThemeGallery() {
  return (
    <section className="border-y border-border bg-muted/30 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between px-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Example Themes
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
          {exampleThemes.map((theme) => (
            <motion.div
              key={theme.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ThemeCard
                theme={theme}
                onClick={() => {
                  // Scroll to studio and potentially load theme
                  document.getElementById("studio")?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            </motion.div>
          ))}

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
