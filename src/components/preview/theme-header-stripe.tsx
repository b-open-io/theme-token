"use client";

import { useEffect, useState, ViewTransition } from "react";
import { toast } from "sonner";
import type { ThemeToken } from "@theme-token/sdk";

interface ThemeHeaderStripeProps {
	theme: ThemeToken;
	mode: "light" | "dark";
	origin: string;
}

export function ThemeHeaderStripe({
	theme,
	mode,
	origin,
}: ThemeHeaderStripeProps) {
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
	// Delay setting viewTransitionName until after initial mount to avoid conflict with source page
	const [canTransition, setCanTransition] = useState(false);
	useEffect(() => {
		const timer = setTimeout(() => setCanTransition(true), 100);
		return () => clearTimeout(timer);
	}, []);
	const styles = theme.styles[mode];

	const colorEntries = [
		{ key: "background", value: styles.background },
		{ key: "card", value: styles.card },
		{ key: "popover", value: styles.popover },
		{ key: "muted", value: styles.muted },
		{ key: "accent", value: styles.accent },
		{ key: "secondary", value: styles.secondary },
		{ key: "primary", value: styles.primary },
		{ key: "destructive", value: styles.destructive },
	];

	const handleCopyColor = (colorKey: string, colorValue: string) => {
		navigator.clipboard.writeText(colorValue);
		toast.success(`Copied ${colorKey}`, {
			description: colorValue,
			style: {
				backgroundColor: styles.popover,
				color: styles["popover-foreground"],
				borderColor: styles.border,
			},
		});
	};

	return (
		<div className="relative h-8 w-full border-b border-border">
			{/* Color stripes with hover interaction - wrapped in ViewTransition for shared element */}
			<ViewTransition name={canTransition ? `theme-stripe-${origin}` : undefined}>
				<div className="absolute inset-0 flex">
					{colorEntries.map(({ key, value }, index) => (
						<div
							key={key}
							className="relative cursor-pointer"
							style={{
								flex: hoveredIndex === index ? 2 : 1,
								backgroundColor: value,
								transition: "flex 300ms ease-out",
							}}
							onMouseEnter={() => setHoveredIndex(index)}
							onMouseLeave={() => setHoveredIndex(null)}
							onClick={() => handleCopyColor(key, value)}
						>
							<div
								className="absolute inset-0 flex items-center justify-center"
								style={{
									opacity: hoveredIndex === index ? 1 : 0,
									transition: "opacity 200ms ease-out",
								}}
							>
								<span
									className="rounded px-2 py-0.5 text-xs font-medium shadow-lg"
									style={{
										backgroundColor: styles.background,
										color: styles.foreground,
									}}
								>
									{key}
								</span>
							</div>
						</div>
					))}
				</div>
			</ViewTransition>
		</div>
	);
}
