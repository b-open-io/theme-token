"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SwatchySide } from "./swatchy-store";

interface SwatchyTalkBubbleProps {
	type: "say" | "think";
	text: string;
	/** Which screen edge Swatchy is docked on, so the bubble grows inward. */
	side: SwatchySide;
}

export function SwatchyTalkBubble({
	type,
	text,
	side,
}: SwatchyTalkBubbleProps) {
	const isLeft = side === "left";
	return (
		<motion.div
			className={cn(
				// Anchor to whichever edge Swatchy is docked on so the bubble grows
				// inward and never spills off-screen. (Centering on the avatar made
				// it overflow when he wandered to either edge.)
				"absolute bottom-full mb-4 z-50 w-48 max-w-[80vw] pointer-events-none",
				isLeft ? "left-0" : "right-0",
			)}
			initial={{ opacity: 0, scale: 0.5, y: 10 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.5, y: 5 }}
			transition={{ type: "spring", stiffness: 300, damping: 20 }}
		>
			<div
				className={cn(
					"relative rounded-xl border-2 border-primary bg-background p-3 text-center text-xs font-medium shadow-lg",
					type === "think" && "border-dashed",
				)}
			>
				<span className="text-foreground">{text}</span>

				{/* Down-pointing tail toward the avatar. Two stacked triangles: an
				    outer one in the border color and an inner one in the background
				    colour pulled up by the 2px border width, so the border wraps the
				    tail cleanly and the join with the bubble has no seam line. */}
				{type === "say" && (
					<>
						<div
							className={cn(
								"absolute top-full h-0 w-0 border-x-[10px] border-t-[10px] border-x-transparent border-t-primary",
								isLeft ? "left-4" : "right-4",
							)}
						/>
						<div
							className={cn(
								"absolute top-full -mt-[3px] h-0 w-0 border-x-[8px] border-t-[8px] border-x-transparent border-t-background",
								isLeft ? "left-[18px]" : "right-[18px]",
							)}
						/>
					</>
				)}

				{type === "think" && (
					<div
						className={cn(
							"absolute top-full mt-1 flex flex-col items-center gap-1",
							isLeft ? "left-6" : "right-6",
						)}
					>
						<div className="h-2 w-2 rounded-full border-2 border-primary bg-background" />
						<div className="h-1.5 w-1.5 rounded-full border-2 border-primary bg-background" />
					</div>
				)}
			</div>
		</motion.div>
	);
}
