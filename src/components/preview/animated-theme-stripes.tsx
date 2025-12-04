import React from "react";

export function AnimatedThemeStripes() {
	const colors = [
		{ name: "background", var: "background", fg: "foreground" },
		{ name: "card", var: "card", fg: "card-foreground" },
		{ name: "popover", var: "popover", fg: "popover-foreground" },
		{ name: "muted", var: "muted", fg: "muted-foreground" },
		{ name: "accent", var: "accent", fg: "accent-foreground" },
		{ name: "secondary", var: "secondary", fg: "secondary-foreground" },
		{ name: "primary", var: "primary", fg: "primary-foreground" },
		{ name: "destructive", var: "destructive", fg: "destructive-foreground" },
	];

	return (
		<div
			className="w-full h-14 flex rounded-xl overflow-hidden mb-6 shadow-sm"
			style={{ borderWidth: "1px", borderColor: "var(--border)" }}
		>
			{colors.map((color) => (
				<div
					key={color.name}
					className="flex-1 flex items-end justify-center pb-2 hover:flex-[2] transition-all duration-300 cursor-pointer group relative"
					style={{
						backgroundColor: `var(--${color.var})`,
						color: `var(--${color.fg}, var(--foreground))`,
					}}
				>
					<span className="text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap px-1 bg-background/50 backdrop-blur-[1px] rounded-[2px]">
						{color.name}
					</span>
				</div>
			))}
		</div>
	);
}
