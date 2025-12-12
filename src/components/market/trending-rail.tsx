"use client";

import type { ThemeToken } from "@theme-token/sdk";
import { motion } from "framer-motion";
import { Flame, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useBsvRateContext } from "@/hooks/use-bsv-rate-context";
import type { ThemeWithChange } from "@/hooks/use-market-history";
import { formatBSV } from "./theme-stripes";
import { Skeleton } from "@/components/ui/skeleton";

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
	const { formatUsd } = useBsvRateContext();
	const usdPrice = formatUsd(item.price);

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.05 }}
		>
			<Link
				href={`/preview/${item.origin}`}
				className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/50"
			>
				{/* Top row: swatch + name + change */}
				<div className="mb-2 flex items-start gap-2">
					{/* Color swatch */}
					<div
						className="h-8 w-8 shrink-0 rounded-md shadow-sm"
						style={{
							background: `linear-gradient(135deg, ${styles.primary} 0%, ${styles.secondary || styles.accent} 100%)`,
						}}
					/>
					<div className="min-w-0 flex-1">
						<div className="flex items-start justify-between gap-1">
							<p className="truncate text-sm font-medium leading-tight">{item.theme.name}</p>
							{/* Change badge */}
							{hasChange && (
								<span
									className={`flex shrink-0 items-center gap-0.5 rounded px-1 py-0.5 font-mono text-[10px] font-medium ${
										isPositive
											? "bg-emerald-500/10 text-emerald-500"
											: "bg-rose-500/10 text-rose-500"
									}`}
								>
									{isPositive ? (
										<TrendingUp className="h-2.5 w-2.5" />
									) : (
										<TrendingDown className="h-2.5 w-2.5" />
									)}
									{isPositive ? "+" : ""}
									{item.priceChange24h?.toFixed(1)}%
								</span>
							)}
						</div>
						<p className="font-mono text-[10px] text-muted-foreground">
							{item.origin.slice(0, 8)}
						</p>
					</div>
				</div>

				{/* Color spectrum mini-bar */}
				<div className="mb-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full opacity-70 transition-opacity group-hover:opacity-100">
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
				<div className="mt-auto flex items-end justify-between gap-2">
					<span className="shrink-0 text-[10px] text-muted-foreground">Price</span>
					<div className="min-w-0 text-right">
						<span className="truncate font-mono text-sm font-bold">
							{usdPrice || `${formatBSV(item.price)} BSV`}
						</span>
						{usdPrice && (
							<span className="ml-1 font-mono text-[10px] text-muted-foreground">
								{formatBSV(item.price)}
							</span>
						)}
					</div>
				</div>
			</Link>
		</motion.div>
	);
}

export function TrendingRailSkeleton() {
	return (
		<section className="mb-8">
			<div className="mb-4 flex items-center gap-2">
				<Skeleton className="h-5 w-5" />
				<Skeleton className="h-5 w-32" />
				<Skeleton className="h-4 w-8" />
			</div>

			<div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 lg:grid-cols-5 xl:grid-cols-6">
				{Array.from({ length: 6 }).map((_, index) => (
					<div
						key={index}
						className="flex w-40 shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-card p-3 md:w-auto"
					>
						{/* Top row: swatch + name + change */}
						<div className="mb-2 flex items-start gap-2">
							<Skeleton className="h-8 w-8 shrink-0 rounded-md" />
							<div className="min-w-0 flex-1">
								<Skeleton className="mb-1 h-4 w-full" />
								<Skeleton className="h-3 w-16" />
							</div>
						</div>

						{/* Color spectrum mini-bar */}
						<Skeleton className="mb-2 h-1.5 w-full rounded-full" />

						{/* Bottom: price */}
						<div className="mt-auto flex items-end justify-between gap-2">
							<Skeleton className="h-3 w-8" />
							<Skeleton className="h-4 w-20" />
						</div>
					</div>
				))}
			</div>
		</section>
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

			<div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 lg:grid-cols-5 xl:grid-cols-6">
				{items.map((item, index) => (
					<div key={item.origin} className="w-40 shrink-0 md:w-auto">
						<TrendingCard
							item={item}
							mode={mode}
							index={index}
						/>
					</div>
				))}
			</div>
		</section>
	);
}
