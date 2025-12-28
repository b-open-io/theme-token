"use client";

import { motion } from "framer-motion";
import {
	ArrowRight,
	Grid3X3,
	Image,
	Palette,
	Shapes,
	Terminal,
	Type,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { getStudioTabs } from "@/lib/routes";

// Visual Preview Components
const ThemePreview = () => (
	<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-transparent">
		<div className="relative h-24 w-32 rounded-lg border border-border bg-card shadow-2xl">
			<div className="flex items-center gap-1 border-b border-border p-2">
				<div className="traffic-close h-2 w-2 rounded-full" />
				<div className="traffic-minimize h-2 w-2 rounded-full" />
				<div className="traffic-maximize h-2 w-2 rounded-full" />
			</div>
			<div className="space-y-2 p-3">
				<div className="h-2 w-3/4 rounded-full bg-primary/20" />
				<div className="h-2 w-1/2 rounded-full bg-muted-foreground/20" />
				<div className="mt-2 flex gap-2">
					<div className="h-6 w-full rounded bg-primary/80" />
				</div>
			</div>
			{/* Floating abstract elements */}
			<div className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-primary/10 blur-xl" />
			<div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-accent/10 blur-xl" />
		</div>
	</div>
);

const FontPreview = () => (
	<div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-bl from-primary/5 to-transparent">
		<div className="relative z-10 text-center">
			<span className="block font-serif text-6xl text-primary/80 drop-shadow-lg">
				Aa
			</span>
			<div className="mt-2 flex justify-center gap-1 opacity-50">
				<div className="h-1 w-1 rounded-full bg-foreground" />
				<div className="h-1 w-1 rounded-full bg-foreground" />
				<div className="h-1 w-1 rounded-full bg-foreground" />
			</div>
		</div>
		<div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]" />
	</div>
);

const PatternPreview = () => (
	<div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-background">
		<svg
			className="absolute inset-0 h-full w-full opacity-20"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<pattern
					id="grid-pattern"
					width="20"
					height="20"
					patternUnits="userSpaceOnUse"
				>
					<circle cx="2" cy="2" r="1" className="fill-primary" />
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#grid-pattern)" />
		</svg>
		<div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
		<div className="relative z-10 h-20 w-20 rotate-45 rounded-xl border border-primary/30 bg-background/50 backdrop-blur-sm" />
		<div className="absolute z-0 h-24 w-24 -rotate-12 rounded-full border border-dashed border-muted-foreground/30" />
	</div>
);

const IconPreview = () => (
	<div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-tr from-primary/5 to-transparent">
		<div className="relative z-10 grid grid-cols-3 gap-2">
			{[Shapes, Palette, Type].map((Icon, i) => (
				<div
					key={i}
					className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card/50"
				>
					<Icon className="h-5 w-5 text-primary/60" />
				</div>
			))}
		</div>
		<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,hsl(var(--background))_70%)]" />
	</div>
);

const WallpaperPreview = () => (
	<div className="absolute inset-0 flex items-center justify-center overflow-hidden">
		<div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20" />
		<div className="absolute inset-0 opacity-30">
			<div className="absolute left-1/4 top-1/4 h-32 w-32 rounded-full bg-primary/30 blur-3xl" />
			<div className="absolute bottom-1/4 right-1/4 h-24 w-24 rounded-full bg-accent/40 blur-2xl" />
		</div>
		<div className="relative z-10 h-16 w-24 rounded-lg border border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm" />
	</div>
);

// Preview component mapping by path
const previewComponents: Record<string, React.FC> = {
	"/studio/theme": ThemePreview,
	"/studio/font": FontPreview,
	"/studio/patterns": PatternPreview,
	"/studio/icon": IconPreview,
	"/studio/wallpaper": WallpaperPreview,
};

// Default preview for any new studios
const DefaultPreview = () => (
	<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-transparent">
		<div className="h-16 w-16 rounded-xl border border-primary/30 bg-primary/10" />
	</div>
);

// Animation Variants
const containerVariants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.15,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0 },
};

export function StudioPageClient() {
	// Get studio tools from route registry (already filtered by feature flags)
	const studioTools = useMemo(() => getStudioTabs(), []);

	return (
		<div className="min-h-[80vh] w-full bg-background py-12">
			<div className="mx-auto max-w-5xl px-4">
				{/* Terminal Header */}
				<div className="mb-12 flex items-center gap-3 border-b border-border/40 pb-6">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<Terminal className="h-5 w-5" />
					</div>
					<div>
						<h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">
							$ studio<span className="animate-pulse text-primary">_</span>
						</h1>
						<p className="text-sm text-muted-foreground">
							Initialize creative tools. Select a module to begin.
						</p>
					</div>
				</div>

				{/* Tools Grid */}
				<motion.div
					variants={containerVariants}
					initial="hidden"
					animate="show"
					className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
				>
					{studioTools.map((tool) => {
						const Icon = tool.icon;
						const Preview = previewComponents[tool.path] || DefaultPreview;

						return (
							<motion.div
								key={tool.label}
								variants={itemVariants}
								className="h-full"
							>
								<Link href={tool.path} className="group block h-full">
									<div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card/30 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:bg-card/50 hover:shadow-2xl hover:shadow-primary/5">
										{/* Visual Preview Area */}
										<div className="relative h-40 w-full overflow-hidden border-b border-border/50 bg-muted/20">
											<Preview />
										</div>

										{/* Content Area */}
										<div className="flex flex-1 flex-col p-5">
											<div className="mb-3 flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
														{Icon && <Icon className="h-4 w-4" />}
													</div>
													<h2 className="font-mono text-lg font-semibold">
														{tool.label}
													</h2>
												</div>
												<ArrowRight className="h-4 w-4 -translate-x-2 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
											</div>

											<p className="flex-1 text-sm leading-relaxed text-muted-foreground">
												{tool.description}
											</p>

											{/* Footer */}
											<div className="mt-4 border-t border-border/30 pt-3">
												<span className="font-mono text-xs text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
													[ LAUNCH ]
												</span>
											</div>
										</div>
									</div>
								</Link>
							</motion.div>
						);
					})}
				</motion.div>
			</div>
		</div>
	);
}
