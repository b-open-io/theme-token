"use client";

import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ThemeToken } from "@theme-token/sdk";
import { Button } from "@/components/ui/button";
import { storeRemixTheme } from "@/components/theme-gallery";
import type { FilterState } from "./filter-sidebar";

interface GenerateCardProps {
	filters: FilterState;
}

const STYLE_PRESETS = [
	{ id: "modern", label: "Modern", description: "Clean and minimal" },
	{ id: "vibrant", label: "Vibrant", description: "Bold and colorful" },
	{ id: "corporate", label: "Corporate", description: "Professional" },
	{ id: "playful", label: "Playful", description: "Fun and friendly" },
	{ id: "dark-elegant", label: "Elegant", description: "Sophisticated" },
];

export function GenerateCard({ filters }: GenerateCardProps) {
	const router = useRouter();
	const [isGenerating, setIsGenerating] = useState(false);
	const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
	const [customPrompt, setCustomPrompt] = useState("");
	const [showAdvanced, setShowAdvanced] = useState(false);

	const hasFilters =
		filters.primaryColor !== null ||
		filters.radius !== null ||
		filters.fontTypes.length > 0;

	const handleGenerate = async () => {
		setIsGenerating(true);
		try {
			const response = await fetch("/api/generate-theme", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: customPrompt || (selectedStyle ? `Generate a ${selectedStyle} style theme` : undefined),
					primaryColor: filters.primaryColor
						? `oklch(${filters.primaryColor.l.toFixed(3)} ${filters.primaryColor.c.toFixed(3)} ${filters.primaryColor.h.toFixed(1)})`
						: undefined,
					radius: filters.radius,
					style: selectedStyle,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to generate theme");
			}

			const data = await response.json();
			const theme = data.theme as ThemeToken;

			// Store the theme and navigate to studio
			storeRemixTheme(theme);
			router.push("/studio");
		} catch (error) {
			console.error("Generation failed:", error);
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<div className="flex h-full min-h-[280px] flex-col rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-5">
			{/* Header */}
			<div className="mb-4 flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<Wand2 className="h-5 w-5 text-primary" />
				</div>
				<div>
					<h3 className="font-semibold">Generate with AI</h3>
					<p className="text-xs text-muted-foreground">
						Powered by Gemini
					</p>
				</div>
			</div>

			{/* Show active filters */}
			{hasFilters && (
				<div className="mb-4 space-y-1.5 rounded-lg bg-muted/50 p-3">
					<p className="text-xs font-medium text-muted-foreground">
						Generating with your filters:
					</p>
					{filters.primaryColor && (
						<div className="flex items-center gap-2 text-xs">
							<div
								className="h-3 w-3 rounded-full border"
								style={{
									backgroundColor: `oklch(${filters.primaryColor.l} ${filters.primaryColor.c} ${filters.primaryColor.h})`,
								}}
							/>
							<span>Custom primary color</span>
						</div>
					)}
					{filters.radius && (
						<p className="text-xs">
							<span className="font-mono text-primary">{filters.radius}</span> radius
						</p>
					)}
					{filters.fontTypes.length > 0 && (
						<p className="text-xs">{filters.fontTypes.join(", ")} fonts</p>
					)}
				</div>
			)}

			{/* Style presets */}
			<div className="mb-4 flex flex-wrap gap-1.5">
				{STYLE_PRESETS.map((preset) => (
					<button
						key={preset.id}
						type="button"
						onClick={() => setSelectedStyle(selectedStyle === preset.id ? null : preset.id)}
						className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
							selectedStyle === preset.id
								? "bg-primary text-primary-foreground"
								: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
						}`}
						title={preset.description}
					>
						{preset.label}
					</button>
				))}
			</div>

			{/* Advanced toggle */}
			<button
				type="button"
				onClick={() => setShowAdvanced(!showAdvanced)}
				className="mb-2 text-left text-xs text-muted-foreground hover:text-foreground"
			>
				{showAdvanced ? "Hide" : "Show"} custom prompt
			</button>

			{/* Custom prompt input */}
			{showAdvanced && (
				<textarea
					value={customPrompt}
					onChange={(e) => setCustomPrompt(e.target.value)}
					placeholder="Describe your ideal theme... (e.g., 'A warm, cozy theme inspired by autumn colors')"
					className="mb-4 h-20 w-full resize-none rounded-lg border border-border bg-background p-2 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
				/>
			)}

			{/* Generate button */}
			<div className="mt-auto">
				<Button
					onClick={handleGenerate}
					disabled={isGenerating}
					className="w-full gap-2"
					size="sm"
				>
					{isGenerating ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Generating...
						</>
					) : (
						<>
							<Sparkles className="h-4 w-4" />
							Generate Theme
						</>
					)}
				</Button>
				<p className="mt-2 text-center text-[10px] text-muted-foreground">
					Free during beta
				</p>
			</div>
		</div>
	);
}
