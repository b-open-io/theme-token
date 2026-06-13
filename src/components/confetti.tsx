"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface ThemeStyles {
	light: Record<string, string>;
	dark: Record<string, string>;
}

interface ConfettiExplosionProps {
	/** Full theme styles to derive palette from */
	styles: ThemeStyles;
}

interface Particle {
	id: string;
	x: number;
	y: number;
	size: number;
	isCircle: boolean;
	rotateX: number;
	rotateY: number;
	rotateZ: number;
	duration: number;
	delay: number;
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

// Build the random particle layout ONCE. Calling Math.random() during render
// makes the render non-deterministic (different output every render), which
// can drive React into an infinite re-render loop ("Maximum update depth
// exceeded", React error #185) under concurrent rendering / view transitions —
// it only surfaced in production when the success modal mounted this. Freezing
// the layout in a lazy useState initializer makes the render deterministic.
function createParticles(): Particle[] {
	return Array.from({ length: 30 }, (_, i) => {
		const angle = Math.random() * 360;
		const distance = 100 + Math.random() * 150;
		return {
			id: `confetti-${i}`,
			x: Math.cos((angle * Math.PI) / 180) * distance,
			y: Math.sin((angle * Math.PI) / 180) * distance,
			size: 4 + Math.random() * 6,
			isCircle: Math.random() > 0.5,
			rotateX: Math.random() * 360,
			rotateY: Math.random() * 360,
			rotateZ: Math.random() * 360,
			duration: 1.2 + Math.random() * 0.5,
			delay: Math.random() * 0.1,
		};
	});
}

// Premium confetti with "Pop & Drift" physics
export function ConfettiExplosion({ styles }: ConfettiExplosionProps) {
	const palette = getConfettiPalette(styles);
	const [particles] = useState(createParticles);

	return (
		<div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
			{particles.map((particle, i) => (
				<motion.div
					key={particle.id}
					initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
					animate={{
						x: particle.x,
						y: particle.y,
						scale: [0, 1, 0.8], // Pop up then settle
						opacity: [1, 1, 0], // Fade at end
						rotateX: particle.rotateX, // 3D tumble for "twinkle"
						rotateY: particle.rotateY,
						rotateZ: particle.rotateZ,
					}}
					transition={{
						duration: particle.duration,
						ease: [0.22, 1, 0.36, 1], // Pop & drift cubic-bezier
						delay: particle.delay, // Slight stagger
					}}
					style={{
						backgroundColor: palette[i % palette.length],
						width: particle.isCircle ? particle.size : particle.size * 2,
						height: particle.size,
						borderRadius: particle.isCircle ? "50%" : "2px",
						position: "absolute",
					}}
				/>
			))}
		</div>
	);
}
