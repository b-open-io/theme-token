"use client";

import type { ThemeToken } from "@theme-token/sdk";
import {
	ExternalLink,
	Loader2,
	ShoppingCart,
	Sparkles,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatBSV } from "./theme-stripes";

interface ThemeCardProps {
	theme: ThemeToken;
	origin: string;
	price: number;
	mode: "light" | "dark";
	isConnected: boolean;
	isPurchasing: boolean;
	onPurchase: () => void;
	onConnect: () => void;
	onApplyTheme?: (e: React.MouseEvent) => void;
	priceChange?: number | null;
}

export function ThemeCard({
	theme,
	origin,
	price,
	mode,
	isConnected,
	isPurchasing,
	onPurchase,
	onConnect,
	onApplyTheme,
	priceChange,
}: ThemeCardProps) {
	const styles = theme.styles[mode];
	const hasChange = priceChange !== null && priceChange !== undefined;
	const isPositive = (priceChange ?? 0) >= 0;

	// Build CSS custom properties from theme
	const themeVars = {
		"--background": styles.background,
		"--foreground": styles.foreground,
		"--card": styles.card,
		"--card-foreground": styles["card-foreground"],
		"--primary": styles.primary,
		"--primary-foreground": styles["primary-foreground"],
		"--secondary": styles.secondary,
		"--secondary-foreground": styles["secondary-foreground"],
		"--muted": styles.muted,
		"--muted-foreground": styles["muted-foreground"],
		"--accent": styles.accent,
		"--accent-foreground": styles["accent-foreground"],
		"--border": styles.border,
		"--input": styles.input,
		"--radius": styles.radius || "0.5rem",
	} as React.CSSProperties;

	return (
		<div className="group flex flex-col gap-3">
			{/* Live Preview Area - Click to apply theme */}
			<button
				type="button"
				onClick={onApplyTheme}
				className="text-left"
			>
				<div
					style={themeVars}
					className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border shadow-sm transition-all group-hover:shadow-lg cursor-pointer"
				>
					{/* Background */}
					<div
						className="absolute inset-0"
						style={{ backgroundColor: "var(--background)" }}
					/>

					{/* Mini UI Simulation */}
					<div className="absolute inset-0 p-4 flex flex-col gap-3 select-none">
						{/* Mock Header */}
						<div
							className="flex items-center justify-between border-b pb-2"
							style={{ borderColor: "var(--border)" }}
						>
							<div
								className="h-2 w-14 rounded-full"
								style={{
									backgroundColor: "var(--muted-foreground)",
									opacity: 0.3,
								}}
							/>
							<div className="flex gap-1.5">
								<div
									className="h-3 w-3 rounded-full"
									style={{ backgroundColor: "var(--primary)" }}
								/>
								<div
									className="h-3 w-3 rounded-full"
									style={{ backgroundColor: "var(--secondary)" }}
								/>
							</div>
						</div>

						{/* Mock Content */}
						<div className="flex-1 space-y-2">
							{/* Input mock */}
							<div
								className="h-8 w-full border"
								style={{
									borderColor: "var(--input)",
									borderRadius: "var(--radius)",
									backgroundColor: "transparent",
								}}
							/>

							{/* Buttons row */}
							<div className="flex gap-2">
								<div
									className="h-8 flex-1"
									style={{
										backgroundColor: "var(--secondary)",
										borderRadius: "var(--radius)",
									}}
								/>
								<div
									className="h-8 flex-[2] flex items-center justify-center text-[10px] font-medium"
									style={{
										backgroundColor: "var(--primary)",
										color: "var(--primary-foreground)",
										borderRadius: "var(--radius)",
									}}
								>
									Action
								</div>
							</div>

							{/* Card mock */}
							<div
								className="p-2 border"
								style={{
									backgroundColor: "var(--card)",
									borderColor: "var(--border)",
									borderRadius: "var(--radius)",
								}}
							>
								<div
									className="h-2 w-16 rounded mb-1"
									style={{
										backgroundColor: "var(--foreground)",
										opacity: 0.8,
									}}
								/>
								<div
									className="h-1.5 w-24 rounded"
									style={{
										backgroundColor: "var(--muted-foreground)",
										opacity: 0.5,
									}}
								/>
							</div>
						</div>

						{/* Spectrum bar at bottom - animated on hover */}
						<div className="flex h-2 gap-0.5 overflow-hidden rounded">
							{["primary", "secondary", "accent", "muted"].map((color) => (
								<div
									key={color}
									className="flex-1 transition-all duration-300 group-hover:first:flex-[2] group-hover:last:flex-[0.5]"
									style={{ backgroundColor: `var(--${color})` }}
								/>
							))}
						</div>
					</div>

					{/* Hover overlay */}
					<div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/20">
						<div className="flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100">
							<Sparkles className="h-4 w-4" />
							Apply Theme
						</div>
					</div>
				</div>
			</button>

			{/* Metadata */}
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0 flex-1">
					<h3 className="font-semibold text-sm truncate">{theme.name}</h3>
					<p className="text-xs text-muted-foreground">
						{theme.author || "Anonymous"} &middot;{" "}
						<span className="font-mono">{origin.slice(0, 8)}</span>
					</p>
				</div>
				<div className="text-right">
					<p className="font-mono text-sm font-semibold">
						{formatBSV(price)} BSV
					</p>
					{hasChange && (
						<span
							className={`inline-flex items-center gap-0.5 font-mono text-[10px] font-medium ${
								isPositive ? "text-emerald-500" : "text-rose-500"
							}`}
						>
							{isPositive ? (
								<TrendingUp className="h-2.5 w-2.5" />
							) : (
								<TrendingDown className="h-2.5 w-2.5" />
							)}
							{isPositive ? "+" : ""}
							{priceChange?.toFixed(1)}%
						</span>
					)}
				</div>
			</div>

			{/* Actions */}
			<div className="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					className="flex-1"
					asChild
				>
					<Link href={`/preview/${origin}`}>
						<ExternalLink className="mr-1.5 h-3.5 w-3.5" />
						Details
					</Link>
				</Button>
				<Button
					size="sm"
					className="flex-1"
					disabled={isPurchasing}
					onClick={() => (isConnected ? onPurchase() : onConnect())}
				>
					{isPurchasing ? (
						<>
							<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
							Buying...
						</>
					) : !isConnected ? (
						"Connect"
					) : (
						<>
							<ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
							Buy
						</>
					)}
				</Button>
			</div>
		</div>
	);
}
