"use client";

import { useState } from "react";
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
		<div
			className="flex h-8 w-full border-b border-border"
			style={{ viewTransitionName: "theme-stripe" } as React.CSSProperties}
		>
			{colorEntries.map(({ key, value }, index) => (
				<div
					key={key}
					className="relative cursor-pointer"
					style={{
						backgroundColor: value,
						flex: hoveredIndex === index ? 2 : 1,
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
	);
}
