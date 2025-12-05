"use client";

import { cn } from "@/lib/utils";
import { usePatternContext } from "@/components/patterns/pattern-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
	Sparkles,
	Library,
	Wand2,
	Search,
	ChevronDown,
	ChevronUp,
	Loader2,
} from "lucide-react";
import { useState } from "react";
import {
	GEO_GENERATORS,
	FEATURED_HERO_PATTERNS,
	HERO_PATTERNS,
} from "@/lib/pattern-engine";
import { getGeoGeneratorLabel } from "@/lib/pattern-sources/geopattern-adapter";
import { getHeroPatternLabel } from "@/lib/pattern-sources/heropattern-adapter";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function PatternSidebar() {
	const {
		params,
		setSource,
		setGeoGenerator,
		setHeroPattern,
		updateParam,
		updateAnimation,
		generateAI,
		isGenerating,
		uiState,
	} = usePatternContext();

	const [aiPrompt, setAiPrompt] = useState("");
	const [heroSearch, setHeroSearch] = useState("");
	const [showAllHero, setShowAllHero] = useState(false);
	const [appearanceOpen, setAppearanceOpen] = useState(true);
	const [animationOpen, setAnimationOpen] = useState(false);

	// Filter hero patterns
	const filteredHeroPatterns = heroSearch
		? HERO_PATTERNS.filter((p) =>
				getHeroPatternLabel(p).toLowerCase().includes(heroSearch.toLowerCase())
		  )
		: showAllHero
		? [...HERO_PATTERNS]
		: FEATURED_HERO_PATTERNS;

	return (
		<div className="w-80 border-r bg-background/95 backdrop-blur flex flex-col h-full overflow-hidden">
			{/* Source Tabs */}
			<Tabs
				value={uiState.activeTab}
				onValueChange={(v) => setSource(v as "geopattern" | "hero" | "ai")}
				className="flex flex-col h-full min-h-0"
			>
				<div className="p-4 border-b shrink-0">
					<TabsList className="w-full grid grid-cols-3">
						<TabsTrigger value="geopattern" className="gap-1.5">
							<Sparkles className="h-3.5 w-3.5" />
							<span className="hidden sm:inline">Generate</span>
						</TabsTrigger>
						<TabsTrigger value="hero" className="gap-1.5">
							<Library className="h-3.5 w-3.5" />
							<span className="hidden sm:inline">Library</span>
						</TabsTrigger>
						<TabsTrigger value="ai" className="gap-1.5">
							<Wand2 className="h-3.5 w-3.5" />
							<span className="hidden sm:inline">AI</span>
						</TabsTrigger>
					</TabsList>
				</div>

				<ScrollArea className="flex-1 min-h-0">
					{/* GeoPattern Tab */}
					<TabsContent value="geopattern" className="m-0 p-4 space-y-4">
						<div>
							<Label className="text-xs text-muted-foreground mb-2 block">
								Pattern Type
							</Label>
							<div className="grid grid-cols-4 gap-2">
								{GEO_GENERATORS.map((gen) => (
									<button
										key={gen}
										onClick={() => setGeoGenerator(gen)}
										className={cn(
											"aspect-square rounded-md border p-2 text-[10px] leading-tight transition-colors hover:bg-muted",
											params.geoGenerator === gen &&
												"border-primary bg-primary/10"
										)}
									>
										{getGeoGeneratorLabel(gen)}
									</button>
								))}
							</div>
						</div>

						<div>
							<Label className="text-xs text-muted-foreground mb-2 block">
								Seed
							</Label>
							<Input
								value={params.geoSeed}
								onChange={(e) => updateParam("geoSeed", e.target.value)}
								placeholder="Enter seed text..."
								className="text-sm"
							/>
							<p className="text-[10px] text-muted-foreground mt-1">
								Same seed = same pattern
							</p>
						</div>
					</TabsContent>

					{/* Hero Patterns Tab */}
					<TabsContent value="hero" className="m-0 p-4 space-y-4">
						<div className="relative">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								value={heroSearch}
								onChange={(e) => setHeroSearch(e.target.value)}
								placeholder="Search 87 patterns..."
								className="pl-9 text-sm"
							/>
						</div>

						<div className="grid grid-cols-3 gap-2">
							{filteredHeroPatterns.map((pattern) => (
								<button
									key={pattern}
									onClick={() => setHeroPattern(pattern)}
									className={cn(
										"rounded-md border p-2 text-[10px] leading-tight transition-colors hover:bg-muted text-left",
										params.heroPattern === pattern &&
											"border-primary bg-primary/10"
									)}
								>
									{getHeroPatternLabel(pattern)}
								</button>
							))}
						</div>

						{!heroSearch && !showAllHero && (
							<Button
								variant="ghost"
								size="sm"
								className="w-full"
								onClick={() => setShowAllHero(true)}
							>
								Show all 87 patterns
								<ChevronDown className="ml-2 h-3 w-3" />
							</Button>
						)}
						{showAllHero && !heroSearch && (
							<Button
								variant="ghost"
								size="sm"
								className="w-full"
								onClick={() => setShowAllHero(false)}
							>
								Show featured only
								<ChevronUp className="ml-2 h-3 w-3" />
							</Button>
						)}
					</TabsContent>

					{/* AI Tab */}
					<TabsContent value="ai" className="m-0 p-4 space-y-4">
						<div>
							<Label className="text-xs text-muted-foreground mb-2 block">
								Describe your pattern
							</Label>
							<textarea
								value={aiPrompt}
								onChange={(e) => setAiPrompt(e.target.value)}
								placeholder="A geometric pattern with interlocking hexagons..."
								className="w-full min-h-24 rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
							/>
						</div>
						<Button
							className="w-full"
							onClick={() => generateAI(aiPrompt)}
							disabled={isGenerating || !aiPrompt.trim()}
						>
							{isGenerating ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Generating...
								</>
							) : (
								<>
									<Wand2 className="mr-2 h-4 w-4" />
									Generate with AI
								</>
							)}
						</Button>
						<p className="text-[10px] text-muted-foreground text-center">
							AI generates unique SVG patterns from your description
						</p>
					</TabsContent>

					<Separator className="my-2" />

					{/* Appearance Controls */}
					<Collapsible
						open={appearanceOpen}
						onOpenChange={setAppearanceOpen}
						className="px-4"
					>
						<CollapsibleTrigger className="flex items-center justify-between w-full py-2">
							<span className="text-sm font-medium">Appearance</span>
							{appearanceOpen ? (
								<ChevronUp className="h-4 w-4" />
							) : (
								<ChevronDown className="h-4 w-4" />
							)}
						</CollapsibleTrigger>
						<CollapsibleContent className="space-y-4 pb-4">
							<div>
								<div className="flex items-center justify-between mb-2">
									<Label className="text-xs text-muted-foreground">
										Foreground
									</Label>
									<Input
										type="color"
										value={params.foregroundColor}
										onChange={(e) =>
											updateParam("foregroundColor", e.target.value)
										}
										className="w-8 h-8 p-0 border-0"
									/>
								</div>
							</div>

							<div>
								<div className="flex items-center justify-between mb-2">
									<Label className="text-xs text-muted-foreground">
										Background
									</Label>
									<Input
										type="color"
										value={params.backgroundColor}
										onChange={(e) =>
											updateParam("backgroundColor", e.target.value)
										}
										className="w-8 h-8 p-0 border-0"
									/>
								</div>
							</div>

							<div>
								<div className="flex items-center justify-between mb-2">
									<Label className="text-xs text-muted-foreground">
										Opacity
									</Label>
									<span className="text-xs text-muted-foreground">
										{params.opacity}%
									</span>
								</div>
								<Slider
									value={[params.opacity]}
									onValueChange={([v]) => updateParam("opacity", v)}
									min={10}
									max={100}
									step={5}
								/>
							</div>

							<div>
								<div className="flex items-center justify-between mb-2">
									<Label className="text-xs text-muted-foreground">
										Scale
									</Label>
									<span className="text-xs text-muted-foreground">
										{params.scale}px
									</span>
								</div>
								<Slider
									value={[params.scale]}
									onValueChange={([v]) => updateParam("scale", v)}
									min={20}
									max={300}
									step={10}
								/>
							</div>
						</CollapsibleContent>
					</Collapsible>

					<Separator className="my-2" />

					{/* Animation Controls */}
					<Collapsible
						open={animationOpen}
						onOpenChange={setAnimationOpen}
						className="px-4 pb-4"
					>
						<CollapsibleTrigger className="flex items-center justify-between w-full py-2">
							<span className="text-sm font-medium">Animation</span>
							{animationOpen ? (
								<ChevronUp className="h-4 w-4" />
							) : (
								<ChevronDown className="h-4 w-4" />
							)}
						</CollapsibleTrigger>
						<CollapsibleContent className="space-y-4 pb-4">
							<div className="flex items-center justify-between">
								<Label className="text-xs text-muted-foreground">
									Rotate
								</Label>
								<Switch
									checked={params.animation.rotate?.enabled ?? false}
									onCheckedChange={(checked) =>
										updateAnimation("rotate", {
											...params.animation.rotate,
											enabled: checked,
										})
									}
								/>
							</div>

							<div className="flex items-center justify-between">
								<Label className="text-xs text-muted-foreground">
									Scale Pulse
								</Label>
								<Switch
									checked={params.animation.scale?.enabled ?? false}
									onCheckedChange={(checked) =>
										updateAnimation("scale", {
											...params.animation.scale,
											enabled: checked,
										})
									}
								/>
							</div>

							<div className="flex items-center justify-between">
								<Label className="text-xs text-muted-foreground">
									Opacity Fade
								</Label>
								<Switch
									checked={params.animation.opacity?.enabled ?? false}
									onCheckedChange={(checked) =>
										updateAnimation("opacity", {
											...params.animation.opacity,
											enabled: checked,
										})
									}
								/>
							</div>

							<div className="flex items-center justify-between">
								<Label className="text-xs text-muted-foreground">
									Translate
								</Label>
								<Switch
									checked={params.animation.translate?.enabled ?? false}
									onCheckedChange={(checked) =>
										updateAnimation("translate", {
											...params.animation.translate,
											enabled: checked,
										})
									}
								/>
							</div>
						</CollapsibleContent>
					</Collapsible>
				</ScrollArea>
			</Tabs>
		</div>
	);
}
