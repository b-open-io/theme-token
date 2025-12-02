"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { ThemeStudio } from "@/components/theme-studio";
import { Sparkles, Loader2 } from "lucide-react";

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

export default function StudioPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <motion.div
          initial="initial"
          animate="animate"
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
          <motion.h1
            variants={fadeIn}
            className="mb-4 text-3xl font-bold sm:text-4xl"
          >
            Build & Inscribe
          </motion.h1>
          <motion.p variants={fadeIn} className="mx-auto max-w-2xl text-muted-foreground">
            Design your theme, preview it live, and inscribe it permanently on the BSV blockchain.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Suspense
            fallback={
              <div className="flex h-96 items-center justify-center rounded-xl border border-border bg-card">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <ThemeStudio />
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
}
