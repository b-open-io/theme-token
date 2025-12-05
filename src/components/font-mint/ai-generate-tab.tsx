"use client";

import { Loader2, RotateCcw, Sparkles, Wand2, Wallet } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { FONT_GENERATION_COST_SATS, FEE_ADDRESS } from "@/lib/yours-wallet";

interface Glyph {
	char: string;
	unicode: number;
	width: number;
	path: string;
}

interface GeneratedFont {
	name: string;
	style: string;
	unitsPerEm: number;
	ascender: number;
	descender: number;
	capHeight: number;
	xHeight: number;
	glyphs: Glyph[];
	generatedBy: string;
	generatedAt: string;
	prompt?: string;
}

interface CompiledFont {
	woff2Base64: string;
	otfBase64: string;
	woff2Size: number;
	otfSize: number;
	familyName: string;
	glyphCount: number;
}

interface AIGenerateTabProps {
	onFontGenerated: (font: GeneratedFont, compiled?: CompiledFont) => void;
	/** If a font has already been generated, show compact "ready" state */
	generatedFont?: GeneratedFont | null;
	compiledFont?: CompiledFont | null;
	/** Called when user wants to clear and regenerate */
	onClear?: () => void;
	/** Controlled values for URL sync */
	initialModel?: AIModel;
	initialPrompt?: string;
	initialPreset?: string;
	onModelChange?: (model: AIModel) => void;
	onPromptChange?: (prompt: string) => void;
	onPresetChange?: (preset: string | null) => void;
}

type AIModel = "gemini-3-pro" | "claude-opus-4.5";

const AI_MODELS: { id: AIModel; name: string; description: string }[] = [
	{
		id: "gemini-3-pro",
		name: "Gemini 3 Pro",
		description: "Google's latest multimodal model with strong visual understanding",
	},
	{
		id: "claude-opus-4.5",
		name: "Claude Opus 4.5",
		description: "Anthropic's most capable model with nuanced creative output",
	},
];

const STYLE_PRESETS = [
	{ id: "modern-sans", label: "Modern Sans", prompt: "Clean, geometric sans-serif with modern proportions and even stroke weights" },
	{ id: "cyber-gothic", label: "Cyber Gothic", prompt: "Futuristic gothic typeface with sharp angles, digital aesthetic, and technical feel" },
	{ id: "organic-script", label: "Organic Script", prompt: "Flowing handwritten script with natural letterforms and calligraphic flourishes" },
	{ id: "brutalist", label: "Brutalist", prompt: "Heavy, bold industrial typeface with stark geometry and commanding presence" },
	{ id: "retro-display", label: "Retro Display", prompt: "1970s inspired display font with rounded corners and groovy vibes" },
	{ id: "pixel-art", label: "Pixel Art", prompt: "8-bit inspired bitmap-style font for games and digital nostalgia" },
];

const STORAGE_KEY = "font:activeGeneration";

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

// Generation status type from API
interface GenerationStatus {
	success?: boolean;
	status: "generating" | "compiling" | "complete" | "failed" | "not_found";
	prompt?: string;
	model?: string;
	font?: GeneratedFont;
	compiled?: CompiledFont;
	error?: string;
	age?: number;
}

// Format satoshis as BSV
const formatBsv = (sats: number) => {
	const bsv = sats / 100_000_000;
	if (bsv < 0.01) return bsv.toFixed(5);
	if (bsv < 0.1) return bsv.toFixed(3);
	return bsv.toFixed(2);
};

export function AIGenerateTab({ 
	onFontGenerated, 
	generatedFont: externalFont, 
	compiledFont: externalCompiled, 
	onClear,
	initialModel = "gemini-3-pro",
	initialPrompt = "",
	initialPreset,
	onModelChange,
	onPromptChange,
	onPresetChange,
}: AIGenerateTabProps) {
	const { status, connect, balance, sendPayment, isSending } = useYoursWallet();
	const [selectedModel, setSelectedModel] = useState<AIModel>(initialModel);
	const [prompt, setPrompt] = useState(initialPrompt);
	const [selectedPreset, setSelectedPreset] = useState<string | null>(initialPreset ?? null);
	const [jobId, setJobId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isPaying, setIsPaying] = useState(false);
	
	// Sync controlled changes to parent
	const handleModelChange = (model: AIModel) => {
		setSelectedModel(model);
		onModelChange?.(model);
	};
	
	const handlePromptChange = (value: string) => {
		setPrompt(value);
		onPromptChange?.(value);
	};
	
	const handlePresetChange = (preset: string | null) => {
		setSelectedPreset(preset);
		onPresetChange?.(preset);
	};

	const isConnected = status === "connected";
	const hasEnoughBalance = (balance?.satoshis ?? 0) >= FONT_GENERATION_COST_SATS;

	// Poll for generation status when we have a jobId
	const { data: statusData } = useSWR<GenerationStatus>(
		jobId ? `/api/font-generation/${jobId}` : null,
		fetcher,
		{
			// Poll every 3 seconds while generating
			refreshInterval: (data) => {
				if (!data) return 3000;
				// Stop polling when complete, failed, not found, OR when we have font data
				if (data.status === "complete" || data.status === "failed" || data.status === "not_found") {
					return 0;
				}
				// Also stop if we're "compiling" but already have font data
				if (data.status === "compiling" && data.font) {
					return 0;
				}
				return 3000;
			},
			revalidateOnFocus: true,
		}
	);

	// Check localStorage for active generation on mount
	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const { jobId: storedJobId, prompt: storedPrompt } = JSON.parse(stored);
				if (storedJobId) {
					setJobId(storedJobId);
					setPrompt(storedPrompt || "");
				}
			} catch {
				localStorage.removeItem(STORAGE_KEY);
			}
		}
	}, []);

	// Handle status updates from polling - pass font up to parent
	useEffect(() => {
		if (!statusData) return;

		// Treat both "complete" and "compiling with font data" as complete
		const hasFont = statusData.font !== undefined;
		const isComplete = statusData.status === "complete";
		const isCompilingWithFont = statusData.status === "compiling" && hasFont;

		if ((isComplete || isCompilingWithFont) && statusData.font) {
			// Pass font to parent - parent handles all preview
			onFontGenerated(statusData.font, statusData.compiled ?? undefined);
			localStorage.removeItem(STORAGE_KEY);
			setJobId(null);
		} else if (statusData.status === "failed") {
			setError(statusData.error || "Generation failed");
			setJobId(null);
			localStorage.removeItem(STORAGE_KEY);
		} else if (statusData.status === "not_found") {
			setJobId(null);
			localStorage.removeItem(STORAGE_KEY);
		}
	}, [statusData, onFontGenerated]);

	const handlePresetClick = (preset: typeof STYLE_PRESETS[0]) => {
		handlePresetChange(preset.id);
		handlePromptChange(preset.prompt);
	};

	const handleGenerate = async () => {
		if (!prompt.trim()) return;

		// Check wallet connection
		if (!isConnected) {
			try {
				await connect();
			} catch {
				setError("Please connect your wallet to generate fonts");
				return;
			}
			return; // Let user click again after connecting
		}

		// Check balance
		if (!hasEnoughBalance) {
			setError(`Insufficient balance. You need at least ${formatBsv(FONT_GENERATION_COST_SATS)} BSV to generate a font.`);
			return;
		}

		setError(null);
		// Clear parent's font state when starting new generation
		onClear?.();

		try {
			// Step 1: Process payment first
			setIsPaying(true);
			const paymentResult = await sendPayment(FEE_ADDRESS, FONT_GENERATION_COST_SATS);
			setIsPaying(false);

			if (!paymentResult) {
				throw new Error("Payment failed or was cancelled");
			}

			// Step 2: Start font generation with payment txid
			const response = await fetch("/api/generate-font", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt,
					model: selectedModel,
					paymentTxid: paymentResult.txid,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to start generation");
			}

			setJobId(data.jobId);
			localStorage.setItem(STORAGE_KEY, JSON.stringify({
				jobId: data.jobId,
				prompt,
				model: selectedModel,
				paymentTxid: paymentResult.txid,
				startedAt: Date.now(),
			}));

		} catch (err) {
			console.error("[AIGenerateTab] Error:", err);
			setError(err instanceof Error ? err.message : "Generation failed");
			setIsPaying(false);
		}
	};

	const handleReset = useCallback(() => {
		setJobId(null);
		setError(null);
		localStorage.removeItem(STORAGE_KEY);
		onClear?.();
	}, [onClear]);

	// Determine UI state
	const isGenerating = jobId !== null && statusData?.status !== "complete" && statusData?.status !== "failed";
	const progressStage = statusData?.status === "compiling" ? "COMPILING_FONT..." : "GENERATING_GLYPHS...";
	const hasFontReady = externalFont !== null && externalFont !== undefined;
	const isProcessing = isPaying || isSending || isGenerating;

	// When a font has been generated, show compact ready state with option to regenerate
	if (hasFontReady && !isGenerating) {
		return (
			<div className="rounded border border-primary/50 bg-primary/5">
				<div className="flex items-center justify-between border-b border-primary/30 px-3 py-2">
					<div className="flex items-center gap-2">
						<Sparkles className="h-4 w-4 text-primary" />
						<span className="font-mono text-xs text-primary">
							FONT_READY: {externalFont.name}
						</span>
					</div>
					<span className="font-mono text-[10px] text-muted-foreground">
						{externalFont.glyphs.length} glyphs
					</span>
				</div>
				<div className="space-y-3 p-3">
					{/* Compact stats */}
					<div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-muted-foreground">
						<span>Model: {externalFont.generatedBy}</span>
						<span>Cap: {externalFont.capHeight}</span>
						<span>x-Height: {externalFont.xHeight}</span>
					</div>

					{/* Compilation status */}
					{externalCompiled ? (
						<div className="flex items-center gap-2 rounded bg-green-500/10 px-2 py-1.5 font-mono text-[10px] text-green-600 dark:text-green-400">
							<span className="font-medium">WOFF2 COMPILED</span>
							<span className="text-muted-foreground">
								({(externalCompiled.woff2Size / 1024).toFixed(1)} KB)
							</span>
						</div>
					) : (
						<div className="flex items-center gap-2 rounded bg-yellow-500/10 px-2 py-1.5 font-mono text-[10px] text-yellow-600 dark:text-yellow-400">
							<span>SVG paths only (no WOFF2)</span>
						</div>
					)}

					{/* Regenerate option */}
					<Button
						variant="outline"
						size="sm"
						onClick={onClear}
						className="w-full gap-2 font-mono text-xs"
					>
						<RotateCcw className="h-3 w-3" />
						Generate New Font
					</Button>
				</div>
			</div>
		);
	}

	// Button content based on state
	const getButtonContent = () => {
		if (status === "not-installed") {
			return (
				<>
					<Wallet className="mr-2 h-4 w-4" />
					Install Yours Wallet
				</>
			);
		}

		if (!isConnected) {
			return (
				<>
					<Wallet className="mr-2 h-4 w-4" />
					Connect Wallet
				</>
			);
		}

		if (!hasEnoughBalance) {
			return (
				<>
					<Wallet className="mr-2 h-4 w-4" />
					Insufficient Balance
				</>
			);
		}

		if (isPaying || isSending) {
			return (
				<>
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					Processing Payment...
				</>
			);
		}

		if (isGenerating) {
			return (
				<>
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					GENERATING...
				</>
			);
		}

		return (
			<>
				<Wand2 className="mr-2 h-4 w-4" />
				[ GENERATE_FONT ] ({formatBsv(FONT_GENERATION_COST_SATS)} BSV)
			</>
		);
	};

	return (
		<div className="rounded border border-border bg-background">
			{/* Header */}
			<div className="border-b border-border px-3 py-2">
				<div className="flex items-center gap-2">
					<Sparkles className="h-4 w-4 text-yellow-500" />
					<span className="font-mono text-xs text-muted-foreground">
						// AI_FONT_GENERATION [BETA]
					</span>
				</div>
			</div>

			<div className="space-y-4 p-4">
				{/* Model Selection */}
				<div>
					<div className="mb-2 font-mono text-xs text-muted-foreground">
						MODEL:
					</div>
					<div className="grid grid-cols-2 gap-2">
						{AI_MODELS.map((model) => (
							<button
								key={model.id}
								type="button"
								onClick={() => handleModelChange(model.id)}
								disabled={isProcessing}
								className={`rounded border p-3 text-left transition-colors ${
									selectedModel === model.id
										? "border-primary bg-primary/10"
										: "border-border hover:border-primary/50"
								} ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
							>
								<div className="font-mono text-xs font-medium text-foreground">
									{model.name}
								</div>
								<div className="mt-1 font-mono text-[10px] text-muted-foreground">
									{model.description}
								</div>
							</button>
						))}
					</div>
				</div>

				{/* Style Presets */}
				<div>
					<div className="mb-2 font-mono text-xs text-muted-foreground">
						STYLE_PRESETS:
					</div>
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
						{STYLE_PRESETS.map((preset) => (
							<button
								key={preset.id}
								type="button"
								onClick={() => handlePresetClick(preset)}
								disabled={isProcessing}
								className={`rounded border px-3 py-2 text-left font-mono text-xs transition-colors ${
									selectedPreset === preset.id
										? "border-primary bg-primary/10 text-primary"
										: "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
								} ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
							>
								{preset.label}
							</button>
						))}
					</div>
				</div>

				{/* Custom Prompt */}
				<div>
					<div className="mb-2 font-mono text-xs text-muted-foreground">
						CUSTOM_PROMPT:
					</div>
					<textarea
						value={prompt}
						onChange={(e) => {
							handlePromptChange(e.target.value);
							handlePresetChange(null);
						}}
						disabled={isProcessing}
						placeholder="Describe your font style in detail... e.g., 'Elegant serif with tall ascenders, delicate hairlines, and subtle contrast between thick and thin strokes. Inspired by 18th century French typography.'"
						className="h-24 w-full resize-none rounded border border-border bg-transparent px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none disabled:opacity-50"
					/>
				</div>

				{/* Progress Bar */}
				{isGenerating && (
					<div className="space-y-2 rounded border border-border bg-muted/30 p-3">
						<div className="flex justify-between font-mono text-xs">
							<span className="text-primary">{progressStage}</span>
							<span className="tabular-nums text-muted-foreground animate-pulse">...</span>
						</div>
						<div className="h-1.5 overflow-hidden rounded-full bg-border">
							<div
								className="h-full bg-primary animate-pulse"
								style={{ width: statusData?.status === "compiling" ? "80%" : "40%" }}
							/>
						</div>
						<p className="font-mono text-[10px] text-muted-foreground">
							Generation continues in background. You can navigate away and return.
						</p>
					</div>
				)}

				{/* Error */}
				{error && (
					<div className="rounded border border-destructive/50 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
						ERROR: {error}
						<button
							type="button"
							onClick={handleReset}
							className="ml-2 underline hover:no-underline"
						>
							Dismiss
						</button>
					</div>
				)}

				{/* Balance info when connected */}
				{isConnected && balance && (
					<div className="rounded border border-border bg-muted/30 px-3 py-2 text-center font-mono text-xs text-muted-foreground">
						Balance: {formatBsv(balance.satoshis)} BSV
						{!hasEnoughBalance && (
							<span className="ml-2 text-destructive">
								(need {formatBsv(FONT_GENERATION_COST_SATS)} BSV)
							</span>
						)}
					</div>
				)}

				{/* Generate Button */}
				<Button
					onClick={handleGenerate}
					disabled={!prompt.trim() || isProcessing || (isConnected && !hasEnoughBalance)}
					className="w-full font-mono"
				>
					{getButtonContent()}
				</Button>

				{/* Info Note */}
				<div className="rounded border border-dashed border-border p-3 font-mono text-[10px] text-muted-foreground/70">
					<p className="mb-1 font-medium text-muted-foreground">How it works:</p>
					<ol className="list-inside list-decimal space-y-0.5">
						<li>AI analyzes your style description</li>
						<li>Generates SVG path data for each glyph</li>
						<li>You preview and approve the design</li>
						<li>Font is compiled and ready to inscribe</li>
					</ol>
					<p className="mt-2">Generation typically takes 30-90 seconds. You can navigate away and return.</p>
				</div>
			</div>
		</div>
	);
}

export type { GeneratedFont, CompiledFont };
