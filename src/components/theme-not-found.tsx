"use client";

import { useQuery } from "@tanstack/react-query";
import { motion, useAnimation } from "framer-motion";
import { ArrowLeft, Compass } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/components/theme-provider";
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
  mode,
}: {
  theme: CachedTheme;
  delay: number;
  speed: number;
  mode: "light" | "dark";
}) {
  const colors = useMemo(() => {
    const styles = theme.theme.styles[mode];
    return [
      styles.primary,
      styles.secondary,
      styles.accent,
      styles.destructive,
      styles.muted,
      styles.card,
    ];
  }, [theme, mode]);

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
          textShadow: "4px 0 var(--destructive)",
          transition: { duration: 0.05 },
        });
        await controls.start({
          x: 8,
          opacity: 0.9,
          textShadow: "-4px 0 var(--primary)",
          transition: { duration: 0.05 },
        });
        await controls.start({
          x: -3,
          textShadow: "2px 0 var(--accent)",
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
      className="select-none font-mono text-[18vw] font-black leading-none tracking-tighter md:text-[12vw]"
      style={{ color: "var(--foreground)" }}
    >
      404
    </motion.h1>
  );
}

export function ThemeNotFound() {
  const { mode } = useTheme();
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
      setColumnCount(Math.floor(width / (width < 768 ? 32 : 44)));
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

  // Memoize random values so they don't change on mode switch
  const columnData = useMemo(() => {
    return columns.map((i) => ({
      delay1: Math.random() * 3,
      speed1: 4 + Math.random() * 4,
      delay2: Math.random() * 3 + 1.5,
      speed2: 6 + Math.random() * 5,
    }));
  }, [columns]);

  return (
    <div
      className="relative flex min-h-[70vh] w-full flex-1 flex-col items-center justify-center overflow-hidden py-8"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Matrix rain of theme colors */}
      {themes.length > 0 && columnCount > 0 && (
        <div className="absolute inset-0 flex gap-1 px-1 opacity-50">
          {columns.map((i) => {
            const theme = themes[i % themes.length];
            const theme2 =
              themes[(i + Math.floor(themes.length / 2)) % themes.length];
            const data = columnData[i];
            return (
              <div key={i} className="relative h-full flex-1 overflow-hidden">
                <ColorColumn
                  theme={theme}
                  delay={data.delay1}
                  speed={data.speed1}
                  mode={mode}
                />
                <div className="absolute inset-0">
                  <ColorColumn
                    theme={theme2}
                    delay={data.delay2}
                    speed={data.speed2}
                    mode={mode}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Radial vignette - theme aware */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, transparent 20%, color-mix(in oklch, var(--background) 70%, transparent) 50%, var(--background) 80%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4">
        {/* Swatchy mascot */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <Image
            src="/swatchy-not-found.jpeg"
            alt="Swatchy in the mempool"
            width={400}
            height={280}
            className="rounded-2xl border-4 shadow-2xl"
            style={{ borderColor: "var(--border)" }}
            priority
          />
        </motion.div>

        <GlitchText />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 max-w-md rounded-xl border p-6 text-center backdrop-blur-xl md:p-8"
          style={{
            backgroundColor: "color-mix(in oklch, var(--card) 80%, transparent)",
            borderColor: "var(--border)",
          }}
        >
          <h2
            className="mb-2 font-mono text-lg font-bold uppercase tracking-widest"
            style={{ color: "var(--foreground)" }}
          >
            Page Not Found
          </h2>
          <p className="mb-6 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Looks like this page got flushed. But don&apos;t worry, there are
            plenty of beautiful themes to explore!
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
            className="mt-4 text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            Loading theme colors...
          </motion.p>
        )}
      </div>
    </div>
  );
}
