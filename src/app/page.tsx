"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JsonSyntax } from "@/components/json-syntax";
import { ThemeGallery } from "@/components/theme-gallery";
import { ThemeStudio } from "@/components/theme-studio";
import { ChainImplementations } from "@/components/chain-implementations";
import {
  Palette,
  Code2,
  Wallet,
  Globe,
  Lock,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";

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

// New simplified schema - tweakcn compatible
const minimalSchema = {
  $schema: "https://themetoken.dev/v1",
  label: "My Theme",
  author: "designer@paymail",
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

export default function Home() {
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
              Open Standard v1.0
            </Badge>

            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="block">Tokenize UI Themes</span>
              <span className="block text-primary">On Blockchain</span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              An open standard for inscribing{" "}
              <span className="font-semibold text-foreground">ShadCN UI</span> themes
              as NFT assets. Own, trade, and apply themes across any compatible
              application.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="gap-2" asChild>
                <a href="#studio">
                  <Sparkles className="h-5 w-5" />
                  Launch Studio
                </a>
              </Button>
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <a href="#schema">
                  Read the Spec
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </motion.div>

          {/* Animated Schema Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-16 max-w-2xl"
          >
            <div className="rounded-xl border border-border bg-card/50 p-1 shadow-2xl backdrop-blur">
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
                Universal & decentralized
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Layers className="mt-0.5 h-4 w-4 text-primary" />
                  <span>One standard, infinite community themes</span>
                </li>
                <li className="flex items-start gap-2">
                  <Globe className="mt-0.5 h-4 w-4 text-primary" />
                  <span>No central point of failure</span>
                </li>
                <li className="flex items-start gap-2">
                  <Code2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>Simple JSON schema, easy integration</span>
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

      {/* Schema Documentation */}
      <section id="schema" className="border-t border-border py-24">
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
              Built on ShadCN UI Standards
            </motion.h2>
            <motion.p variants={fadeIn} className="mb-12 max-w-2xl text-muted-foreground">
              Theme Token uses the same CSS custom properties that power thousands of
              ShadCN-based applications. If your app uses ShadCN UI, it&apos;s already
              compatible.
            </motion.p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Color Variables */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h3 className="font-semibold">19 Semantic Color Properties</h3>
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {[
                  ["background", "Page background"],
                  ["foreground", "Text color"],
                  ["primary", "Brand color"],
                  ["secondary", "Muted actions"],
                  ["muted", "Muted backgrounds"],
                  ["accent", "Highlights"],
                  ["destructive", "Error/danger"],
                  ["card", "Card surfaces"],
                  ["popover", "Dropdowns"],
                  ["border", "Borders"],
                  ["input", "Input borders"],
                  ["ring", "Focus rings"],
                ].map(([name, desc]) => (
                  <div
                    key={name}
                    className="flex items-center gap-2 rounded border border-border bg-muted/30 px-3 py-2"
                  >
                    <div
                      className="h-3 w-3 rounded-full border"
                      style={{ backgroundColor: `var(--${name})` }}
                    />
                    <span className="text-xs">{name}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Colors like <code className="rounded bg-muted px-1">primary</code>,{" "}
                <code className="rounded bg-muted px-1">card</code>, and{" "}
                <code className="rounded bg-muted px-1">destructive</code> include{" "}
                <code className="rounded bg-muted px-1">-foreground</code> variants for
                accessible text contrast. All values use{" "}
                <code className="rounded bg-muted px-1">oklch()</code> format.
              </p>
            </motion.div>

            {/* Schema Structure */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="mb-4 font-semibold">Full Schema Structure</h3>
              <JsonSyntax
                json={{
                  $schema: "https://themetoken.dev/v1/schema.json",
                  name: "My Theme",
                  author: "designer@paymail",
                  styles: {
                    light: {
                      background: "oklch(1 0 0)",
                      foreground: "oklch(0.145 0 0)",
                      primary: "oklch(0.55 0.22 255)",
                      "primary-foreground": "oklch(0.98 0 0)",
                      "...": "// 19 semantic colors + chart-1 to chart-5",
                      radius: "0.5rem",
                    },
                    dark: { "...": "// dark mode variants" },
                  },
                }}
                className="text-xs"
              />
              <p className="mt-3 text-xs text-muted-foreground">
                Directly compatible with{" "}
                <a href="https://tweakcn.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  tweakcn
                </a>{" "}
                and ShadCN UI. Uses flat kebab-case CSS property names.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Protocol Implementations */}
      <section className="border-t border-border bg-muted/30 py-24">
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

      {/* Theme Studio - Unified Preview & Mint */}
      <section id="studio" className="border-t border-border py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
            className="mb-12 text-center"
          >
            <motion.div
              variants={fadeIn}
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"
            >
              <Sparkles className="h-6 w-6 text-primary" />
            </motion.div>
            <motion.p
              variants={fadeIn}
              className="font-mono text-sm text-primary"
            >
              // Theme Studio
            </motion.p>
            <motion.h2
              variants={fadeIn}
              className="mb-4 text-3xl font-bold sm:text-4xl"
            >
              Build & Inscribe
            </motion.h2>
            <motion.p variants={fadeIn} className="mx-auto max-w-2xl text-muted-foreground">
              Design your theme, preview it live, and inscribe it permanently on the BSV blockchain.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <ThemeStudio />
          </motion.div>
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
