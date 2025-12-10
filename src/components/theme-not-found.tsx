"use client";

import { useQuery } from "@tanstack/react-query";
import { motion, useAnimation } from "framer-motion";
import { ArrowLeft, Compass } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CachedTheme } from "@/lib/themes-cache";

interface ThemesResponse {
  themes: CachedTheme[];
}

// Falling color column - each column shows one theme's palette
function ColorColumn({
  theme,
  delay,
  speed,
}: {
  theme: CachedTheme;
  delay: number;
  speed: number;
}) {
  const colors = useMemo(
    () => [
      theme.theme.styles.dark.primary,
      theme.theme.styles.dark.secondary,
      theme.theme.styles.dark.accent,
      theme.theme.styles.dark.destructive,
      theme.theme.styles.dark.muted,
      theme.theme.styles.dark.card,
    ],
    [theme]
  );

  // Create a long trail by repeating colors
  const tiles = useMemo(
    () => [...colors, ...colors, ...colors, ...colors],
    [colors]
  );

  return (
    <motion.div
      className="flex flex-col gap-1"
      initial={{ y: "-100%" }}
      animate={{ y: "100%" }}
      transition={{
        duration: speed,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear",
        delay: delay,
      }}
    >
      {tiles.map((color, i) => (
        <div
          key={i}
          className="aspect-square w-full rounded-sm"
          style={{
            backgroundColor: color,
            opacity: 1 - i / tiles.length,
          }}
        />
      ))}
    </motion.div>
  );
}

// Glitchy 404 text
function GlitchText() {
  const controls = useAnimation();

  useEffect(() => {
    const glitchSequence = async () => {
      while (true) {
        await controls.start({
          x: 0,
          opacity: 1,
          textShadow: "0 0 0 transparent",
        });
        await new Promise((r) =>
          setTimeout(r, Math.random() * 4000 + 2000)
        );

        // Glitch burst
        await controls.start({
          x: -8,
          opacity: 0.8,
          textShadow: "4px 0 oklch(0.7 0.25 25)",
          transition: { duration: 0.05 },
        });
        await controls.start({
          x: 8,
          opacity: 0.9,
          textShadow: "-4px 0 oklch(0.7 0.2 250)",
          transition: { duration: 0.05 },
        });
        await controls.start({
          x: -3,
          textShadow: "2px 0 oklch(0.8 0.15 150)",
          transition: { duration: 0.03 },
        });
        await controls.start({
          x: 0,
          opacity: 1,
          textShadow: "0 0 0 transparent",
          transition: { duration: 0.05 },
        });
      }
    };
    glitchSequence();
  }, [controls]);

  return (
    <motion.h1
      animate={controls}
      className="select-none text-[20vw] font-black leading-none tracking-tighter text-white mix-blend-difference md:text-[15vw]"
      style={{ fontFamily: "var(--font-mono), monospace" }}
    >
      404
    </motion.h1>
  );
}

export function ThemeNotFound() {
  const { data, isLoading } = useQuery<ThemesResponse>({
    queryKey: ["themes-cache-404"],
    queryFn: async () => {
      const res = await fetch("/api/themes/cache");
      if (!res.ok) throw new Error("Failed to fetch themes");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const [columnCount, setColumnCount] = useState(0);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      // ~40px per column on mobile, ~50px on desktop
      setColumnCount(Math.floor(width / (width < 768 ? 36 : 48)));
    };
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  const themes = data?.themes || [];
  const columns = useMemo(
    () => Array.from({ length: columnCount }, (_, i) => i),
    [columnCount]
  );

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-black">
      {/* Matrix rain of theme colors */}
      {themes.length > 0 && columnCount > 0 && (
        <div className="absolute inset-0 flex gap-1 px-1 opacity-60">
          {columns.map((i) => {
            const theme = themes[i % themes.length];
            const theme2 = themes[(i + Math.floor(themes.length / 2)) % themes.length];
            return (
              <div key={i} className="relative h-full flex-1 overflow-hidden">
                <ColorColumn
                  theme={theme}
                  delay={Math.random() * 3}
                  speed={4 + Math.random() * 4}
                />
                <div className="absolute inset-0">
                  <ColorColumn
                    theme={theme2}
                    delay={Math.random() * 3 + 1.5}
                    speed={6 + Math.random() * 5}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Radial vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent 30%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.95) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4">
        <GlitchText />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 max-w-md rounded-xl border border-white/10 bg-black/80 p-6 text-center backdrop-blur-xl md:p-8"
        >
          <h2
            className="mb-2 text-lg font-bold uppercase tracking-widest text-white"
            style={{ fontFamily: "var(--font-mono), monospace" }}
          >
            Page Not Found
          </h2>
          <p className="mb-6 text-sm text-neutral-400">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. But look at all these beautiful themes you could explore
            instead.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/themes">
                <Compass className="h-4 w-4" />
                Browse Themes
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back Home
              </Link>
            </Button>
          </div>
        </motion.div>

        {isLoading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-xs text-neutral-600"
          >
            Loading theme colors...
          </motion.p>
        )}
      </div>

      {/* Bottom attribution */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-700">
          ThemeToken
        </p>
      </div>
    </div>
  );
}
