"use client";

import {
  type ThemeStyleProps,
  type ThemeToken,
  validateThemeToken,
} from "@theme-token/sdk";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  AudioWaveform,
  Bot,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Grid3X3,
  LayoutDashboard,
  Loader2,
  Moon,
  Palette,
  Sparkles,
  Sun,
  Type,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiDemo } from "@/components/preview/ai-demo";
import { AudioDemo } from "@/components/preview/audio-demo";
import { ButtonsDemo } from "@/components/preview/buttons-demo";
import { CardsDemo } from "@/components/preview/cards-demo";
import { ColorsDemo } from "@/components/preview/colors-demo";
import { DashboardDemo } from "@/components/preview/dashboard-demo";
import { FormsDemo } from "@/components/preview/forms-demo";
import { TypographyDemo } from "@/components/preview/typography-demo";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isOnChainFont, loadThemeFonts } from "@/lib/font-loader";
import { cn } from "@/lib/utils";
import { UnifiedRemixDialog } from "@/components/market/unified-remix-dialog";

interface Props {
  params: Promise<{ origin: string }>;
}

// Extract Google Font name from CSS font-family value
function extractGoogleFontName(fontFamily: string): string | null {
  // Get the first font in the stack (before the comma)
  const firstFont = fontFamily.split(",")[0].trim();
  // Skip generic families
  const genericFamilies = [
    "sans-serif",
    "serif",
    "monospace",
    "ui-sans-serif",
    "ui-serif",
    "ui-monospace",
    "system-ui",
  ];
  if (genericFamilies.includes(firstFont.toLowerCase())) return null;
  return firstFont;
}

// Load Google Font dynamically
function loadGoogleFont(fontName: string): void {
  const linkId = `google-font-${fontName.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(linkId)) return; // Already loaded

  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

// Apply theme styles to a container element
function applyStylesToElement(element: HTMLElement, styles: ThemeStyleProps) {
  Object.entries(styles).forEach(([key, value]) => {
    if (typeof value === "string") {
      element.style.setProperty(`--${key}`, value);
    }
  });

  // Apply font-family directly to the element for it to take effect
  if (styles["font-sans"]) {
    element.style.fontFamily = styles["font-sans"];
  }
}

// Calculate max radius for circular reveal animation
function getMaxRadius(x: number, y: number): number {
  const right = window.innerWidth - x;
  const bottom = window.innerHeight - y;
  return Math.hypot(Math.max(x, right), Math.max(y, bottom));
}

// Creative animations for view transitions
type AnimationConfig = {
  name: string;
  keyframes: { clipPath: string[] };
  options: { duration: number; easing: string };
};

function getCreativeAnimations(
  x: number,
  y: number,
  maxRadius: number,
): AnimationConfig[] {
  const createStarPolygon = (
    points: number,
    outerRadius: number,
    innerRadius: number = 0,
  ): string => {
    const angleStep = (Math.PI * 2) / (points * 2);
    const path: string[] = [];
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * angleStep - Math.PI / 2;
      path.push(
        `${x + radius * Math.cos(angle)}px ${y + radius * Math.sin(angle)}px`,
      );
    }
    return `polygon(${path.join(", ")})`;
  };

  return [
    {
      name: "Circle",
      keyframes: {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      options: { duration: 500, easing: "ease-in-out" },
    },
    {
      name: "Diamond",
      keyframes: {
        clipPath: [
          `polygon(${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px)`,
          `polygon(${x}px ${y - maxRadius}px, ${x + maxRadius}px ${y}px, ${x}px ${y + maxRadius}px, ${x - maxRadius}px ${y}px)`,
        ],
      },
      options: { duration: 600, easing: "cubic-bezier(0.25, 1, 0.5, 1)" },
    },
    {
      name: "Hexagon",
      keyframes: {
        clipPath: [
          `polygon(${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px)`,
          `polygon(${x + maxRadius}px ${y}px, ${x + maxRadius * 0.5}px ${y + maxRadius * 0.866}px, ${x - maxRadius * 0.5}px ${y + maxRadius * 0.866}px, ${x - maxRadius}px ${y}px, ${x - maxRadius * 0.5}px ${y - maxRadius * 0.866}px, ${x + maxRadius * 0.5}px ${y - maxRadius * 0.866}px)`,
        ],
      },
      options: { duration: 550, easing: "ease-in-out" },
    },
    {
      name: "Starburst",
      keyframes: {
        clipPath: [
          createStarPolygon(8, 0, 0),
          createStarPolygon(8, maxRadius * 1.2, maxRadius * 0.4),
          createStarPolygon(8, maxRadius, maxRadius),
        ],
      },
      options: {
        duration: 700,
        easing: "cubic-bezier(0.68, -0.55, 0.27, 1.55)",
      },
    },
    {
      name: "Ellipse",
      keyframes: {
        clipPath: [
          `ellipse(0px 0px at ${x}px ${y}px)`,
          `ellipse(${maxRadius * 0.5}px ${maxRadius}px at ${x}px ${y}px)`,
          `ellipse(${maxRadius}px ${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      options: { duration: 600, easing: "ease-out" },
    },
    {
      name: "Horizontal",
      keyframes: {
        clipPath: [
          `inset(${y}px 0px ${window.innerHeight - y}px 0px)`,
          `inset(0px 0px 0px 0px)`,
        ],
      },
      options: { duration: 450, easing: "ease-in-out" },
    },
  ];
}

// Start view transition with random creative animation
async function startViewTransition(
  callback: () => void,
  clickX?: number,
  clickY?: number,
): Promise<void> {
  if ("startViewTransition" in document) {
    const x = clickX ?? window.innerWidth / 2;
    const y = clickY ?? window.innerHeight / 2;
    const maxRadius = getMaxRadius(x, y);
    const animations = getCreativeAnimations(x, y, maxRadius);
    const selected = animations[Math.floor(Math.random() * animations.length)];

    const transition = (
      document as Document & {
        startViewTransition: (cb: () => void) => {
          ready: Promise<void>;
          finished: Promise<void>;
        };
      }
    ).startViewTransition(callback);

    await transition.ready;
    document.documentElement.animate(selected.keyframes, {
      ...selected.options,
      pseudoElement: "::view-transition-new(root)",
    });
  } else {
    callback();
  }
}

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "audio", label: "Audio", icon: AudioWaveform },
  { id: "controls", label: "Inputs & Buttons", icon: Grid3X3 },
  { id: "cards", label: "Cards", icon: CreditCard },
  { id: "typography", label: "Type", icon: Type },
  { id: "colors", label: "Colors", icon: Palette },
  { id: "ai", label: "AI", icon: Bot },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function PreviewPage({ params }: Props) {
  const { origin } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mode: globalMode } = useTheme();
  const [theme, setTheme] = useState<ThemeToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");
  const [copied, setCopied] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [showRemixDialog, setShowRemixDialog] = useState(false);
  const activeTab = useMemo<TabId>(() => {
    const tabParam = searchParams.get("tab");
    const normalized =
      tabParam === "buttons" || tabParam === "forms" ? "controls" : tabParam;
    return tabs.some((t) => t.id === normalized) ? (normalized as TabId) : "dashboard";
  }, [searchParams]);
  const containerRef = useRef<HTMLDivElement>(null);

  const installCommand = `bunx shadcn@latest add https://themetoken.dev/r/themes/${origin}`;

  const copyCommand = useCallback(() => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [installCommand]);

  const copyOrigin = useCallback(() => {
    navigator.clipboard.writeText(origin);
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 2000);
  }, [origin]);

  // Sync preview mode with global mode initially
  useEffect(() => {
    setPreviewMode(globalMode);
  }, [globalMode]);

  const handleTabChange = useCallback(
    (tabId: TabId) => {
      if (tabId === activeTab) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tabId);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [activeTab, router, searchParams],
  );

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

        // Add to themes cache so it appears on homepage
        // Fire and forget - non-blocking
        fetch("/api/themes/cache", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txid: origin.replace(/_\d+$/, ""),
            theme: result.theme,
          }),
        }).catch(() => { });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load theme");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTheme();
  }, [origin]);

  // Load fonts when theme changes (Google Fonts and on-chain fonts)
  useEffect(() => {
    if (!theme) return;

    const styles = theme.styles[previewMode];
    const fontProps = ["font-sans", "font-serif", "font-mono"] as const;

    // Check if any fonts are on-chain
    const hasOnChainFonts = fontProps.some(
      (prop) => styles[prop] && isOnChainFont(styles[prop] as string),
    );

    if (hasOnChainFonts) {
      // Load on-chain fonts
      loadThemeFonts(styles as Record<string, string>).then((resolved) => {
        console.log("[Preview] Loaded on-chain fonts:", resolved);
      });
    }

    // Also load Google Fonts for any non-on-chain fonts
    fontProps.forEach((prop) => {
      const fontValue = styles[prop];
      if (fontValue && !isOnChainFont(fontValue as string)) {
        const fontName = extractGoogleFontName(fontValue as string);
        if (fontName) {
          loadGoogleFont(fontName);
        }
      }
    });
  }, [theme, previewMode]);

  // Apply theme styles to the preview container
  useEffect(() => {
    if (!theme || !containerRef.current) return;
    applyStylesToElement(containerRef.current, theme.styles[previewMode]);
  }, [theme, previewMode]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

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
          <p className="mb-4 text-muted-foreground">
            {error || "Unable to load theme"}
          </p>
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
    <div className="min-h-screen bg-background font-sans antialiased selection:bg-primary/30 theme-transition relative pattern-bg">
      {/* Preview Container - Scoped Theme */}
      <div
        ref={containerRef}
        className={`relative z-0 min-h-screen ${previewMode === "dark" ? "dark" : ""}`}
        style={{
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
        }}
      >
        {/* Compact Header */}
        <header
          className="sticky top-0 z-50 border-b backdrop-blur"
          style={{
            backgroundColor: "color-mix(in oklch, var(--background) 95%, transparent)",
            borderColor: "var(--border)",
          }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="h-10" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {/* Mode Toggle */}
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "shadow-xs w-9 justify-center",
                  previewMode === "light"
                    ? "bg-background"
                    : "bg-transparent text-muted-foreground",
                )}
                aria-label={`Switch to ${previewMode === "light" ? "dark" : "light"} mode`}
                onClick={(e) => {
                  const nextMode = previewMode === "light" ? "dark" : "light";
                  startViewTransition(
                    () => setPreviewMode(nextMode),
                    e.clientX,
                    e.clientY,
                  );
                }}
              >
                {previewMode === "light" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              <Button asChild size="sm" variant="outline">
                <a
                  href={`https://1sat.market/outpoint/${origin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  On-chain
                </a>
              </Button>

              <Button size="sm" onClick={() => setShowRemixDialog(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Remix
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          {/* Header Section */}
          <div className="mb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {theme.name}
                  </h1>
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] uppercase tracking-widest"
                    style={{
                      borderColor: "color-mix(in oklch, var(--primary) 30%, transparent)",
                      color: "var(--primary)",
                      backgroundColor: "color-mix(in oklch, var(--primary) 5%, transparent)",
                    }}
                  >
                    Inscribed
                  </Badge>
                </div>
                {theme.author && (
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    by{" "}
                    <span style={{ color: "var(--foreground)" }}>
                      {theme.author}
                    </span>
                    <span className="mx-2" style={{ color: "var(--border)" }}>/</span>
                    <button
                      type="button"
                      onClick={copyOrigin}
                      className="inline-flex items-center gap-1 font-mono text-xs hover:text-foreground transition-colors group"
                      title="Copy full origin TXID"
                    >
                      <span>{origin.slice(0, 8)}...</span>
                      {copiedOrigin ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      )}
                    </button>
                  </p>
                )}
              </div>

              {/* CLI Command */}
              <button
                type="button"
                onClick={copyCommand}
                className="group flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-xs transition-colors"
                style={{
                  backgroundColor: "color-mix(in oklch, var(--muted) 50%, transparent)",
                  borderWidth: "1px",
                  borderColor: "var(--border)",
                }}
              >
                <span style={{ color: "var(--primary)" }}>$</span>
                <span className="hidden sm:inline" style={{ color: "var(--muted-foreground)" }}>
                  bunx shadcn add .../{origin.slice(0, 8)}
                </span>
                <span className="sm:hidden" style={{ color: "var(--muted-foreground)" }}>
                  Copy install
                </span>
                {copied ? (
                  <Check className="ml-1 h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="ml-1 h-3 w-3 opacity-50 group-hover:opacity-100" style={{ color: "var(--muted-foreground)" }} />
                )}
              </button>
            </div>
          </div>

          {/* Tab Navigation using shadcn/ui Tabs with animation */}
          <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as TabId)} className="w-full">
            <TabsList className="mb-2 h-auto p-1 bg-muted/50 w-full justify-start overflow-x-auto flex-nowrap">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="relative flex items-center gap-1.5 text-xs font-medium whitespace-nowrap cursor-pointer hover:bg-muted/80 data-[state=active]:shadow-sm transition-colors"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="preview-active-tab"
                        className="absolute inset-0 rounded-md bg-background"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Tab Content */}
            <TabsContent value="dashboard" className="mt-0">
              <DashboardDemo />
            </TabsContent>

            <TabsContent value="colors" className="mt-0">
              <ColorsDemo theme={theme} mode={previewMode} />
            </TabsContent>

            <TabsContent value="typography" className="mt-0">
              <TypographyDemo theme={theme} mode={previewMode} />
            </TabsContent>

            <TabsContent value="controls" className="mt-0">
              <div className="space-y-8">
                <ButtonsDemo />
                <FormsDemo />
              </div>
            </TabsContent>

            <TabsContent value="cards" className="mt-0">
              <CardsDemo />
            </TabsContent>

            <TabsContent value="audio" className="mt-0">
              <AudioDemo theme={theme} mode={previewMode} />
            </TabsContent>

            <TabsContent value="ai" className="mt-0">
              <AiDemo />
            </TabsContent>
          </Tabs>
        </div>

        {/* Remix Dialog */}
        <UnifiedRemixDialog
          isOpen={showRemixDialog}
          onClose={() => setShowRemixDialog(false)}
          type="theme"
          previousTheme={theme}
          onThemeRemixComplete={(newTheme) => {
            // Navigate to studio with the new remixed theme
            router.push(
              `/studio?remix=${encodeURIComponent(JSON.stringify(newTheme))}`,
            );
          }}
        />
      </div>
    </div>
  );
}

