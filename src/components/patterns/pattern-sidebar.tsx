"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Layers, Zap, Palette, BoxSelect, Shapes } from "lucide-react";
import { usePatternContext, type PatternParams, type GeneratorType, type ShapeType } from "./pattern-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorPicker } from "@/components/ui/color-picker";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const GENERATORS: { id: GeneratorType; label: string }[] = [
    { id: "ai", label: "AI Prompt" },
    { id: "scatter", label: "Scatter" },
    { id: "grid", label: "Grid" },
    { id: "waves", label: "Waves" },
    { id: "stripes", label: "Stripes" },
    { id: "noise", label: "Noise" },
    { id: "topo", label: "Topo" },
    { id: "parallelogram", label: "Parallelogram" },
];

const SHAPES: { id: ShapeType; label: string; icon: string }[] = [
    { id: "circle", label: "Circle", icon: "●" },
    { id: "square", label: "Square", icon: "■" },
    { id: "triangle", label: "Triangle", icon: "▲" },
    { id: "hexagon", label: "Hexagon", icon: "⬢" },
    { id: "star", label: "Star", icon: "★" },
    { id: "emoji", label: "Emoji", icon: "😊" },
];

// Presets data
const PRESETS: { id: string; label: string; prompt: string; params?: Partial<PatternParams> }[] = [
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

export function PatternSidebar() {
	const { patternParams, updateParam, randomizeParams, requirePayment, setRequirePayment, uiState, setUIState, applyPreset } = usePatternContext();

    if (!uiState.isControlsOpen) return null;

	return (
		<div className="fixed inset-y-0 left-0 top-[6.375rem] z-30 w-80 border-r bg-background/95 backdrop-blur-md shadow-xl transition-transform duration-300 ease-in-out animate-in slide-in-from-left flex flex-col">
			<div className="shrink-0 flex items-center justify-between border-b p-4">
				<h3 className="font-medium text-sm">Studio Controls</h3>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={randomizeParams} title="Randomize All">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 md:hidden"
						onClick={() => setUIState((prev) => ({ ...prev, isControlsOpen: false }))}
					>
						<X className="h-4 w-4" />
					</Button>
                </div>
			</div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 pb-24 space-y-6">
                    
                    {/* Presets Section - Prominent */}
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Presets</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => applyPreset({ prompt: preset.prompt, params: preset.params })}
                                    className="group flex flex-col items-center justify-center gap-1 rounded-md border p-2 transition-colors hover:bg-muted aspect-square"
                                    title={preset.label}
                                >
                                    <div className="h-4 w-4 rounded-full bg-primary/20 group-hover:bg-primary/40 transition-colors" />
                                    <span className="text-[9px] truncate w-full text-center">{preset.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-border" />

                    {/* Generator Type */}
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Generator</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {GENERATORS.map((gen) => (
                                <button
                                    key={gen.id}
                                    onClick={() => updateParam("generatorType", gen.id)}
                                    className={cn(
                                        "flex items-center justify-center rounded-md border px-2 py-1.5 text-xs font-medium transition-colors hover:bg-muted",
                                        patternParams.generatorType === gen.id
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "bg-card"
                                    )}
                                >
                                    {gen.label}
                                </button>
                            ))}
                        </div>
                    </div>

                     {/* Shape Selector (Only if not AI, though AI might use it as hint) */}
                     <div className="space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shape</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {SHAPES.map((shape) => (
                                <button
                                    key={shape.id}
                                    onClick={() => updateParam("shape", shape.id)}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-1 rounded-md border p-2 transition-colors hover:bg-muted aspect-square",
                                        patternParams.shape === shape.id
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "bg-card"
                                    )}
                                >
                                    <span className="text-lg leading-none">{shape.icon}</span>
                                    <span className="text-[9px]">{shape.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Tabs defaultValue="params" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 h-8">
                            <TabsTrigger value="params" className="text-xs h-6">Params</TabsTrigger>
                            <TabsTrigger value="style" className="text-xs h-6">Style</TabsTrigger>
                            <TabsTrigger value="anim" className="text-xs h-6">Anim</TabsTrigger>
                        </TabsList>
                        
                        {/* Geometric Parameters */}
                        <TabsContent value="params" className="space-y-5 mt-4">
                            {/* Scale */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Scale</Label>
                                    <span className="text-xs font-mono text-muted-foreground">{patternParams.scale}px</span>
                                </div>
                                <Slider
                                    value={[patternParams.scale]}
                                    onValueChange={([v]) => updateParam("scale", v)}
                                    min={8}
                                    max={256}
                                    step={4}
                                />
                            </div>

                            {/* Size Range (Min/Max) */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Size Range</Label>
                                    <span className="text-xs font-mono text-muted-foreground">{patternParams.sizeRange[0]}-{patternParams.sizeRange[1]}px</span>
                                </div>
                                <Slider
                                    value={patternParams.sizeRange}
                                    onValueChange={(v) => updateParam("sizeRange", v as [number, number])}
                                    min={1}
                                    max={100}
                                    step={1}
                                    minStepsBetweenThumbs={1}
                                />
                            </div>

                            {/* Density */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Density</Label>
                                    <span className="text-xs font-mono text-muted-foreground">{patternParams.density}%</span>
                                </div>
                                <Slider
                                    value={[patternParams.density]}
                                    onValueChange={([v]) => updateParam("density", v)}
                                    min={10}
                                    max={100}
                                    step={5}
                                />
                            </div>

                            {/* Stroke Width */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Stroke Width</Label>
                                    <span className="text-xs font-mono text-muted-foreground">{patternParams.strokeWidth}px</span>
                                </div>
                                <Slider
                                    value={[patternParams.strokeWidth]}
                                    onValueChange={([v]) => updateParam("strokeWidth", v)}
                                    min={0.5}
                                    max={10}
                                    step={0.5}
                                />
                            </div>

                            {/* Jitter */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Jitter</Label>
                                    <span className="text-xs font-mono text-muted-foreground">{patternParams.jitter}%</span>
                                </div>
                                <Slider
                                    value={[patternParams.jitter]}
                                    onValueChange={([v]) => updateParam("jitter", v)}
                                    min={0}
                                    max={100}
                                    step={5}
                                />
                            </div>
                            
                            {/* Spacing */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Spacing</Label>
                                    <span className="text-xs font-mono text-muted-foreground">{patternParams.spacing}</span>
                                </div>
                                <Slider
                                    value={[patternParams.spacing]}
                                    onValueChange={([v]) => updateParam("spacing", v)}
                                    min={0}
                                    max={100}
                                    step={5}
                                />
                            </div>

                            {/* Rotation */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Rotation</Label>
                                    <span className="text-xs font-mono text-muted-foreground">{patternParams.rotation}°</span>
                                </div>
                                <Slider
                                    value={[patternParams.rotation]}
                                    onValueChange={([v]) => updateParam("rotation", v)}
                                    min={0}
                                    max={360}
                                    step={15}
                                />
                            </div>

                            {/* Symmetry */}
                            <div className="space-y-2">
                                <Label className="text-xs">Symmetry</Label>
                                <Select
                                    value={patternParams.symmetry}
                                    onValueChange={(v) => updateParam("symmetry", v as PatternParams["symmetry"])}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Select symmetry" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="mirror">Mirror</SelectItem>
                                        <SelectItem value="radial">Radial</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </TabsContent>
                        
                        {/* Colors & Opacity */}
                        <TabsContent value="style" className="space-y-5 mt-4">
                            {/* Opacity (Global) */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Opacity</Label>
                                    <span className="text-xs font-mono text-muted-foreground">{patternParams.opacity}%</span>
                                </div>
                                <Slider
                                    value={[patternParams.opacity]}
                                    onValueChange={([v]) => updateParam("opacity", v)}
                                    min={0}
                                    max={100}
                                    step={5}
                                />
                            </div>

                            {/* Opacity Range (Per element) */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Opacity Range</Label>
                                    <span className="text-xs font-mono text-muted-foreground">{patternParams.opacityRange[0]}-{patternParams.opacityRange[1]}%</span>
                                </div>
                                <Slider
                                    value={patternParams.opacityRange}
                                    onValueChange={(v) => updateParam("opacityRange", v as [number, number])}
                                    min={0}
                                    max={100}
                                    step={5}
                                    minStepsBetweenThumbs={10}
                                />
                            </div>
                            
                            {/* Stroke/Fill Color */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Pattern Color</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[80px]">
                                            {patternParams.strokeColor}
                                        </span>
                                        <ColorPicker
                                            value={patternParams.strokeColor === "currentColor" ? "#000000" : patternParams.strokeColor}
                                            onChange={(v) => updateParam("strokeColor", v)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Background Color */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Background</Label>
                                     <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[80px]">
                                            {patternParams.backgroundColor}
                                        </span>
                                        <ColorPicker
                                            value={patternParams.backgroundColor === "transparent" ? "#ffffff" : patternParams.backgroundColor}
                                            onChange={(v) => updateParam("backgroundColor", v)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                        
                        {/* Animation */}
                        <TabsContent value="anim" className="space-y-5 mt-4">
                             {/* Duration */}
                             <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Duration</Label>
                                    <span className="text-xs font-mono text-muted-foreground">{patternParams.animationDuration}s</span>
                                </div>
                                <Slider
                                    value={[patternParams.animationDuration]}
                                    onValueChange={([v]) => updateParam("animationDuration", v)}
                                    min={1}
                                    max={60}
                                    step={1}
                                />
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Animate Rotation</Label>
                                    <Switch
                                        checked={patternParams.animateRotation}
                                        onCheckedChange={(v) => updateParam("animateRotation", v)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Animate Scale</Label>
                                    <Switch
                                        checked={patternParams.animateScale}
                                        onCheckedChange={(v) => updateParam("animateScale", v)}
                                    />
                                </div>
                                 <div className="flex items-center justify-between">
                                    <Label className="text-xs">Animate Opacity</Label>
                                    <Switch
                                        checked={patternParams.animateOpacity}
                                        onCheckedChange={(v) => updateParam("animateOpacity", v)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Animate Position</Label>
                                    <Switch
                                        checked={patternParams.animatePosition}
                                        onCheckedChange={(v) => updateParam("animatePosition", v)}
                                    />
                                </div>
                            </div>
                            
                            <div className="rounded-md bg-muted/50 p-3 mt-4">
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    Animations are applied via CSS transform. Exported SVGs will include these animations as inline styles.
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Payment Toggle (Dev/Test) */}
                    <div className="flex items-center justify-between pt-4 border-t">
                        <Label htmlFor="require-payment" className="text-[10px] text-muted-foreground">Require Payment (Test)</Label>
                        <Switch
                            id="require-payment"
                            checked={requirePayment}
                            onCheckedChange={setRequirePayment}
                            className="scale-75 origin-right"
                        />
                    </div>
                </div>
            </div>
		</div>
	);
}
