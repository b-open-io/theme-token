"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { usePatternContext, type PatternParams } from "./pattern-context";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Preset {
	id: string;
	label: string;
	prompt: string;
	params?: Partial<PatternParams>;
	locked?: boolean;
}

const PRESETS: Preset[] = [
	{
		id: "dots",
		label: "Dot Matrix",
		prompt: "evenly spaced small dots in a grid pattern",
		params: { density: 40, scale: 24, symmetry: "none" },
	},
	{
		id: "grid",
		label: "Iso Grid",
		prompt: "isometric grid lines with subtle depth",
		params: { density: 30, scale: 32, strokeWidth: 1, rotation: 30 },
	},
	{
		id: "topo",
		label: "Topo Map",
		prompt: "topographic contour lines like a terrain map",
		params: { density: 60, scale: 48, jitter: 20 },
	},
	{
		id: "waves",
		label: "Waves",
		prompt: "smooth flowing wave lines",
		params: { density: 50, scale: 40, rotation: 0 },
	},
	{
		id: "hex",
		label: "Hexagons",
		prompt: "hexagonal honeycomb pattern",
		params: { density: 45, scale: 32, symmetry: "radial" },
	},
	{
		id: "circuit",
		label: "Circuit",
		prompt: "circuit board traces and connection points",
		params: { density: 70, scale: 64, strokeWidth: 1.5 },
	},
	{
		id: "noise",
		label: "Grain",
		prompt: "subtle organic noise texture",
		params: { density: 90, scale: 16, opacity: 30 },
	},
	{
		id: "bauhaus",
		label: "Bauhaus",
		prompt: "geometric shapes in bauhaus style",
		params: { density: 40, scale: 64, jitter: 40 },
	},
];

export function PatternPresets() {
	const { applyPreset, uiState, setUIState } = usePatternContext();

	if (!uiState.isPresetsOpen) return null;

	return (
		<div className="fixed bottom-24 left-1/2 z-30 w-full max-w-2xl -translate-x-1/2 px-4 animate-in slide-in-from-bottom-4 fade-in duration-200">
			<div className="rounded-xl border bg-background/95 p-4 shadow-xl backdrop-blur-md">
				<div className="mb-3 flex items-center justify-between">
					<h3 className="font-medium text-sm">Quick Presets</h3>
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6 rounded-full"
						onClick={() => setUIState((prev) => ({ ...prev, isPresetsOpen: false }))}
					>
						<X className="h-3 w-3" />
					</Button>
				</div>
				
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
					{PRESETS.map((preset) => (
						<button
							key={preset.id}
							onClick={() => applyPreset({ prompt: preset.prompt, params: preset.params })}
							className={cn(
								"group relative flex flex-col items-start gap-1 rounded-lg border bg-muted/40 p-3 text-left transition-all hover:bg-muted/80 hover:border-primary/50",
							)}
						>
							<span className="font-medium text-xs group-hover:text-primary">
								{preset.label}
							</span>
							<span className="line-clamp-2 text-[10px] text-muted-foreground">
								{preset.prompt}
							</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

