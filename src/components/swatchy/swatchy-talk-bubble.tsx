"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SwatchyTalkBubbleProps {
	type: "say" | "think";
	text: string;
}

export function SwatchyTalkBubble({ type, text }: SwatchyTalkBubbleProps) {
	return (
		<motion.div
			className={cn(
				"absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-48 z-50 pointer-events-none",
				// Shift slightly for visual balance relative to avatar center
				"ml-4"
			)}
			initial={{ opacity: 0, scale: 0.5, y: 10 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.5, y: 5 }}
			transition={{ type: "spring", stiffness: 300, damping: 20 }}
		>
			<div className={cn(
				"relative p-3 bg-background border-2 border-primary text-primary-foreground text-xs font-medium text-center shadow-lg",
				type === "say" ? "rounded-xl rounded-bl-none" : "rounded-[20px]",
				type === "think" && "border-dashed"
			)}>
				{/* Content */}
				<span className="text-foreground">{text}</span>

				{/* Tails */}
				{type === "say" && (
					<svg className="absolute -bottom-[14px] left-4 w-4 h-4 text-primary fill-background stroke-primary stroke-2" viewBox="0 0 20 20">
						<path d="M0 0 L0 20 L20 0 Z" />
						{/* Overlay to hide border overlap */}
						<path d="M2 0 L18 0" stroke="none" fill="currentColor" className="text-background" />
					</svg>
				)}

				{type === "think" && (
					<div className="absolute -bottom-6 left-6 flex flex-col items-center gap-1">
						<div className="w-2 h-2 rounded-full bg-background border-2 border-primary" />
						<div className="w-1.5 h-1.5 rounded-full bg-background border-2 border-primary" />
					</div>
				)}
			</div>
		</motion.div>
	);
}
