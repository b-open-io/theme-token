"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WalletConnect } from "@/components/wallet-connect";
import { Github, Star } from "lucide-react";

function useGitHubStars() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://api.github.com/repos/b-open-io/theme-token")
      .then((res) => res.json())
      .then((data) => {
        if (data.stargazers_count !== undefined) {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => {
        // Ignore errors
      });
  }, []);

  return stars;
}

function ThemeTokenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="themeTokenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A159B"/>
          <stop offset="50%" stopColor="#A63BDE"/>
          <stop offset="100%" stopColor="#31D7D0"/>
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="44" height="44" rx="10" transform="rotate(-15 32 32)" fill="url(#themeTokenGradient)"/>
      <rect x="15" y="15" width="34" height="34" rx="8" transform="rotate(0 32 32)" fill="#A63BDE"/>
      <rect x="20" y="20" width="24" height="24" rx="6" transform="rotate(15 32 32)" fill="#31D7D0"/>
    </svg>
  );
}

export function Header() {
  const stars = useGitHubStars();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <ThemeTokenIcon className="h-6 w-6" />
          <span className="font-display text-lg font-semibold">Theme Token</span>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/#schema"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Spec
          </Link>
          <Link
            href="/#studio"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Studio
          </Link>
          <Link
            href="/market"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Market
          </Link>
        </nav>

        {/* Right Side: GitHub + Wallet */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/b-open-io/theme-token"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Github className="h-4 w-4" />
            <Star className="h-3 w-3" />
            {stars !== null && (
              <span className="font-medium">{stars}</span>
            )}
          </a>
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
