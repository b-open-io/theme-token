"use client";

import { type ThemeToken } from "@theme-token/sdk";
import { DemoSection } from "./utils";

export function ColorsDemo({ theme, mode }: { theme: ThemeToken; mode: "light" | "dark" }) {
	return (
		<DemoSection title="Colors" description="Complete color palette">
			<div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
				{Object.entries(theme.styles[mode]).map(([key, value]) => {
					if (typeof value !== "string") return null;
					if (
						key.includes("radius") ||
						key.includes("font") ||
						key.includes("shadow") ||
						key.includes("spacing") ||
						key.includes("tracking")
					)
						return null;

					return (
						<div
							key={key}
							className="group cursor-pointer"
							style={{ borderRadius: "var(--radius, 0.5rem)" }}
						>
							<div
								className="aspect-square rounded-lg shadow-sm transition-transform group-hover:scale-105"
								style={{
									backgroundColor: value,
									borderWidth: "1px",
									borderColor: "var(--border)",
								}}
							/>
							<p className="mt-1.5 text-xs font-medium truncate">{key}</p>
							<p
								className="font-mono text-[10px] truncate text-muted-foreground"
							>
								{value}
							</p>
						</div>
					);
				})}
			</div>
		</DemoSection>
	);
}

