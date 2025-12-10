"use client";

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

	// Calculate positions based on state
	// Use calc() with top/right consistently to enable smooth animation
	// (can't animate between bottom and top - they're different properties)
	const getAnimateProps = () => {
		if (!isCorner) {
			// Expanded - large avatar at top right, partially behind chat
			return {
				top: -75,
				right: -20,
				width: 280,
				height: 280,
			};
		}

		// Corner position - use top with calc to position from bottom
		if (isLeft) {
			return {
				top: "calc(100vh - 96px)", // 80px height + 16px margin
				right: "calc(100vw - 96px)", // 80px width + 16px margin
				width: 80,
				height: 80,
			};
		}

		// Right side corner
		return {
			top: "calc(100vh - 96px)", // 80px height + 16px margin
			right: 16,
			width: 80,
			height: 80,
		};
	};

	return (
		<motion.button
			// z-50 when expanded (behind chat at z-55), z-60 when in corner (above everything)
			className={`fixed cursor-pointer overflow-visible rounded-full ${isCorner ? "z-[60]" : "z-[50]"}`}
			initial={false}
			animate={getAnimateProps()}
			transition={{
				type: "spring",
				stiffness: 80,
				damping: 20,
				mass: 1,
			}}
			onClick={onClick}
			whileHover={isCorner ? { scale: 1.1 } : undefined}
			whileTap={isCorner ? { scale: 0.95 } : undefined}
			aria-label={isCorner ? "Open Swatchy assistant" : "Close chat"}
		>
			{/* Floating animation wrapper - only when in corner */}
			<motion.div
				animate={
					isCorner
						? {
								y: [0, -12, 0],
								rotate: [0, 3, 0, -3, 0],
							}
						: { y: 0, rotate: 0 }
				}
				transition={
					isCorner
						? {
								y: {
									duration: 5,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								},
								rotate: {
									duration: 7,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								},
							}
						: { duration: 0.3 }
				}
				className="h-full w-full"
			>
				<Image
					src="/swatchy-meditation.png"
					alt="Swatchy Assistant"
					width={80}
					height={80}
					className="h-full w-full object-contain"
					priority
				/>
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
