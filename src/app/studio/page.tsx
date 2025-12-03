"use client";

import { motion } from "framer-motion";
import { Grid3X3, Palette, Type } from "lucide-react";
import Link from "next/link";

const tools = [
	{
		href: "/studio/theme",
		label: "Theme",
		icon: Palette,
		description: "Create custom ShadCN UI themes with colors, typography, and styling",
	},
	{
		href: "/studio/font",
		label: "Font",
		icon: Type,
		description: "Mint fonts to the blockchain for use across applications",
	},
	{
		href: "/studio/patterns",
		label: "Pattern",
		icon: Grid3X3,
		description: "Generate seamless SVG patterns with AI for theme backgrounds",
	},
];

export default function StudioPage() {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
			{/* Header */}
			<div className="mb-8 text-center">
				<h1 className="font-mono text-sm text-muted-foreground">
					<span className="text-primary">$</span> studio
					<span className="animate-pulse">_</span>
				</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Create and inscribe assets on-chain
				</p>
			</div>

			{/* Tool Cards */}
			<div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{tools.map((tool, index) => {
					const Icon = tool.icon;
					return (
						<motion.div
							key={tool.href}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<Link
								href={tool.href}
								className="group flex flex-col rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
							>
								<div className="mb-4 flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
										<Icon className="h-5 w-5" />
									</div>
									<h2 className="font-mono text-lg font-semibold">
										{tool.label}
									</h2>
								</div>
								<p className="text-sm text-muted-foreground">
									{tool.description}
								</p>
								<div className="mt-4 font-mono text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
									[ LAUNCH ]
								</div>
							</Link>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}
