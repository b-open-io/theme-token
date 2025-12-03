"use client";

import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { FontFile } from "@/app/market/fonts/page";

interface AIGenerateTabProps {
	onFontGenerated: (file: FontFile) => void;
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

export function AIGenerateTab({ onFontGenerated }: AIGenerateTabProps) {
	const [selectedModel, setSelectedModel] = useState<AIModel>("gemini-3-pro");
	const [prompt, setPrompt] = useState("");
	const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [progress, setProgress] = useState(0);
	const [progressStage, setProgressStage] = useState("");
	const [error, setError] = useState<string | null>(null);

	const handlePresetClick = (preset: typeof STYLE_PRESETS[0]) => {
		setSelectedPreset(preset.id);
		setPrompt(preset.prompt);
	};

	const handleGenerate = async () => {
		if (!prompt.trim()) return;

		setIsGenerating(true);
		setError(null);
		setProgress(0);
		setProgressStage("INITIALIZING...");

		try {
			// Simulated progress stages for font generation pipeline
			const stages = [
				{ progress: 10, stage: "ANALYZING_PROMPT..." },
				{ progress: 25, stage: "GENERATING_GLYPH_DESIGNS..." },
				{ progress: 45, stage: "VECTORIZING_LETTERFORMS..." },
				{ progress: 60, stage: "COMPUTING_KERNING_PAIRS..." },
				{ progress: 75, stage: "BUILDING_FONT_TABLES..." },
				{ progress: 90, stage: "COMPILING_WOFF2..." },
			];

			// Start progress animation
			let currentStageIndex = 0;
			const progressInterval = setInterval(() => {
				if (currentStageIndex < stages.length) {
					setProgress(stages[currentStageIndex].progress);
					setProgressStage(stages[currentStageIndex].stage);
					currentStageIndex++;
				}
			}, 800);

			// Call the AI font generation API
			const response = await fetch("/api/generate-font", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt,
					model: selectedModel,
				}),
			});

			clearInterval(progressInterval);

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Failed to generate font");
			}

			setProgress(95);
			setProgressStage("FINALIZING...");

			// Get the font file from response
			const blob = await response.blob();
			const fontName = `ai-${selectedModel.split("-")[0]}-${Date.now()}.woff2`;
			const file = new File([blob], fontName, {
				type: "application/font-woff2",
			});

			setProgress(100);
			setProgressStage("COMPLETE");

			// Add to files
			onFontGenerated({
				file,
				name: fontName,
				size: file.size,
				weight: 400,
				style: "normal",
			});

		} catch (err) {
			console.error("[AIGenerateTab] Error:", err);
			setError(err instanceof Error ? err.message : "Generation failed");
		} finally {
			setIsGenerating(false);
			setProgress(0);
			setProgressStage("");
		}
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
								onClick={() => setSelectedModel(model.id)}
								className={`rounded border p-3 text-left transition-colors ${
									selectedModel === model.id
										? "border-primary bg-primary/10"
										: "border-border hover:border-primary/50"
								}`}
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
								className={`rounded border px-3 py-2 text-left font-mono text-xs transition-colors ${
									selectedPreset === preset.id
										? "border-primary bg-primary/10 text-primary"
										: "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
								}`}
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
						placeholder="Describe your font style in detail... e.g., 'Elegant serif with tall ascenders, delicate hairlines, and subtle contrast between thick and thin strokes. Inspired by 18th century French typography.'"
						className="h-24 w-full resize-none rounded border border-border bg-transparent px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
					/>
				</div>

				{/* Progress Bar */}
				{isGenerating && (
					<div className="space-y-2 rounded border border-border bg-muted/30 p-3">
						<div className="flex justify-between font-mono text-xs">
							<span className="text-primary">{progressStage}</span>
							<span className="tabular-nums text-muted-foreground">{progress}%</span>
						</div>
						<div className="h-1.5 overflow-hidden rounded-full bg-border">
							<div
								className="h-full bg-primary transition-all duration-500"
								style={{ width: `${progress}%` }}
							/>
						</div>
					</div>
				)}

				{/* Error */}
				{error && (
					<div className="rounded border border-destructive/50 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
						ERROR: {error}
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
						<li>Generates SVG glyphs for each character</li>
						<li>Computes optimal kerning pairs</li>
						<li>Compiles into WOFF2 format</li>
					</ol>
					<p className="mt-2">Generation typically takes 30-90 seconds.</p>
				</div>
			</div>
		</div>
	);
}
