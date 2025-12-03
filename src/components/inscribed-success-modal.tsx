"use client";

import type { ThemeToken } from "@theme-token/sdk";
import { motion } from "framer-motion";
import { Check, Copy, ExternalLink, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
} from "@/components/ui/dialog";

interface InscribedSuccessModalProps {
	isOpen: boolean;
	onClose: () => void;
	txid: string;
	theme: ThemeToken;
}

// Lightweight confetti using Framer Motion
function ConfettiExplosion({ primaryColor }: { primaryColor: string }) {
	const particles = Array.from({ length: 24 });

	return (
		<div className="pointer-events-none absolute left-1/2 top-1/3 z-0 -translate-x-1/2 -translate-y-1/2">
			{particles.map((_, i) => (
				<motion.div
					key={i}
					initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
					animate={{
						x: (Math.random() - 0.5) * 350,
						y: (Math.random() - 0.5) * 350,
						opacity: 0,
						scale: Math.random() * 1.5 + 0.5,
						rotate: Math.random() * 360,
					}}
					transition={{ duration: 1.2, ease: "easeOut" }}
					className="absolute h-2 w-2 rounded-full"
					style={{
						backgroundColor: [primaryColor, "#FFD700", "#FF69B4", "#00CED1", "#9333EA"][i % 5],
					}}
				/>
			))}
		</div>
	);
}

// Mini preview showing light/dark split
function ThemePreviewCard({ theme }: { theme: ThemeToken }) {
	const light = theme.styles.light;
	const dark = theme.styles.dark;

	return (
		<div
			className="relative h-28 w-full overflow-hidden rounded-lg border shadow-lg"
			style={{ borderColor: light.border }}
		>
			<div className="absolute inset-0 flex">
				{/* Light Side */}
				<div
					className="flex flex-1 flex-col gap-2 p-3"
					style={{ backgroundColor: light.background }}
				>
					<div
						className="h-2 w-2/3 rounded-full opacity-30"
						style={{ backgroundColor: light.foreground }}
					/>
					<div
						className="flex h-7 w-full items-center justify-center rounded-md text-[10px] font-bold shadow-sm"
						style={{
							backgroundColor: light.primary,
							color: light["primary-foreground"] || light.background,
						}}
					>
						Button
					</div>
					<div
						className="h-2 w-1/2 rounded-full opacity-20"
						style={{ backgroundColor: light.foreground }}
					/>
				</div>

				{/* Dark Side */}
				<div
					className="flex flex-1 flex-col gap-2 p-3"
					style={{ backgroundColor: dark.background }}
				>
					<div
						className="h-2 w-2/3 rounded-full opacity-30"
						style={{ backgroundColor: dark.foreground }}
					/>
					<div
						className="flex h-7 w-full items-center justify-center rounded-md border text-[10px] font-bold"
						style={{
							borderColor: dark.border,
							color: dark.foreground,
						}}
					>
						Outline
					</div>
					<div
						className="h-2 w-1/2 rounded-full opacity-20"
						style={{ backgroundColor: dark.foreground }}
					/>
				</div>
			</div>

			{/* Theme name badge */}
			<div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1.5 text-center backdrop-blur-sm">
				<span className="text-[10px] font-medium uppercase tracking-widest text-white">
					{theme.name}
				</span>
			</div>
		</div>
	);
}

// X/Twitter icon
function XIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" className={className} fill="currentColor">
			<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
		</svg>
	);
}

export function InscribedSuccessModal({
	isOpen,
	onClose,
	txid,
	theme,
}: InscribedSuccessModalProps) {
	const [copied, setCopied] = useState(false);

	const origin = `${txid}_0`;
	const installUrl = `https://themetoken.dev/r/themes/${origin}.json`;
	const installCommand = `bunx shadcn@latest add ${installUrl}`;
	const marketUrl = `https://1sat.market/outpoint/${origin}`;
	const themePageUrl = `https://themetoken.dev/preview/${origin}`;

	const handleCopy = () => {
		navigator.clipboard.writeText(installCommand);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleShare = () => {
		const text = `I just inscribed "${theme.name}" as a Theme Token on BSV! Install it in your project:\n\n${installCommand}\n\n`;
		window.open(
			`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(themePageUrl)}`,
			"_blank",
		);
	};

	const primaryColor = theme.styles.light.primary;

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-md overflow-hidden border-0 p-0 shadow-2xl sm:rounded-2xl">
				{/* Magical glow background using theme's primary color */}
				<div
					className="absolute inset-0 opacity-20 blur-3xl"
					style={{
						background: `radial-gradient(circle at center, ${primaryColor}, transparent 70%)`,
					}}
				/>

				{isOpen && <ConfettiExplosion primaryColor={primaryColor} />}

				<div className="relative z-10 flex flex-col items-center p-8 text-center">
					{/* Animated success icon */}
					<motion.div
						initial={{ scale: 0, rotate: -180 }}
						animate={{ scale: 1, rotate: 0 }}
						transition={{ type: "spring", damping: 12 }}
						className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/50 shadow-inner"
					>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.2 }}
						>
							<Sparkles className="h-8 w-8" style={{ color: primaryColor }} />
						</motion.div>
					</motion.div>

					{/* Headlines */}
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
					>
						<h2 className="text-2xl font-bold tracking-tight">
							Theme Inscribed!
						</h2>
						<p className="mt-2 text-sm text-muted-foreground">
							<span className="font-semibold text-foreground">{theme.name}</span>{" "}
							is now permanently on the blockchain.
						</p>
					</motion.div>

					{/* Theme preview */}
					<motion.div
						className="my-6 w-full"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.2 }}
					>
						<ThemePreviewCard theme={theme} />
					</motion.div>

					{/* Install command */}
					<motion.div
						className="w-full"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
					>
						<label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
							Install via CLI
						</label>
						<div className="group relative flex items-center gap-2 rounded-lg border bg-muted/50 p-3 pr-12 font-mono text-xs">
							<code className="flex-1 overflow-x-auto text-left">{installCommand}</code>
							<button
								type="button"
								onClick={handleCopy}
								className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-background"
								title="Copy"
							>
								{copied ? (
									<Check className="h-4 w-4 text-green-500" />
								) : (
									<Copy className="h-4 w-4 text-muted-foreground" />
								)}
							</button>
						</div>
					</motion.div>

					{/* Origin ID (smaller) */}
					<motion.div
						className="mt-4 w-full"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.35 }}
					>
						<p className="text-[10px] text-muted-foreground">
							Origin: <span className="font-mono">{origin}</span>
						</p>
					</motion.div>

					{/* Action buttons */}
					<motion.div
						className="mt-6 flex w-full gap-3"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.4 }}
					>
						<Button
							onClick={handleShare}
							variant="default"
							className="flex-1 gap-2"
						>
							<XIcon className="h-4 w-4" />
							Share
						</Button>
						<Button asChild variant="outline" className="flex-1 gap-2">
							<a href={marketUrl} target="_blank" rel="noopener noreferrer">
								View on Market
								<ExternalLink className="h-3 w-3" />
							</a>
						</Button>
					</motion.div>

					{/* Create another button */}
					<motion.div
						className="mt-4 w-full"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.5 }}
					>
						<Button
							onClick={onClose}
							variant="ghost"
							className="w-full text-muted-foreground"
						>
							Create Another Theme
						</Button>
					</motion.div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
