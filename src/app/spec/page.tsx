"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { JsonSyntax } from "@/components/json-syntax";
import { ChainImplementations } from "@/components/chain-implementations";
import { Terminal, Copy, Check } from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function SpecPage() {
  const [copied, setCopied] = useState(false);
  const installCommand = "bunx shadcn@latest add https://themetoken.dev/r/themes/[origin].json";

  const copyCommand = useCallback(() => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [installCommand]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero - CLI Install */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent py-16">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
            className="text-center"
          >
            <motion.p
              variants={fadeIn}
              className="font-mono text-sm text-primary"
            >
              // ShadCN Registry Format
            </motion.p>
            <motion.h1
              variants={fadeIn}
              className="mb-4 text-3xl font-bold sm:text-4xl"
            >
              Install Themes from Blockchain
            </motion.h1>
            <motion.p variants={fadeIn} className="mx-auto mb-8 max-w-2xl text-muted-foreground">
              Theme Token uses the ShadCN Registry Format. Install any on-chain theme
              directly with the ShadCN CLI.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-auto max-w-2xl"
          >
            <div className="rounded-xl border border-primary/20 bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                <span className="font-semibold">Install via CLI</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 font-mono text-sm">
                <code className="flex-1 overflow-x-auto text-muted-foreground">
                  <span className="text-primary">bunx</span> shadcn@latest add{" "}
                  <span className="text-foreground">https://themetoken.dev/r/themes/[origin].json</span>
                </code>
                <button
                  onClick={copyCommand}
                  className="flex-shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title="Copy command"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Replace <code className="rounded bg-muted px-1">[origin]</code> with the inscription origin ID
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Schema Documentation */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.p
              variants={fadeIn}
              className="font-mono text-sm text-primary"
            >
              // The Schema
            </motion.p>
            <motion.h2
              variants={fadeIn}
              className="mb-4 text-3xl font-bold sm:text-4xl"
            >
              ShadCN Registry Format
            </motion.h2>
            <motion.p variants={fadeIn} className="mb-12 max-w-2xl text-muted-foreground">
              Theme Token uses the same CSS custom properties that power thousands of
              ShadCN-based applications. 100% compatible with the ShadCN CLI ecosystem.
            </motion.p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Color Variables */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h3 className="font-semibold">Theme Properties</h3>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">19 Core Colors <span className="text-primary">*</span></p>
                  <div className="grid grid-cols-3 gap-1 font-mono text-xs">
                    {["background", "foreground", "card", "popover", "primary", "secondary", "muted", "accent", "destructive", "border", "input", "ring"].map((name) => (
                      <div key={name} className="flex items-center gap-1 rounded border border-border bg-muted/30 px-2 py-1">
                        <div className="h-2 w-2 rounded-full border" style={{ backgroundColor: `var(--${name})` }} />
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Charts (optional)</p>
                  <div className="flex gap-1 font-mono text-xs">
                    {["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"].map((name) => (
                      <div key={name} className="rounded border border-border bg-muted/30 px-2 py-1">{name}</div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Sidebar (optional)</p>
                  <div className="flex flex-wrap gap-1 font-mono text-xs">
                    {["sidebar", "sidebar-primary", "sidebar-accent", "sidebar-border", "sidebar-ring"].map((name) => (
                      <div key={name} className="rounded border border-border bg-muted/30 px-2 py-1">{name}</div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Typography & Layout</p>
                  <div className="flex flex-wrap gap-1 font-mono text-xs">
                    {["radius", "font-sans", "font-serif", "font-mono", "letter-spacing", "spacing"].map((name) => (
                      <div key={name} className="rounded border border-border bg-muted/30 px-2 py-1">
                        {name}{name === "radius" && <span className="text-primary ml-1">*</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Shadows (optional)</p>
                  <div className="flex flex-wrap gap-1 font-mono text-xs">
                    {["shadow-2xs", "shadow-xs", "shadow-sm", "shadow", "shadow-md", "shadow-lg", "shadow-xl", "shadow-2xl"].map((name) => (
                      <div key={name} className="rounded border border-border bg-muted/30 px-2 py-1">{name}</div>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Colors include <code className="rounded bg-muted px-1">-foreground</code> variants.
                All color values use <code className="rounded bg-muted px-1">oklch()</code> format.
                <span className="text-primary">*</span> = required.
              </p>
            </motion.div>

            {/* Schema Structure */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h3 className="mb-4 font-semibold">Full Schema Structure</h3>
              <JsonSyntax
                json={{
                  $schema: "https://themetoken.dev/v1/schema.json",
                  name: "My Theme",
                  author: "WildSatchmo (https://github.com/rohenaz)",
                  styles: {
                    light: {
                      background: "oklch(1 0 0)",
                      foreground: "oklch(0.145 0 0)",
                      primary: "oklch(0.55 0.22 255)",
                      "primary-foreground": "oklch(0.98 0 0)",
                      "...": "// 19 semantic colors + chart-1..5 + sidebar-*",
                      radius: "0.5rem",
                      "font-sans": "Inter, sans-serif",
                      "letter-spacing": "0em",
                      "shadow-offset-x": "0",
                      "shadow-offset-y": "1px",
                      "shadow-sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                    },
                    dark: { "...": "// dark mode variants" },
                  },
                }}
                className="text-xs"
              />
              <p className="mt-3 text-xs text-muted-foreground">
                Our <code className="rounded bg-muted px-1">/r/themes/[origin].json</code> endpoint
                serves this as{" "}
                <a href="https://ui.shadcn.com/docs/registry" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  ShadCN Registry Format
                </a>
                . Also compatible with{" "}
                <a href="https://tweakcn.com/editor/theme" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  tweakcn
                </a>
                .{" "}
                <a
                  href="https://docs.npmjs.com/cli/v10/configuring-npm/package-json#name"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Name
                </a>
                {" "}and{" "}
                <a
                  href="https://docs.npmjs.com/cli/v10/configuring-npm/package-json#people-fields-author-contributors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  author
                </a>
                {" "}follow npm conventions.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Protocol Implementations */}
      <section className="border-t border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.p
              variants={fadeIn}
              className="font-mono text-sm text-primary"
            >
              // Blockchain Implementations
            </motion.p>
            <motion.h2
              variants={fadeIn}
              className="mb-4 text-3xl font-bold sm:text-4xl"
            >
              Inscribe on Any Chain
            </motion.h2>
            <motion.p variants={fadeIn} className="mb-12 max-w-2xl text-muted-foreground">
              Theme Tokens can be inscribed on multiple blockchains. Choose based on
              your cost, speed, and ecosystem requirements.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <ChainImplementations />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
