"use client";

import type { ThemeToken } from "@theme-token/sdk";
import { motion } from "framer-motion";
import { Check, Copy, ExternalLink, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import useSound from "use-sound";
import { Button } from "@/components/ui/button";
import { ConfettiExplosion } from "@/components/ui/confetti";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InscribedSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  txid: string;
  theme: ThemeToken;
}

// Holographic sheen sweep effect
function CardSheen() {
  return (
    <motion.div
      initial={{ x: "-100%", opacity: 0 }}
      animate={{ x: "200%", opacity: [0, 0.6, 0] }}
      transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
      className="pointer-events-none absolute inset-0 z-20"
      style={{
        background:
          "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.5) 50%, transparent 80%)",
      }}
    />
  );
}

// Mini preview showing light/dark split
function ThemePreviewCard({ theme }: { theme: ThemeToken }) {
  const light = theme.styles.light;
  const dark = theme.styles.dark;

  return (
    <div
      className="relative h-24 w-full overflow-hidden rounded-lg border shadow-md"
      style={{ borderColor: light.border }}
    >
      <div className="absolute inset-0 flex">
        {/* Light Side */}
        <div
          className="flex flex-1 flex-col gap-1.5 p-2.5"
          style={{ backgroundColor: light.background }}
        >
          <div
            className="h-1.5 w-2/3 rounded-full opacity-30"
            style={{ backgroundColor: light.foreground }}
          />
          <div
            className="flex h-5 w-full items-center justify-center rounded text-[9px] font-bold shadow-sm"
            style={{
              backgroundColor: light.primary,
              color: light["primary-foreground"] || light.background,
            }}
          >
            Button
          </div>
          <div
            className="h-1.5 w-1/2 rounded-full opacity-20"
            style={{ backgroundColor: light.foreground }}
          />
        </div>

        {/* Dark Side */}
        <div
          className="flex flex-1 flex-col gap-1.5 p-2.5"
          style={{ backgroundColor: dark.background }}
        >
          <div
            className="h-1.5 w-2/3 rounded-full opacity-30"
            style={{ backgroundColor: dark.foreground }}
          />
          <div
            className="flex h-5 w-full items-center justify-center rounded border text-[9px] font-bold"
            style={{
              borderColor: dark.border,
              color: dark.foreground,
            }}
          >
            Outline
          </div>
          <div
            className="h-1.5 w-1/2 rounded-full opacity-20"
            style={{ backgroundColor: dark.foreground }}
          />
        </div>
      </div>

      {/* Theme name badge */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-center backdrop-blur-sm">
        <span className="text-[9px] font-medium uppercase tracking-widest text-white">
          {theme.name}
        </span>
      </div>

      {/* Holographic sheen sweep */}
      <CardSheen />
    </div>
  );
}

// X/Twitter icon
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function InscribedSuccessModal({
  isOpen,
  onClose,
  txid,
  theme,
}: InscribedSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  // Success chime sound
  const [playSuccess] = useSound("/sounds/success.mp3", { volume: 0.5 });

  // Play sound when modal opens
  useEffect(() => {
    if (isOpen) {
      playSuccess();
    }
  }, [isOpen, playSuccess]);

  const origin = `${txid}_0`;
  const installUrl = `https://themetoken.dev/r/themes/${origin}.json`;
  const installCommand = `bunx shadcn@latest add ${installUrl}`;
  const marketUrl = `https://1sat.market/outpoint/${origin}`;
  const themePageUrl = `https://themetoken.dev/preview/${origin}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const text = `I just inscribed "${theme.name}" as a Theme Token on BSV! Install it in your project:\n\n${installCommand}\n\n`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(themePageUrl)}`,
      "_blank",
    );
  };

  const primaryColor = theme.styles.light.primary;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-md overflow-hidden"
        showCloseButton={false}
      >
        {/* Magical glow background using theme's primary color */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20 blur-3xl"
          style={{
            background: `radial-gradient(circle at center, ${primaryColor}, transparent 70%)`,
          }}
        />

        {isOpen && <ConfettiExplosion styles={theme.styles} />}

        {/* Header with animated icon */}
        <DialogHeader className="relative z-10 items-center text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12 }}
            className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/50 shadow-inner"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="h-7 w-7" style={{ color: primaryColor }} />
            </motion.div>
          </motion.div>

          <DialogTitle className="text-xl">Theme Inscribed!</DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-foreground">{theme.name}</span>{" "}
            is now permanently on the blockchain.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content area */}
        <ScrollArea className="relative z-10 max-h-[50vh]">
          <div className="space-y-4 px-1">
            {/* Theme preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <ThemePreviewCard theme={theme} />
            </motion.div>

            {/* Install command */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Install via CLI
              </label>
              <div className="group relative rounded-md border bg-muted/50">
                <div className="overflow-x-auto p-3 pr-10">
                  <code className="block whitespace-nowrap font-mono text-xs">
                    {installCommand}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded transition-colors hover:bg-background"
                  title="Copy command"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Origin ID */}
            <motion.p
              className="truncate text-[10px] text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              Origin: <span className="font-mono">{origin}</span>
            </motion.p>
          </div>
        </ScrollArea>

        {/* Footer with actions */}
        <DialogFooter className="relative z-10 flex-col gap-2 sm:flex-col">
          <motion.div
            className="flex w-full gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button onClick={handleShare} variant="default" className="flex-1 gap-2">
              <XIcon className="h-4 w-4 shrink-0" />
              <span>Share</span>
            </Button>
            <Button asChild variant="outline" className="flex-1 gap-2">
              <a href={marketUrl} target="_blank" rel="noopener noreferrer">
                <span>Market</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </Button>
          </motion.div>
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-muted-foreground"
          >
            Create Another Theme
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
