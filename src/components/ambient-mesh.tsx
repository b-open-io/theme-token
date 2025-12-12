"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";

/**
 * AmbientMesh - A fixed background layer with animated gradient orbs
 * Creates depth and atmosphere across the entire page
 */
export function AmbientMesh() {
	const { scrollYProgress } = useScroll();

	// Smooth spring for scroll-based animations
	const smoothProgress = useSpring(scrollYProgress, {
		stiffness: 100,
		damping: 30,
		mass: 1,
	});

	// Orb transformations based on scroll
	const orb1Y = useTransform(smoothProgress, [0, 1], ["0%", "50%"]);
	const orb2Y = useTransform(smoothProgress, [0, 1], ["0%", "-30%"]);
	const orb3Y = useTransform(smoothProgress, [0, 1], ["0%", "80%"]);

	// Hue shifts for color morphing
	const orb1Hue = useTransform(smoothProgress, [0, 0.5, 1], [0, 20, 40]);
	const orb2Hue = useTransform(smoothProgress, [0, 0.5, 1], [0, -30, -60]);

	return (
		<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
			{/* Base dark gradient */}
			<div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/95" />

			{/* Orb 1 - Primary (Top Left) */}
			<motion.div
				style={{ y: orb1Y }}
				className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-30 blur-[120px] will-change-transform"
			>
				<div className="w-full h-full rounded-full bg-primary" />
			</motion.div>

			{/* Orb 2 - Chart-1 (Top Right) */}
			<motion.div
				style={{ y: orb2Y }}
				className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full opacity-25 blur-[100px] will-change-transform"
			>
				<div className="w-full h-full rounded-full bg-chart-1" />
			</motion.div>

			{/* Orb 3 - Chart-3 (Bottom Center) */}
			<motion.div
				style={{ y: orb3Y }}
				className="absolute top-[60%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-20 blur-[150px] will-change-transform"
			>
				<div className="w-full h-full rounded-full bg-chart-3" />
			</motion.div>

			{/* Orb 4 - Chart-5 (Mid Left) - Slower drift */}
			<motion.div
				animate={{
					y: [0, 50, 0],
					x: [0, 30, 0],
					scale: [1, 1.1, 1],
				}}
				transition={{
					duration: 20,
					repeat: Number.POSITIVE_INFINITY,
					ease: "easeInOut",
				}}
				className="absolute top-[40%] -left-40 w-[400px] h-[400px] rounded-full opacity-15 blur-[80px]"
			>
				<div className="w-full h-full rounded-full bg-chart-5" />
			</motion.div>

			{/* Orb 5 - Chart-2 (Bottom Right) */}
			<motion.div
				animate={{
					y: [0, -40, 0],
					x: [0, -20, 0],
				}}
				transition={{
					duration: 15,
					repeat: Number.POSITIVE_INFINITY,
					ease: "easeInOut",
				}}
				className="absolute top-[70%] -right-32 w-[450px] h-[450px] rounded-full opacity-20 blur-[100px]"
			>
				<div className="w-full h-full rounded-full bg-chart-2" />
			</motion.div>

			{/* Noise texture overlay */}
			<div
				className="absolute inset-0 opacity-[0.03]"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
				}}
			/>

			{/* Gradient fade at bottom for content transition */}
			<div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
		</div>
	);
}
