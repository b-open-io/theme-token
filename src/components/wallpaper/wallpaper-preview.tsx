"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, Image, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ASPECT_DIMENSIONS, downloadWallpaper } from "@/lib/wallpaper-engine";
import { useWallpaperContext } from "./wallpaper-context";

// Terminal log messages for loading state
const TERMINAL_LOGS = [
	"> Initializing image diffusion...",
	"> Analyzing prompt semantics...",
	"> Generating composition layout...",
	"> Applying style parameters...",
	"> Rendering high-res textures...",
	"> Optimizing color balance...",
	"> Finalizing wallpaper...",
];

export function WallpaperPreview() {
	const {
		selectedWallpaper,
		selectedImageDataUrl,
		isGenerating,
		generationProgress,
		ambientColors,
		params,
	} = useWallpaperContext();

	const [terminalLogIndex, setTerminalLogIndex] = useState(0);

	// Cycle through terminal logs during generation
	useEffect(() => {
		if (!isGenerating) {
			setTerminalLogIndex(0);
			return;
		}

		const interval = setInterval(() => {
			setTerminalLogIndex((prev) => (prev + 1) % TERMINAL_LOGS.length);
		}, 3000);

		return () => clearInterval(interval);
	}, [isGenerating]);

	const handleDownload = () => {
		if (selectedWallpaper) {
			downloadWallpaper(
				selectedWallpaper.imageBase64,
				selectedWallpaper.mimeType,
				`wallpaper-${selectedWallpaper.aspectRatio}`,
			);
		}
	};

	// Calculate aspect ratio for preview
	const dimensions = ASPECT_DIMENSIONS[params.aspectRatio];
	const aspectRatio = dimensions.width / dimensions.height;

	return (
		<div className="relative flex-1 flex items-center justify-center overflow-hidden">
			{/* Ambient Bleed Background */}
			<div
				className="absolute inset-0 transition-colors duration-1000"
				style={{
					background: `linear-gradient(135deg, ${ambientColors[0]}20, ${ambientColors[1]}15, ${ambientColors[2]}10)`,
				}}
			/>

			{/* Blurred wallpaper background for ambient effect */}
			{selectedImageDataUrl && (
				<div
					className="absolute inset-0 opacity-10 blur-[100px] scale-110"
					style={{
						backgroundImage: `url(${selectedImageDataUrl})`,
						backgroundSize: "cover",
						backgroundPosition: "center",
					}}
				/>
			)}

			{/* Floating Viewport Container */}
			<div className="relative z-10 p-10 max-w-full max-h-full flex items-center justify-center">
				<AnimatePresence mode="wait">
					{isGenerating ? (
						// Loading State: Generative Haze
						<motion.div
							key="loading"
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							transition={{ duration: 0.3 }}
							className="relative rounded-2xl overflow-hidden shadow-2xl"
							style={{
								aspectRatio,
								width: "min(80vw, 900px)",
								maxHeight: "70vh",
							}}
						>
							{/* Animated gradient background */}
							<div
								className="absolute inset-0 animate-pulse"
								style={{
									background: `linear-gradient(45deg, ${ambientColors[0]}, ${ambientColors[1]}, ${ambientColors[2]})`,
									backgroundSize: "400% 400%",
									animation: "gradient-shift 3s ease infinite",
								}}
							/>

							{/* Noise overlay */}
							<div
								className="absolute inset-0 opacity-20"
								style={{
									backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
								}}
							/>

							{/* Terminal Log Overlay */}
							<div className="absolute bottom-4 left-4 font-mono text-xs text-white/70 space-y-1">
								<AnimatePresence mode="wait">
									<motion.div
										key={terminalLogIndex}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										transition={{ duration: 0.2 }}
									>
										{TERMINAL_LOGS[terminalLogIndex]}
									</motion.div>
								</AnimatePresence>
							</div>

							{/* Progress indicator */}
							<div className="absolute bottom-4 right-4 flex items-center gap-2 text-white/70">
								<Loader2 className="h-4 w-4 animate-spin" />
								<span className="font-mono text-xs">
									{Math.round(generationProgress)}%
								</span>
							</div>

							{/* Center spinner */}
							<div className="absolute inset-0 flex items-center justify-center">
								<div className="flex flex-col items-center gap-4">
									<motion.div
										animate={{ rotate: 360 }}
										transition={{
											duration: 2,
											repeat: Number.POSITIVE_INFINITY,
											ease: "linear",
										}}
										className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full"
									/>
									<span className="text-white/50 font-mono text-sm">
										Generating wallpaper...
									</span>
								</div>
							</div>
						</motion.div>
					) : selectedWallpaper ? (
						// Generated Wallpaper
						<motion.div
							key="wallpaper"
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							transition={{ duration: 0.3 }}
							className="relative group"
						>
							{/* Image with floating effect */}
							<div
								className="relative rounded-2xl overflow-hidden shadow-2xl"
								style={{
									boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
								}}
							>
								<img
									src={selectedImageDataUrl!}
									alt={selectedWallpaper.prompt}
									className="max-w-[80vw] max-h-[70vh] object-contain"
									style={{ aspectRatio }}
								/>

								{/* Hover overlay with actions */}
								<div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
									<Button
										size="sm"
										variant="secondary"
										className="shadow-lg"
										onClick={handleDownload}
									>
										<Download className="mr-2 h-4 w-4" />
										Download
									</Button>
								</div>
							</div>

							{/* Tech readout watermark */}
							<div className="absolute bottom-2 right-2 font-mono text-[10px] text-white/30 pointer-events-none">
								{selectedWallpaper.dimensions.width}x
								{selectedWallpaper.dimensions.height} //{" "}
								{selectedWallpaper.aspectRatio}
							</div>
						</motion.div>
					) : (
						// Empty State
						<motion.div
							key="empty"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className={cn(
								"relative rounded-2xl border-2 border-dashed border-muted-foreground/20",
								"flex flex-col items-center justify-center gap-4 p-12",
								"bg-background/50 backdrop-blur",
							)}
							style={{
								aspectRatio,
								width: "min(80vw, 600px)",
								maxHeight: "60vh",
							}}
						>
							<Image className="h-16 w-16 text-muted-foreground/30" />
							<div className="text-center">
								<h3 className="text-lg font-medium text-muted-foreground/60">
									No wallpaper yet
								</h3>
								<p className="text-sm text-muted-foreground/40 mt-1">
									Describe your dream wallpaper and click Generate
								</p>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* CSS for gradient animation */}
			<style jsx global>{`
				@keyframes gradient-shift {
					0% { background-position: 0% 50%; }
					50% { background-position: 100% 50%; }
					100% { background-position: 0% 50%; }
				}
			`}</style>
		</div>
	);
}
