"use client";

import { type ThemeStyleProps, type ThemeToken } from "@theme-token/sdk";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  AudioWaveform,
  Bot,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Grid3X3,
  LayoutDashboard,
  Moon,
  Palette,
  ShoppingCart,
  Sparkles,
  Sun,
  Type,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, startTransition, ViewTransition } from "react";
import { AiDemo } from "@/components/preview/ai-demo";
import { AudioDemo } from "@/components/preview/audio-demo";
import { ButtonsDemo } from "@/components/preview/buttons-demo";
import { CardsDemo } from "@/components/preview/cards-demo";
import { ColorsDemo } from "@/components/preview/colors-demo";
import { DashboardDemo } from "@/components/preview/dashboard-demo";
import { FormsDemo } from "@/components/preview/forms-demo";
import { TypographyDemo } from "@/components/preview/typography-demo";
import { PageContainer } from "@/components/page-container";
import { useTheme } from "@/components/theme-provider";
import { useAudioStore } from "@/lib/audio-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isOnChainFont, loadThemeFonts } from "@/lib/font-loader";
import { cn } from "@/lib/utils";
import { BuyThemeModal } from "@/components/market/buy-theme-modal";
import { PurchaseSuccessModal } from "@/components/market/purchase-success-modal";
import { UnifiedRemixDialog } from "@/components/market/unified-remix-dialog";
import { ThemeHeaderStripe } from "@/components/preview/theme-header-stripe";
import { storeRemixTheme } from "@/components/theme-gallery";
import { fetchThemeListingByOrigin, type ThemeMarketListing } from "@/lib/yours-wallet";

interface PreviewClientProps {
  theme: ThemeToken;
  origin: string;
  initialTab?: string;
}

// Extract Google Font name from CSS font-family value
function extractGoogleFontName(fontFamily: string): string | null {
  const firstFont = fontFamily.split(",")[0].trim();
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
  if (document.getElementById(linkId)) return;

  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

// Apply theme CSS variables to an element
function applyStylesToElement(
  element: HTMLElement,
  styles: ThemeStyleProps,
): void {
  for (const [key, value] of Object.entries(styles)) {
    if (key.startsWith("font-")) {
      element.style.setProperty(`--${key}`, value);
    } else if (key === "radius") {
      element.style.setProperty(`--${key}`, value);
    } else {
      element.style.setProperty(`--${key}`, value);
    }
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

export function PreviewClient({ theme, origin, initialTab }: PreviewClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mode: globalMode } = useTheme();
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");
  const [copied, setCopied] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [showRemixDialog, setShowRemixDialog] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [successModal, setSuccessModal] = useState<{ theme: ThemeToken; txid: string } | null>(null);

  // Fetch listing to check if for sale
  const { data: listing, refetch: refetchListing } = useQuery({
    queryKey: ["theme-listing", origin],
    queryFn: () => fetchThemeListingByOrigin(origin),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Determine active tab from URL or initial prop
  const activeTabFromUrl = useMemo<TabId>(() => {
    const tabParam = searchParams.get("tab") || initialTab;
    const normalized =
      tabParam === "buttons" || tabParam === "forms" ? "controls" : tabParam;
    return tabs.some((t) => t.id === normalized) ? (normalized as TabId) : "dashboard";
  }, [searchParams, initialTab]);

  const [activeTab, setActiveTab] = useState<TabId>(activeTabFromUrl);
  const containerRef = useRef<HTMLDivElement>(null);

  const installCommand = `bunx shadcn@latest add https://themetoken.dev/r/themes/${origin}`;

  // Sync with URL changes
  useEffect(() => {
    setActiveTab(activeTabFromUrl);
  }, [activeTabFromUrl]);

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

      // Pause audio when leaving the audio tab
      if (activeTab === "audio" && tabId !== "audio") {
        const audioState = useAudioStore.getState();
        if (audioState.isPlaying) {
          audioState.pause();
        }
      }

      // Update local state immediately for instant UI response
      setActiveTab(tabId);

      // Update URL in background without blocking UI
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tabId);
        router.replace(`?${params.toString()}`, { scroll: false });
      });
    },
    [activeTab, router, searchParams],
  );

  // Load fonts when theme changes (Google Fonts and on-chain fonts)
  useEffect(() => {
    const styles = theme.styles[previewMode];
    const fontProps = ["font-sans", "font-serif", "font-mono"] as const;

    // Check if any fonts are on-chain
    const hasOnChainFonts = fontProps.some(
      (prop) => styles[prop] && isOnChainFont(styles[prop] as string),
    );

    if (hasOnChainFonts) {
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

  // Track if this is the initial mount (for delaying theme application during view transition)
  const isInitialMount = useRef(true);

  // Apply theme styles to the preview container
  // Delay initial application to let view transition complete
  useEffect(() => {
    if (!containerRef.current) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Delay initial theme application to allow view transition to complete
      const timeout = setTimeout(() => {
        if (containerRef.current) {
          applyStylesToElement(containerRef.current, theme.styles[previewMode]);
        }
      }, 550); // Slightly longer than the 500ms view transition
      return () => clearTimeout(timeout);
    }

    // Subsequent changes (like mode toggle) apply immediately
    applyStylesToElement(containerRef.current, theme.styles[previewMode]);
  }, [theme, previewMode]);

  // Cache theme on mount
  useEffect(() => {
    fetch("/api/themes/cache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        txid: origin.replace(/_\d+$/, ""),
        theme,
      }),
    }).catch(() => {});
  }, [origin, theme]);

  const handlePurchaseComplete = useCallback((txid: string) => {
    setSuccessModal({ theme, txid });
    refetchListing(); // Refresh listing status
    setShowBuyModal(false);
  }, [theme, refetchListing]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Preview Container - Scoped Theme */}
      <div
        ref={containerRef}
        className={`relative z-0 min-h-screen flex-1 ${previewMode === "dark" ? "dark" : ""}`}
        style={{
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
        }}
      >
        <ViewTransition>
        {/* Compact Header */}
        <header
          className="sticky top-0 z-50 border-b backdrop-blur"
          style={{
            backgroundColor: "color-mix(in oklch, var(--background) 95%, transparent)",
            borderColor: "var(--border)",
          }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="h-10" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>

            <div className="flex items-center gap-2">
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
                onClick={() => {
                  const nextMode = previewMode === "light" ? "dark" : "light";
                  startTransition(() => {
                    setPreviewMode(nextMode);
                  });
                }}
              >
                {previewMode === "light" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              {/* Remix Button */}
              <Button
                variant={listing ? "outline" : "default"}
                size="sm"
                onClick={() => setShowRemixDialog(true)}
                className="gap-1.5"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Remix</span>
              </Button>

              {/* Buy Button - only if for sale */}
              {listing && (
                <Button
                  size="sm"
                  onClick={() => setShowBuyModal(true)}
                  className="gap-1.5"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">Buy</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Persistent Color Stripe */}
        <ThemeHeaderStripe theme={theme} mode={previewMode} origin={origin} />

        <PageContainer className="py-6">
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
                    <span className="inline-flex items-center gap-1.5 group">
                      <button
                        type="button"
                        onClick={copyOrigin}
                        className="inline-flex items-center gap-1 font-mono text-xs hover:text-foreground transition-colors"
                        title="Copy full origin TXID"
                      >
                        <span>{origin.slice(0, 8)}...</span>
                        {copiedOrigin ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                        )}
                      </button>
                      <a
                        href={`https://1sat.market/outpoint/${origin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity"
                        title="View on 1Sat Market"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </span>
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
                        transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
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
        </PageContainer>

        {/* Remix Dialog */}
        <UnifiedRemixDialog
          isOpen={showRemixDialog}
          onClose={() => setShowRemixDialog(false)}
          type="theme"
          previousTheme={theme}
          onThemeRemixComplete={(newTheme) => {
            router.push(
              `/studio?remix=${encodeURIComponent(JSON.stringify(newTheme))}`,
            );
          }}
        />

        {/* Buy Modal */}
        {listing && (
          <BuyThemeModal
            isOpen={showBuyModal}
            onClose={() => setShowBuyModal(false)}
            listing={listing}
            onPurchaseComplete={handlePurchaseComplete}
          />
        )}

        {/* Success Modal */}
        {successModal && (
          <PurchaseSuccessModal
            isOpen={true}
            onClose={() => setSuccessModal(null)}
            theme={successModal.theme}
            txid={successModal.txid}
            onApplyNow={() => {
              storeRemixTheme(successModal.theme);
              router.push("/studio/theme");
            }}
          />
        )}
        </ViewTransition>
      </div>
    </div>
  );
}
