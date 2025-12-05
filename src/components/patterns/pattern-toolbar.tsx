"use client";

import {
	Wand2,
	Dice5,
	Download,
	History,
	LayoutGrid,
	Settings2,
	Share2,
	ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePatternContext } from "./pattern-context";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PatternExport } from "./pattern-export";

export function PatternToolbar() {
	const {
		prompt,
		setPrompt,
		generatePattern,
		isGenerating,
		randomizeParams,
		uiState,
		setUIState,
		requirePayment,
	} = usePatternContext();
	
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			generatePattern();
		}
	};

	return (
		<div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
			<TooltipProvider>
				<div className="flex items-center gap-2 rounded-xl border bg-background/95 p-2 shadow-xl backdrop-blur-md transition-all duration-200">
					
					{/* Presets Toggle (REMOVED - Now in sidebar) */}
					{/* 
                    <Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant={uiState.isPresetsOpen ? "secondary" : "ghost"}
								size="icon"
								onClick={() =>
									setUIState((prev) => ({ ...prev, isPresetsOpen: !prev.isPresetsOpen }))
								}
							>
								<LayoutGrid className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Presets</TooltipContent>
					</Tooltip>

					<Separator orientation="vertical" className="h-6" /> 
                    */}

					{/* Advanced Controls Toggle (Sidebar) - MOVED TO START */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant={uiState.isControlsOpen ? "secondary" : "ghost"}
								size="icon"
								onClick={() => setUIState((prev) => ({ ...prev, isControlsOpen: !prev.isControlsOpen }))}
								className={cn(uiState.isControlsOpen && "text-primary")}
							>
								<Settings2 className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Controls & Presets</TooltipContent>
					</Tooltip>

                    <Separator orientation="vertical" className="h-6" />

					{/* Prompt Input */}
					<div className="relative w-64 md:w-80 lg:w-96 transition-all">
						<Input
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Describe pattern (e.g. 'hexagonal grid')..."
							className="h-9 border-muted bg-muted/50 pr-8 text-xs focus-visible:ring-1 focus-visible:ring-primary/50"
						/>
					</div>

					{/* Generate Button */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								size="sm"
								onClick={() => generatePattern()}
								disabled={isGenerating || !prompt.trim()}
								className={cn(
									"h-9 gap-2 px-4 transition-all",
									isGenerating && "opacity-80",
								)}
							>
								<Wand2 className={cn("h-3.5 w-3.5", isGenerating && "animate-spin")} />
								<span className="hidden sm:inline">
									{isGenerating ? "Generating..." : "Generate"}
								</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{requirePayment ? "Generate (1000 sats)" : "Generate (Free)"}
						</TooltipContent>
					</Tooltip>

					<Separator orientation="vertical" className="h-6" />

					{/* Randomize */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="ghost" size="icon" onClick={randomizeParams}>
								<Dice5 className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Randomize Params</TooltipContent>
					</Tooltip>

					<Separator orientation="vertical" className="h-6" />

					{/* History Toggle */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant={uiState.isHistoryOpen ? "secondary" : "ghost"}
								size="icon"
								onClick={() =>
									setUIState((prev) => ({ ...prev, isHistoryOpen: !prev.isHistoryOpen }))
								}
							>
								<History className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>History</TooltipContent>
					</Tooltip>

					{/* Export Toggle */}
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="ghost" size="icon">
								<Download className="h-4 w-4" />
							</Button>
						</PopoverTrigger>
						<PopoverContent side="top" className="w-56 p-0" align="end">
                            <div className="p-2">
                                <p className="text-xs font-medium text-muted-foreground mb-2 px-2 pt-2">Export Options</p>
                                <PatternExport />
                            </div>
						</PopoverContent>
					</Popover>
				</div>
			</TooltipProvider>
		</div>
	);
}
