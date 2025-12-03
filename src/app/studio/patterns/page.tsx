"use client";

import { motion } from "framer-motion";
import {
	Check,
	Copy,
	Download,
	ExternalLink,
	Grid3X3,
	Loader2,
	Palette,
	Sparkles,
	Wallet,
	Wand2,
} from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useYoursWallet } from "@/hooks/use-yours-wallet";

type ColorMode = "theme" | "currentColor" | "grayscale";

interface PatternState {
	svg: string;
	prompt: string;
	colorMode: ColorMode;
}

// Pattern type presets for quick prompts
const PATTERN_PRESETS = [
	{ id: "dots", label: "Dot Matrix", prompt: "evenly spaced small dots in a grid pattern" },
	{ id: "grid", label: "Isometric Grid", prompt: "isometric grid lines with subtle depth" },
	{ id: "topo", label: "Topographic", prompt: "topographic contour lines like a terrain map" },
	{ id: "waves", label: "Wave Lines", prompt: "smooth flowing wave lines" },
	{ id: "hexagon", label: "Hexagon", prompt: "hexagonal honeycomb pattern" },
	{ id: "diagonal", label: "Scanlines", prompt: "diagonal parallel lines like CRT scanlines" },
	{ id: "circuit", label: "Circuit", prompt: "circuit board traces and connection points" },
	{ id: "noise", label: "Grain", prompt: "subtle organic noise texture" },
];

export default function PatternGeneratorPage() {
	const [prompt, setPrompt] = useState("");
	const [patternName, setPatternName] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [pattern, setPattern] = useState<PatternState | null>(null);
	const [colorMode, setColorMode] = useState<ColorMode>("currentColor");
	const [scale, setScale] = useState(24);
	const [opacity, setOpacity] = useState(100);
	const [copiedType, setCopiedType] = useState<string | null>(null);
	const [inscribedOrigin, setInscribedOrigin] = useState<string | null>(null);

	const { status, connect, inscribePattern, isInscribing } = useYoursWallet();

	// Generate SVG pattern using Gemini API
	const generatePattern = useCallback(async () => {
		if (!prompt.trim()) return;

		setIsGenerating(true);
		try {
			const response = await fetch("/api/generate-pattern", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: prompt.trim(),
					colorMode,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to generate pattern");
			}

			const data = await response.json();
			setPattern({
				svg: data.svg,
				prompt: prompt.trim(),
				colorMode,
			});
		} catch (error) {
			console.error("Error generating pattern:", error);
		} finally {
			setIsGenerating(false);
		}
	}, [prompt, colorMode]);

	// Apply preset prompt
	const applyPreset = useCallback((preset: typeof PATTERN_PRESETS[number]) => {
		setPrompt(preset.prompt);
	}, []);

	// Copy functions
	const copyToClipboard = useCallback(async (text: string, type: string) => {
		await navigator.clipboard.writeText(text);
		setCopiedType(type);
		setTimeout(() => setCopiedType(null), 2000);
	}, []);

	// Generate SVG data URL (URL-encoded, not base64)
	const svgDataUrl = useMemo(() => {
		if (!pattern?.svg) return "";
		const encoded = encodeURIComponent(pattern.svg);
		return `data:image/svg+xml,${encoded}`;
	}, [pattern?.svg]);

	// Generate CSS snippet
	const cssSnippet = useMemo(() => {
		if (!pattern?.svg) return "";
		const encoded = encodeURIComponent(pattern.svg);
		return `.pattern-bg {
  background-color: hsl(var(--primary) / ${(opacity / 100) * 0.1});
  mask-image: url("data:image/svg+xml,${encoded}");
  mask-repeat: repeat;
  mask-size: ${scale}px;
}`;
	}, [pattern?.svg, scale, opacity]);

	// Download SVG file
	const downloadSvg = useCallback(() => {
		if (!pattern?.svg) return;
		const blob = new Blob([pattern.svg], { type: "image/svg+xml" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `pattern-${Date.now()}.svg`;
		a.click();
		URL.revokeObjectURL(url);
	}, [pattern?.svg]);

	// Inscribe pattern on-chain
	const handleInscribe = useCallback(async () => {
		if (!pattern?.svg) return;

		const name = patternName.trim() || `Pattern ${Date.now()}`;
		const response = await inscribePattern(pattern.svg, name, {
			prompt: pattern.prompt,
			colorMode: pattern.colorMode,
		});

		if (response?.txid) {
			setInscribedOrigin(`${response.txid}_0`);
		}
	}, [pattern, patternName, inscribePattern]);

	return (
		<div className="relative">
			{/* Header */}
			<div className="mb-6">
				<h1 className="font-mono text-sm text-muted-foreground">
					<span className="text-primary">root</span>/studio/
					<span className="text-foreground">patterns</span>{" "}
					<span className="animate-pulse">_</span>
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Generate seamless SVG patterns with AI
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Left Column: Generator Controls */}
				<div className="space-y-6">
					{/* Pattern Presets */}
					<div className="rounded border border-border bg-card p-4">
						<Label className="mb-3 block font-mono text-xs text-muted-foreground">
							QUICK_PRESETS
						</Label>
						<div className="flex flex-wrap gap-2">
							{PATTERN_PRESETS.map((preset) => (
								<button
									key={preset.id}
									type="button"
									onClick={() => applyPreset(preset)}
									className="rounded border border-border bg-muted/50 px-3 py-1.5 font-mono text-xs transition-colors hover:border-primary/50 hover:bg-primary/10"
								>
									{preset.label}
								</button>
							))}
						</div>
					</div>

					{/* Prompt Input */}
					<div className="rounded border border-border bg-card p-4">
						<Label className="mb-3 block font-mono text-xs text-muted-foreground">
							PATTERN_DESCRIPTION
						</Label>
						<Textarea
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							placeholder="Describe your pattern... e.g. 'subtle hexagonal grid with thin lines'"
							className="mb-4 min-h-[100px] font-mono text-sm"
						/>

						<div className="flex items-center gap-4">
							<div className="flex-1">
								<Label className="mb-2 block font-mono text-xs text-muted-foreground">
									COLOR_MODE
								</Label>
								<Select value={colorMode} onValueChange={(v) => setColorMode(v as ColorMode)}>
									<SelectTrigger className="font-mono text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="currentColor">currentColor (Theme Reactive)</SelectItem>
										<SelectItem value="theme">Theme Colors (Hardcoded)</SelectItem>
										<SelectItem value="grayscale">Grayscale</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<Button
								onClick={generatePattern}
								disabled={isGenerating || !prompt.trim()}
								className="mt-6 gap-2 font-mono text-xs"
							>
								{isGenerating ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										GENERATING...
									</>
								) : (
									<>
										<Wand2 className="h-4 w-4" />
										GENERATE
									</>
								)}
							</Button>
						</div>
					</div>

					{/* Pattern Controls */}
					{pattern && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							className="rounded border border-border bg-card p-4"
						>
							<Label className="mb-4 block font-mono text-xs text-muted-foreground">
								PATTERN_CONTROLS
							</Label>

							<div className="space-y-4">
								<div>
									<div className="mb-2 flex items-center justify-between">
										<span className="font-mono text-xs text-muted-foreground">Scale</span>
										<span className="font-mono text-xs">{scale}px</span>
									</div>
									<Slider
										value={[scale]}
										onValueChange={([v]) => setScale(v)}
										min={8}
										max={64}
										step={4}
									/>
								</div>

								<div>
									<div className="mb-2 flex items-center justify-between">
										<span className="font-mono text-xs text-muted-foreground">Opacity</span>
										<span className="font-mono text-xs">{opacity}%</span>
									</div>
									<Slider
										value={[opacity]}
										onValueChange={([v]) => setOpacity(v)}
										min={10}
										max={100}
										step={5}
									/>
								</div>
							</div>
						</motion.div>
					)}

					{/* Copy/Export Actions */}
					{pattern && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1 }}
							className="rounded border border-border bg-card p-4"
						>
							<Label className="mb-3 block font-mono text-xs text-muted-foreground">
								EXPORT_OPTIONS
							</Label>

							<div className="grid grid-cols-2 gap-2">
								<Button
									variant="outline"
									size="sm"
									className="gap-2 font-mono text-xs"
									onClick={() => copyToClipboard(pattern.svg, "svg")}
								>
									{copiedType === "svg" ? (
										<Check className="h-3 w-3 text-green-500" />
									) : (
										<Copy className="h-3 w-3" />
									)}
									Copy SVG
								</Button>

								<Button
									variant="outline"
									size="sm"
									className="gap-2 font-mono text-xs"
									onClick={() => copyToClipboard(svgDataUrl, "dataurl")}
								>
									{copiedType === "dataurl" ? (
										<Check className="h-3 w-3 text-green-500" />
									) : (
										<Copy className="h-3 w-3" />
									)}
									Copy Data URL
								</Button>

								<Button
									variant="outline"
									size="sm"
									className="gap-2 font-mono text-xs"
									onClick={() => copyToClipboard(cssSnippet, "css")}
								>
									{copiedType === "css" ? (
										<Check className="h-3 w-3 text-green-500" />
									) : (
										<Copy className="h-3 w-3" />
									)}
									Copy CSS
								</Button>

								<Button
									variant="outline"
									size="sm"
									className="gap-2 font-mono text-xs"
									onClick={downloadSvg}
								>
									<Download className="h-3 w-3" />
									Download
								</Button>
							</div>

							{/* Inscribe On-Chain */}
							<div className="mt-4 border-t border-border pt-4">
								{inscribedOrigin ? (
									<div className="space-y-2">
										<div className="flex items-center gap-2 rounded bg-green-500/10 px-3 py-2 text-green-600 dark:text-green-400">
											<Check className="h-4 w-4" />
											<span className="font-mono text-xs">Inscribed!</span>
										</div>
										<div className="space-y-1">
											<Label className="font-mono text-[10px] text-muted-foreground">
												ORIGIN_ID
											</Label>
											<div className="flex items-center gap-2">
												<code className="flex-1 truncate rounded bg-muted px-2 py-1 font-mono text-[10px]">
													{inscribedOrigin}
												</code>
												<Button
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0"
													onClick={() =>
														copyToClipboard(`/content/${inscribedOrigin}`, "origin")
													}
												>
													{copiedType === "origin" ? (
														<Check className="h-3 w-3 text-green-500" />
													) : (
														<Copy className="h-3 w-3" />
													)}
												</Button>
											</div>
											<p className="font-mono text-[10px] text-muted-foreground">
												Use <code className="text-primary">/content/{inscribedOrigin}</code> in
												your theme&apos;s bg-image property
											</p>
										</div>
										<a
											href={`https://ordfs.network/content/${inscribedOrigin}`}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-center gap-1 text-primary hover:underline font-mono text-xs"
										>
											View on ORDFS <ExternalLink className="h-3 w-3" />
										</a>
									</div>
								) : status !== "connected" ? (
									<>
										<Button
											variant="secondary"
											size="sm"
											className="w-full gap-2 font-mono text-xs"
											onClick={connect}
										>
											<Wallet className="h-3 w-3" />
											Connect Wallet to Inscribe
										</Button>
										<p className="mt-2 text-center font-mono text-[10px] text-muted-foreground">
											Connect Yours Wallet to inscribe patterns on-chain
										</p>
									</>
								) : (
									<>
										<div className="mb-3">
											<Label className="mb-1 block font-mono text-[10px] text-muted-foreground">
												PATTERN_NAME (optional)
											</Label>
											<Input
												value={patternName}
												onChange={(e) => setPatternName(e.target.value)}
												placeholder="My Pattern"
												className="font-mono text-xs"
											/>
										</div>
										<Button
											variant="secondary"
											size="sm"
											className="w-full gap-2 font-mono text-xs"
											onClick={handleInscribe}
											disabled={isInscribing}
										>
											{isInscribing ? (
												<>
													<Loader2 className="h-3 w-3 animate-spin" />
													Inscribing...
												</>
											) : (
												<>
													<Sparkles className="h-3 w-3" />
													Inscribe On-Chain
												</>
											)}
										</Button>
										<p className="mt-2 text-center font-mono text-[10px] text-muted-foreground">
											Pay BSV to permanently store your pattern on the blockchain
										</p>
									</>
								)}
							</div>
						</motion.div>
					)}
				</div>

				{/* Right Column: Preview */}
				<div className="lg:sticky lg:top-32">
					<div className="overflow-hidden rounded border border-border bg-card">
						<div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
							<Grid3X3 className="h-4 w-4 text-muted-foreground" />
							<span className="font-mono text-xs text-muted-foreground">
								TILED_PREVIEW
							</span>
						</div>

						<div className="relative aspect-square">
							{pattern?.svg ? (
								<>
									{/* Background layer - shows through the mask */}
									<div
										className="absolute inset-0 bg-primary/10"
										style={{ opacity: opacity / 100 }}
									/>
									{/* Mask layer - pattern defines where color shows */}
									<div
										className="absolute inset-0"
										style={{
											backgroundColor: `hsl(var(--primary) / ${(opacity / 100) * 0.3})`,
											maskImage: `url("${svgDataUrl}")`,
											WebkitMaskImage: `url("${svgDataUrl}")`,
											maskRepeat: "repeat",
											WebkitMaskRepeat: "repeat",
											maskSize: `${scale}px`,
											WebkitMaskSize: `${scale}px`,
										}}
									/>
									{/* Center badge */}
									<div className="absolute bottom-4 right-4 rounded bg-background/80 px-2 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur">
										{scale}px tile
									</div>
								</>
							) : (
								<div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
									<div className="rounded-full bg-muted/50 p-4">
										<Palette className="h-8 w-8 text-muted-foreground/50" />
									</div>
									<div>
										<p className="font-mono text-sm text-muted-foreground">
											No pattern generated
										</p>
										<p className="font-mono text-xs text-muted-foreground/70">
											Enter a description and click Generate
										</p>
									</div>
								</div>
							)}
						</div>

						{/* Raw SVG Preview Toggle */}
						{pattern?.svg && (
							<details className="border-t border-border">
								<summary className="cursor-pointer bg-muted/30 px-4 py-2 font-mono text-xs text-muted-foreground hover:bg-muted/50">
									VIEW_RAW_SVG
								</summary>
								<div className="max-h-48 overflow-auto bg-muted/10 p-4">
									<pre className="font-mono text-[10px] text-muted-foreground">
										{pattern.svg}
									</pre>
								</div>
							</details>
						)}
					</div>

					{/* Usage Guide */}
					<div className="mt-4 rounded border border-border bg-card p-4">
						<Label className="mb-2 block font-mono text-xs text-muted-foreground">
							USAGE_GUIDE
						</Label>
						<div className="space-y-2 font-mono text-xs text-muted-foreground">
							<p>
								<span className="text-primary">1.</span> Choose a preset or describe your pattern
							</p>
							<p>
								<span className="text-primary">2.</span> Select color mode (currentColor for theme-reactive)
							</p>
							<p>
								<span className="text-primary">3.</span> Adjust scale and opacity
							</p>
							<p>
								<span className="text-primary">4.</span> Copy CSS to use with mask-image
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
