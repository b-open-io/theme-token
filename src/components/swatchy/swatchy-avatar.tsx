"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { SwatchyPosition } from "./swatchy-store";

interface SwatchyAvatarProps {
	position: SwatchyPosition;
	onClick: () => void;
}

export function SwatchyAvatar({ position, onClick }: SwatchyAvatarProps) {
	const isCorner = position === "corner";

	return (
		<motion.button
			className="fixed z-[60] cursor-pointer overflow-visible rounded-full"
			initial={false}
			animate={
				isCorner
					? {
							left: 16,
							bottom: 16,
							right: "auto",
							top: "auto",
							width: 80,
							height: 80,
						}
					: {
							left: "auto",
							bottom: "auto",
							right: 16,
							top: 72,
							width: 48,
							height: 48,
						}
			}
			transition={{
				type: "spring",
				stiffness: 200,
				damping: 25,
			}}
			onClick={onClick}
			whileHover={{ scale: 1.1 }}
			whileTap={{ scale: 0.95 }}
			aria-label={isCorner ? "Open Swatchy assistant" : "Close chat"}
		>
			{/* Floating animation wrapper - only when in corner */}
			<motion.div
				animate={
					isCorner
						? {
								y: [0, -12, 0],
								rotate: [0, 3, 0, -3, 0],
							}
						: { y: 0, rotate: 0 }
				}
				transition={
					isCorner
						? {
								y: {
									duration: 5,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								},
								rotate: {
									duration: 7,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								},
							}
						: { duration: 0.3 }
				}
				className="h-full w-full"
			>
				<Image
					src="/swatchy-meditation.png"
					alt="Swatchy Assistant"
					width={80}
					height={80}
					className="h-full w-full object-contain"
					priority
				/>
			</motion.div>

			{/* Notification pulse when idle in corner */}
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
