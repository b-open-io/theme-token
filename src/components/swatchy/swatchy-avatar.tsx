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
	// Check mobile once for all position calculations
	const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

	const getPositionStyle = (): React.CSSProperties => {
		if (isExpanded) {
			// Expanded - large avatar partially behind chat
			// On mobile: position near bottom-right where chat appears
			// On desktop: position at top-right behind chat
			if (isMobile) {
				return {
					position: "fixed",
					top: "auto",
					bottom: -40,
					right: -30,
					left: "auto",
					width: 180,
					height: 180,
					zIndex: 50,
				};
			}
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
			// On mobile: push further right (partially off-screen) so text is readable
			return {
				position: "fixed",
				top: "auto",
				bottom: isMobile ? "20%" : "25%",
				left: "auto",
				right: isMobile ? "-15%" : "15%", // Negative = partially off-screen on mobile
				width: isMobile ? 200 : 280,
				height: isMobile ? 200 : 280,
				zIndex: 40,
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
