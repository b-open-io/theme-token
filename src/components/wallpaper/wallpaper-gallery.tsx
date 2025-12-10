"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createImageDataUrl } from "@/lib/wallpaper-engine";
import { useWallpaperContext } from "./wallpaper-context";

export function WallpaperGallery() {
	const {
		generatedWallpapers,
		selectedWallpaper,
		selectWallpaper,
		clearGallery,
		isGalleryCollapsed,
		setGalleryCollapsed,
	} = useWallpaperContext();

	if (generatedWallpapers.length === 0) {
		return null;
	}

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 20 }}
				className={cn(
					"absolute bottom-4 left-1/2 -translate-x-1/2 z-20",
					"rounded-xl border border-white/10",
					"bg-background/80 backdrop-blur-xl shadow-2xl",
					"transition-all duration-300",
				)}
			>
				{/* Collapse/Expand Toggle */}
				<div className="absolute -top-3 left-1/2 -translate-x-1/2">
					<Button
						size="icon"
						variant="outline"
						className="h-6 w-6 rounded-full bg-background/90 backdrop-blur border-white/10 hover:bg-background"
						onClick={() => setGalleryCollapsed(!isGalleryCollapsed)}
					>
						{isGalleryCollapsed ? (
							<ChevronUp className="h-3 w-3" />
						) : (
							<ChevronDown className="h-3 w-3" />
						)}
					</Button>
				</div>

				<AnimatePresence mode="wait">
					{isGalleryCollapsed ? (
						// Collapsed: Just show count
						<motion.div
							key="collapsed"
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							className="px-4 py-2 flex items-center gap-2"
						>
							<span className="text-xs text-muted-foreground">
								{generatedWallpapers.length} wallpaper
								{generatedWallpapers.length !== 1 ? "s" : ""}
							</span>
						</motion.div>
					) : (
						// Expanded: Show thumbnails
						<motion.div
							key="expanded"
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							className="p-2"
						>
							<ScrollArea className="w-[min(80vw,600px)]">
								<div className="flex gap-2 pb-2">
									<AnimatePresence mode="popLayout">
										{generatedWallpapers.map((wallpaper, index) => (
											<motion.button
												key={wallpaper.id}
												initial={{ opacity: 0, scale: 0.8, x: 20 }}
												animate={{ opacity: 1, scale: 1, x: 0 }}
												exit={{ opacity: 0, scale: 0.8 }}
												transition={{ delay: index * 0.05 }}
												onClick={() => selectWallpaper(wallpaper.id)}
												className={cn(
													"relative shrink-0 rounded-lg overflow-hidden",
													"transition-all duration-200",
													"hover:scale-105 hover:shadow-lg",
													"focus:outline-none focus:ring-2 focus:ring-primary",
													selectedWallpaper?.id === wallpaper.id
														? "ring-2 ring-primary shadow-lg"
														: "ring-1 ring-white/10",
												)}
												style={{
													width: wallpaper.aspectRatio === "9:16" ? 45 : 80,
													height: 60,
												}}
											>
												<img
													src={createImageDataUrl(
														wallpaper.imageBase64,
														wallpaper.mimeType,
													)}
													alt={wallpaper.prompt}
													className="w-full h-full object-cover"
												/>

												{/* Selection indicator */}
												{selectedWallpaper?.id === wallpaper.id && (
													<motion.div
														layoutId="gallery-selection"
														className="absolute inset-0 border-2 border-primary rounded-lg"
														transition={{
															type: "spring",
															bounce: 0.2,
															duration: 0.4,
														}}
													/>
												)}
											</motion.button>
										))}
									</AnimatePresence>
								</div>
								<ScrollBar orientation="horizontal" />
							</ScrollArea>

							{/* Clear Gallery Button */}
							{generatedWallpapers.length > 1 && (
								<div className="flex justify-end pt-1 border-t border-white/5 mt-1">
									<Button
										size="sm"
										variant="ghost"
										className="h-6 text-xs text-muted-foreground hover:text-destructive"
										onClick={clearGallery}
									>
										<Trash2 className="h-3 w-3 mr-1" />
										Clear
									</Button>
								</div>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</AnimatePresence>
	);
}
