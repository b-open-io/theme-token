"use client";

import { motion } from "framer-motion";
import { JsonSyntax } from "@/components/json-syntax";
import { ChainImplementations } from "@/components/chain-implementations";

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
  return (
    <div className="min-h-screen bg-background">
      {/* Schema Documentation */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.p
              variants={fadeIn}
              className="font-mono text-sm text-primary"
            >
              // The Schema
            </motion.p>
            <motion.h1
              variants={fadeIn}
              className="mb-4 text-3xl font-bold sm:text-4xl"
            >
              Built on ShadCN UI Standards
            </motion.h1>
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
              animate={{ opacity: 1, x: 0 }}
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
                and ShadCN UI. Author field uses{" "}
                <a
                  href="https://docs.npmjs.com/cli/v10/configuring-npm/package-json#people-fields-author-contributors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  npm author format
                </a>
                .
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
