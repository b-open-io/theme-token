"use client";

/**
 * Pricing Page - "The Prism Pass"
 *
 * An unconventional pricing page that uses a reality slider
 * to transform between pay-as-you-go (wireframe) and subscriber (holographic) modes.
 */

import { motion, AnimatePresence } from "framer-motion";
import {
	Bitcoin,
	Sparkles,
	Zap,
	Palette,
	Clock,
	Infinity,
	ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/page-container";

function PerkRow({ icon, text, delay = 0 }: { icon: React.ReactNode; text: string; delay?: number }) {
	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay }}
			className="flex items-center gap-3"
		>
			<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-primary">
				{icon}
			</div>
			<span className="text-sm font-medium text-foreground">{text}</span>
		</motion.div>
	);
}

function TheArtifact({ active }: { active: boolean }) {
	return (
		<div className="perspective-[1000px]">
			<motion.div
				animate={{
					rotateY: active ? 180 : 0,
					scale: active ? 1.02 : 1,
				}}
				transition={{ type: "spring", stiffness: 260, damping: 25 }}
				style={{ transformStyle: "preserve-3d" }}
				className="relative h-[480px] w-[340px] sm:h-[520px] sm:w-[380px]"
			>
				{/* Glow effect for subscriber mode */}
				<motion.div
					animate={{
						opacity: active ? 0.6 : 0,
						scale: active ? 1.1 : 0.9,
					}}
					className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/40 via-purple-500/30 to-pink-500/40 blur-2xl"
				/>

				{/* FRONT: PAY AS YOU GO (The Developer/CLI View) */}
				<div
					className={`absolute inset-0 rounded-3xl border bg-card/50 p-6 backdrop-blur-xl transition-opacity duration-300 sm:p-8 ${
						active ? "pointer-events-none opacity-0" : "opacity-100"
					} ${active ? "" : "border-dashed border-border"}`}
					style={{ backfaceVisibility: "hidden" }}
				>
					<div className="flex h-full flex-col justify-between">
						{/* Terminal Header */}
						<div>
							<div className="mb-6 flex items-center gap-2">
								<div className="h-3 w-3 rounded-full bg-red-500/60" />
								<div className="h-3 w-3 rounded-full bg-yellow-500/60" />
								<div className="h-3 w-3 rounded-full bg-green-500/60" />
								<span className="ml-2 font-mono text-xs text-muted-foreground">
									guest.config
								</span>
							</div>

							<h3 className="mb-1 font-mono text-lg font-semibold text-foreground">
								Pay As You Go
							</h3>
							<p className="text-sm text-muted-foreground">
								Create freely, pay per generation
							</p>
						</div>

						{/* Config Display */}
						<div className="space-y-3 font-mono text-sm">
							<div className="flex items-center justify-between border-b border-border/50 pb-2">
								<span className="text-muted-foreground">generation_cost</span>
								<span className="text-foreground">STANDARD</span>
							</div>
							<div className="flex items-center justify-between border-b border-border/50 pb-2">
								<span className="text-muted-foreground">draft_slots</span>
								<span className="text-foreground">5 per type</span>
							</div>
							<div className="flex items-center justify-between border-b border-border/50 pb-2">
								<span className="text-muted-foreground">retention</span>
								<span className="text-foreground">30 days</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">mode</span>
								<span className="text-foreground">anonymous</span>
							</div>
						</div>

						{/* Payment Method */}
						<div className="border-t border-border pt-6">
							<p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
								Payment
							</p>
							<div className="flex items-center gap-2 text-foreground">
								<Bitcoin className="h-5 w-5 text-primary" />
								<span className="text-sm">BSV micro-transactions</span>
							</div>
							<p className="mt-3 text-xs text-muted-foreground">
								No account needed. Pay when you create.
							</p>
						</div>
					</div>
				</div>

				{/* BACK: SUBSCRIBER (The Creative View) */}
				<div
					className={`absolute inset-0 rounded-3xl border border-primary/30 bg-card/80 p-6 backdrop-blur-xl transition-opacity duration-300 sm:p-8 ${
						active ? "opacity-100" : "pointer-events-none opacity-0"
					}`}
					style={{
						backfaceVisibility: "hidden",
						transform: "rotateY(180deg)",
					}}
				>
					{/* Animated Gradient Background */}
					<motion.div
						animate={{ rotate: 360 }}
						transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
						className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-primary/40 via-purple-500/30 to-pink-500/40 blur-[80px]"
					/>

					<div className="relative z-10 flex h-full flex-col justify-between">
						{/* Header */}
						<div>
							<div className="mb-2 inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
								NFT MEMBERSHIP
							</div>
							<h2 className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-3xl font-bold text-transparent">
								Prism Pass
							</h2>
							<p className="mt-2 text-sm text-muted-foreground">
								Unlock your creative potential
							</p>
						</div>

						{/* Perks */}
						<div className="space-y-4">
							<PerkRow
								icon={<Zap className="h-4 w-4" />}
								text="50% off AI generations"
								delay={0.1}
							/>
							<PerkRow
								icon={<Palette className="h-4 w-4" />}
								text="25 drafts per asset type"
								delay={0.15}
							/>
							<PerkRow
								icon={<Clock className="h-4 w-4" />}
								text="90-day draft retention"
								delay={0.2}
							/>
							<PerkRow
								icon={<Infinity className="h-4 w-4" />}
								text="Inscribe to own forever"
								delay={0.25}
							/>
						</div>

						{/* CTA */}
						<div>
							<Button
								size="lg"
								className="w-full gap-2 bg-gradient-to-r from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02]"
							>
								<Sparkles className="h-4 w-4" />
								Mint Pass
								<span className="ml-1 text-xs opacity-80">~$4</span>
							</Button>
							<p className="mt-3 text-center text-xs text-muted-foreground">
								Tradeable NFT on Bitcoin SV
							</p>
						</div>
					</div>
				</div>
			</motion.div>
		</div>
	);
}

function RealitySlider({
	active,
	onToggle,
}: {
	active: boolean;
	onToggle: (v: boolean) => void;
}) {
	return (
		<div className="flex flex-col items-center gap-3">
			<button
				type="button"
				onClick={() => onToggle(!active)}
				className="relative flex h-14 w-56 items-center rounded-full border border-border bg-muted/50 p-1 shadow-inner backdrop-blur-sm transition-colors hover:border-primary/50 sm:h-16 sm:w-64"
			>
				{/* Background Labels */}
				<div className="pointer-events-none absolute inset-0 flex items-center justify-between px-5 text-xs font-bold uppercase tracking-wider sm:px-6">
					<span
						className={`transition-colors ${!active ? "text-foreground" : "text-muted-foreground/50"}`}
					>
						Pay-Go
					</span>
					<span
						className={`transition-colors ${active ? "text-foreground" : "text-muted-foreground/50"}`}
					>
						Member
					</span>
				</div>

				{/* Sliding Knob */}
				<motion.div
					layout
					initial={false}
					animate={{
						x: active ? "100%" : "0%",
					}}
					transition={{ type: "spring", stiffness: 400, damping: 30 }}
					className={`relative z-10 flex h-full w-1/2 items-center justify-center rounded-full shadow-xl transition-colors ${
						active
							? "bg-gradient-to-r from-primary to-purple-600"
							: "bg-card border border-border"
					}`}
				>
					<motion.div
						animate={{ rotate: active ? 180 : 0 }}
						className={`h-1 w-4 rounded-full ${active ? "bg-white/80" : "bg-muted-foreground/50"}`}
					/>
				</motion.div>
			</button>

			<p className="text-center text-xs text-muted-foreground">
				{active
					? "Slide left for pay-as-you-go"
					: "Slide right to see member perks"}
			</p>
		</div>
	);
}

function SwatchyMascot({ active }: { active: boolean }) {
	return (
		<motion.div
			animate={{
				scale: active ? 1.2 : 0.9,
				y: active ? -20 : 0,
				filter: active ? "blur(0px)" : "blur(1px) grayscale(50%)",
				opacity: active ? 0.15 : 0.08,
			}}
			transition={{ type: "spring", stiffness: 200, damping: 20 }}
			className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2"
		>
			<Image
				src="/swatchy-meditation.png"
				alt=""
				width={500}
				height={500}
				className="h-auto w-[400px] sm:w-[500px]"
			/>
		</motion.div>
	);
}

function AmbientBackground({ active }: { active: boolean }) {
	return (
		<>
			{/* Base gradient */}
			<div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />

			{/* Grid pattern - fades in on active */}
			<motion.div
				animate={{ opacity: active ? 0.03 : 0.01 }}
				className="grid-background absolute inset-0"
			/>

			{/* Animated orbs */}
			<motion.div
				animate={{
					opacity: active ? 0.3 : 0.1,
					scale: active ? 1.2 : 1,
				}}
				className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/20 blur-[100px]"
			/>
			<motion.div
				animate={{
					opacity: active ? 0.2 : 0.05,
					scale: active ? 1.1 : 0.9,
				}}
				transition={{ delay: 0.1 }}
				className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-purple-500/20 blur-[80px]"
			/>
		</>
	);
}

export default function PricingPage() {
	const [active, setActive] = useState(false);

	return (
		<div className="relative min-h-screen overflow-hidden">
			<AmbientBackground active={active} />
			<SwatchyMascot active={active} />

			<PageContainer className="relative z-10 flex min-h-screen flex-col items-center justify-center py-16">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="mb-12 text-center"
				>
					<motion.p
						animate={{ opacity: active ? 0.5 : 1 }}
						className="mb-2 font-mono text-sm text-primary"
					>
						{"// choose your reality"}
					</motion.p>
					<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
						<AnimatePresence mode="wait">
							{active ? (
								<motion.span
									key="member"
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									className="block bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent"
								>
									Creative Superpowers
								</motion.span>
							) : (
								<motion.span
									key="free"
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									className="block text-foreground"
								>
									Create Without Limits
								</motion.span>
							)}
						</AnimatePresence>
					</h1>
					<motion.p
						animate={{ color: active ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground))" }}
						className="mt-3 text-muted-foreground"
					>
						{active
							? "Unlock discounts and extended storage"
							: "Pay only when you create something amazing"}
					</motion.p>
				</motion.div>

				{/* The Artifact */}
				<TheArtifact active={active} />

				{/* Reality Slider */}
				<div className="mt-12">
					<RealitySlider active={active} onToggle={setActive} />
				</div>

				{/* Bottom Note */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.5 }}
					className="mt-12 text-center"
				>
					<p className="mb-4 text-sm text-muted-foreground">
						Both options support BSV payments. Inscribe your creations to own them forever.
					</p>
					<Link
						href="/studio/theme"
						className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
					>
						Start creating now
						<ChevronRight className="h-4 w-4" />
					</Link>
				</motion.div>
			</PageContainer>
		</div>
	);
}
