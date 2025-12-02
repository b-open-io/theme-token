"use client";

import { useEffect, useState, useRef } from "react";
import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeDemo } from "@/components/theme-demo";
import { validateThemeToken, type ThemeToken, type ThemeStyleProps } from "@/lib/schema";
import { useTheme } from "@/components/theme-provider";
import {
  ArrowLeft,
  Sun,
  Moon,
  Loader2,
  AlertCircle,
  Palette,
  Type,
  Layers,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface Props {
  params: Promise<{ origin: string }>;
}

// Apply theme styles to a container element
function applyStylesToElement(element: HTMLElement, styles: ThemeStyleProps) {
  Object.entries(styles).forEach(([key, value]) => {
    if (typeof value === "string") {
      element.style.setProperty(`--${key}`, value);
    }
  });
}

export default function PreviewPage({ params }: Props) {
  const { origin } = use(params);
  const { mode: globalMode } = useTheme();
  const [theme, setTheme] = useState<ThemeToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync preview mode with global mode initially
  useEffect(() => {
    setPreviewMode(globalMode);
  }, []);

  // Fetch theme data
  useEffect(() => {
    async function fetchTheme() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`https://ordfs.network/${origin}`);
        if (!response.ok) {
          throw new Error("Theme not found");
        }

        const json = await response.json();
        const result = validateThemeToken(json);

        if (!result.valid) {
          throw new Error("Invalid theme format");
        }

        setTheme(result.theme);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load theme");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTheme();
  }, [origin]);

  // Apply theme styles to the preview container
  useEffect(() => {
    if (!theme || !containerRef.current) return;
    applyStylesToElement(containerRef.current, theme.styles[previewMode]);
  }, [theme, previewMode]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading theme...</span>
        </div>
      </div>
    );
  }

  if (error || !theme) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h1 className="mb-2 text-xl font-semibold">Theme Not Found</h1>
          <p className="mb-4 text-muted-foreground">{error || "Unable to load theme"}</p>
          <Button asChild variant="outline">
            <Link href="/market/browse">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Market
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/market/browse">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{theme.name}</h1>
              {theme.author && (
                <p className="text-sm text-muted-foreground">by {theme.author}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <div className="flex items-center rounded-lg border p-1">
              <button
                onClick={() => setPreviewMode("light")}
                className={`rounded-md p-2 transition-colors ${
                  previewMode === "light"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPreviewMode("dark")}
                className={`rounded-md p-2 transition-colors ${
                  previewMode === "dark"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Moon className="h-4 w-4" />
              </button>
            </div>

            <Badge variant="outline" className="font-mono text-xs">
              {origin.slice(0, 8)}...
            </Badge>

            <Button asChild size="sm" variant="outline">
              <a
                href={`https://1satordinals.com/outpoint/${origin}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Chain
              </a>
            </Button>

            <Button asChild size="sm">
              <Link href={`/studio?remix=${origin}`}>
                <Sparkles className="mr-2 h-4 w-4" />
                Remix
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Preview Container - Scoped Theme */}
      <div
        ref={containerRef}
        className={`min-h-screen ${previewMode === "dark" ? "dark" : ""}`}
        style={{
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-12">
          {/* Theme Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 rounded-2xl p-8"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              borderWidth: "1px",
            }}
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="mb-2 text-3xl font-bold">{theme.name}</h2>
                {theme.author && (
                  <p style={{ color: "var(--muted-foreground)" }}>
                    Created by {theme.author}
                  </p>
                )}
              </div>

              {/* Quick Color Preview */}
              <div className="flex gap-2">
                {["primary", "secondary", "accent", "destructive", "muted"].map(
                  (color) => (
                    <div
                      key={color}
                      className="h-12 w-12 rounded-lg shadow-sm"
                      style={{
                        backgroundColor: `var(--${color})`,
                        borderColor: "var(--border)",
                        borderWidth: "1px",
                      }}
                      title={color}
                    />
                  )
                )}
              </div>
            </div>
          </motion.div>

          {/* Demo Tabs */}
          <Tabs defaultValue="components" className="w-full">
            <TabsList
              className="mb-8"
              style={{
                backgroundColor: "var(--muted)",
              }}
            >
              <TabsTrigger value="components">
                <Layers className="mr-2 h-4 w-4" />
                Components
              </TabsTrigger>
              <TabsTrigger value="colors">
                <Palette className="mr-2 h-4 w-4" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="typography">
                <Type className="mr-2 h-4 w-4" />
                Typography
              </TabsTrigger>
            </TabsList>

            <TabsContent value="components">
              <ThemeDemo />
            </TabsContent>

            <TabsContent value="colors">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Object.entries(theme.styles[previewMode]).map(([key, value]) => {
                  if (typeof value !== "string") return null;
                  // Skip non-color values
                  if (key.includes("radius") || key.includes("font") || key.includes("shadow") || key.includes("spacing") || key.includes("tracking")) return null;

                  return (
                    <div
                      key={key}
                      className="rounded-lg p-4"
                      style={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderWidth: "1px",
                      }}
                    >
                      <div
                        className="mb-3 h-16 rounded-md shadow-inner"
                        style={{ backgroundColor: value }}
                      />
                      <p className="font-medium">{key}</p>
                      <p
                        className="font-mono text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="typography">
              <div
                className="space-y-8 rounded-xl p-8"
                style={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderWidth: "1px",
                }}
              >
                <div>
                  <p
                    className="mb-2 text-sm font-medium"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Heading 1
                  </p>
                  <h1 className="text-5xl font-extrabold tracking-tight">
                    The quick brown fox jumps
                  </h1>
                </div>
                <div>
                  <p
                    className="mb-2 text-sm font-medium"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Heading 2
                  </p>
                  <h2 className="text-3xl font-semibold tracking-tight">
                    Over the lazy dog
                  </h2>
                </div>
                <div>
                  <p
                    className="mb-2 text-sm font-medium"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Heading 3
                  </p>
                  <h3 className="text-2xl font-semibold tracking-tight">
                    Pack my box with five dozen liquor jugs
                  </h3>
                </div>
                <div>
                  <p
                    className="mb-2 text-sm font-medium"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Body Text
                  </p>
                  <p className="max-w-2xl text-base leading-7">
                    Theme tokens bring the benefits of blockchain to design systems.
                    Create beautiful, consistent experiences across your applications
                    with tokenized themes that you truly own. Trade them on any
                    ordinal marketplace, use them across any compatible app.
                  </p>
                </div>
                <div>
                  <p
                    className="mb-2 text-sm font-medium"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Muted Text
                  </p>
                  <p
                    className="max-w-2xl text-sm"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Secondary text provides additional context without drawing
                    attention away from the primary content. Use it for descriptions,
                    timestamps, and helper text.
                  </p>
                </div>
                <div>
                  <p
                    className="mb-2 text-sm font-medium"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Code
                  </p>
                  <code
                    className="rounded px-2 py-1 font-mono text-sm"
                    style={{ backgroundColor: "var(--muted)" }}
                  >
                    const theme = await fetchTheme(origin);
                  </code>
                </div>

                {/* Font Info */}
                {(theme.styles[previewMode]["font-sans"] ||
                  theme.styles[previewMode]["font-serif"] ||
                  theme.styles[previewMode]["font-mono"]) && (
                  <div
                    className="rounded-lg p-4"
                    style={{
                      backgroundColor: "var(--muted)",
                    }}
                  >
                    <p className="mb-2 font-medium">Font Families</p>
                    <div className="space-y-1 font-mono text-sm">
                      {theme.styles[previewMode]["font-sans"] && (
                        <p>Sans: {theme.styles[previewMode]["font-sans"]}</p>
                      )}
                      {theme.styles[previewMode]["font-serif"] && (
                        <p>Serif: {theme.styles[previewMode]["font-serif"]}</p>
                      )}
                      {theme.styles[previewMode]["font-mono"] && (
                        <p>Mono: {theme.styles[previewMode]["font-mono"]}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
