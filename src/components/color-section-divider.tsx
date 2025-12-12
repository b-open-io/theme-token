"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

type ColorVariant = "primary" | "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5";

interface ColorSectionDividerProps {
	color?: ColorVariant;
	intensity?: "subtle" | "medium" | "strong";
	direction?: "top" | "bottom" | "both";
	className?: string;
}

const colorClasses: Record<ColorVariant, string> = {
	primary: "from-primary/30",
	"chart-1": "from-chart-1/30",
	"chart-2": "from-chart-2/30",
	"chart-3": "from-chart-3/30",
	"chart-4": "from-chart-4/30",
	"chart-5": "from-chart-5/30",
};

const intensityOpacity: Record<string, string> = {
	subtle: "opacity-40",
	medium: "opacity-60",
	strong: "opacity-80",
};

/**
 * ColorSectionDivider - A radial gradient that simulates a light source
 * Use between sections for visual continuity
 */
export function ColorSectionDivider({
	color = "primary",
	intensity = "medium",
	direction = "top",
	className = "",
}: ColorSectionDividerProps) {
	const ref = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start end", "end start"],
	});

	const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);
	const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);

	return (
		<div
			ref={ref}
			className={`relative h-48 w-full overflow-hidden pointer-events-none ${className}`}
		>
			{/* Top radial gradient */}
			{(direction === "top" || direction === "both") && (
				<motion.div
					style={{ opacity, scale }}
					className={`
            absolute inset-x-0 top-0 h-full
            bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,var(--tw-gradient-from),transparent)]
            ${colorClasses[color]}
            ${intensityOpacity[intensity]}
            will-change-transform
          `}
				/>
			)}

			{/* Bottom radial gradient */}
			{(direction === "bottom" || direction === "both") && (
				<motion.div
					style={{ opacity, scale }}
					className={`
            absolute inset-x-0 bottom-0 h-full
            bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,var(--tw-gradient-from),transparent)]
            ${colorClasses[color]}
            ${intensityOpacity[intensity]}
            will-change-transform
          `}
				/>
			)}
		</div>
	);
}

/**
 * GlowingDivider - A horizontal line with a center glow
 */
export function GlowingDivider({
	color = "primary",
	className = "",
}: {
	color?: ColorVariant;
	className?: string;
}) {
	const glowColors: Record<ColorVariant, string> = {
		primary: "shadow-primary/50",
		"chart-1": "shadow-chart-1/50",
		"chart-2": "shadow-chart-2/50",
		"chart-3": "shadow-chart-3/50",
		"chart-4": "shadow-chart-4/50",
		"chart-5": "shadow-chart-5/50",
	};

	const bgColors: Record<ColorVariant, string> = {
		primary: "from-transparent via-primary/50 to-transparent",
		"chart-1": "from-transparent via-chart-1/50 to-transparent",
		"chart-2": "from-transparent via-chart-2/50 to-transparent",
		"chart-3": "from-transparent via-chart-3/50 to-transparent",
		"chart-4": "from-transparent via-chart-4/50 to-transparent",
		"chart-5": "from-transparent via-chart-5/50 to-transparent",
	};

	return (
		<div className={`relative py-12 ${className}`}>
			<div
				className={`
          h-px w-full
          bg-gradient-to-r ${bgColors[color]}
          shadow-[0_0_30px_10px] ${glowColors[color]}
        `}
			/>
		</div>
	);
}

/**
 * ColorBleed - Full-width color accent for section backgrounds
 */
export function ColorBleed({
	color = "primary",
	position = "left",
	className = "",
}: {
	color?: ColorVariant;
	position?: "left" | "right" | "center";
	className?: string;
}) {
	const bgColors: Record<ColorVariant, string> = {
		primary: "bg-primary",
		"chart-1": "bg-chart-1",
		"chart-2": "bg-chart-2",
		"chart-3": "bg-chart-3",
		"chart-4": "bg-chart-4",
		"chart-5": "bg-chart-5",
	};

	const positions = {
		left: "-left-64 top-1/2 -translate-y-1/2",
		right: "-right-64 top-1/2 -translate-y-1/2",
		center: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.8 }}
			whileInView={{ opacity: 1, scale: 1 }}
			viewport={{ once: true }}
			transition={{ duration: 1, ease: "easeOut" }}
			className={`
        absolute ${positions[position]}
        w-[500px] h-[500px]
        ${bgColors[color]}
        opacity-20 blur-[150px]
        rounded-full
        pointer-events-none
        ${className}
      `}
		/>
	);
}
