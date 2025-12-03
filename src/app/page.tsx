"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JsonSyntax } from "@/components/json-syntax";
import { ThemeGallery } from "@/components/theme-gallery";
import {
  Palette,
  Code2,
  Wallet,
  Globe,
  Lock,
  Layers,
  ArrowRight,
  Sparkles,
  Terminal,
  Copy,
  Check,
} from "lucide-react";
import { useState, useCallback } from "react";

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

// ShadCN Registry Format - the standard
const minimalSchema = {
  $schema: "https://themetoken.dev/v1/schema.json",
  name: "midnight-aurora",
  author: "WildSatchmo (https://github.com/rohenaz)",
  styles: {
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0 0)",
      primary: "oklch(0.55 0.22 255)",
      "primary-foreground": "oklch(0.98 0 0)",
      radius: "0.5rem",
      "...": "// all ShadCN CSS vars",
    },
    dark: {
      "...": "// dark mode variants",
    },
  },
};

// Example CLI install command
const exampleOrigin = "85702d92d2ca2f5a48eaede302f0e85d9142924d68454565dbf621701b2d83cf_0";

export default function Home() {
  const [copied, setCopied] = useState(false);
  const installCommand = `bunx shadcn@latest add https://themetoken.dev/r/themes/${exampleOrigin}.json`;

  const copyCommand = useCallback(() => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [installCommand]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="grid-background absolute inset-0 opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="mb-6" variant="outline">
              <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
              bun i @theme-token/sdk
            </Badge>

            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="block">On-Chain Themes</span>
              <span className="block text-primary">For ShadCN UI</span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Install themes directly from blockchain using the{" "}
              <span className="font-semibold text-foreground">ShadCN CLI</span>.
              Own, trade, and apply themes across any compatible application.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="gap-2" asChild>
                <a href="/market">
                  <Palette className="h-5 w-5" />
                  Browse Themes
                </a>
              </Button>
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <a href="/studio">
                  <Sparkles className="h-5 w-5" />
                  Create Theme
                </a>
              </Button>
            </div>
          </motion.div>

          {/* Glass Stack: CLI + Schema Preview */}
          <div className="relative mx-auto mt-16 flex w-full max-w-3xl flex-col items-center justify-center">
            {/* Background Layer: JSON Schema (tilted, faded) */}
            <motion.div
              initial={{ opacity: 0, y: 40, rotate: 0 }}
              animate={{ opacity: 0.6, y: 0, rotate: -2 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ opacity: 1, rotate: 0 }}
              className="absolute top-0 w-full max-w-2xl scale-95 rounded-xl border border-border bg-card/50 p-1 shadow-xl backdrop-blur transition-all duration-500"
            >
              <div className="flex items-center gap-2 border-b border-border/50 px-4 py-2">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/40" />
                <span className="ml-2 font-mono text-[10px] text-muted-foreground/60">
                  theme-token.json
                </span>
              </div>
              <div className="relative">
                <JsonSyntax json={minimalSchema} className="rounded-b-lg text-xs opacity-80" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/80 to-transparent" />
              </div>
            </motion.div>

            {/* Foreground Layer: CLI Install (focused, glowing) */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative z-10 mt-32 w-full max-w-xl"
            >
              <div className="rounded-xl border border-primary/20 bg-background/90 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
                <div className="mb-2 flex items-center gap-2 px-2 pt-1">
                  <Terminal className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Install from Blockchain</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-4 py-3">
                  <code className="flex-1 overflow-x-auto font-mono text-sm">
                    <span className="select-none text-muted-foreground">$ </span>
                    <span className="text-primary">bunx</span>{" "}
                    <span className="text-foreground">shadcn@latest add</span>{" "}
                    <span className="text-muted-foreground">https://.../<span className="text-primary">[origin]</span>.json</span>
                  </code>
                  <button
                    onClick={copyCommand}
                    className="shrink-0 rounded-md border border-border bg-background p-2 text-muted-foreground shadow-sm transition-colors hover:text-foreground"
                    title="Copy command"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-3 text-center text-sm text-muted-foreground">
                Replace <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary">[origin]</code> with any theme&apos;s blockchain ID.{" "}
                <a href="/market" className="text-primary hover:underline">Browse themes</a> to find one.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Theme Gallery */}
      <ThemeGallery />

      {/* Why On-Chain Themes Section */}
      <section className="border-t border-border bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center"
          >
            <motion.p
              variants={fadeIn}
              className="font-mono text-sm text-primary"
            >
              // Why On-Chain Themes?
            </motion.p>
            <motion.h2
              variants={fadeIn}
              className="mb-4 text-3xl font-bold sm:text-4xl"
            >
              A New Paradigm for Design Assets
            </motion.h2>
            <motion.p
              variants={fadeIn}
              className="mx-auto mb-16 max-w-2xl text-muted-foreground"
            >
              Theme tokens bring the benefits of blockchain to design systems—
              provenance, ownership, and permissionless distribution.
            </motion.p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* For Designers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <Palette className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">For Designers</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                True ownership & monetization
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Lock className="mt-0.5 h-4 w-4 text-primary" />
                  <span>Authorship permanently recorded on-chain</span>
                </li>
                <li className="flex items-start gap-2">
                  <Wallet className="mt-0.5 h-4 w-4 text-primary" />
                  <span>Sell on any ordinal marketplace</span>
                </li>
                <li className="flex items-start gap-2">
                  <Globe className="mt-0.5 h-4 w-4 text-primary" />
                  <span>Direct, permissionless distribution</span>
                </li>
              </ul>
            </motion.div>

            {/* For Developers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">For Developers</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                ShadCN Registry Format
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Terminal className="mt-0.5 h-4 w-4 text-primary" />
                  <span>Install with bunx shadcn@latest add</span>
                </li>
                <li className="flex items-start gap-2">
                  <Layers className="mt-0.5 h-4 w-4 text-primary" />
                  <span>100% compatible with ShadCN ecosystem</span>
                </li>
                <li className="flex items-start gap-2">
                  <Globe className="mt-0.5 h-4 w-4 text-primary" />
                  <span>Decentralized, immutable theme CDN</span>
                </li>
              </ul>
            </motion.div>

            {/* For Users */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">For Users</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Portability & collection
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Palette className="mt-0.5 h-4 w-4 text-primary" />
                  <span>Buy once, use across all supported apps</span>
                </li>
                <li className="flex items-start gap-2">
                  <Layers className="mt-0.5 h-4 w-4 text-primary" />
                  <span>Collect rare, limited-edition themes</span>
                </li>
                <li className="flex items-start gap-2">
                  <Globe className="mt-0.5 h-4 w-4 text-primary" />
                  <span>Community-driven curation ecosystem</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <span className="font-semibold">Theme Token</span>
              <Badge variant="outline" className="ml-2">
                v1.0
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              An open standard. Use freely.
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/b-open-io/theme-token"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                GitHub
              </a>
              <a
                href="https://1satordinals.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                1Sat Ordinals
              </a>
              <a
                href="https://ui.shadcn.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ShadCN UI
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
