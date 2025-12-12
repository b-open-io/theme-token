"use client";

import type React from "react";
import { motion, type PanInfo } from "framer-motion";
import Image from "next/image";
import { useRef, useState, useEffect, useCallback } from "react";
import type { SwatchyPosition, SwatchySide } from "./swatchy-store";

interface SwatchyAvatarProps {
	position: SwatchyPosition;
	side: SwatchySide;
	onClick: () => void;
}

interface DragPosition {
	x: number;
	y: number;
}

export function SwatchyAvatar({ position, side, onClick }: SwatchyAvatarProps) {
	const isCorner = position === "corner";
	const isHero = position === "hero";
	const isExpanded = position === "expanded";
	const isLeft = side === "left";

	// Drag state - only active in corner mode
	const [dragPosition, setDragPosition] = useState<DragPosition | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const dragStartPos = useRef<{ x: number; y: number } | null>(null);
	const constraintsRef = useRef<{ top: number; left: number; right: number; bottom: number } | null>(null);

	// Reset drag position when leaving corner mode
	useEffect(() => {
		if (!isCorner) {
			setDragPosition(null);
		}
	}, [isCorner]);

	// Calculate constraints on mount and resize
	useEffect(() => {
		const updateConstraints = () => {
			constraintsRef.current = {
				top: 16,
				left: 16,
				right: window.innerWidth - 96, // 80px avatar + 16px margin
				bottom: window.innerHeight - 96,
			};
		};
		updateConstraints();
		window.addEventListener("resize", updateConstraints);
		return () => window.removeEventListener("resize", updateConstraints);
	}, []);

	const handleDragStart = useCallback(() => {
		setIsDragging(true);
	}, []);

	const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
		setIsDragging(false);
		// Save the final position
		if (constraintsRef.current) {
			const constraints = constraintsRef.current;
			// Clamp to constraints
			const newX = Math.max(constraints.left, Math.min(constraints.right, info.point.x - 40));
			const newY = Math.max(constraints.top, Math.min(constraints.bottom, info.point.y - 40));
			setDragPosition({ x: newX, y: newY });
		}
	}, []);

	const handleClick = useCallback(() => {
		// Only trigger click if we weren't dragging
		if (!isDragging) {
			onClick();
		}
	}, [isDragging, onClick]);

	// Position styles applied directly to style prop - layout animation handles the transition
	// CSS cannot interpolate between numeric values and "auto", so we use layout animation
	// Check mobile once for all position calculations
	const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

	const getPositionStyle = (): React.CSSProperties => {
		if (isExpanded) {
			// Expanded - large avatar partially behind chat
			// On mobile: position just above the chat bubble (which is at bottom)
			if (isMobile) {
				return {
					position: "fixed",
					top: "auto",
					bottom: "calc(70vh - 40px)", // Chat is 70vh tall, position just above it
					right: -20,
					left: "auto",
					width: 140,
					height: 140,
					zIndex: 50,
				};
			}
			// Desktop: at top right, partially behind chat
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

		// Corner state - use drag position if available
		if (dragPosition) {
			return {
				position: "fixed",
				top: dragPosition.y,
				left: dragPosition.x,
				bottom: "auto",
				right: "auto",
				width: 80,
				height: 80,
				zIndex: 60,
			};
		}

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
			className={`overflow-visible rounded-full focus:outline-none focus-visible:outline-none ${
				isCorner ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
			}`}
			onClick={handleClick}
			// Enable drag only in corner mode
			drag={isCorner}
			dragMomentum={false}
			dragElastic={0.1}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
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
