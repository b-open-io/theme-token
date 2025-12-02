"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Wallet, Tag } from "lucide-react";

const tabs = [
  { href: "/market/browse", label: "Browse Market", icon: ShoppingCart },
  { href: "/market/my-themes", label: "My Themes", icon: Wallet },
  { href: "/market/sell", label: "Sell Theme", icon: Tag },
];

export default function MarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Theme Token Market</h1>
          <p className="text-muted-foreground">
            Buy, sell, and trade theme tokens on the decentralized marketplace
          </p>
        </div>

        {/* Tab Navigation */}
        <nav className="mb-8 flex gap-2 rounded-lg bg-muted p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="mr-2 inline h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </div>
  );
}
