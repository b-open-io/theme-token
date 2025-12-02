"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  type ThemeToken,
  type ThemeStyleProps,
  validateThemeToken,
  parseCss,
  applyTheme,
} from "@theme-token/sdk";
import { exampleThemes } from "@/lib/example-themes";
import { JsonSyntax } from "./json-syntax";
import { Sun, Moon, Check, AlertCircle } from "lucide-react";

interface ThemePreviewProps {
  className?: string;
}

export function ThemePreview({ className = "" }: ThemePreviewProps) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeToken>(exampleThemes[0]);
  const [mode, setMode] = useState<"light" | "dark">("dark");
  const [customJson, setCustomJson] = useState("");
  const [customCss, setCustomCss] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"presets" | "css" | "json">("presets");

  const applyThemeToPreview = useCallback((styles: ThemeStyleProps) => {
    const previewEl = document.getElementById("theme-preview-container");
    if (!previewEl) return;

    for (const [key, value] of Object.entries(styles)) {
      if (value !== undefined) {
        previewEl.style.setProperty(`--${key}`, value);
      }
    }
  }, []);

  useEffect(() => {
    applyThemeToPreview(selectedTheme.styles[mode]);
  }, [selectedTheme, mode, applyThemeToPreview]);

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

    const result = parseCss(value, "Custom Theme");

    if (result.valid) {
      setSelectedTheme(result.theme);
      setValidationError(null);
    } else {
      setValidationError(result.error);
    }
  };

  return (
    <div className={`grid gap-8 lg:grid-cols-2 ${className}`}>
      {/* Control Panel */}
      <div className="space-y-6">
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

        {activeTab === "presets" && (
          <div className="space-y-3">
            {exampleThemes.map((theme, i) => (
              <motion.button
                key={theme.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedTheme(theme)}
                className={`w-full rounded-lg border p-4 text-left transition-all ${
                  selectedTheme.name === theme.name
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Color Preview */}
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
                    <h4 className="font-semibold">{theme.name}</h4>
                  </div>
                  {selectedTheme.name === theme.name && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              </motion.button>
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
              or any ShadCN theme generator.
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

        {/* Mode Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <span className="font-medium">Preview Mode</span>
          <div className="flex gap-2">
            <Button
              variant={mode === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("light")}
            >
              <Sun className="mr-2 h-4 w-4" />
              Light
            </Button>
            <Button
              variant={mode === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("dark")}
            >
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </Button>
          </div>
        </div>

        {/* Current Theme JSON */}
        <div>
          <h4 className="mb-2 font-mono text-sm text-muted-foreground">
            // Current Theme Token
          </h4>
          <JsonSyntax json={selectedTheme} className="max-h-64 overflow-auto text-xs" />
        </div>
      </div>

      {/* Preview Panel */}
      <div
        id="theme-preview-container"
        className="theme-transition overflow-hidden rounded-xl border border-border shadow-lg"
        style={{
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
        }}
      >
        <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: "var(--destructive)" }}
            />
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: "var(--chart-4)" }}
            />
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: "var(--chart-3)" }}
            />
            <span className="ml-4 font-mono text-sm" style={{ color: "var(--muted-foreground)" }}>
              {selectedTheme.name}
            </span>
          </div>
        </div>

        <div className="p-6">
          <Card
            className="theme-transition"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: "var(--card-foreground)" }}>
                Sample Card Component
              </CardTitle>
              <CardDescription style={{ color: "var(--muted-foreground)" }}>
                This card demonstrates the theme in action
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="text"
                placeholder="Input field example"
                className="w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  backgroundColor: "var(--background)",
                  borderColor: "var(--input)",
                  color: "var(--foreground)",
                }}
              />

              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-md px-4 py-2 text-sm font-medium"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  Primary
                </button>
                <button
                  className="rounded-md px-4 py-2 text-sm font-medium"
                  style={{
                    backgroundColor: "var(--secondary)",
                    color: "var(--secondary-foreground)",
                  }}
                >
                  Secondary
                </button>
                <button
                  className="rounded-md px-4 py-2 text-sm font-medium"
                  style={{
                    backgroundColor: "var(--destructive)",
                    color: "var(--destructive-foreground)",
                  }}
                >
                  Destructive
                </button>
              </div>

              <div className="flex gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "var(--accent-foreground)",
                  }}
                >
                  Accent Badge
                </span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: "var(--muted)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  Muted Badge
                </span>
              </div>

              {/* Chart Color Preview */}
              <div className="pt-2">
                <p
                  className="mb-2 text-xs font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Chart Colors
                </p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className="h-8 flex-1 rounded"
                      style={{ backgroundColor: `var(--chart-${n})` }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
