"use client";

import Link from "next/link";
import { WalletConnect } from "@/components/wallet-connect";

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
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <ThemeTokenIcon className="h-6 w-6" />
          <span className="font-display text-lg font-semibold">Theme Token</span>
        </Link>
        <WalletConnect />
      </div>
    </header>
  );
}
