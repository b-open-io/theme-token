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
              ShadCN Registry Format
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

          {/* CLI Install - Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-12 max-w-3xl"
          >
            <div className="rounded-xl border border-primary/20 bg-card/80 p-6 shadow-2xl backdrop-blur">
              <div className="mb-4 flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                <span className="font-semibold">Install from Blockchain</span>
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
              <p className="mt-3 text-center text-sm text-muted-foreground">
                Replace <code className="rounded bg-muted px-1 font-mono">[origin]</code> with any theme&apos;s blockchain ID.{" "}
                <a href="/market" className="text-primary hover:underline">Browse themes</a> to find one.
              </p>
            </div>
          </motion.div>

          {/* Schema Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mx-auto mt-8 max-w-2xl"
          >
            <div className="rounded-xl border border-border bg-card/50 p-1 shadow-xl backdrop-blur">
              <div className="flex items-center gap-2 border-b border-border px-4 py-2">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-green-500/60" />
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  theme-token.json
                </span>
              </div>
              <JsonSyntax json={minimalSchema} className="rounded-b-lg text-sm" />
            </div>
          </motion.div>
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
