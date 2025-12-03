"use client";

import type { ThemeToken } from "@theme-token/sdk";
import { motion } from "framer-motion";
import { Loader2, TrendingUp } from "lucide-react";
import type { MarketStats, ThemeWithChange } from "@/hooks/use-market-history";
import { formatBSV } from "./theme-stripes";

interface MarketHeroProps {
	stats: MarketStats | null;
	featured:
		| (ThemeWithChange & {
				theme: ThemeToken;
		  })
		| null;
	mode: "light" | "dark";
	isLoading: boolean;
	isConnected: boolean;
	onPurchase?: () => void;
	onConnect: () => void;
	onApplyTheme?: (e: React.MouseEvent) => void;
}

export function MarketHero({
	stats,
	featured,
	mode,
	isLoading,
}: MarketHeroProps) {
	const featuredTheme = featured?.theme;
	const featuredStyles = featuredTheme?.styles[mode];

	// Extract gradient colors from featured theme
	const gradientColors = featuredStyles
		? [
				featuredStyles.primary,
				featuredStyles.secondary || featuredStyles.accent,
				featuredStyles.accent,
				featuredStyles.primary,
		  ]
		: ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--primary))"];

	return (
		<header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container">
				<div className="flex h-20 items-center justify-between">
					{/* Left: Title */}
					<h1 className="text-2xl font-bold tracking-tight">Theme Market</h1>

					{/* Right: Stats Bar */}
					<div className="flex divide-x divide-border font-mono text-sm">
						{isLoading ? (
							<div className="flex items-center gap-2 px-4">
								<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
								<span className="text-muted-foreground">Loading...</span>
							</div>
						) : stats ? (
							<>
								{/* Total Themes */}
								<div className="flex flex-col justify-center px-4">
									<div className="text-[10px] uppercase tracking-wider text-muted-foreground">
										Total Themes
									</div>
									<div className="text-lg font-bold tabular-nums">
										{stats.totalListings}
									</div>
								</div>

								{/* Floor Price */}
								<div className="flex flex-col justify-center px-4">
									<div className="text-[10px] uppercase tracking-wider text-muted-foreground">
										Floor Price
									</div>
									<div className="flex items-baseline gap-1.5">
										<span className="text-lg font-bold tabular-nums">
											{formatBSV(stats.floorPrice)}
										</span>
										<span className="text-xs text-muted-foreground">BSV</span>
									</div>
								</div>

								{/* Trending Indicator */}
								{stats.floorPriceChange24h !== null &&
									stats.floorPriceChange24h !== undefined && (
										<div className="flex flex-col justify-center px-4">
											<div className="text-[10px] uppercase tracking-wider text-muted-foreground">
												24h Change
											</div>
											<div
												className={`flex items-center gap-1 text-lg font-bold tabular-nums ${
													stats.floorPriceChange24h >= 0
														? "text-emerald-500"
														: "text-rose-500"
												}`}
											>
												{stats.floorPriceChange24h >= 0 && (
													<TrendingUp className="h-3.5 w-3.5" />
												)}
												<span>
													{stats.floorPriceChange24h >= 0 ? "+" : ""}
													{stats.floorPriceChange24h.toFixed(1)}%
												</span>
											</div>
										</div>
									)}
							</>
						) : null}
					</div>
				</div>
			</div>

			{/* Animated Gradient Bar */}
			<motion.div
				className="h-1 w-full"
				style={{
					backgroundImage: `linear-gradient(90deg, ${gradientColors.join(", ")})`,
					backgroundSize: "200% 100%",
				}}
				animate={{
					backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
				}}
				transition={{
					duration: 8,
					ease: "linear",
					repeat: Number.POSITIVE_INFINITY,
				}}
			/>
		</header>
	);
}
