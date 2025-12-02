"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { useTheme } from "@/components/theme-provider";
import { JsonSyntax } from "@/components/json-syntax";
import {
  type ThemeToken,
  exampleThemes,
  validateThemeToken,
  parseTweakCnCss,
} from "@/lib/schema";
import {
  Wallet,
  Loader2,
  Check,
  AlertCircle,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface MintThemeProps {
  className?: string;
}

export function MintTheme({ className = "" }: MintThemeProps) {
  const {
    status,
    connect,
    balance,
    inscribeTheme,
    isInscribing,
    error: walletError,
  } = useYoursWallet();
  const { mode } = useTheme();

  const [selectedTheme, setSelectedTheme] = useState<ThemeToken>(exampleThemes[0]);
  const [customJson, setCustomJson] = useState("");
  const [customCss, setCustomCss] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"presets" | "css" | "json">("presets");
  const [txid, setTxid] = useState<string | null>(null);
  const [customLabel, setCustomLabel] = useState("");

  const handleCustomJsonChange = (value: string) => {
    setCustomJson(value);
    setValidationError(null);

    if (!value.trim()) return;

    try {
      const parsed = JSON.parse(value);
      const result = validateThemeToken(parsed);

      if (result.valid) {
        setSelectedTheme(result.theme);
        setValidationError(null);
      } else {
        setValidationError(result.error);
      }
    } catch {
      setValidationError("Invalid JSON syntax");
    }
  };

  const handleCustomCssChange = (value: string) => {
    setCustomCss(value);
    setValidationError(null);

    if (!value.trim()) return;

    const result = parseTweakCnCss(value, customLabel || "Custom Theme");

    if (result.valid) {
      setSelectedTheme(result.theme);
      setValidationError(null);
    } else {
      setValidationError(result.error);
    }
  };

  const handleMint = async () => {
    // Use custom name if provided, otherwise use theme's name
    const themeToMint: ThemeToken = {
      ...selectedTheme,
      name: customLabel.trim() || selectedTheme.name,
    };

    const result = await inscribeTheme(themeToMint);
    if (result) {
      setTxid(result.txid);
    }
  };

  const isConnected = status === "connected";
  const canMint = isConnected && !isInscribing && !validationError;

  // Success state
  if (txid) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl border border-green-500/50 bg-green-500/10 p-8 text-center ${className}`}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
          <Check className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="mb-2 text-xl font-bold">Theme Token Inscribed!</h3>
        <p className="mb-4 text-muted-foreground">
          Your theme has been permanently inscribed on the BSV blockchain.
        </p>
        <div className="mb-6 rounded-lg bg-muted/50 p-4">
          <p className="mb-1 text-xs text-muted-foreground">Transaction ID</p>
          <p className="break-all font-mono text-sm">{txid}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="outline">
            <a
              href={`https://whatsonchain.com/tx/${txid}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Explorer
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button onClick={() => setTxid(null)}>Mint Another</Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      {!isConnected && status !== "connecting" && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Connect your wallet using the button in the header to inscribe theme tokens.
          </p>
        </div>
      )}

      {/* Balance Display */}
      {isConnected && balance && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
          <div>
            <p className="text-sm text-muted-foreground">Wallet Balance</p>
            <p className="text-xl font-bold">{balance.bsv.toFixed(8)} BSV</p>
            <p className="text-xs text-muted-foreground">
              ~${(balance.usdInCents / 100).toFixed(2)} USD
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            Connected
          </Badge>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 rounded-lg bg-muted p-1">
        <button
          onClick={() => setActiveTab("presets")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "presets"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Presets
        </button>
        <button
          onClick={() => setActiveTab("css")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "css"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Paste CSS
        </button>
        <button
          onClick={() => setActiveTab("json")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "json"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          JSON
        </button>
      </div>

      {/* Theme Selection */}
      {activeTab === "presets" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {exampleThemes.map((theme) => (
            <button
              key={theme.name}
              onClick={() => setSelectedTheme(theme)}
              className={`relative rounded-lg border p-4 text-left transition-all ${
                selectedTheme.name === theme.name
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-1">
                  <div
                    className="h-6 w-6 rounded-full border-2 border-background"
                    style={{ backgroundColor: theme.styles[mode].primary }}
                  />
                  <div
                    className="h-6 w-6 rounded-full border-2 border-background"
                    style={{ backgroundColor: theme.styles[mode].background }}
                  />
                </div>
                <div>
                  <h4 className="font-semibold">{theme.name}</h4>
                </div>
              </div>
              {selectedTheme.name === theme.name && (
                <Check className="absolute right-3 top-3 h-5 w-5 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}

      {activeTab === "css" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Paste CSS from{" "}
            <a
              href="https://tweakcn.com/editor/theme"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              tweakcn.com
            </a>{" "}
            or any ShadCN theme generator. Include both :root and .dark blocks.
          </p>
          <textarea
            value={customCss}
            onChange={(e) => handleCustomCssChange(e.target.value)}
            placeholder={`:root {
  --background: oklch(0.98 0.01 90);
  --foreground: oklch(0.2 0.02 90);
  --primary: oklch(0.6 0.15 145);
  /* ... */
}

.dark {
  --background: oklch(0.15 0.02 90);
  /* ... */
}`}
            className="h-64 w-full rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {validationError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {validationError}
            </div>
          )}
          {customCss && !validationError && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              Valid CSS parsed successfully
            </div>
          )}
        </div>
      )}

      {activeTab === "json" && (
        <div className="space-y-3">
          <textarea
            value={customJson}
            onChange={(e) => handleCustomJsonChange(e.target.value)}
            placeholder="Paste your Theme Token JSON here..."
            className="h-64 w-full rounded-lg border border-border bg-muted/30 p-4 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {validationError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {validationError}
            </div>
          )}
          {customJson && !validationError && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              Valid Theme Token
            </div>
          )}
        </div>
      )}

      {/* Custom Label */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Theme Name (optional)
        </label>
        <input
          type="text"
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          placeholder={selectedTheme.name}
          className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Leave empty to use the theme&apos;s default name
        </p>
      </div>

      {/* Preview */}
      <div>
        <h4 className="mb-2 font-mono text-sm text-muted-foreground">
          // Theme Token Preview
        </h4>
        <JsonSyntax
          json={{
            name: customLabel.trim() || selectedTheme.name,
            styles: selectedTheme.styles,
          }}
          className="max-h-48 overflow-auto text-xs"
        />
      </div>

      {/* Error Display */}
      {walletError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {walletError}
        </div>
      )}

      {/* Mint Button */}
      <Button
        size="lg"
        className="w-full gap-2"
        disabled={!canMint}
        onClick={handleMint}
      >
        {isInscribing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Inscribing...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            {isConnected ? "Inscribe Theme Token (~$0.001)" : "Connect Wallet First"}
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Theme tokens are inscribed as 1Sat Ordinals on the BSV blockchain.
        <br />
        Once inscribed, they cannot be modified or deleted.
      </p>
    </div>
  );
}
