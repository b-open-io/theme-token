"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Image,
	Loader2,
	Monitor,
	Palette,
	Smartphone,
	Sparkles,
	Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import {
	ASPECT_RATIOS,
	type AspectRatio,
	WALLPAPER_STYLES,
} from "@/lib/wallpaper-engine";
import { useWallpaperContext } from "./wallpaper-context";

// Icon mapping for aspect ratios
const ASPECT_ICONS: Record<AspectRatio, typeof Monitor> = {
	"16:9": Monitor,
	"9:16": Smartphone,
	"1:1": Square,
	"4:3": Monitor,
	"3:2": Image,
};

export function WallpaperSidebar() {
	const {
		params,
		updateParam,
		generate,
		isGenerating,
		isPaying,
		generatedWallpapers,
		setSourceWallpaper,
		useThemeContext,
		setUseThemeContext,
		selectedTheme,
		setSelectedTheme,
		availableThemes,
	} = useWallpaperContext();

	const { activeTheme, mode } = useTheme();

	// Segmented control for source type
	const sourceMode = params.sourceType === "prompt" ? "prompt" : "remix";

	// Handle theme selection
	const handleThemeSelect = (themeName: string) => {
		if (themeName === "__active__") {
			setSelectedTheme(activeTheme);
		} else {
			const theme = availableThemes.find((t) => t.name === themeName);
			if (theme) setSelectedTheme(theme);
		}
	};

	const handleSourceModeChange = (mode: "prompt" | "remix") => {
		if (mode === "prompt") {
			updateParam("sourceType", "prompt");
			updateParam("sourcePatternSvg", undefined);
			updateParam("sourceWallpaperId", undefined);
			updateParam("sourceWallpaperBase64", undefined);
		} else {
			updateParam("sourceType", "wallpaper");
		}
	};

	return (
		<div className="w-80 border-r bg-background/95 backdrop-blur flex flex-col h-full overflow-hidden">
			{/* Source Mode Toggle */}
			<div className="p-4 border-b shrink-0">
				<div className="flex rounded-lg bg-muted p-1">
					<button
						type="button"
						onClick={() => handleSourceModeChange("prompt")}
						className={cn(
							"flex-1 px-3 py-1.5 rounded-md text-sm font-mono transition-all",
							sourceMode === "prompt"
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						/prompt
					</button>
					<button
						type="button"
						onClick={() => handleSourceModeChange("remix")}
						className={cn(
							"flex-1 px-3 py-1.5 rounded-md text-sm font-mono transition-all",
							sourceMode === "remix"
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						/remix
					</button>
				</div>
			</div>

			<ScrollArea className="flex-1 min-h-0">
				<div className="p-4 space-y-6">
					{/* Remix Source Selection */}
					<AnimatePresence mode="wait">
						{sourceMode === "remix" && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, height: 0 }}
								className="space-y-3"
							>
								<Label className="text-xs text-muted-foreground">
									Source Wallpaper
								</Label>
								{generatedWallpapers.length > 0 ? (
									<div className="grid grid-cols-3 gap-2">
										{generatedWallpapers.slice(0, 6).map((wp) => (
											<button
												type="button"
												key={wp.id}
												onClick={() => setSourceWallpaper(wp)}
												className={cn(
													"aspect-video rounded-md overflow-hidden border-2 transition-all",
													params.sourceWallpaperId === wp.id
														? "border-primary ring-2 ring-primary/30"
														: "border-transparent hover:border-muted-foreground/30",
												)}
											>
												<img
													src={`data:${wp.mimeType};base64,${wp.imageBase64}`}
													alt=""
													className="w-full h-full object-cover"
												/>
											</button>
										))}
									</div>
								) : (
									<div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 text-center">
										<p className="text-xs text-muted-foreground">
											Generate some wallpapers first to remix them
										</p>
									</div>
								)}
								<Separator />
							</motion.div>
						)}
					</AnimatePresence>

					{/* Prompt Input */}
					<div>
						<Label className="text-xs text-muted-foreground mb-2 block">
							{sourceMode === "remix"
								? "Describe the transformation"
								: "Describe your wallpaper"}
						</Label>
						<textarea
							value={params.prompt}
							onChange={(e) => updateParam("prompt", e.target.value)}
							placeholder={
								sourceMode === "remix"
									? "Make it more cyberpunk with neon lights..."
									: "A serene mountain landscape at sunset with soft clouds..."
							}
							className="w-full min-h-32 rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
						/>
					</div>

					<Separator />

					{/* Aspect Ratio */}
					<div>
						<Label className="text-xs text-muted-foreground mb-3 block">
							Aspect Ratio
						</Label>
						<div className="flex gap-2">
							{ASPECT_RATIOS.slice(0, 3).map((ratio) => {
								const Icon = ASPECT_ICONS[ratio.value];
								const isSelected = params.aspectRatio === ratio.value;
								return (
									<button
										type="button"
										key={ratio.value}
										onClick={() => updateParam("aspectRatio", ratio.value)}
										className={cn(
											"flex-1 flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all",
											isSelected
												? "border-primary bg-primary/10 text-primary"
												: "border-muted hover:border-muted-foreground/30",
										)}
									>
										<Icon className="h-5 w-5" />
										<span className="text-[10px] font-medium">
											{ratio.label}
										</span>
									</button>
								);
							})}
						</div>
					</div>

					<Separator />

					{/* Style Selection */}
					<div>
						<Label className="text-xs text-muted-foreground mb-3 block">
							Style
						</Label>
						<div className="flex flex-wrap gap-2">
							{WALLPAPER_STYLES.map((style) => {
								const isSelected = params.style === style.value;
								return (
									<button
										type="button"
										key={style.value}
										onClick={() =>
											updateParam("style", isSelected ? undefined : style.value)
										}
										className={cn(
											"px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
											isSelected
												? "border-primary bg-primary/10 text-primary"
												: "border-muted text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground",
										)}
									>
										{style.label}
									</button>
								);
							})}
						</div>
						<p className="text-[10px] text-muted-foreground mt-2">
							Optional: Leave unselected for AI to decide
						</p>
					</div>

					<Separator />

					{/* Theme Context */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Palette className="h-4 w-4 text-muted-foreground" />
								<Label className="text-xs text-muted-foreground">
									Match Theme Colors
								</Label>
							</div>
							<Switch
								checked={useThemeContext}
								onCheckedChange={setUseThemeContext}
							/>
						</div>

						<AnimatePresence mode="wait">
							{useThemeContext && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: "auto" }}
									exit={{ opacity: 0, height: 0 }}
									className="space-y-2"
								>
									<Select
										value={selectedTheme?.name || (activeTheme ? "__active__" : "")}
										onValueChange={handleThemeSelect}
									>
										<SelectTrigger className="w-full h-9">
											<SelectValue placeholder="Select a theme" />
										</SelectTrigger>
										<SelectContent>
											{activeTheme && (
												<SelectItem value="__active__">
													<div className="flex items-center gap-2">
														<div className="flex h-3 w-9 overflow-hidden rounded-sm border border-border">
															{[
																activeTheme.styles[mode].primary,
																activeTheme.styles[mode].secondary,
																activeTheme.styles[mode].accent,
															].map((color, i) => (
																<div
																	key={i}
																	className="flex-1"
																	style={{ backgroundColor: color }}
																/>
															))}
														</div>
														<span>{activeTheme.name} (Current)</span>
													</div>
												</SelectItem>
											)}
											{availableThemes
												.filter((t) => t.name !== activeTheme?.name)
												.map((theme) => (
													<SelectItem key={theme.name} value={theme.name}>
														<div className="flex items-center gap-2">
															<div className="flex h-3 w-9 overflow-hidden rounded-sm border border-border">
																{[
																	theme.styles[mode].primary,
																	theme.styles[mode].secondary,
																	theme.styles[mode].accent,
																].map((color, i) => (
																	<div
																		key={i}
																		className="flex-1"
																		style={{ backgroundColor: color }}
																	/>
																))}
															</div>
															<span>{theme.name}</span>
														</div>
													</SelectItem>
												))}
										</SelectContent>
									</Select>
									<p className="text-[10px] text-muted-foreground">
										AI will use these colors as inspiration
									</p>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
			</ScrollArea>

			{/* Generate Button */}
			<div className="p-4 border-t shrink-0">
				<Button
					className="w-full"
					size="lg"
					onClick={generate}
					disabled={isGenerating || isPaying || !params.prompt.trim()}
				>
					{isGenerating ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Generating...
						</>
					) : isPaying ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Processing payment...
						</>
					) : (
						<>
							<Sparkles className="mr-2 h-4 w-4" />
							Generate Wallpaper
						</>
					)}
				</Button>
				<p className="text-[10px] text-muted-foreground text-center mt-2">
					1M sats (~$0.01) per generation
				</p>
			</div>
		</div>
	);
}
