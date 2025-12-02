"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { useTheme } from "@/components/theme-provider";
import {
  type ThemeToken,
  exampleThemes,
  validateThemeToken,
  parseTweakCnCss,
  applyTheme as applyThemeToDOM,
} from "@/lib/schema";
import { REMIX_THEME_EVENT, getAndClearRemixTheme } from "@/components/theme-gallery";
import {
  Loader2,
  Check,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Copy,
  Moon,
  Sun,
  Save,
  Trash2,
  FolderOpen,
} from "lucide-react";

const DRAFTS_STORAGE_KEY = "theme-token-drafts";

interface ThemeDraft {
  id: string;
  theme: ThemeToken;
  savedAt: number;
}

function loadDrafts(): ThemeDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(DRAFTS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveDrafts(drafts: ThemeDraft[]): void {
  localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
}

// Preview components that show the theme in action
function PreviewCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-card p-4 ${className}`}>
      <h4 className="mb-2 font-semibold text-card-foreground">Card Title</h4>
      <p className="mb-3 text-sm text-muted-foreground">
        This is a sample card component.
      </p>
      <div className="flex gap-2">
        <Button size="sm">Primary</Button>
        <Button size="sm" variant="secondary">Secondary</Button>
        <Button size="sm" variant="outline">Outline</Button>
      </div>
    </div>
  );
}

function PreviewInputs({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label className="mb-1 block text-sm font-medium">Text Input</label>
        <input
          type="text"
          placeholder="Type something..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </div>
    </div>
  );
}

function PreviewPanel() {
  return (
    <div className="space-y-4">
      <PreviewCard />
      <PreviewInputs />
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-primary p-3 text-center text-primary-foreground">
          Primary
        </div>
        <div className="rounded-lg bg-secondary p-3 text-center text-secondary-foreground">
          Secondary
        </div>
        <div className="rounded-lg bg-accent p-3 text-center text-accent-foreground">
          Accent
        </div>
        <div className="rounded-lg bg-muted p-3 text-center text-muted-foreground">
          Muted
        </div>
      </div>
    </div>
  );
}

export function ThemeStudio() {
  const searchParams = useSearchParams();
  const {
    status,
    connect,
    balance,
    profile,
    inscribeTheme,
    isInscribing,
    error: walletError,
  } = useYoursWallet();
  const { mode, toggleMode, activeTheme } = useTheme();

  // Use wallet's active theme as default if available, otherwise use first preset
  const [selectedTheme, setSelectedTheme] = useState<ThemeToken>(
    activeTheme || exampleThemes[0]
  );
  const [customInput, setCustomInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"presets" | "paste" | "drafts">("presets");
  const [txid, setTxid] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [copied, setCopied] = useState<"css" | "json" | null>(null);
  const [drafts, setDrafts] = useState<ThemeDraft[]>([]);
  const [savedNotice, setSavedNotice] = useState(false);
  const [importSource, setImportSource] = useState<string | null>(null);

  // Load drafts on mount
  useEffect(() => {
    setDrafts(loadDrafts());
  }, []);

  // Handle deep link import from URL (?import=base64 or ?css=base64 or ?remix=origin)
  useEffect(() => {
    const importParam = searchParams.get("import") || searchParams.get("css");
    const remixParam = searchParams.get("remix");
    const nameParam = searchParams.get("name");
    const sourceParam = searchParams.get("source");

    // Handle remix by origin - fetch theme from blockchain
    if (remixParam) {
      fetch(`https://ordfs.network/${remixParam}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.styles && (data.styles.light || data.styles.dark)) {
            const theme: ThemeToken = {
              $schema: data.$schema || "https://themetoken.dev/v1/schema.json",
              name: data.name || "Remixed Theme",
              author: data.author,
              styles: data.styles,
            };
            setSelectedTheme(theme);
            setCustomName(`${theme.name} (remix)`);
            setImportSource("blockchain");
          }
        })
        .catch(() => {
          setValidationError("Failed to fetch theme from blockchain");
        });
      return;
    }

    if (importParam) {
      try {
        // Decode base64 CSS
        const decodedCss = atob(importParam);

        // Parse the CSS
        const themeName = nameParam || "Imported Theme";
        const cssResult = parseTweakCnCss(decodedCss, themeName);

        if (cssResult.valid) {
          setSelectedTheme(cssResult.theme);
          setCustomInput(decodedCss);
          setCustomName(themeName);
          setActiveTab("paste");
          setImportSource(sourceParam || null);
          setValidationError(null);
        } else {
          setValidationError(cssResult.error);
          setActiveTab("paste");
        }
      } catch {
        setValidationError("Invalid import data - could not decode");
        setActiveTab("paste");
      }
    }
  }, [searchParams]);

  // Check for remix theme from gallery navigation
  useEffect(() => {
    const remixTheme = getAndClearRemixTheme();
    if (remixTheme) {
      setSelectedTheme(remixTheme);
      setCustomName(remixTheme.name);
    }
  }, []);

  const handleSaveDraft = () => {
    const draft: ThemeDraft = {
      id: Date.now().toString(),
      theme: { ...selectedTheme, name: customName.trim() || selectedTheme.name },
      savedAt: Date.now(),
    };
    const updated = [draft, ...drafts];
    setDrafts(updated);
    saveDrafts(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleLoadDraft = (draft: ThemeDraft) => {
    setSelectedTheme(draft.theme);
    setCustomName(draft.theme.name);
    setActiveTab("presets");
  };

  const handleDeleteDraft = (id: string) => {
    const updated = drafts.filter((d) => d.id !== id);
    setDrafts(updated);
    saveDrafts(updated);
  };

  const isConnected = status === "connected";
  const canMint = isConnected && !isInscribing && !validationError;

  // Generate CSS from theme
  const generateCSS = (theme: ThemeToken): string => {
    const lightVars = Object.entries(theme.styles.light)
      .map(([key, value]) => `  --${key}: ${value};`)
      .join("\n");
    const darkVars = Object.entries(theme.styles.dark)
      .map(([key, value]) => `  --${key}: ${value};`)
      .join("\n");

    return `:root {\n${lightVars}\n}\n\n.dark {\n${darkVars}\n}`;
  };

  // Copy to clipboard
  const handleCopy = async (type: "css" | "json") => {
    const content = type === "css"
      ? generateCSS(selectedTheme)
      : JSON.stringify(selectedTheme, null, 2);

    await navigator.clipboard.writeText(content);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  // Apply theme to DOM directly (not through provider to avoid loops)
  useEffect(() => {
    applyThemeToDOM(selectedTheme.styles[mode]);
  }, [selectedTheme, mode]);

  // Listen for remix events from gallery
  useEffect(() => {
    const handleRemix = (e: Event) => {
      const theme = (e as CustomEvent<ThemeToken>).detail;
      setSelectedTheme(theme);
      setCustomName(""); // Clear custom name for remix
    };

    window.addEventListener(REMIX_THEME_EVENT, handleRemix);
    return () => window.removeEventListener(REMIX_THEME_EVENT, handleRemix);
  }, []);

  // Update theme name when customName changes
  useEffect(() => {
    if (customName.trim()) {
      setSelectedTheme((prev) => ({ ...prev, name: customName.trim() }));
    }
  }, [customName]);

  const handleInputChange = (value: string) => {
    setCustomInput(value);
    setValidationError(null);
    setImportSource(null); // Clear import source when user edits

    if (!value.trim()) return;

    // Try parsing as JSON first
    try {
      const parsed = JSON.parse(value);
      const result = validateThemeToken(parsed);
      if (result.valid) {
        setSelectedTheme(result.theme);
        return;
      }
    } catch {
      // Not JSON, try CSS
    }

    // Try parsing as CSS
    const cssResult = parseTweakCnCss(value, customName || "Custom Theme");
    if (cssResult.valid) {
      setSelectedTheme(cssResult.theme);
      setValidationError(null);
    } else {
      setValidationError(cssResult.error);
    }
  };

  const handleMint = async () => {
    const themeToMint: ThemeToken = {
      ...selectedTheme,
      name: customName.trim() || selectedTheme.name,
      // Add author from profile if available
      ...(profile?.displayName && { author: profile.displayName }),
    };

    const result = await inscribeTheme(themeToMint);
    if (result) {
      setTxid(result.txid);
    }
  };

  // Success state
  if (txid) {
    const origin = `${txid}_0`;
    const installUrl = `https://themetoken.dev/r/themes/${origin}.json`;
    const installCommand = `bunx shadcn@latest add ${installUrl}`;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border border-green-500/50 bg-green-500/10 p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
          <Check className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="mb-2 text-xl font-bold">Theme Token Inscribed!</h3>
        <p className="mb-4 text-muted-foreground">
          Your theme has been permanently inscribed on the BSV blockchain.
        </p>

        {/* Install Command */}
        <div className="mb-6 rounded-lg border border-primary/30 bg-card p-4 text-left">
          <p className="mb-2 text-xs font-medium text-primary">Install via CLI</p>
          <div className="flex items-center gap-2 rounded-md bg-muted p-2 font-mono text-xs">
            <code className="flex-1 overflow-x-auto">{installCommand}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(installCommand);
              }}
              className="flex-shrink-0 rounded p-1 hover:bg-background"
              title="Copy"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="mb-4 rounded-lg bg-muted/50 p-4">
          <p className="mb-1 text-xs text-muted-foreground">Origin ID</p>
          <p className="break-all font-mono text-sm">{origin}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="outline">
            <a
              href={`https://1sat.market/outpoint/${origin}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Market
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button onClick={() => setTxid(null)}>Create Another</Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
      {/* Split pane layout */}
      <div className="flex flex-col lg:flex-row">
        {/* Left Panel: Controls */}
        <div className="w-full border-b border-border bg-muted/10 p-6 lg:w-2/5 lg:border-b-0 lg:border-r">
          {/* Tab switcher */}
          <div className="mb-4 flex gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => setActiveTab("presets")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === "presets"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Presets
            </button>
            <button
              onClick={() => setActiveTab("paste")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === "paste"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Paste
            </button>
            <button
              onClick={() => setActiveTab("drafts")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === "drafts"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Drafts{drafts.length > 0 && ` (${drafts.length})`}
            </button>
          </div>

          {/* Presets Tab */}
          {activeTab === "presets" && (
            <div className="grid grid-cols-2 gap-2">
              {/* Show wallet theme first if available, otherwise show all example themes */}
              {(activeTheme
                ? [activeTheme, ...exampleThemes.filter(t => t.name !== activeTheme.name)]
                : exampleThemes
              ).map((theme, index) => (
                <button
                  key={theme.name}
                  onClick={() => {
                    setSelectedTheme(theme);
                    setCustomName("");
                  }}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    selectedTheme.name === theme.name
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  } ${index === 0 && activeTheme ? "ring-1 ring-primary/30" : ""}`}
                >
                  <div className="mb-2 flex h-4 overflow-hidden rounded">
                    {[
                      theme.styles[mode].primary,
                      theme.styles[mode].secondary,
                      theme.styles[mode].accent,
                      theme.styles[mode].background,
                    ].map((color, i) => (
                      <div key={i} className="flex-1" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-medium">{theme.name}</p>
                    {index === 0 && activeTheme && (
                      <span className="text-[10px] text-primary">(active)</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Paste Tab */}
          {activeTab === "paste" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Paste ShadCN theme CSS from{" "}
                <a
                  href="https://tweakcn.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  tweakcn.com
                </a>{" "}
                or any ShadCN-compatible JSON.
              </p>
              <textarea
                value={customInput}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={`:root {\n  --primary: oklch(0.6 0.15 145);\n  /* ... */\n}`}
                className="h-40 w-full rounded-lg border border-border bg-background p-3 font-mono text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {validationError && (
                <div className="flex items-center gap-2 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {validationError}
                </div>
              )}
              {customInput && !validationError && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-green-600">
                    <Check className="h-3 w-3" />
                    Theme imported successfully
                    {importSource && (
                      <span className="text-muted-foreground">from {importSource}</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex h-5 overflow-hidden rounded-md border border-green-500/30">
                      {[
                        selectedTheme.styles[mode].primary,
                        selectedTheme.styles[mode].secondary,
                        selectedTheme.styles[mode].accent,
                        selectedTheme.styles[mode].muted,
                        selectedTheme.styles[mode].background,
                      ].map((color, i) => (
                        <div key={i} className="w-5" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Object.keys(selectedTheme.styles[mode]).length} properties
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Drafts Tab */}
          {activeTab === "drafts" && (
            <div className="space-y-2">
              {drafts.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <FolderOpen className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p>No saved drafts</p>
                  <p className="mt-1 text-xs">Save a theme to work on it later</p>
                </div>
              ) : (
                drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="flex items-center gap-2 rounded-lg border border-border p-3"
                  >
                    <button
                      onClick={() => handleLoadDraft(draft)}
                      className="flex flex-1 items-center gap-2 text-left hover:text-primary"
                    >
                      <div className="flex h-4 w-8 overflow-hidden rounded">
                        {[
                          draft.theme.styles[mode].primary,
                          draft.theme.styles[mode].secondary,
                        ].map((color, i) => (
                          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{draft.theme.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(draft.savedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                      title="Delete draft"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Theme name input + Save Draft */}
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Theme Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={selectedTheme.name}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleSaveDraft}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              {savedNotice ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Draft
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div className="flex-1 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Live Preview</Badge>
              {/* Mode Toggle - uses global mode with splash animation */}
              <button
                onClick={(e) => toggleMode(e)}
                className="flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs transition-colors hover:bg-muted"
              >
                {mode === "light" ? (
                  <>
                    <Sun className="h-3 w-3" />
                    Light
                  </>
                ) : (
                  <>
                    <Moon className="h-3 w-3" />
                    Dark
                  </>
                )}
              </button>
            </div>
            {/* Copy Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy("css")}
                className="flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs transition-colors hover:bg-muted"
              >
                {copied === "css" ? (
                  <>
                    <Check className="h-3 w-3 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy CSS
                  </>
                )}
              </button>
              <button
                onClick={() => handleCopy("json")}
                className="flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs transition-colors hover:bg-muted"
              >
                {copied === "json" ? (
                  <>
                    <Check className="h-3 w-3 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy JSON
                  </>
                )}
              </button>
            </div>
          </div>
          <PreviewPanel />
        </div>
      </div>

      {/* Bottom Bar: Mint Action */}
      <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-4">
        <div>
          {isConnected && balance ? (
            <div>
              <p className="text-sm font-medium">
                {profile?.displayName && (
                  <span className="text-primary">{profile.displayName}</span>
                )}
                {profile?.displayName && " · "}
                {balance.bsv.toFixed(8)} BSV
              </p>
              <p className="text-xs text-muted-foreground">
                Inscription cost: ~0.00001 BSV
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Connect wallet to inscribe
            </p>
          )}
        </div>

        {walletError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {walletError}
          </div>
        )}

        <Button
          size="lg"
          disabled={!canMint}
          onClick={isConnected ? handleMint : connect}
          className="gap-2"
        >
          {isInscribing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Inscribing...
            </>
          ) : isConnected ? (
            <>
              <Sparkles className="h-5 w-5" />
              Inscribe Theme
            </>
          ) : status === "connecting" ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Connect to Inscribe
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
