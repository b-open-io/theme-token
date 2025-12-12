"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import {
	Check,
	Code2,
	Copy,
	Globe,
	Layers,
	LayoutGrid,
	Lock,
	Palette,
	Terminal,
	Wallet,
	Wand2,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { AmbientMesh } from "@/components/ambient-mesh";
import { ColorSectionDivider, ColorBleed, GlowingDivider } from "@/components/color-section-divider";
import { HeroOrbs } from "@/components/hero-orbs";
import { JsonSyntax } from "@/components/json-syntax";
import { PageContainer } from "@/components/page-container";
import { ParallaxChips } from "@/components/parallax-chips";
import { PresetShowcase } from "@/components/preset-showcase";
import { StatsBar } from "@/components/stats-bar";
import { Testimonials } from "@/components/testimonials";
import { ThemeGallery } from "@/components/theme-gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SwatchyHeroController } from "@/components/swatchy/swatchy-hero-controller";
import { useSwatchyStore } from "@/components/swatchy/swatchy-store";

const fadeIn = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.5 },
};

const stagger = {
	animate: {
		transition: {
			staggerChildren: 0.1,
		},
	},
};

// ShadCN Registry Format - the standard
const minimalSchema = {
	$schema: "https://themetoken.dev/v1/schema.json",
	name: "midnight-aurora",
	author: "WildSatchmo (https://github.com/rohenaz)",
	styles: {
		light: {
			background: "oklch(1 0 0)",
			foreground: "oklch(0.145 0 0)",
			primary: "oklch(0.55 0.22 255)",
			"primary-foreground": "oklch(0.98 0 0)",
			radius: "0.5rem",
			"font-mono": "/content/abc123_0",
			"...": "// all ShadCN CSS vars",
		},
		dark: {
			"...": "// dark mode variants",
		},
	},
};

// Example CLI install command
const exampleOrigin =
	"85702d92d2ca2f5a48eaede302f0e85d9142924d68454565dbf621701b2d83cf_0";

export default function Home() {
	const [copied, setCopied] = useState(false);
	const { openChat, setPendingMessage } = useSwatchyStore();

	const handleCreateWithSwatchy = useCallback(() => {
		setPendingMessage("I want to create a new theme. Can you help me design something?");
		openChat();
	}, [openChat, setPendingMessage]);
	const installCommand = `bunx shadcn@latest add https://themetoken.dev/r/themes/${exampleOrigin}`;

	const copyCommand = useCallback(() => {
		navigator.clipboard.writeText(installCommand);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [installCommand]);

	return (
		<div className="min-h-screen">
			{/* Global Ambient Background - Floating color orbs */}
			<AmbientMesh />

			{/* Swatchy Hero Controller - manages scroll-based hero pose */}
			<SwatchyHeroController />

			{/* Hero Section */}
			<section className="relative overflow-hidden min-h-screen">
				{/* Hero Orbs - Interactive parallax orbs */}
				<HeroOrbs />

				<div className="grid-background absolute inset-0 opacity-30" />
				<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

				<PageContainer className="relative pb-24 pt-32">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						className="text-center"
					>
						<Badge className="mb-6" variant="outline">
							<span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
							bun i @theme-token/sdk
						</Badge>

						<h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
							<span className="block bg-gradient-to-b from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
								Shadcn Themes,
							</span>
							<span className="block bg-gradient-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent">
								on Bitcoin
							</span>
						</h1>

						<p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
							Ownable, cross-site theming. Buy, Sell, Create.
						</p>

						<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
							<Button size="lg" className="gap-2" asChild>
								<Link href="/themes">
									<LayoutGrid className="h-5 w-5" />
									Browse Themes
								</Link>
							</Button>
							<Button size="lg" variant="outline" className="gap-2" onClick={handleCreateWithSwatchy}>
								<Wand2 className="h-5 w-5" />
								Create Theme
							</Button>
						</div>
					</motion.div>

					{/* Glass Stack: CLI + Schema Preview */}
					<div className="relative mx-auto mt-16 flex w-full max-w-3xl flex-col items-center justify-center">
						{/* Background Layer: JSON Schema (tilted, faded) */}
						<motion.div
							initial={{ opacity: 0, y: 40, rotate: 0 }}
							animate={{ opacity: 0.6, y: 0, rotate: -2 }}
							transition={{ duration: 0.6, delay: 0.3 }}
							whileHover={{ opacity: 1, rotate: 0 }}
							className="absolute top-0 w-full max-w-2xl scale-95 rounded-xl border border-border bg-card/50 p-1 shadow-xl backdrop-blur transition-all duration-500"
						>
							<div className="flex items-center gap-2 border-b border-border/50 px-4 py-2">
								<div className="traffic-close h-2.5 w-2.5 rounded-full" />
								<div className="traffic-minimize h-2.5 w-2.5 rounded-full" />
								<div className="traffic-maximize h-2.5 w-2.5 rounded-full" />
								<span className="ml-2 font-mono text-[10px] text-muted-foreground/60">
									theme-token.json
								</span>
							</div>
							<div className="relative">
								<JsonSyntax
									json={minimalSchema}
									className="rounded-b-lg text-xs opacity-80"
								/>
								<div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/80 to-transparent" />
							</div>
						</motion.div>

						{/* Foreground Layer: CLI Install (focused, glowing) */}
						<motion.div
							initial={{ opacity: 0, y: 40 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.2 }}
							className="relative z-10 mt-32 w-full max-w-xl"
						>
							<div className="rounded-xl border border-primary/20 bg-background/90 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
								<div className="mb-2 flex items-center gap-2 px-2 pt-1">
									<Terminal className="h-4 w-4 text-primary" />
									<span className="text-xs font-medium text-muted-foreground">
										Install from Blockchain
									</span>
								</div>
								<div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-4 py-3">
									<code className="flex-1 overflow-x-auto font-mono text-sm">
										<span className="select-none text-muted-foreground">
											${" "}
										</span>
										<span className="text-primary">bunx</span>{" "}
										<span className="text-foreground">shadcn@latest add</span>{" "}
										<span className="text-muted-foreground">
											https://.../<span className="text-primary">[origin]</span>
											.json
										</span>
									</code>
									<button
										type="button"
										onClick={copyCommand}
										className="shrink-0 rounded-md border border-border bg-background p-2 text-muted-foreground shadow-sm transition-colors hover:text-foreground"
										title="Copy command"
									>
										{copied ? (
											<Check className="h-4 w-4 text-green-500" />
										) : (
											<Copy className="h-4 w-4" />
										)}
									</button>
								</div>
							</div>
							<p className="mt-3 text-center text-sm text-muted-foreground">
								Replace{" "}
								<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary">
									[origin]
								</code>{" "}
								with any theme&apos;s blockchain ID.{" "}
								<Link href="/themes" className="text-primary hover:underline">
									Browse themes
								</Link>{" "}
								to find one.
							</p>
						</motion.div>
					</div>
				</PageContainer>
			</section>

			{/* Color Cascade Transition */}
			<ParallaxChips className="-mt-32" />

			{/* Stats Bar - Quick credibility */}
			<StatsBar />

			{/* Glowing Divider */}
			<GlowingDivider color="chart-1" />

			{/* Theme Gallery */}
			<ThemeGallery />

			{/* Section Divider */}
			<ColorSectionDivider color="chart-2" intensity="medium" direction="both" />

			{/* Preset Showcase - Interactive theme preview */}
			<PresetShowcase />

			{/* Why On-Chain Themes Section */}
			<section className="relative border-t border-border/50 py-24 overflow-hidden">
				{/* Color bleeds for depth */}
				<ColorBleed color="primary" position="left" />
				<ColorBleed color="chart-3" position="right" className="top-[60%]" />

				<PageContainer className="relative z-10">
					<motion.div
						initial="initial"
						whileInView="animate"
						viewport={{ once: true }}
						variants={stagger}
						className="text-center"
					>
						<motion.p
							variants={fadeIn}
							className="font-mono text-sm text-primary"
						>
							{"// Why store themes on-chain?"}
						</motion.p>
						<motion.h2
							variants={fadeIn}
							className="mb-4 text-3xl font-bold sm:text-4xl"
						>
							A Registry That Cannot Be Deleted
						</motion.h2>
						<motion.p
							variants={fadeIn}
							className="mx-auto mb-16 max-w-2xl text-muted-foreground"
						>
							Design tokens as immutable assets. Once published, your theme is
							globally accessible via CLI, forever.
						</motion.p>
					</motion.div>

					<div className="grid gap-8 md:grid-cols-3">
						{/* For Designers */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: 0.1 }}
							className="group relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-xl p-6 overflow-hidden hover:border-primary/50 transition-colors"
						>
							{/* Bottom gradient accent */}
							<div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary via-chart-1 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

							<div className="mb-4 inline-flex rounded-lg bg-primary/20 p-3 shadow-lg shadow-primary/20">
								<Palette className="h-6 w-6 text-primary" />
							</div>
							<h3 className="mb-2 text-xl font-semibold">For Designers</h3>
							<p className="mb-4 text-sm text-muted-foreground">
								Immutable attribution & royalties
							</p>
							<ul className="space-y-2 text-sm">
								<li className="flex items-start gap-2">
									<Lock className="mt-0.5 h-4 w-4 text-primary" />
									<span>Authorship permanently recorded on-chain</span>
								</li>
								<li className="flex items-start gap-2">
									<Wallet className="mt-0.5 h-4 w-4 text-chart-1" />
									<span>Sell on any ordinal marketplace</span>
								</li>
								<li className="flex items-start gap-2">
									<Globe className="mt-0.5 h-4 w-4 text-chart-2" />
									<span>Direct, permissionless distribution</span>
								</li>
							</ul>
						</motion.div>

						{/* For Developers */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: 0.2 }}
							className="group relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-xl p-6 overflow-hidden hover:border-chart-2/50 transition-colors"
						>
							{/* Bottom gradient accent */}
							<div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-chart-2 via-chart-3 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

							<div className="mb-4 inline-flex rounded-lg bg-chart-2/20 p-3 shadow-lg shadow-chart-2/20">
								<Code2 className="h-6 w-6 text-chart-2" />
							</div>
							<h3 className="mb-2 text-xl font-semibold">For Developers</h3>
							<p className="mb-4 text-sm text-muted-foreground">
								Native CLI integration
							</p>
							<ul className="space-y-2 text-sm">
								<li className="flex items-start gap-2">
									<Terminal className="mt-0.5 h-4 w-4 text-chart-2" />
									<span>Install with bunx shadcn@latest add</span>
								</li>
								<li className="flex items-start gap-2">
									<Layers className="mt-0.5 h-4 w-4 text-chart-3" />
									<span>100% compatible with ShadCN ecosystem</span>
								</li>
								<li className="flex items-start gap-2">
									<Globe className="mt-0.5 h-4 w-4 text-chart-4" />
									<span>Decentralized, immutable theme CDN</span>
								</li>
							</ul>
						</motion.div>

						{/* For Users */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: 0.3 }}
							className="group relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-xl p-6 overflow-hidden hover:border-chart-5/50 transition-colors"
						>
							{/* Bottom gradient accent */}
							<div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-chart-5 via-chart-4 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

							<div className="mb-4 inline-flex rounded-lg bg-chart-5/20 p-3 shadow-lg shadow-chart-5/20">
								<Wallet className="h-6 w-6 text-chart-5" />
							</div>
							<h3 className="mb-2 text-xl font-semibold">For Users</h3>
							<p className="mb-4 text-sm text-muted-foreground">
								Cross-app theme persistence
							</p>
							<ul className="space-y-2 text-sm">
								<li className="flex items-start gap-2">
									<Palette className="mt-0.5 h-4 w-4 text-chart-5" />
									<span>Buy once, use across all supported apps</span>
								</li>
								<li className="flex items-start gap-2">
									<Layers className="mt-0.5 h-4 w-4 text-chart-4" />
									<span>Collect rare, limited-edition themes</span>
								</li>
								<li className="flex items-start gap-2">
									<Globe className="mt-0.5 h-4 w-4 text-chart-3" />
									<span>Community-driven curation ecosystem</span>
								</li>
							</ul>
						</motion.div>
					</div>
				</PageContainer>
			</section>

			{/* Section Divider */}
			<GlowingDivider color="chart-5" />

			{/* Testimonials - Social proof */}
			<Testimonials />

			{/* Final color accent at bottom */}
			<ColorSectionDivider color="primary" intensity="strong" direction="top" />
		</div>
	);
}
