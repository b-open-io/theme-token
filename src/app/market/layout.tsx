"use client";

import {
	motion,
	useMotionValue,
	useSpring,
	useTransform,
} from "framer-motion";
import { Image, ShoppingCart, Tag, Type, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useMemo } from "react";
import { BsvRateProvider, useBsvRateContext } from "@/hooks/use-bsv-rate-context";
import { fetchThemeMarketListings, fetchFontMarketListings, type ThemeMarketListing, type FontMarketListing } from "@/lib/yours-wallet";
import { featureFlags } from "@/lib/feature-flags";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Marketplace | Buy & Sell On-Chain Themes",
	description:
		"Decentralized marketplace for ShadCN themes, fonts, and assets. Buy, sell, and trade immutable design tokens.",
	keywords: [
		"Theme Marketplace",
		"Buy Themes",
		"Sell Themes",
		"On-Chain Assets",
		"ShadCN UI",
		"Bitcoin SV",
		"Digital Artifacts",
	],
	openGraph: {
		title: "Marketplace | Buy & Sell On-Chain Themes",
		description:
			"Decentralized marketplace for ShadCN themes, fonts, and assets. Buy, sell, and trade immutable design tokens.",
		images: ["/og/market.png"],
	},
	twitter: {
		card: "summary_large_image",
		title: "Marketplace | Buy & Sell On-Chain Themes",
		description:
			"Decentralized marketplace for ShadCN themes, fonts, and assets. Buy, sell, and trade immutable design tokens.",
		images: ["/og/market.png"],
	},
};

const allTabs = [
	{ href: "/market/browse", label: "Themes", icon: ShoppingCart, feature: null },
	{ href: "/market/fonts", label: "Fonts", icon: Type, feature: "fonts" as const },
	{ href: "/market/images", label: "Images", icon: Image, feature: "images" as const },
	{ href: "/market/my-themes", label: "My Themes", icon: Wallet, feature: null },
	{ href: "/market/my-fonts", label: "My Fonts", icon: Type, feature: "fonts" as const },
	{ href: "/market/sell", label: "Sell", icon: Tag, feature: null },
];

// Format satoshis as BSV
function formatBSV(sats: number): string {
	const bsv = sats / 100_000_000;
	if (bsv < 0.001) return bsv.toFixed(8);
	if (bsv < 1) return bsv.toFixed(4);
	return bsv.toFixed(2);
}

function MarketLayoutInner({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const barRef = useRef<HTMLDivElement>(null);
	const [themeListings, setThemeListings] = useState<ThemeMarketListing[]>([]);
	const [fontListings, setFontListings] = useState<FontMarketListing[]>([]);
	const { formatUsd } = useBsvRateContext();

	// Filter tabs based on feature flags
	const tabs = useMemo(
		() =>
			allTabs.filter(
				(tab) => tab.feature === null || featureFlags[tab.feature],
			),
		[],
	);

	// Mouse tracking for spotlight effect
	const mouseX = useMotionValue(0);
	const smoothMouseX = useSpring(mouseX, { stiffness: 400, damping: 40 });
	// Center the 400px spotlight on cursor
	const spotlightX = useTransform(smoothMouseX, (x) => x - 200);

	// Global mouse tracking - calculate position relative to the gradient bar
	useEffect(() => {
		function handleMouseMove(e: MouseEvent) {
			if (barRef.current) {
				const rect = barRef.current.getBoundingClientRect();
				const relativeX = e.clientX - rect.left;
				mouseX.set(relativeX);
			}
		}

		window.addEventListener("mousemove", handleMouseMove);
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, [mouseX]);

	// Fetch listings directly
	useEffect(() => {
		async function loadListings() {
			try {
				const [themes, fonts] = await Promise.all([
					fetchThemeMarketListings(),
					fetchFontMarketListings(),
				]);
				setThemeListings(themes);
				setFontListings(fonts);
			} catch (error) {
				console.error("[MarketLayout] Failed to fetch listings:", error);
			}
		}
		loadListings();
	}, []);

	// Compute stats based on current tab
	const getStats = () => {
		if (pathname?.includes("/fonts")) {
			return { listings: fontListings, label: "fonts" };
		}
		if (pathname?.includes("/images")) {
			// No image listings yet
			return { listings: [], label: "images" };
		}
		// Default to themes (browse, my-themes, sell)
		return { listings: themeListings, label: "themes" };
	};

	const { listings, label } = getStats();
	const totalCount = listings.length;
	const floorPrice = listings.length > 0 ? Math.min(...listings.map(l => l.price)) : 0;

	return (
		<div className="flex min-h-0 flex-1 flex-col bg-background">
			{/* Terminal-style Header - responsive layout */}
			<header className="sticky top-14 z-40 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="mx-auto max-w-[1400px] px-4">
					{/* Row: Title + Tabs + Stats */}
					<div className="flex h-11 items-center gap-2 sm:gap-6">
						{/* Terminal-style title - hidden on mobile */}
						<h1 className="hidden font-mono text-sm font-medium tracking-tight text-foreground/90 sm:block">
							<span className="text-primary">$</span> theme-market
						</h1>

						{/* Divider - hidden on mobile */}
						<div className="hidden h-4 w-px bg-border sm:block" />

						{/* Tab Navigation */}
						<nav className="flex items-center gap-0.5 sm:gap-1">
							{tabs.map((tab) => {
								const Icon = tab.icon;
								const isActive =
									pathname === tab.href ||
									(tab.href === "/market/browse" && pathname === "/market");
								return (
									<Link
										key={tab.href}
										href={tab.href}
										className={`relative flex items-center gap-1 rounded-md px-2 py-1.5 font-mono text-xs transition-colors sm:gap-1.5 sm:px-3 ${
											isActive
												? "text-foreground"
												: "text-muted-foreground hover:text-foreground/80"
										}`}
									>
										{isActive && (
											<motion.div
												layoutId="market-active-tab"
												className="absolute inset-0 rounded-md bg-muted/60"
												transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
											/>
										)}
										<Icon className="relative z-10 h-3.5 w-3.5" />
										<span className="relative z-10 hidden sm:inline">
											{tab.label}
										</span>
									</Link>
								);
							})}
						</nav>

						{/* Stats - pushed to right, always visible */}
						<div className="ml-auto flex items-center gap-2 font-mono text-xs sm:gap-4">
							<div className="flex items-center gap-1 sm:gap-1.5">
								<span className="text-muted-foreground">{totalCount}</span>
								<span className="text-muted-foreground/60">{label}</span>
							</div>
							<div className="flex items-center gap-1 sm:gap-1.5">
								<span className="hidden text-muted-foreground/60 sm:inline">floor</span>
								<span className="tabular-nums text-foreground">
									{totalCount > 0 ? (formatUsd(floorPrice) || formatBSV(floorPrice)) : "$0.00"}
								</span>
							</div>
						</div>
					</div>

					{/* Animated Gradient Bar with Spotlight */}
					<div
						ref={barRef}
						className="relative h-0.5 w-full overflow-hidden"
					>
						{/* Base: Dim animated gradient */}
						<motion.div
							className="absolute inset-0 opacity-30"
							style={{
								backgroundImage:
									"linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--secondary)), hsl(var(--primary)))",
								backgroundSize: "300% 100%",
							}}
							animate={{
								backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
							}}
							transition={{
								duration: 12,
								ease: "linear",
								repeat: Number.POSITIVE_INFINITY,
							}}
						/>

						{/* Spotlight: Bright gradient that follows mouse */}
						<motion.div
							className="pointer-events-none absolute inset-y-0 w-[400px]"
							style={{
								x: spotlightX,
								background:
									"linear-gradient(90deg, transparent 0%, hsl(var(--primary)) 20%, hsl(var(--accent)) 40%, white 50%, hsl(var(--accent)) 60%, hsl(var(--primary)) 80%, transparent 100%)",
							}}
						/>
					</div>
				</div>
			</header>

			{/* Content */}
			<div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 overflow-x-hidden">
				{children}
			</div>
		</div>
	);
}

export default function MarketLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<BsvRateProvider>
			<MarketLayoutInner>{children}</MarketLayoutInner>
		</BsvRateProvider>
	);
}
