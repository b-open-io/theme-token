"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
	Bell,
	Check,
	ChevronRight,
	CreditCard,
	Mail,
	MessageSquare,
	Plus,
	Settings,
	Sparkles,
	User,
	Wand2,
} from "lucide-react";
import Link from "next/link";
import { useState, useCallback } from "react";
import { exampleThemes } from "@/lib/example-themes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useSwatchyStore } from "@/components/swatchy/swatchy-store";
import type { ThemeToken } from "@theme-token/sdk";

// Extend example themes with additional curated presets
const showcaseThemes: (ThemeToken & { description?: string })[] = [
	{ ...exampleThemes[0], description: "Clean & professional" },
	{ ...exampleThemes[1], description: "Calm & serene" },
	{ ...exampleThemes[2], description: "Bold & vibrant" },
	{ ...exampleThemes[3], description: "Natural & organic" },
];

// Mini component preview that shows the theme in action
function ThemePreviewMini({ theme }: { theme: ThemeToken }) {
	const lightStyles = theme.styles.light;
	const darkStyles = theme.styles.dark;

	// Use light mode styles for preview
	const styles = {
		"--preview-bg": lightStyles.background,
		"--preview-fg": lightStyles.foreground,
		"--preview-card": lightStyles.card,
		"--preview-card-fg": lightStyles["card-foreground"],
		"--preview-primary": lightStyles.primary,
		"--preview-primary-fg": lightStyles["primary-foreground"],
		"--preview-muted": lightStyles.muted,
		"--preview-muted-fg": lightStyles["muted-foreground"],
		"--preview-border": lightStyles.border,
		"--preview-accent": lightStyles.accent,
		"--preview-chart-1": lightStyles["chart-1"],
		"--preview-chart-2": lightStyles["chart-2"],
		"--preview-radius": lightStyles.radius || "0.5rem",
	} as React.CSSProperties;

	return (
		<div
			className="relative overflow-hidden rounded-xl border"
			style={{
				...styles,
				background: "var(--preview-bg)",
				borderColor: "var(--preview-border)",
			}}
		>
			{/* Mini Dashboard Preview */}
			<div className="p-4 space-y-3">
				{/* Header Bar */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div
							className="h-6 w-6 rounded-md flex items-center justify-center"
							style={{ background: "var(--preview-primary)" }}
						>
							<Sparkles
								className="h-3.5 w-3.5"
								style={{ color: "var(--preview-primary-fg)" }}
							/>
						</div>
						<span
							className="text-sm font-medium"
							style={{ color: "var(--preview-fg)" }}
						>
							Dashboard
						</span>
					</div>
					<div className="flex items-center gap-1.5">
						<div
							className="h-6 w-6 rounded-full flex items-center justify-center"
							style={{ background: "var(--preview-muted)" }}
						>
							<Bell
								className="h-3 w-3"
								style={{ color: "var(--preview-muted-fg)" }}
							/>
						</div>
						<div
							className="h-6 w-6 rounded-full"
							style={{ background: "var(--preview-primary)" }}
						/>
					</div>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-2 gap-2">
					<div
						className="rounded-lg p-2.5"
						style={{
							background: "var(--preview-card)",
							borderRadius: "var(--preview-radius)",
						}}
					>
						<div
							className="text-[10px] mb-1"
							style={{ color: "var(--preview-muted-fg)" }}
						>
							Revenue
						</div>
						<div
							className="text-sm font-bold"
							style={{ color: "var(--preview-fg)" }}
						>
							$12.4k
						</div>
						<div className="flex items-center gap-1 mt-1">
							<div
								className="h-1 flex-1 rounded-full overflow-hidden"
								style={{ background: "var(--preview-muted)" }}
							>
								<div
									className="h-full w-3/4"
									style={{ background: "var(--preview-chart-1)" }}
								/>
							</div>
						</div>
					</div>
					<div
						className="rounded-lg p-2.5"
						style={{
							background: "var(--preview-card)",
							borderRadius: "var(--preview-radius)",
						}}
					>
						<div
							className="text-[10px] mb-1"
							style={{ color: "var(--preview-muted-fg)" }}
						>
							Users
						</div>
						<div
							className="text-sm font-bold"
							style={{ color: "var(--preview-fg)" }}
						>
							2,847
						</div>
						<div className="flex items-center gap-1 mt-1">
							<div
								className="h-1 flex-1 rounded-full overflow-hidden"
								style={{ background: "var(--preview-muted)" }}
							>
								<div
									className="h-full w-1/2"
									style={{ background: "var(--preview-chart-2)" }}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex gap-2">
					<button
						type="button"
						className="flex-1 h-7 rounded-md text-xs font-medium flex items-center justify-center gap-1"
						style={{
							background: "var(--preview-primary)",
							color: "var(--preview-primary-fg)",
							borderRadius: "var(--preview-radius)",
						}}
					>
						<Plus className="h-3 w-3" />
						Create
					</button>
					<button
						type="button"
						className="h-7 px-3 rounded-md text-xs border flex items-center justify-center"
						style={{
							borderColor: "var(--preview-border)",
							color: "var(--preview-fg)",
							borderRadius: "var(--preview-radius)",
						}}
					>
						<Settings className="h-3 w-3" />
					</button>
				</div>
			</div>
		</div>
	);
}

// Color stripe preview for theme card
function ColorStripes({ theme }: { theme: ThemeToken }) {
	const colors = [
		theme.styles.light.primary,
		theme.styles.light["chart-1"],
		theme.styles.light["chart-2"],
		theme.styles.light["chart-3"],
		theme.styles.light.accent,
	];

	return (
		<div className="flex h-2 w-full overflow-hidden rounded-full">
			{colors.map((color, i) => (
				<div
					key={`${color}-${i}`}
					className="flex-1"
					style={{ background: color }}
				/>
			))}
		</div>
	);
}

export function PresetShowcase() {
	const [selectedTheme, setSelectedTheme] = useState<ThemeToken>(
		showcaseThemes[0],
	);
	const [hoveredTheme, setHoveredTheme] = useState<ThemeToken | null>(null);
	const { openChat, setPendingMessage } = useSwatchyStore();

	const displayedTheme = hoveredTheme || selectedTheme;

	const handleCreateSimilar = useCallback(
		(themeName: string) => {
			setPendingMessage(
				`I love the ${themeName} theme! Can you help me create something similar but with my own twist?`,
			);
			openChat();
		},
		[openChat, setPendingMessage],
	);

	return (
		<section className="py-24 border-t border-border">
			<div className="container mx-auto px-4">
				{/* Section Header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="text-center mb-12"
				>
					<p className="font-mono text-sm text-primary mb-2">
						{"// Try before you buy"}
					</p>
					<h2 className="text-3xl font-bold sm:text-4xl mb-4">
						Explore Theme Presets
					</h2>
					<p className="text-muted-foreground max-w-xl mx-auto">
						Click any theme to see it come to life. Every theme works instantly
						with your ShadCN project.
					</p>
				</motion.div>

				{/* Main Content Grid */}
				<div className="grid lg:grid-cols-2 gap-8 items-start">
					{/* Left: Theme Cards Grid */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						className="grid grid-cols-2 gap-4"
					>
						{showcaseThemes.map((theme) => {
							const isSelected = selectedTheme.name === theme.name;
							return (
								<motion.button
									key={theme.name}
									type="button"
									onClick={() => setSelectedTheme(theme)}
									onMouseEnter={() => setHoveredTheme(theme)}
									onMouseLeave={() => setHoveredTheme(null)}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									className={`
                    relative text-left p-4 rounded-xl border transition-all duration-200
                    ${
											isSelected
												? "border-primary bg-primary/5 ring-2 ring-primary/20"
												: "border-border bg-card hover:border-primary/50"
										}
                  `}
								>
									{isSelected && (
										<div className="absolute top-2 right-2">
											<div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
												<Check className="h-3 w-3 text-primary-foreground" />
											</div>
										</div>
									)}

									<ColorStripes theme={theme} />

									<h3 className="font-semibold mt-3 text-sm">{theme.name}</h3>
									<p className="text-xs text-muted-foreground mt-0.5">
										{theme.description}
									</p>

									<div className="flex items-center gap-2 mt-3">
										<Button
											size="sm"
											variant="ghost"
											className="h-7 text-xs px-2"
											asChild
										>
											<Link href="/studio/theme">
												Try in Studio
												<ChevronRight className="h-3 w-3 ml-1" />
											</Link>
										</Button>
									</div>
								</motion.button>
							);
						})}
					</motion.div>

					{/* Right: Live Preview */}
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						className="lg:sticky lg:top-24"
					>
						<div className="rounded-2xl border border-border bg-card p-6">
							<div className="flex items-center justify-between mb-4">
								<div>
									<h3 className="font-semibold">Live Preview</h3>
									<p className="text-sm text-muted-foreground">
										Hover themes to preview instantly
									</p>
								</div>
								<Badge variant="secondary" className="font-mono text-xs">
									{displayedTheme.name}
								</Badge>
							</div>

							<AnimatePresence mode="wait">
								<motion.div
									key={displayedTheme.name}
									initial={{ opacity: 0, scale: 0.98 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.98 }}
									transition={{ duration: 0.2 }}
								>
									<ThemePreviewMini theme={displayedTheme} />
								</motion.div>
							</AnimatePresence>

							<div className="mt-4 flex gap-2">
								<Button className="flex-1 gap-2" asChild>
									<Link href="/studio/theme">
										<Wand2 className="h-4 w-4" />
										Open in Studio
									</Link>
								</Button>
								<Button
									variant="outline"
									onClick={() => handleCreateSimilar(displayedTheme.name)}
								>
									<MessageSquare className="h-4 w-4" />
								</Button>
							</div>

							<p className="text-xs text-center text-muted-foreground mt-3">
								Ask Swatchy to create something similar
							</p>
						</div>
					</motion.div>
				</div>

				{/* Browse All CTA */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="text-center mt-12"
				>
					<Button variant="outline" size="lg" asChild>
						<Link href="/themes">
							Browse All Published Themes
							<ChevronRight className="h-4 w-4 ml-2" />
						</Link>
					</Button>
				</motion.div>
			</div>
		</section>
	);
}
