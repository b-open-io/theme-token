"use client";

import type React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import type { SwatchyPosition, SwatchySide } from "./swatchy-store";

interface SwatchyAvatarProps {
	position: SwatchyPosition;
	side: SwatchySide;
	onClick: () => void;
}

export function SwatchyAvatar({ position, side, onClick }: SwatchyAvatarProps) {
	const isCorner = position === "corner";
	const isLeft = side === "left";

	// Position styles applied directly to style prop - layout animation handles the transition
	// CSS cannot interpolate between numeric values and "auto", so we use layout animation
	const getPositionStyle = (): React.CSSProperties => {
		if (!isCorner) {
			// Expanded - large avatar at top right, partially behind chat
			return {
				position: "fixed",
				top: -75,
				right: -20,
				bottom: "auto",
				left: "auto",
				width: 280,
				height: 280,
				zIndex: 50,
			};
		}

		// Corner state
		return {
			position: "fixed",
			top: "auto",
			bottom: 16,
			left: isLeft ? 16 : "auto",
			right: isLeft ? "auto" : 16,
			width: 80,
			height: 80,
			zIndex: 60,
		};
	};

	return (
		<motion.button
			// layout prop is the key - it measures bounding box and uses transforms
			// instead of trying to interpolate CSS position properties
			layout
			style={getPositionStyle()}
			className="cursor-pointer overflow-visible rounded-full"
			onClick={onClick}
			// Smooth spring that feels "heavy" enough not to overshoot
			transition={{
				type: "spring",
				stiffness: 200,
				damping: 25,
			}}
			whileHover={isCorner ? { scale: 1.05 } : undefined}
			whileTap={isCorner ? { scale: 0.95 } : undefined}
			aria-label={isCorner ? "Open Swatchy assistant" : "Close chat"}
		>
			{/* Wrapper with layout="preserve-aspect" prevents distortion during size transition */}
			<motion.div className="relative h-full w-full" layout="preserve-aspect">
				{/* Floating animation wrapper - only when in corner */}
				<motion.div
					className="h-full w-full"
					animate={
						isCorner
							? {
									y: [0, -8, 0],
									rotate: [0, 2, 0, -2, 0],
								}
							: { y: 0, rotate: 0 }
					}
					transition={
						isCorner
							? {
									duration: 5,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								}
							: { duration: 0.5 }
					}
				>
					<Image
						src="/swatchy-meditation.png"
						alt="Swatchy Assistant"
						fill
						sizes="(max-width: 768px) 100vw, 280px"
						className="object-contain"
						priority
						draggable={false}
					/>
				</motion.div>
			</motion.div>

			{/* Notification pulse when idle in corner */}
			{isCorner && (
				<motion.span
					className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-primary"
					animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
					transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
				/>
			)}
		</motion.button>
	);
}
