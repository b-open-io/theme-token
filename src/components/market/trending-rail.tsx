"use client";

import type { ThemeToken } from "@theme-token/sdk";
import { motion } from "framer-motion";
import { Flame, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { ThemeWithChange } from "@/hooks/use-market-history";
import { formatBSV } from "./theme-stripes";

interface TrendingItem extends ThemeWithChange {
	theme: ThemeToken;
}

interface TrendingRailProps {
	items: TrendingItem[];
	mode: "light" | "dark";
}

function TrendingCard({
	item,
	mode,
	index,
}: {
	item: TrendingItem;
	mode: "light" | "dark";
	index: number;
}) {
	const styles = item.theme.styles[mode];
	const hasChange = item.priceChange24h !== null;
	const isPositive = (item.priceChange24h ?? 0) >= 0;

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.05 }}
		>
			<Link
				href={`/preview/${item.origin}`}
				className="group flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
			>
				{/* Top row: swatch + name + change */}
				<div className="mb-3 flex items-start justify-between gap-2">
					<div className="flex items-center gap-2">
						{/* Color swatch */}
						<div
							className="h-8 w-8 rounded-md shadow-sm"
							style={{
								background: `linear-gradient(135deg, ${styles.primary} 0%, ${styles.secondary || styles.accent} 100%)`,
							}}
						/>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium">{item.theme.name}</p>
							<p className="font-mono text-[10px] text-muted-foreground">
								{item.origin.slice(0, 8)}
							</p>
						</div>
					</div>

					{/* Change badge */}
					{hasChange && (
						<span
							className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-xs font-medium ${
								isPositive
									? "bg-emerald-500/10 text-emerald-500"
									: "bg-rose-500/10 text-rose-500"
							}`}
						>
							{isPositive ? (
								<TrendingUp className="h-3 w-3" />
							) : (
								<TrendingDown className="h-3 w-3" />
							)}
							{isPositive ? "+" : ""}
							{item.priceChange24h?.toFixed(1)}%
						</span>
					)}
				</div>

				{/* Color spectrum mini-bar */}
				<div className="mb-3 flex h-1.5 gap-0.5 overflow-hidden rounded-full opacity-70 transition-opacity group-hover:opacity-100">
					{["primary", "secondary", "accent", "muted"].map((color) => (
						<div
							key={color}
							className="flex-1"
							style={{
								backgroundColor: styles[color as keyof typeof styles],
							}}
						/>
					))}
				</div>

				{/* Bottom: price */}
				<div className="flex items-end justify-between">
					<span className="text-[10px] text-muted-foreground">Price</span>
					<span className="font-mono text-sm font-bold">
						{formatBSV(item.price)} BSV
					</span>
				</div>
			</Link>
		</motion.div>
	);
}

export function TrendingRail({ items, mode }: TrendingRailProps) {
	if (items.length === 0) {
		return null;
	}

	return (
		<section className="mb-8">
			<div className="mb-4 flex items-center gap-2">
				<Flame className="h-5 w-5 text-orange-500" />
				<h3 className="text-lg font-semibold">Market Movers</h3>
				<span className="text-sm text-muted-foreground">24h</span>
			</div>

			<div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
				{items.map((item, index) => (
					<TrendingCard
						key={item.origin}
						item={item}
						mode={mode}
						index={index}
					/>
				))}
			</div>
		</section>
	);
}
