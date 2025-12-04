"use client";

import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { UnifiedRemixDialog } from "@/components/market/unified-remix-dialog";

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

export function AIGenerateTab({ onFontGenerated }: AIGenerateTabProps) {
	const [selectedModel, setSelectedModel] = useState<AIModel>("gemini-3-pro");
	const [prompt, setPrompt] = useState("");
	const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
	const [jobId, setJobId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [generatedFont, setGeneratedFont] = useState<GeneratedFont | null>(null);
	const [compiledFont, setCompiledFont] = useState<CompiledFont | null>(null);
	const [showRemixDialog, setShowRemixDialog] = useState(false);

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

	// Handle status updates from polling
	useEffect(() => {
		if (!statusData) return;

		// Treat both "complete" and "compiling with font data" as complete
		// (compilation is optional - if it fails, we still have the font)
		const hasFont = statusData.font !== undefined;
		const isComplete = statusData.status === "complete";
		const isCompilingWithFont = statusData.status === "compiling" && hasFont;

		if ((isComplete || isCompilingWithFont) && statusData.font) {
			setGeneratedFont(statusData.font);
			if (statusData.compiled) {
				setCompiledFont(statusData.compiled);
			}
			// Clear localStorage on completion
			localStorage.removeItem(STORAGE_KEY);
			setJobId(null); // Stop polling
		} else if (statusData.status === "failed") {
			setError(statusData.error || "Generation failed");
			setJobId(null);
			localStorage.removeItem(STORAGE_KEY);
		} else if (statusData.status === "not_found") {
			// Stale localStorage - clear it
			setJobId(null);
			localStorage.removeItem(STORAGE_KEY);
		}
	}, [statusData]);

	const handlePresetClick = (preset: typeof STYLE_PRESETS[0]) => {
		setSelectedPreset(preset.id);
		setPrompt(preset.prompt);
	};

	const handleGenerate = async () => {
		if (!prompt.trim()) return;

		setError(null);
		setGeneratedFont(null);
		setCompiledFont(null);

		try {
			// Start generation - server returns jobId immediately
			const response = await fetch("/api/generate-font", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt,
					model: selectedModel,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to start generation");
			}

			// Store jobId in state and localStorage
			setJobId(data.jobId);
			localStorage.setItem(STORAGE_KEY, JSON.stringify({
				jobId: data.jobId,
				prompt,
				model: selectedModel,
				startedAt: Date.now(),
			}));

		} catch (err) {
			console.error("[AIGenerateTab] Error:", err);
			setError(err instanceof Error ? err.message : "Generation failed");
		}
	};

	const handleUseFont = () => {
		if (generatedFont) {
			onFontGenerated(generatedFont, compiledFont ?? undefined);
		}
	};

	const handleReset = useCallback(() => {
		setGeneratedFont(null);
		setCompiledFont(null);
		setJobId(null);
		setError(null);
		localStorage.removeItem(STORAGE_KEY);
	}, []);

	const handleRemixComplete = (newFont: GeneratedFont, newCompiled?: CompiledFont) => {
		setGeneratedFont(newFont);
		setCompiledFont(newCompiled ?? null);
		setShowRemixDialog(false);
	};

	// Determine UI state
	const isGenerating = jobId !== null && statusData?.status !== "complete" && statusData?.status !== "failed";
	const progressStage = statusData?.status === "compiling" ? "COMPILING_FONT..." : "GENERATING_GLYPHS...";

	// If we have a generated font, show preview
	if (generatedFont) {
		return (
			<div className="rounded border border-border bg-background">
				<div className="border-b border-border px-3 py-2">
					<div className="flex items-center justify-between">
						<span className="font-mono text-xs text-primary">
							// FONT_GENERATED: {generatedFont.name}
						</span>
						<span className="font-mono text-[10px] text-muted-foreground">
							{generatedFont.glyphs.length} glyphs
						</span>
					</div>
				</div>

				<div className="p-4 space-y-4">
					{/* Glyph Preview Grid */}
					<div>
						<div className="mb-2 font-mono text-xs text-muted-foreground">
							GLYPH_PREVIEW:
						</div>
						<div className="grid grid-cols-8 gap-1 rounded border border-border bg-black p-2">
							{generatedFont.glyphs.slice(0, 32).map((glyph, i) => (
								<div
									key={i}
									className="aspect-square flex items-center justify-center"
									title={`${glyph.char} (U+${glyph.unicode.toString(16).toUpperCase()})`}
								>
									<svg
										viewBox={`0 0 ${glyph.width} 1000`}
										className="h-6 w-6"
										style={{ transform: "scaleY(-1)" }}
									>
										<path
											d={glyph.path}
											fill="white"
										/>
									</svg>
								</div>
							))}
						</div>
						{generatedFont.glyphs.length > 32 && (
							<div className="mt-1 font-mono text-[10px] text-muted-foreground text-center">
								+{generatedFont.glyphs.length - 32} more glyphs
							</div>
						)}
					</div>

					{/* Sample Text Preview */}
					<div>
						<div className="mb-2 font-mono text-xs text-muted-foreground">
							SAMPLE_TEXT:
						</div>
						<div className="rounded border border-border bg-black p-4 overflow-x-auto">
							<svg viewBox="0 0 800 100" className="w-full h-16">
								{renderTextAsSvg(generatedFont, "Hello World", 50, 70)}
							</svg>
						</div>
					</div>

					{/* Font Metrics */}
					<div className="grid grid-cols-2 gap-2 font-mono text-xs">
						<div className="text-muted-foreground">Style:</div>
						<div>{generatedFont.style}</div>
						<div className="text-muted-foreground">Cap Height:</div>
						<div>{generatedFont.capHeight}</div>
						<div className="text-muted-foreground">x-Height:</div>
						<div>{generatedFont.xHeight}</div>
						<div className="text-muted-foreground">Generated by:</div>
						<div>{generatedFont.generatedBy}</div>
						{compiledFont && (
							<>
								<div className="text-muted-foreground">WOFF2 Size:</div>
								<div className="text-primary">{formatBytes(compiledFont.woff2Size)}</div>
								<div className="text-muted-foreground">OTF Size:</div>
								<div>{formatBytes(compiledFont.otfSize)}</div>
							</>
						)}
					</div>

					{/* Compilation Status */}
					{compiledFont ? (
						<div className="flex items-center gap-2 rounded border border-primary/50 bg-primary/10 px-3 py-2 font-mono text-xs text-primary">
							<span className="h-2 w-2 rounded-full bg-primary" />
							COMPILED: Real WOFF2 font ready for inscription
						</div>
					) : (
						<div className="flex items-center gap-2 rounded border border-yellow-500/50 bg-yellow-500/10 px-3 py-2 font-mono text-xs text-yellow-500">
							<span className="h-2 w-2 rounded-full bg-yellow-500" />
							SVG Preview Only - Compilation failed
						</div>
					)}

					{/* Actions */}
					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={() => setShowRemixDialog(true)}
							className="flex-1 font-mono text-xs"
						>
							[ REMIX ]
						</Button>
						<Button
							onClick={handleUseFont}
							className="flex-1 font-mono text-xs"
						>
							[ USE_THIS_FONT ]
						</Button>
					</div>
				</div>

				{/* Remix Dialog */}
				<UnifiedRemixDialog
					isOpen={showRemixDialog}
					onClose={() => setShowRemixDialog(false)}
					type="font"
					previousFont={generatedFont}
					compiledFont={compiledFont ?? undefined}
					onFontRemixComplete={handleRemixComplete}
				/>
			</div>
		);
	}

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
								onClick={() => setSelectedModel(model.id)}
								disabled={isGenerating}
								className={`rounded border p-3 text-left transition-colors ${
									selectedModel === model.id
										? "border-primary bg-primary/10"
										: "border-border hover:border-primary/50"
								} ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
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
								disabled={isGenerating}
								className={`rounded border px-3 py-2 text-left font-mono text-xs transition-colors ${
									selectedPreset === preset.id
										? "border-primary bg-primary/10 text-primary"
										: "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
								} ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
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
							setPrompt(e.target.value);
							setSelectedPreset(null);
						}}
						disabled={isGenerating}
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

				{/* Generate Button */}
				<Button
					onClick={handleGenerate}
					disabled={!prompt.trim() || isGenerating}
					className="w-full font-mono"
				>
					{isGenerating ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							GENERATING...
						</>
					) : (
						<>
							<Wand2 className="mr-2 h-4 w-4" />
							[ GENERATE_FONT ]
						</>
					)}
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

// Helper to render text as SVG using glyph paths
function renderTextAsSvg(font: GeneratedFont, text: string, x: number, y: number) {
	const glyphMap = new Map(font.glyphs.map(g => [g.char, g]));
	const elements: React.ReactNode[] = [];
	let currentX = x;

	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		const glyph = glyphMap.get(char);

		if (glyph) {
			// Scale down from 1000 units to display size
			const scale = 0.08;
			elements.push(
				<g
					key={i}
					transform={`translate(${currentX}, ${y}) scale(${scale}, -${scale})`}
				>
					<path d={glyph.path} fill="white" />
				</g>
			);
			currentX += glyph.width * scale;
		} else {
			// Space or unknown character
			currentX += 30;
		}
	}

	return elements;
}

// Helper to format bytes as human-readable
function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type { GeneratedFont, CompiledFont };
