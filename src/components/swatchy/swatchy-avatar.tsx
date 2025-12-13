"use client";

import type React from "react";
import { motion, useMotionValue, animate, type AnimationPlaybackControls } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
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

const STORAGE_KEY = "swatchy-offsets-v3"; // Version bump for new coord system

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
	const isDraggable = true;

	// Motion values for absolute screen position
	const x = useMotionValue(0);
	const y = useMotionValue(0);
	// Motion values for dimensions
	const width = useMotionValue(80);
	const height = useMotionValue(80);

	// Store drag offsets relative to base position
	const offsetsRef = useRef<StoredOffsets>({
		hero: { x: 0, y: 0 },
		corner: { x: 0, y: 0 },
		expanded: { x: 0, y: 0 },
	});

	const [isDragging, setIsDragging] = useState(false);
	const [windowSize, setWindowSize] = useState({ w: 0, h: 0 });
	// Keep track of active animations to stop them on drag
	const controlsRef = useRef<{ x?: AnimationPlaybackControls; y?: AnimationPlaybackControls; w?: AnimationPlaybackControls; h?: AnimationPlaybackControls }>({});

	// Handle window resize
	useEffect(() => {
		if (typeof window !== "undefined") {
			setWindowSize({ w: window.innerWidth, h: window.innerHeight });
			const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
			window.addEventListener("resize", handleResize);
			return () => window.removeEventListener("resize", handleResize);
		}
	}, []);

	// Load offsets on mount
	useEffect(() => {
		const stored = loadStoredOffsets();
		offsetsRef.current = {
			hero: stored.hero ?? { x: 0, y: 0 },
			corner: stored.corner ?? { x: 0, y: 0 },
			expanded: stored.expanded ?? { x: 0, y: 0 },
		};
	}, []);

	// Calculate base position for a given mode
	const getBasePosition = useCallback((mode: SwatchyPosition, winW: number, winH: number) => {
		const isMobile = winW < 640;

		if (mode === "expanded") {
			const size = isMobile ? 140 : 280;
			if (isMobile) {
				// Mobile Expanded: Bottom Rightish
				return {
					x: winW - 20 - size,
					y: winH - 40 - size,
					size,
				};
			}
			// Desktop Expanded: Top Right
			// top: 80, right: 40
			return {
				x: winW - 40 - size,
				y: 80,
				size,
			};
		}

		if (mode === "hero") {
			const size = isMobile ? 200 : 280;
			// Desktop: bottom 25%, right 15%
			// Mobile: bottom 20%, right 5%
			const rightPct = isMobile ? 0.05 : 0.15;
			const bottomPct = isMobile ? 0.20 : 0.25;
			return {
				x: winW - (winW * rightPct) - size,
				y: winH - (winH * bottomPct) - size,
				size,
			};
		}

		// Corner (Default)
		const size = 80;
		// bottom: 16, right: 16 (or left: 16)
		if (isLeft) {
			return {
				x: 16,
				y: winH - 16 - size,
				size,
			};
		}
		return {
			x: winW - 16 - size,
			y: winH - 16 - size,
			size,
		};
	}, [isLeft]);

	// Animate to target position whenever state changes
	useEffect(() => {
		if (windowSize.w === 0) return; // Wait for hydration
		if (isDragging) return; // Don't animate while dragging

		const base = getBasePosition(position, windowSize.w, windowSize.h);
		const offset = offsetsRef.current[position] ?? { x: 0, y: 0 };
		const targetX = base.x + offset.x;
		const targetY = base.y + offset.y;

		// Stop any existing animations
		controlsRef.current.x?.stop();
		controlsRef.current.y?.stop();
		controlsRef.current.w?.stop();
		controlsRef.current.h?.stop();

		// Spring configuration for "Fly To" feel
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const spring: any = { type: "spring", stiffness: 120, damping: 20, mass: 1 };

		controlsRef.current.x = animate(x, targetX, spring);
		controlsRef.current.y = animate(y, targetY, spring);
		controlsRef.current.w = animate(width, base.size, spring);
		controlsRef.current.h = animate(height, base.size, spring);

	}, [position, windowSize, isDragging, getBasePosition, x, y, width, height]);

	const handleDragStart = useCallback(() => {
		setIsDragging(true);
		// Stop animations to let user take control
		controlsRef.current.x?.stop();
		controlsRef.current.y?.stop();
	}, []);

	const handleDragEnd = useCallback(() => {
		setIsDragging(false);
		if (windowSize.w === 0) return;

		// Calculate new offset relative to base
		const base = getBasePosition(position, windowSize.w, windowSize.h);
		const newOffset = {
			x: x.get() - base.x,
			y: y.get() - base.y,
		};

		// Save offset
		offsetsRef.current[position] = newOffset;
		saveStoredOffsets(offsetsRef.current);
		
		// Optional: Snap to bounds if dragging went too wild?
		// For now we let it stay where dragged (as requested: "no matter where Swatchy is, he can be dragged")
	}, [position, windowSize, getBasePosition, x, y]);

	const handleClick = useCallback(() => {
		if (!isDragging) {
			onClick();
		}
	}, [isDragging, onClick]);

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

	// Hero constraints logic can be handled here if needed, but since we animate imperatively,
	// dragConstraints prop works best with relative motion values usually.
	// Since x/y are absolute, we can constrain to window bounds.
	const getConstraints = () => {
		if (windowSize.w === 0) return undefined;
		
		if (isHero) {
			// Hero: "draggable within the confines of the first visible view height"
			// Assuming first view height is windowSize.h
			// Avatar size is dynamic (width.get() is motion value)
			// We can approximate constraints.
			return {
				top: 0,
				left: 0,
				right: windowSize.w - 200, // loose
				bottom: windowSize.h - 200,
			};
		}
		// Free drag
		return undefined;
	};

	return (
		<motion.div
			// The Rig - handles absolute position and drag
			// NO layout prop - we handle position manually for perfect control
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				x,
				y,
				width,
				height,
				zIndex: isCorner ? 60 : (isExpanded ? 50 : 40),
			}}
			className="overflow-visible"
			drag={isDraggable}
			dragMomentum={false}
			dragElastic={0.1}
			dragConstraints={getConstraints()}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			{/* The Avatar Visuals */}
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
				<motion.div className="relative h-full w-full">
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
