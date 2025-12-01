"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { useTheme } from "@/components/theme-provider";
import { YOURS_WALLET_URL } from "@/lib/yours-wallet";
import {
  Wallet,
  ChevronDown,
  Check,
  Loader2,
  ExternalLink,
  Palette,
  Moon,
  Sun,
  X,
} from "lucide-react";

function ModeToggle() {
  const { mode, toggleMode } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => toggleMode(e)}
      className="h-9 w-9"
      title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {mode === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}

export function WalletConnect() {
  const { status, error, connect, disconnect, themeTokens, isLoading } =
    useYoursWallet();
  const { activeTheme, applyTheme, resetTheme, mode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Not installed state
  if (status === "not-installed") {
    return (
      <div className="flex items-center gap-2">
        <ModeToggle />
        <a
          href={YOURS_WALLET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted"
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">Install Yours Wallet</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  // Disconnected state
  if (status === "disconnected" || status === "error") {
    return (
      <div className="flex items-center gap-2">
        <ModeToggle />
        <Button
          variant="outline"
          size="sm"
          onClick={connect}
          className="gap-2"
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">Connect</span>
        </Button>
        {error && (
          <span className="text-xs text-destructive">{error}</span>
        )}
      </div>
    );
  }

  // Connecting state
  if (status === "connecting") {
    return (
      <div className="flex items-center gap-2">
        <ModeToggle />
        <Button variant="outline" size="sm" disabled className="gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="hidden sm:inline">Connecting...</span>
        </Button>
      </div>
    );
  }

  // Connected state
  return (
    <div className="flex items-center gap-2">
      <ModeToggle />

      {/* Theme Selector Dropdown */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          <Palette className="h-4 w-4" />
          <span className="hidden max-w-[120px] truncate sm:inline">
            {activeTheme?.name ?? "Select Theme"}
          </span>
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ChevronDown
              className={`h-3 w-3 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </Button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-border bg-card p-2 shadow-lg"
            >
              {/* Theme List */}
              {themeTokens.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading themes...
                    </div>
                  ) : (
                    <>
                      <Palette className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      <p>No Theme Tokens found</p>
                      <p className="mt-1 text-xs">
                        Inscribe a Theme Token to see it here
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="max-h-64 space-y-1 overflow-auto">
                  {themeTokens.map((token) => (
                    <button
                      key={token.name}
                      onClick={() => {
                        applyTheme(token);
                        setIsOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        activeTheme?.name === token.name
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      {/* Color Preview */}
                      <div className="flex -space-x-1">
                        <div
                          className="h-4 w-4 rounded-full border border-border"
                          style={{
                            backgroundColor: token.styles[mode].primary,
                          }}
                        />
                        <div
                          className="h-4 w-4 rounded-full border border-border"
                          style={{
                            backgroundColor: token.styles[mode].background,
                          }}
                        />
                      </div>
                      <span className="flex-1 truncate">
                        {token.name}
                      </span>
                      {activeTheme?.name === token.name && (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="mt-2 border-t border-border pt-2">
                {activeTheme && (
                  <button
                    onClick={() => {
                      resetTheme();
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                    Reset to default
                  </button>
                )}
                <button
                  onClick={() => {
                    disconnect();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Wallet className="h-4 w-4" />
                  Disconnect wallet
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active Theme Badge */}
      {activeTheme && (
        <Badge variant="secondary" className="hidden gap-1 lg:flex">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: activeTheme.styles[mode].primary }}
          />
          {activeTheme.name}
        </Badge>
      )}
    </div>
  );
}
