"use client";

import type React from "react";
import { motion, useMotionValue } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useCallback, useLayoutEffect, useRef } from "react";
import type { SwatchyPosition, SwatchySide } from "./swatchy-store";

interface SwatchyAvatarProps {
	position: SwatchyPosition;
	side: SwatchySide;
	onClick: () => void;
	children?: React.ReactNode;
}

interface DragOffset {
	x: number;
	y: number;
}

interface StoredOffsets {
	hero?: DragOffset;
	corner?: DragOffset;
	expanded?: DragOffset;
}

const STORAGE_KEY = "swatchy-offsets-v2";

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

export function SwatchyAvatar({ position, side, onClick, children }: SwatchyAvatarProps) {
	const isCorner = position === "corner";
	const isHero = position === "hero";
	const isExpanded = position === "expanded";
	const isLeft = side === "left";
	
	// Draggable in all states now
	const isDraggable = true;

	// Single pair of motion values for the avatar transform
	const x = useMotionValue(0);
	const y = useMotionValue(0);

	// Store drag offsets in a ref to persist between renders without re-rendering
	const offsetsRef = useRef<StoredOffsets>({
		hero: { x: 0, y: 0 },
		corner: { x: 0, y: 0 },
		expanded: { x: 0, y: 0 },
	});

	const [isDragging, setIsDragging] = useState(false);
	const prevPositionRef = useRef(position);
	const [viewportHeight, setViewportHeight] = useState(1000);

	// Handle window resize for constraints
	useEffect(() => {
		if (typeof window !== "undefined") {
			setViewportHeight(window.innerHeight);
			const handleResize = () => setViewportHeight(window.innerHeight);
			window.addEventListener("resize", handleResize);
			return () => window.removeEventListener("resize", handleResize);
		}
	}, []);

	// Load stored offsets on mount
	useEffect(() => {
		const stored = loadStoredOffsets();
		offsetsRef.current = {
			hero: stored.hero ?? { x: 0, y: 0 },
			corner: stored.corner ?? { x: 0, y: 0 },
			expanded: stored.expanded ?? { x: 0, y: 0 },
		};

		// Initialize position based on current mode
		const currentOffset = offsetsRef.current[position] ?? { x: 0, y: 0 };
		x.set(currentOffset.x);
		y.set(currentOffset.y);
	}, [position, x, y]);

	// Handle mode switching logic to preserve continuity
	useLayoutEffect(() => {
		const prev = prevPositionRef.current;
		if (prev !== position) {
			// 1. Save current drag state to previous mode
			offsetsRef.current[prev] = { x: x.get(), y: y.get() };

			// 2. Load drag state for new mode
			// If transitioning to Expanded for the first time (or if we want it to follow),
			// we might want logic to "copy" the previous position. 
			// But for now, let's respect the persistent "Expanded" position as requested.
			const targetOffset = offsetsRef.current[position] ?? { x: 0, y: 0 };

			// 3. Update motion values immediately before paint
			// This allows layout animation to animate from [PrevBase + PrevOffset] -> [NewBase + NewOffset]
			x.set(targetOffset.x);
			y.set(targetOffset.y);

			// 4. Update ref
			prevPositionRef.current = position;
		}
	}, [position, x, y]);

	const handleDragStart = useCallback(() => {
		setIsDragging(true);
	}, []);

	const handleDragEnd = useCallback(() => {
		setIsDragging(false);

		// Persist to local storage
		const currentOffsets = offsetsRef.current;
		currentOffsets[position] = { x: x.get(), y: y.get() };
		saveStoredOffsets(currentOffsets);
	}, [position, x, y]);

	const handleClick = useCallback(() => {
		if (!isDragging) {
			onClick();
		}
	}, [isDragging, onClick]);

	const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

	// Define base layout positions
	const getPositionStyle = (): React.CSSProperties => {
		if (isExpanded) {
			// Expanded base position (Top-Rightish)
			// User can drag from here
			if (isMobile) {
				return {
					position: "fixed",
					top: "auto",
					bottom: "calc(70vh - 40px)",
					right: 20, // using positive right
					left: "auto",
					width: 140,
					height: 140,
					zIndex: 50,
				};
			}
			return {
				position: "fixed",
				top: 80, // Moved down a bit to be visible
				right: 40,
				bottom: "auto",
				left: "auto",
				width: 280,
				height: 280,
				zIndex: 50,
			};
		}

		if (isHero) {
			// Hero base position
			return {
				position: "fixed",
				top: "auto",
				bottom: isMobile ? "20%" : "25%",
				left: "auto",
				right: isMobile ? "5%" : "15%",
				width: isMobile ? 200 : 280,
				height: isMobile ? 200 : 280,
				zIndex: 40,
			};
		}

		// Corner base position
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

	// Floating animation
	const getFloatAnimation = () => {
		if (isExpanded) return { y: 0, rotate: 0 };
		if (isHero) return { y: [0, -12, 0], rotate: [0, 3, 0, -3, 0] };
		return { y: [0, -8, 0], rotate: [0, 2, 0, -2, 0] };
	};

	const getFloatTransition = () => {
		if (isExpanded) return { duration: 0.5 };
		if (isHero) return { duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" as const };
		return { duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" as const };
	};

	// Determine constraints
	const getConstraints = () => {
		// Hero: Constrain to roughly the first viewport (plus some buffer)
		if (isHero) {
			return { 
				top: -500, // Allow some upward movement relative to base
				bottom: 200, 
				left: -1000, 
				right: 200 
			};
		}
		// Corner/Expanded: Free drag (window limits mostly)
		return undefined;
	};

	return (
		<motion.div
			// The Rig - handles position and drag
			layout
			style={{
				...getPositionStyle(),
				x,
				y,
			}}
			className="overflow-visible"
			drag={isDraggable}
			dragMomentum={false}
			dragElastic={0.1}
			dragConstraints={getConstraints()}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			transition={{
				type: "spring",
				stiffness: isHero ? 120 : 200,
				damping: isHero ? 20 : 25,
				mass: 1,
			}}
		>
			{/* The Avatar - handles visual interactions */}
			<motion.button
				className={`relative w-full h-full rounded-full focus:outline-none focus-visible:outline-none ${
					isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
				}`}
				onClick={handleClick}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				aria-label="Swatchy Assistant"
			>
				{/* Inner wrapper for aspect ratio */}
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

				{/* Pulse indicator */}
				{isCorner && (
					<motion.span
						className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-primary"
						animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
						transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
					/>
				)}
			</motion.button>

			{/* The Chat Bubble - Rendered relative to the Rig */}
			{children}
		</motion.div>
	);
}