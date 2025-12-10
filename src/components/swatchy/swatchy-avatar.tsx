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
	const isHero = position === "hero";
	const isExpanded = position === "expanded";
	const isLeft = side === "left";

	// Position styles applied directly to style prop - layout animation handles the transition
	// CSS cannot interpolate between numeric values and "auto", so we use layout animation
	const getPositionStyle = (): React.CSSProperties => {
		if (isExpanded) {
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

		if (isHero) {
			// Hero pose - larger, positioned to the right side of the hero content
			// Higher up and more towards center, but not blocking the main UI
			return {
				position: "fixed",
				top: "auto",
				bottom: "25%",
				left: "auto",
				right: "15%",
				width: 280,
				height: 280,
				zIndex: 40, // Below corner z-index so it doesn't feel too prominent
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

	// Floating animation - more pronounced in hero mode, subtle in corner
	const getFloatAnimation = () => {
		if (isExpanded) {
			return { y: 0, rotate: 0 };
		}
		if (isHero) {
			// Larger, slower, more majestic float for hero pose
			return {
				y: [0, -12, 0],
				rotate: [0, 3, 0, -3, 0],
			};
		}
		// Standard corner float
		return {
			y: [0, -8, 0],
			rotate: [0, 2, 0, -2, 0],
		};
	};

	const getFloatTransition = () => {
		if (isExpanded) {
			return { duration: 0.5 };
		}
		if (isHero) {
			// Slower, more elegant for hero
			return {
				duration: 6,
				repeat: Number.POSITIVE_INFINITY,
				ease: "easeInOut" as const,
			};
		}
		return {
			duration: 5,
			repeat: Number.POSITIVE_INFINITY,
			ease: "easeInOut" as const,
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
			// Smooth spring - slightly softer for hero transitions
			transition={{
				type: "spring",
				stiffness: isHero ? 120 : 200,
				damping: isHero ? 20 : 25,
				mass: 1,
			}}
			whileHover={isCorner || isHero ? { scale: 1.05 } : undefined}
			whileTap={isCorner || isHero ? { scale: 0.95 } : undefined}
			aria-label={isCorner || isHero ? "Open Swatchy assistant" : "Close chat"}
		>
			{/* Wrapper with layout="preserve-aspect" prevents distortion during size transition */}
			<motion.div className="relative h-full w-full" layout="preserve-aspect">
				{/* Floating animation wrapper */}
				<motion.div
					className="h-full w-full"
					animate={getFloatAnimation()}
					transition={getFloatTransition()}
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

			{/* Notification pulse when idle in corner (not in hero) */}
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
