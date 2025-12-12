"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface Chip {
	color: string;
	x: string;
	y: number;
	speed: number;
	scale: number;
	blur?: boolean;
	rotation?: number;
}

// Randomly positioned color chips at different depths
const chips: Chip[] = [
	{ color: "bg-primary", x: "8%", y: 50, speed: 0.6, scale: 1.2, rotation: 12 },
	{ color: "bg-chart-1", x: "85%", y: 120, speed: 1.4, scale: 0.7, blur: true },
	{ color: "bg-chart-2", x: "35%", y: 200, speed: 0.9, scale: 1.0, rotation: -8 },
	{ color: "bg-chart-3", x: "72%", y: 80, speed: 1.1, scale: 0.85 },
	{ color: "bg-chart-4", x: "18%", y: 280, speed: 1.6, scale: 0.6, blur: true },
	{ color: "bg-chart-5", x: "55%", y: 150, speed: 0.7, scale: 1.1, rotation: 20 },
	{ color: "bg-primary", x: "92%", y: 320, speed: 1.3, scale: 0.55, blur: true },
	{ color: "bg-chart-1", x: "42%", y: 380, speed: 0.8, scale: 0.9, rotation: -15 },
	{ color: "bg-chart-2", x: "5%", y: 180, speed: 1.5, scale: 0.65, blur: true },
	{ color: "bg-chart-3", x: "68%", y: 420, speed: 0.5, scale: 1.3, rotation: 5 },
	{ color: "bg-chart-4", x: "28%", y: 100, speed: 1.2, scale: 0.75 },
	{ color: "bg-chart-5", x: "78%", y: 280, speed: 0.95, scale: 0.8, rotation: -10 },
	{ color: "bg-primary", x: "48%", y: 350, speed: 1.0, scale: 0.7, blur: true },
	{ color: "bg-chart-1", x: "12%", y: 450, speed: 0.75, scale: 1.0, rotation: 18 },
	{ color: "bg-chart-2", x: "62%", y: 30, speed: 1.35, scale: 0.6, blur: true },
];

function Chip({
	data,
	progress,
}: {
	data: Chip;
	progress: ReturnType<typeof useTransform>;
}) {
	const y = useTransform(progress, [0, 1], [0, -600 * data.speed]);
	const opacity = useTransform(progress, [0, 0.3, 0.7, 1], [0, 0.9, 0.9, 0]);
	const rotate = useTransform(
		progress,
		[0, 1],
		[data.rotation || 0, (data.rotation || 0) + 45],
	);

	return (
		<motion.div
			style={{
				y,
				opacity,
				rotate,
				left: data.x,
				top: data.y,
				scale: data.scale,
			}}
			className={`
        absolute w-14 h-14 rounded-xl
        ${data.color}
        ${data.blur ? "blur-[2px] opacity-60" : "opacity-80"}
        mix-blend-screen
        will-change-transform
        shadow-lg
      `}
		>
			{/* Inner glow */}
			<div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent" />
		</motion.div>
	);
}

/**
 * ParallaxChips - Floating color chips that create a "color river" effect
 * Place between sections for visual transition
 */
export function ParallaxChips({ className = "" }: { className?: string }) {
	const ref = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start end", "end start"],
	});

	return (
		<div
			ref={ref}
			className={`relative h-[600px] w-full overflow-hidden pointer-events-none ${className}`}
		>
			{/* Gradient fade top */}
			<div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent z-10" />

			{/* The chips */}
			{chips.map((chip, i) => (
				<Chip key={`chip-${i}`} data={chip} progress={scrollYProgress} />
			))}

			{/* Gradient fade bottom */}
			<div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />

			{/* Central glow */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
		</div>
	);
}

/**
 * FloatingChips - Smaller version for inline use between content
 */
export function FloatingChips() {
	return (
		<div className="relative h-32 w-full overflow-hidden pointer-events-none">
			{chips.slice(0, 6).map((chip, i) => (
				<motion.div
					key={`float-${i}`}
					animate={{
						y: [0, -20, 0],
						rotate: [chip.rotation || 0, (chip.rotation || 0) + 10, chip.rotation || 0],
					}}
					transition={{
						duration: 4 + i * 0.5,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
					style={{
						left: chip.x,
						top: `${20 + (i * 10)}%`,
						scale: chip.scale * 0.6,
					}}
					className={`
            absolute w-10 h-10 rounded-lg
            ${chip.color}
            opacity-50
            blur-[1px]
            mix-blend-screen
          `}
				/>
			))}
		</div>
	);
}
