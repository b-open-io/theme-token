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
import { RefreshCw, Layers, Zap, Palette } from "lucide-react";
import { usePatternContext, type PatternParams } from "./pattern-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorPicker } from "@/components/ui/color-picker";

export function PatternControls() {
	const { patternParams, updateParam, randomizeParams, requirePayment, setRequirePayment } = usePatternContext();

	return (
		<div className="flex flex-col gap-4 p-4 w-80">
			<div className="flex items-center justify-between">
				<h4 className="font-medium leading-none text-sm">Settings</h4>
				<Button variant="ghost" size="icon" className="h-6 w-6" onClick={randomizeParams} title="Randomize All">
					<RefreshCw className="h-3 w-3" />
				</Button>
			</div>

            <Tabs defaultValue="params" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-8">
                    <TabsTrigger value="params" className="text-xs h-6"><Layers className="w-3 h-3 mr-1"/> Params</TabsTrigger>
                    <TabsTrigger value="style" className="text-xs h-6"><Palette className="w-3 h-3 mr-1"/> Style</TabsTrigger>
                    <TabsTrigger value="anim" className="text-xs h-6"><Zap className="w-3 h-3 mr-1"/> Anim</TabsTrigger>
                </TabsList>
                
                {/* Geometric Parameters */}
                <TabsContent value="params" className="space-y-4 mt-4">
                    {/* Scale */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Scale</Label>
                            <span className="text-xs font-mono">{patternParams.scale}px</span>
                        </div>
                        <Slider
                            value={[patternParams.scale]}
                            onValueChange={([v]) => updateParam("scale", v)}
                            min={8}
                            max={256}
                            step={4}
                        />
                    </div>

                    {/* Density */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Density</Label>
                            <span className="text-xs font-mono">{patternParams.density}%</span>
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
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Stroke</Label>
                            <span className="text-xs font-mono">{patternParams.strokeWidth}px</span>
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
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Jitter</Label>
                            <span className="text-xs font-mono">{patternParams.jitter}%</span>
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
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Spacing</Label>
                            <span className="text-xs font-mono">{patternParams.spacing}</span>
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
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Rotation</Label>
                            <span className="text-xs font-mono">{patternParams.rotation}°</span>
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
                        <Label className="text-xs text-muted-foreground">Symmetry</Label>
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
                <TabsContent value="style" className="space-y-4 mt-4">
                    {/* Opacity */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Opacity</Label>
                            <span className="text-xs font-mono">{patternParams.opacity}%</span>
                        </div>
                        <Slider
                            value={[patternParams.opacity]}
                            onValueChange={([v]) => updateParam("opacity", v)}
                            min={0}
                            max={100}
                            step={5}
                        />
                    </div>
                    
                    {/* Stroke/Fill Color */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Pattern Color</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-muted-foreground">
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
                            <Label className="text-xs text-muted-foreground">Background</Label>
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-muted-foreground">
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
                <TabsContent value="anim" className="space-y-4 mt-4">
                     {/* Duration */}
                     <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Duration</Label>
                            <span className="text-xs font-mono">{patternParams.animationDuration}s</span>
                        </div>
                        <Slider
                            value={[patternParams.animationDuration]}
                            onValueChange={([v]) => updateParam("animationDuration", v)}
                            min={1}
                            max={60}
                            step={1}
                        />
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Animate Rotation</Label>
                            <Switch
                                checked={patternParams.animateRotation}
                                onCheckedChange={(v) => updateParam("animateRotation", v)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Animate Scale</Label>
                            <Switch
                                checked={patternParams.animateScale}
                                onCheckedChange={(v) => updateParam("animateScale", v)}
                            />
                        </div>
                         <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Animate Opacity</Label>
                            <Switch
                                checked={patternParams.animateOpacity}
                                onCheckedChange={(v) => updateParam("animateOpacity", v)}
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
            <div className="flex items-center justify-between pt-2 border-t mt-2">
                <Label htmlFor="require-payment" className="text-[10px] text-muted-foreground">Require Payment (Test)</Label>
                <Switch
                    id="require-payment"
                    checked={requirePayment}
                    onCheckedChange={setRequirePayment}
                    className="scale-75 origin-right"
                />
            </div>
		</div>
	);
}
