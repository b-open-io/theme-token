"use client";

import type React from "react";
import { motion, useMotionValue } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import type { SwatchyPosition, SwatchySide } from "./swatchy-store";

interface SwatchyAvatarProps {
	position: SwatchyPosition;
	side: SwatchySide;
	onClick: () => void;
}

interface DragOffset {
	x: number;
	y: number;
}

interface StoredOffsets {
	corner?: DragOffset;
	expanded?: DragOffset;
}

const STORAGE_KEY = "swatchy-offsets";

function loadStoredOffsets(): StoredOffsets {
	if (typeof window === "undefined") return {};
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : {};
	} catch {
		return {};
	}
}

function saveStoredOffsets(offsets: StoredOffsets): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(offsets));
	} catch {
		// Ignore storage errors
	}
}

export function SwatchyAvatar({ position, side, onClick }: SwatchyAvatarProps) {
	const isCorner = position === "corner";
	const isHero = position === "hero";
	const isExpanded = position === "expanded";
	const isLeft = side === "left";
	const isDraggable = isCorner || isExpanded;

	// Motion values for drag offsets - these work WITH framer-motion's drag system
	const cornerX = useMotionValue(0);
	const cornerY = useMotionValue(0);
	const expandedX = useMotionValue(0);
	const expandedY = useMotionValue(0);

	const [isDragging, setIsDragging] = useState(false);
	const [offsetsLoaded, setOffsetsLoaded] = useState(false);

	// Load stored offsets on mount
	useEffect(() => {
		const stored = loadStoredOffsets();
		if (stored.corner) {
			cornerX.set(stored.corner.x);
			cornerY.set(stored.corner.y);
		}
		if (stored.expanded) {
			expandedX.set(stored.expanded.x);
			expandedY.set(stored.expanded.y);
		}
		setOffsetsLoaded(true);
	}, [cornerX, cornerY, expandedX, expandedY]);

	const handleDragStart = useCallback(() => {
		setIsDragging(true);
	}, []);

	const handleDragEnd = useCallback(() => {
		setIsDragging(false);

		// Save the current motion values as offsets
		const stored = loadStoredOffsets();
		if (isExpanded) {
			saveStoredOffsets({ ...stored, expanded: { x: expandedX.get(), y: expandedY.get() } });
		} else if (isCorner) {
			saveStoredOffsets({ ...stored, corner: { x: cornerX.get(), y: cornerY.get() } });
		}
	}, [isExpanded, isCorner, cornerX, cornerY, expandedX, expandedY]);

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
			// Default expanded position - offsets handled by motion values
			if (isMobile) {
				return {
					position: "fixed",
					top: "auto",
					bottom: "calc(70vh - 40px)",
					right: -20,
					left: "auto",
					width: 140,
					height: 140,
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
			// Hero pose - NOT draggable, click only
			return {
				position: "fixed",
				top: "auto",
				bottom: isMobile ? "20%" : "25%",
				left: "auto",
				right: isMobile ? "-15%" : "15%",
				width: isMobile ? 200 : 280,
				height: isMobile ? 200 : 280,
				zIndex: 40,
			};
		}

		// Default corner position - offsets handled by motion values
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

	// Get the appropriate motion values for the current mode
	const getCurrentX = () => {
		if (isCorner) return cornerX;
		if (isExpanded) return expandedX;
		return undefined;
	};

	const getCurrentY = () => {
		if (isCorner) return cornerY;
		if (isExpanded) return expandedY;
		return undefined;
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
			style={{
				...getPositionStyle(),
				x: getCurrentX(),
				y: getCurrentY(),
			}}
			className={`overflow-visible rounded-full focus:outline-none focus-visible:outline-none ${
				isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
			}`}
			onClick={handleClick}
			// Enable drag for corner and expanded modes (not hero)
			drag={isDraggable}
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
			whileHover={isDraggable || isHero ? { scale: 1.05 } : undefined}
			whileTap={isDraggable || isHero ? { scale: 0.95 } : undefined}
			aria-label={isCorner || isHero ? "Open Swatchy assistant" : "Drag to reposition or click to close chat"}
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
