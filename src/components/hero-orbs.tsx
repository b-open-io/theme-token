"use client";

import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * HeroOrbs - Animated orbital elements that surround the hero content
 * Responds to both mouse movement and scroll
 */
export function HeroOrbs() {
	const ref = useRef<HTMLDivElement>(null);
	const mouseX = useMotionValue(0);
	const mouseY = useMotionValue(0);

	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start start", "end start"],
	});

	// Smooth spring for mouse tracking
	const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 });
	const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 });

	// Scroll-based transforms
	const heroOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
	const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.3]);
	const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

	// Orb positions based on scroll
	const orb1Y = useTransform(scrollYProgress, [0, 1], [0, -200]);
	const orb2Y = useTransform(scrollYProgress, [0, 1], [0, -350]);
	const orb3Y = useTransform(scrollYProgress, [0, 1], [0, -150]);
	const orb1Rotate = useTransform(scrollYProgress, [0, 1], [0, 180]);
	const orb2Rotate = useTransform(scrollYProgress, [0, 1], [0, -120]);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			const { clientX, clientY } = e;
			const { innerWidth, innerHeight } = window;
			// Normalize to -1 to 1 range
			const x = (clientX / innerWidth - 0.5) * 2;
			const y = (clientY / innerHeight - 0.5) * 2;
			mouseX.set(x * 50); // Max 50px movement
			mouseY.set(y * 50);
		};

		window.addEventListener("mousemove", handleMouseMove);
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, [mouseX, mouseY]);

	return (
		<div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none">
			{/* Central Halo behind content */}
			<motion.div
				style={{
					opacity: heroOpacity,
					scale: heroScale,
					y: heroY,
				}}
				className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
			>
				<div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,var(--primary)_0%,transparent_70%)] opacity-20 blur-[60px]" />
			</motion.div>

			{/* Orb 1 - Primary (Larger, slower) */}
			<motion.div
				style={{
					x: smoothMouseX,
					y: orb1Y,
					rotate: orb1Rotate,
				}}
				className="absolute top-[15%] left-[10%] will-change-transform"
			>
				<motion.div
					animate={{
						y: [0, -30, 0],
						scale: [1, 1.1, 1],
					}}
					transition={{
						duration: 8,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
					className="relative"
				>
					{/* Glow */}
					<div className="absolute inset-0 w-32 h-32 rounded-full bg-primary blur-[40px] opacity-60" />
					{/* Core */}
					<div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary via-primary to-primary/50 shadow-lg shadow-primary/50">
						<div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
					</div>
				</motion.div>
			</motion.div>

			{/* Orb 2 - Chart-1 (Medium, faster) */}
			<motion.div
				style={{
					x: useTransform(smoothMouseX, (v) => -v * 0.7),
					y: orb2Y,
					rotate: orb2Rotate,
				}}
				className="absolute top-[25%] right-[15%] will-change-transform"
			>
				<motion.div
					animate={{
						y: [0, 20, 0],
						x: [0, -15, 0],
						scale: [1, 0.95, 1],
					}}
					transition={{
						duration: 6,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
					className="relative"
				>
					<div className="absolute inset-0 w-24 h-24 rounded-full bg-chart-1 blur-[30px] opacity-50" />
					<div className="w-16 h-16 rounded-full bg-gradient-to-br from-chart-1 via-chart-1 to-chart-1/50 shadow-lg shadow-chart-1/50">
						<div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-white/25 to-transparent" />
					</div>
				</motion.div>
			</motion.div>

			{/* Orb 3 - Chart-2 (Small accent) */}
			<motion.div
				style={{
					x: useTransform(smoothMouseX, (v) => v * 0.5),
					y: orb3Y,
				}}
				className="absolute top-[60%] left-[20%] will-change-transform"
			>
				<motion.div
					animate={{
						y: [0, -25, 0],
						rotate: [0, 10, 0],
					}}
					transition={{
						duration: 5,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
					className="relative"
				>
					<div className="absolute inset-0 w-16 h-16 rounded-full bg-chart-2 blur-[25px] opacity-40" />
					<div className="w-10 h-10 rounded-full bg-gradient-to-br from-chart-2 to-chart-2/50 shadow-md shadow-chart-2/40">
						<div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
					</div>
				</motion.div>
			</motion.div>

			{/* Orb 4 - Chart-3 (Right side accent) */}
			<motion.div
				style={{
					x: useTransform(smoothMouseX, (v) => -v * 0.3),
				}}
				className="absolute top-[55%] right-[10%] will-change-transform"
			>
				<motion.div
					animate={{
						y: [0, 15, 0],
						x: [0, 10, 0],
					}}
					transition={{
						duration: 7,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
					className="relative"
				>
					<div className="absolute inset-0 w-20 h-20 rounded-full bg-chart-3 blur-[30px] opacity-35" />
					<div className="w-12 h-12 rounded-full bg-gradient-to-br from-chart-3 to-chart-3/50 shadow-md shadow-chart-3/40">
						<div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
					</div>
				</motion.div>
			</motion.div>

			{/* Tiny floating particles */}
			{[...Array(8)].map((_, i) => (
				<motion.div
					key={`particle-${i}`}
					animate={{
						y: [0, -20 - i * 5, 0],
						opacity: [0.3, 0.6, 0.3],
					}}
					transition={{
						duration: 3 + i * 0.5,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
						delay: i * 0.3,
					}}
					className="absolute w-2 h-2 rounded-full bg-primary/60 blur-[2px]"
					style={{
						left: `${15 + i * 10}%`,
						top: `${30 + (i % 3) * 15}%`,
					}}
				/>
			))}
		</div>
	);
}
