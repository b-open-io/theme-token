"use client";

import { motion } from "framer-motion";

interface ThemeStyles {
	light: Record<string, string>;
	dark: Record<string, string>;
}

interface ConfettiExplosionProps {
	/** Full theme styles to derive palette from */
	styles: ThemeStyles;
}

// Extract a harmonious palette from the theme's own colors
function getConfettiPalette(styles: ThemeStyles): string[] {
	return [
		styles.light.primary,
		styles.dark.primary, // Adds depth/weight
		styles.light.accent,
		styles.light.secondary,
		styles.dark.accent,
	].filter(Boolean);
}

// Premium confetti with "Pop & Drift" physics
export function ConfettiExplosion({ styles }: ConfettiExplosionProps) {
	const palette = getConfettiPalette(styles);
	const particles = Array.from({ length: 30 });

	return (
		<div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
			{particles.map((_, i) => {
				const color = palette[i % palette.length];
				// Radial burst with controlled spread
				const angle = Math.random() * 360;
				const distance = 100 + Math.random() * 150;
				const x = Math.cos((angle * Math.PI) / 180) * distance;
				const y = Math.sin((angle * Math.PI) / 180) * distance;
				// Vary size for depth perception
				const size = 4 + Math.random() * 6;
				// Mix of circles (dots) and rectangles (dashes)
				const isCircle = Math.random() > 0.5;

				return (
					<motion.div
						key={i}
						initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
						animate={{
							x,
							y,
							scale: [0, 1, 0.8], // Pop up then settle
							opacity: [1, 1, 0], // Fade at end
							rotateX: Math.random() * 360, // 3D tumble for "twinkle"
							rotateY: Math.random() * 360,
							rotateZ: Math.random() * 360,
						}}
						transition={{
							duration: 1.2 + Math.random() * 0.5,
							ease: [0.22, 1, 0.36, 1], // Pop & drift cubic-bezier
							delay: Math.random() * 0.1, // Slight stagger
						}}
						style={{
							backgroundColor: color,
							width: isCircle ? size : size * 2,
							height: size,
							borderRadius: isCircle ? "50%" : "2px",
							position: "absolute",
						}}
					/>
				);
			})}
		</div>
	);
}
