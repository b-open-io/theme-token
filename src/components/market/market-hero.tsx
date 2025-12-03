"use client";

import type { ThemeToken } from "@theme-token/sdk";
import { motion } from "framer-motion";
import { Loader2, ShoppingCart, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { MarketStats, ThemeWithChange } from "@/lib/market-history";
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

function StatCard({
	label,
	value,
	change,
	prefix,
}: {
	label: string;
	value: string | number;
	change?: number | null;
	prefix?: string;
}) {
	return (
		<div className="rounded-lg border border-border bg-card/50 p-4">
			<p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
				{label}
			</p>
			<p className="mt-1 font-mono text-xl font-bold text-foreground">
				{prefix}
				{value}
			</p>
			{change !== null && change !== undefined && (
				<div
					className={`mt-1 flex items-center gap-1 text-xs font-medium ${
						change >= 0 ? "text-emerald-500" : "text-rose-500"
					}`}
				>
					{change >= 0 ? (
						<TrendingUp className="h-3 w-3" />
					) : (
						<TrendingDown className="h-3 w-3" />
					)}
					<span>
						{change >= 0 ? "+" : ""}
						{change.toFixed(1)}%
					</span>
					<span className="text-muted-foreground">24h</span>
				</div>
			)}
		</div>
	);
}

export function MarketHero({
	stats,
	featured,
	mode,
	isLoading,
	isConnected,
	onPurchase,
	onConnect,
	onApplyTheme,
}: MarketHeroProps) {
	if (isLoading) {
		return (
			<div className="mb-8 flex h-64 items-center justify-center rounded-xl border border-border bg-card/30">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!stats || stats.totalListings === 0) {
		return null;
	}

	const featuredTheme = featured?.theme;
	const featuredStyles = featuredTheme?.styles[mode];

	return (
		<section className="mb-8">
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
				{/* Left: Market Stats Panel */}
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					className="flex flex-col justify-between rounded-xl border border-border bg-card/30 p-6 backdrop-blur-sm lg:col-span-4"
				>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Theme Market</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							Trade verified ShadCN UI palettes on-chain.
						</p>
					</div>

					<div className="mt-6 grid grid-cols-2 gap-3">
						<StatCard
							label="Total Themes"
							value={stats.totalListings}
						/>
						<StatCard
							label="Floor Price"
							value={formatBSV(stats.floorPrice)}
							change={stats.floorPriceChange24h}
							prefix=""
						/>
					</div>
				</motion.div>

				{/* Right: Featured Theme Spotlight */}
				{featuredTheme && featuredStyles && (
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.1 }}
						className="group relative overflow-hidden rounded-xl border border-border bg-card lg:col-span-8"
					>
						{/* Gradient glow background from theme colors */}
						<div
							className="absolute inset-0 opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
							style={{
								background: `linear-gradient(135deg, ${featuredStyles.primary}, ${featuredStyles.secondary || featuredStyles.accent})`,
							}}
						/>

						<div className="relative flex h-full flex-col gap-6 p-6 md:flex-row md:items-center md:gap-8">
							{/* Theme Preview */}
							<button
								type="button"
								onClick={onApplyTheme}
								className="flex-1 cursor-pointer"
							>
								<div
									className="aspect-video w-full overflow-hidden rounded-lg border shadow-2xl"
									style={{
										backgroundColor: featuredStyles.background,
										borderColor: featuredStyles.border,
									}}
								>
									{/* Mini UI mockup */}
									<div className="flex h-full flex-col p-4">
										{/* Header bar */}
										<div
											className="mb-3 flex items-center justify-between border-b pb-2"
											style={{ borderColor: featuredStyles.border }}
										>
											<div
												className="h-2 w-20 rounded"
												style={{
													backgroundColor: featuredStyles["muted-foreground"],
													opacity: 0.4,
												}}
											/>
											<div className="flex gap-1.5">
												<div
													className="h-3 w-3 rounded-full"
													style={{ backgroundColor: featuredStyles.primary }}
												/>
												<div
													className="h-3 w-3 rounded-full"
													style={{ backgroundColor: featuredStyles.secondary }}
												/>
												<div
													className="h-3 w-3 rounded-full"
													style={{ backgroundColor: featuredStyles.accent }}
												/>
											</div>
										</div>

										{/* Content area */}
										<div className="flex flex-1 gap-3">
											{/* Sidebar */}
											<div
												className="hidden w-1/4 rounded md:block"
												style={{ backgroundColor: featuredStyles.muted }}
											/>
											{/* Main */}
											<div className="flex flex-1 flex-col gap-2">
												<div
													className="h-8 w-full rounded"
													style={{
														backgroundColor: featuredStyles.card,
														border: `1px solid ${featuredStyles.border}`,
													}}
												/>
												<div className="flex gap-2">
													<div
														className="h-8 flex-1 rounded"
														style={{ backgroundColor: featuredStyles.secondary }}
													/>
													<div
														className="h-8 flex-[2] rounded"
														style={{ backgroundColor: featuredStyles.primary }}
													/>
												</div>
											</div>
										</div>

										{/* Color spectrum bar */}
										<div className="mt-3 flex h-2 gap-1 overflow-hidden rounded">
											{["primary", "secondary", "accent", "muted"].map(
												(color) => (
													<div
														key={color}
														className="flex-1"
														style={{
															backgroundColor:
																featuredStyles[
																	color as keyof typeof featuredStyles
																],
														}}
													/>
												),
											)}
										</div>
									</div>
								</div>

								{/* Hover overlay */}
								<div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 opacity-0 transition-all group-hover:bg-black/10 group-hover:opacity-100">
									<span className="flex items-center gap-2 rounded-full bg-background/90 px-4 py-2 text-sm font-medium">
										<Sparkles className="h-4 w-4" />
										Apply Theme
									</span>
								</div>
							</button>

							{/* CTA Section */}
							<div className="flex-shrink-0 md:w-56">
								<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
									<Sparkles className="h-3 w-3" />
									Featured
								</div>
								<h2 className="text-2xl font-bold">{featuredTheme.name}</h2>
								<p className="mt-1 text-sm text-muted-foreground">
									{featuredTheme.author
										? `by ${featuredTheme.author}`
										: "Anonymous"}
								</p>

								{featured && (
									<p className="mt-2 font-mono text-lg font-bold">
										{formatBSV(featured.price)} BSV
									</p>
								)}

								<div className="mt-4 flex flex-col gap-2">
									<Button
										className="w-full"
										onClick={() =>
											isConnected ? onPurchase?.() : onConnect()
										}
									>
										<ShoppingCart className="mr-2 h-4 w-4" />
										{isConnected ? "Buy Now" : "Connect to Buy"}
									</Button>
									{featured && (
										<Button variant="outline" className="w-full" asChild>
											<Link href={`/preview/${featured.origin}`}>
												View Details
											</Link>
										</Button>
									)}
								</div>
							</div>
						</div>
					</motion.div>
				)}
			</div>
		</section>
	);
}
