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
		});
	};

	return (
		<div className="flex h-8 w-full border-b border-border">
			{colorEntries.map(({ key, value }, index) => (
				<div
					key={key}
					className="group relative flex-1 cursor-pointer transition-all duration-300 ease-out hover:flex-[2]"
					style={{
						backgroundColor: value,
					}}
					onMouseEnter={() => setHoveredIndex(index)}
					onMouseLeave={() => setHoveredIndex(null)}
					onClick={() => handleCopyColor(key, value)}
				>
					<div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
						<span
							className="px-2 py-0.5 text-xs font-medium shadow-lg"
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
