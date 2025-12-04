"use client";

import {
	Check,
	Copy,
	Download,
	ExternalLink,
	Grid3X3,
	Loader2,
	Palette,
	RotateCcw,
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
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { PATTERN_GENERATION_COST_SATS, FEE_ADDRESS } from "@/lib/yours-wallet";

// Color mode for pattern generation - affects how AI generates the SVG
type ColorMode = "currentColor" | "theme" | "grayscale";

interface PatternState {
	svg: string;
	prompt: string;
	colorMode: ColorMode;
	provider: string;
	model: string;
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

// Format satoshis for display
function formatSats(sats: number): string {
	if (sats < 1000) return `${sats} sats`;
	if (sats < 100000) return `${(sats / 1000).toFixed(1)}k sats`;
	return `${(sats / 100000000).toFixed(4)} BSV`;
}

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

	const { status, connect, inscribePattern, isInscribing, balance, sendPayment, isSending } = useYoursWallet();
	const isConnected = status === "connected";
	const hasEnoughBalance = (balance?.satoshis ?? 0) >= PATTERN_GENERATION_COST_SATS;
	const [isPaying, setIsPaying] = useState(false);
	const [paymentError, setPaymentError] = useState<string | null>(null);

	// Estimate cost (SVG size + base fee)
	const estimatedCost = pattern?.svg ? pattern.svg.length + 500 : 0;

	// Generate SVG pattern using Gemini API
	const generatePattern = useCallback(async () => {
		if (!prompt.trim()) return;

		// Check wallet connection
		if (!isConnected) {
			try {
				await connect();
			} catch {
				setPaymentError("Please connect your wallet to generate patterns");
				return;
			}
			return; // Let user click again after connecting
		}

		// Check balance
		if (!hasEnoughBalance) {
			setPaymentError(`Insufficient balance. You need at least ${(PATTERN_GENERATION_COST_SATS / 100_000_000).toFixed(2)} BSV.`);
			return;
		}

		setPaymentError(null);
		setIsGenerating(true);

		try {
			// Step 1: Process payment first
			setIsPaying(true);
			const paymentResult = await sendPayment(FEE_ADDRESS, PATTERN_GENERATION_COST_SATS);
			setIsPaying(false);

			if (!paymentResult) {
				throw new Error("Payment failed or was cancelled");
			}

			// Step 2: Generate pattern with payment txid
			const response = await fetch("/api/generate-pattern", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: prompt.trim(),
					colorMode,
					paymentTxid: paymentResult.txid,
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
				provider: data.provider,
				model: data.model,
			});
		} catch (error) {
			console.error("Error generating pattern:", error);
			setPaymentError(error instanceof Error ? error.message : "Generation failed");
			setIsPaying(false);
		} finally {
			setIsGenerating(false);
		}
	}, [prompt, colorMode, isConnected, connect, hasEnoughBalance, sendPayment]);

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
  background-image: url("data:image/svg+xml,${encoded}");
  background-repeat: repeat;
  background-size: ${scale}px ${scale}px;
  opacity: ${opacity / 100};
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

		const response = await inscribePattern(pattern.svg, {
			name: patternName || undefined,
			prompt: pattern.prompt,
			provider: pattern.provider,
			model: pattern.model,
		});

		if (response?.txid) {
			setInscribedOrigin(`${response.txid}_0`);
		}
	}, [pattern, patternName, inscribePattern]);

	// Reset everything
	const handleReset = useCallback(() => {
		setPrompt("");
		setPatternName("");
		setPattern(null);
		setInscribedOrigin(null);
		setPaymentError(null);
	}, []);

	// Check if ready to inscribe
	const canInscribe = pattern?.svg && !inscribedOrigin;
	const isProcessing = isPaying || isSending || isGenerating || isInscribing;
	const hasContent = pattern !== null || prompt.trim() !== "";

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			{/* Main content area - resizable two panel layout */}
			<ResizablePanelGroup direction="horizontal" className="min-h-0 flex-1">
				{/* Left Panel: Controls (scrollable) */}
				<ResizablePanel defaultSize={35} minSize={25} maxSize={50} className="flex min-h-0 flex-col bg-muted/5">
					{/* Scrollable content */}
					<div className="min-h-0 flex-1 overflow-y-auto p-4">
						<div className="space-y-6">
							{/* Pattern Presets */}
							<div>
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
							<div>
								<Label className="mb-3 block font-mono text-xs text-muted-foreground">
									PATTERN_DESCRIPTION
								</Label>
								<Textarea
									value={prompt}
									onChange={(e) => setPrompt(e.target.value)}
									placeholder="Describe your pattern... e.g. 'subtle hexagonal grid with thin lines'"
									className="mb-4 min-h-[100px] font-mono text-sm"
								/>

								<div className="space-y-4">
									<div>
										<Label className="mb-2 block font-mono text-xs text-muted-foreground">
											COLOR_MODE
										</Label>
										<Select value={colorMode} onValueChange={(v) => setColorMode(v as ColorMode)}>
											<SelectTrigger className="font-mono text-xs">
												<SelectValue />
											</SelectTrigger>
											<SelectContent className="w-[320px]">
												<SelectItem value="currentColor" className="py-3">
													<div className="flex items-start gap-3">
														<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded border border-border bg-muted/30">
															<svg viewBox="0 0 24 24" className="h-6 w-6 text-primary">
																<circle cx="8" cy="8" r="2" fill="currentColor" />
																<circle cx="16" cy="8" r="2" fill="currentColor" />
																<circle cx="8" cy="16" r="2" fill="currentColor" />
																<circle cx="16" cy="16" r="2" fill="currentColor" />
															</svg>
														</div>
														<div className="flex flex-col gap-0.5">
															<span className="font-medium">currentColor</span>
															<span className="text-[10px] text-muted-foreground">
																Inherits color from CSS. Updates with theme/dark mode
															</span>
														</div>
													</div>
												</SelectItem>
												<SelectItem value="theme" className="py-3">
													<div className="flex items-start gap-3">
														<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded border border-border bg-muted/30">
															<svg viewBox="0 0 24 24" className="h-6 w-6">
																<circle cx="8" cy="8" r="2" className="fill-primary" />
																<circle cx="16" cy="8" r="2" className="fill-accent" />
																<circle cx="8" cy="16" r="2" className="fill-secondary" />
																<circle cx="16" cy="16" r="2" className="fill-primary" />
															</svg>
														</div>
														<div className="flex flex-col gap-0.5">
															<span className="font-medium">Theme Colors</span>
															<span className="text-[10px] text-muted-foreground">
																Bakes current colors into SVG. Fixed appearance
															</span>
														</div>
													</div>
												</SelectItem>
												<SelectItem value="grayscale" className="py-3">
													<div className="flex items-start gap-3">
														<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded border border-border bg-muted/30">
															<svg viewBox="0 0 24 24" className="h-6 w-6">
																<circle cx="8" cy="8" r="2" fill="#666" />
																<circle cx="16" cy="8" r="2" fill="#888" />
																<circle cx="8" cy="16" r="2" fill="#aaa" />
																<circle cx="16" cy="16" r="2" fill="#666" />
															</svg>
														</div>
														<div className="flex flex-col gap-0.5">
															<span className="font-medium">Grayscale</span>
															<span className="text-[10px] text-muted-foreground">
																Neutral grays only. Works with any theme
															</span>
														</div>
													</div>
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<Button
										onClick={generatePattern}
										disabled={isProcessing || !prompt.trim() || (isConnected && !hasEnoughBalance)}
										className="w-full gap-2 font-mono text-xs"
									>
										{status === "not-installed" ? (
											<>
												<Wallet className="h-4 w-4" />
												Install Wallet
											</>
										) : !isConnected ? (
											<>
												<Wallet className="h-4 w-4" />
												Connect to Generate
											</>
										) : !hasEnoughBalance ? (
											<>
												<Wallet className="h-4 w-4" />
												Insufficient Balance
											</>
										) : isPaying || isSending ? (
											<>
												<Loader2 className="h-4 w-4 animate-spin" />
												PAYING...
											</>
										) : isGenerating ? (
											<>
												<Loader2 className="h-4 w-4 animate-spin" />
												GENERATING...
											</>
										) : (
											<>
												<Wand2 className="h-4 w-4" />
												GENERATE ({(PATTERN_GENERATION_COST_SATS / 100_000_000).toFixed(2)} BSV)
											</>
										)}
									</Button>
								</div>

								{/* Error display */}
								{paymentError && (
									<div className="mt-3 rounded border border-destructive/50 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
										{paymentError}
										<button
											type="button"
											onClick={() => setPaymentError(null)}
											className="ml-2 underline hover:no-underline"
										>
											Dismiss
										</button>
									</div>
								)}
							</div>

							{/* Pattern Controls - Only show when pattern exists */}
							{pattern && (
								<div>
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
								</div>
							)}

							{/* Export Actions - Only show when pattern exists */}
							{pattern && (
								<div>
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

									{/* Inscribed Success */}
									{inscribedOrigin && (
										<div className="mt-4 space-y-2 border-t border-border pt-4">
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
									)}
								</div>
							)}
						</div>
					</div>
				</ResizablePanel>

				<ResizableHandle withHandle />

				{/* Right Panel: Preview (fixed, no scroll) */}
				<ResizablePanel defaultSize={65} className="hidden min-h-0 flex-col overflow-hidden lg:flex">
					{/* Preview Area */}
					<div className="flex h-full flex-col">
						{/* Header */}
						<div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
							<Grid3X3 className="h-4 w-4 text-muted-foreground" />
							<span className="font-mono text-xs text-muted-foreground">
								TILED_PREVIEW
							</span>
							{pattern && (
								<span className="ml-auto font-mono text-[10px] text-muted-foreground">
									{scale}px tile · {opacity}% opacity
								</span>
							)}
						</div>

						{/* Pattern Display */}
						<div className="relative flex-1">
							{pattern?.svg ? (
								<div
									className="absolute inset-0"
									style={{
										backgroundImage: `url("${svgDataUrl}")`,
										backgroundRepeat: "repeat",
										backgroundSize: `${scale}px ${scale}px`,
										opacity: opacity / 100,
									}}
								/>
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
				</ResizablePanel>
			</ResizablePanelGroup>

			{/* Full-width Footer */}
			<div className="flex shrink-0 items-center justify-between border-t border-border bg-muted/30 px-4 py-2">
				{/* Left: Pattern info */}
				<div className="flex items-center gap-3 overflow-hidden">
					<Input
						value={patternName}
						onChange={(e) => setPatternName(e.target.value)}
						placeholder="Pattern name"
						className="h-7 w-40 font-mono text-xs"
						disabled={!pattern || !!inscribedOrigin}
					/>
					{estimatedCost > 0 && !inscribedOrigin && (
						<span className="shrink-0 font-mono text-xs text-muted-foreground">
							~{formatSats(estimatedCost)}
						</span>
					)}
					{hasContent && (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleReset}
							className="h-7 gap-1.5 px-2 font-mono text-xs text-muted-foreground hover:text-foreground"
						>
							<RotateCcw className="h-3 w-3" />
							Clear
						</Button>
					)}
				</div>

				{/* Right: Wallet + Action */}
				<div className="flex shrink-0 items-center gap-3">
					{isConnected && balance?.satoshis !== undefined && (
						<span className="hidden font-mono text-xs text-muted-foreground sm:block">
							{formatSats(balance.satoshis)}
						</span>
					)}
					{inscribedOrigin ? (
						<div className="flex items-center gap-2 rounded bg-green-500/10 px-3 py-1.5 text-green-600 dark:text-green-400">
							<Check className="h-3 w-3" />
							<span className="font-mono text-xs">Inscribed</span>
						</div>
					) : isConnected ? (
						<Button
							onClick={handleInscribe}
							disabled={!canInscribe || isInscribing}
							className="gap-2 font-mono text-xs"
						>
							{isInscribing ? (
								<>
									<Loader2 className="h-3 w-3 animate-spin" />
									INSCRIBING...
								</>
							) : (
								<>
									<Wallet className="h-3 w-3" />
									INSCRIBE
								</>
							)}
						</Button>
					) : (
						<Button onClick={connect} className="gap-2 font-mono text-xs">
							<Wallet className="h-3 w-3" />
							Connect Wallet
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
