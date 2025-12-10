"use client";

import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { CachedTheme } from "@/lib/themes-cache";

interface ThemesResponse {
  themes: CachedTheme[];
}

function ThemeCard({
  theme,
}: {
  theme: CachedTheme;
}) {
  const randomX = useMemo(() => Math.random() * 80 - 40, []);
  const randomY = useMemo(() => Math.random() * 80 - 40, []);
  const duration = useMemo(() => 15 + Math.random() * 20, []);
  const delay = useMemo(() => Math.random() * 2, []);
  const scale = useMemo(() => 0.6 + Math.random() * 0.6, []);

  const colors = theme.theme.styles.dark;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.6, 0.6, 0],
        scale: [scale * 0.8, scale, scale * 0.8],
        x: [`${randomX}%`, `${randomX + (Math.random() * 20 - 10)}%`],
        y: [`${randomY}%`, `${randomY + (Math.random() * 20 - 10)}%`],
        rotate: [0, Math.random() * 15 - 7.5, 0],
      }}
      transition={{
        duration: duration,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "reverse",
        ease: "easeInOut",
        delay: delay,
      }}
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ zIndex: 0 }}
    >
      <div
        className="relative overflow-hidden rounded-xl border border-white/10 shadow-2xl backdrop-blur-sm"
        style={{ backgroundColor: colors.card || "#18181b", width: "140px" }}
      >
        <div className="flex items-center gap-1 border-b border-white/5 bg-white/5 px-2 py-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-red-500/50" />
          <div className="h-1.5 w-1.5 rounded-full bg-yellow-500/50" />
          <div className="h-1.5 w-1.5 rounded-full bg-green-500/50" />
        </div>

        <div className="flex h-16 w-full flex-col gap-1 p-2">
          <div className="flex flex-1 gap-1">
            <div
              className="flex-[2] rounded"
              style={{ background: colors.primary }}
            />
            <div
              className="flex-1 rounded"
              style={{ background: colors.secondary }}
            />
          </div>
          <div className="flex flex-1 gap-1">
            <div
              className="flex-1 rounded"
              style={{ background: colors.accent }}
            />
            <div
              className="flex-[2] rounded"
              style={{ background: colors.muted }}
            />
          </div>
        </div>

        <div className="px-2 pb-2">
          <div className="h-1.5 w-2/3 rounded-full bg-white/10" />
        </div>
      </div>
    </motion.div>
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

  const backgroundThemes = useMemo(() => {
    if (!data?.themes) return [];
    const shuffled = [...data.themes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 16);
  }, [data]);

  return (
    <main className="relative flex min-h-[80vh] w-full flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-muted/50 via-background to-background" />

      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence>
          {!isLoading &&
            backgroundThemes.map((theme) => (
              <ThemeCard key={theme.origin} theme={theme} />
            ))}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 mx-4 max-w-lg rounded-2xl border border-border bg-card/80 p-8 text-center shadow-2xl backdrop-blur-xl md:p-12"
      >
        <div className="absolute left-1/2 top-1/2 -z-10 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[60px]" />

        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        >
          <h1 className="bg-gradient-to-b from-foreground to-foreground/40 bg-clip-text text-8xl font-black tracking-tighter text-transparent md:text-9xl">
            404
          </h1>
        </motion.div>

        <h2 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
          Theme Not Found
        </h2>

        <p className="mt-4 text-muted-foreground">
          This theme hasn&apos;t been indexed yet or the origin is invalid. The
          marketplace is full of other stunning designs to explore.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full gap-2 sm:w-auto">
            <Link href="/themes">
              <Search className="h-4 w-4" />
              Browse Themes
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full gap-2 sm:w-auto"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back Home
            </Link>
          </Button>
        </div>

        {isLoading && (
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading themes...
          </div>
        )}
      </motion.div>
    </main>
  );
}
