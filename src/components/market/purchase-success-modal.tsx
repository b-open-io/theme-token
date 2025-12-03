"use client";

import type { ThemeToken } from "@theme-token/sdk";
import { motion } from "framer-motion";
import { Check, ExternalLink, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import useSound from "use-sound";
import { Button } from "@/components/ui/button";
import { ConfettiExplosion } from "@/components/ui/confetti";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PurchaseSuccessModalProps {
	isOpen: boolean;
	onClose: () => void;
	onApplyNow: () => void;
	txid: string;
	theme: ThemeToken;
}

// Holographic sheen sweep effect
function CardSheen() {
	return (
		<motion.div
			initial={{ x: "-100%", opacity: 0 }}
			animate={{ x: "200%", opacity: [0, 0.6, 0] }}
			transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
			className="pointer-events-none absolute inset-0 z-20"
			style={{
				background:
					"linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.5) 50%, transparent 80%)",
			}}
		/>
	);
}

// Mini preview showing light/dark split with sheen
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

			{/* Holographic sheen sweep */}
			<CardSheen />
		</div>
	);
}

export function PurchaseSuccessModal({
	isOpen,
	onClose,
	onApplyNow,
	txid,
	theme,
}: PurchaseSuccessModalProps) {
	const primaryColor = theme.styles.light.primary;
	const whatsOnChainUrl = `https://whatsonchain.com/tx/${txid}`;

	// Success chime sound
	const [playSuccess] = useSound("/sounds/success.mp3", { volume: 0.5 });

	// Play sound when modal opens
	useEffect(() => {
		if (isOpen) {
			playSuccess();
		}
	}, [isOpen, playSuccess]);

	const handleApplyNow = () => {
		onApplyNow();
		onClose();
	};

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

				{isOpen && <ConfettiExplosion styles={theme.styles} />}

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
							<ShoppingBag className="h-8 w-8" style={{ color: primaryColor }} />
						</motion.div>
					</motion.div>

					{/* Headlines */}
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
					>
						<h2 className="text-2xl font-bold tracking-tight">
							Theme Purchased!
						</h2>
						<p className="mt-2 text-sm text-muted-foreground">
							<span className="font-semibold text-foreground">{theme.name}</span>{" "}
							is now in your collection.
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

					{/* Transaction link */}
					<motion.div
						className="w-full"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
					>
						<a
							href={whatsOnChainUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
						>
							<Check className="h-3 w-3 text-green-500" />
							Transaction confirmed
							<ExternalLink className="h-3 w-3" />
						</a>
					</motion.div>

					{/* Action buttons */}
					<motion.div
						className="mt-6 flex w-full gap-3"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.4 }}
					>
						<Button
							onClick={handleApplyNow}
							variant="default"
							className="flex-1 gap-2"
						>
							Apply Now
						</Button>
						<Button
							onClick={onClose}
							variant="outline"
							className="flex-1"
						>
							Browse More
						</Button>
					</motion.div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
