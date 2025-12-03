"use client";

import { Sparkles, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ThemeToken } from "@theme-token/sdk";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ai-elements/loader";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { storeRemixTheme } from "@/components/theme-gallery";
import type { FilterState } from "./filter-sidebar";

interface GenerateCardProps {
	filters: FilterState;
}

const STYLE_SUGGESTIONS = [
	{ id: "modern", label: "Modern & Minimal" },
	{ id: "vibrant", label: "Bold & Vibrant" },
	{ id: "corporate", label: "Professional" },
	{ id: "playful", label: "Fun & Playful" },
	{ id: "dark-elegant", label: "Dark Elegant" },
	{ id: "nature", label: "Nature Inspired" },
];

export function GenerateCard({ filters }: GenerateCardProps) {
	const router = useRouter();
	const [isGenerating, setIsGenerating] = useState(false);
	const [prompt, setPrompt] = useState("");
	const [error, setError] = useState<string | null>(null);

	const hasFilters =
		filters.primaryColor !== null ||
		filters.radius !== null ||
		filters.fontTypes.length > 0;

	const handleGenerate = async (stylePrompt?: string) => {
		setIsGenerating(true);
		setError(null);

		const finalPrompt = stylePrompt || prompt || "Generate a modern, professional theme";

		try {
			const response = await fetch("/api/generate-theme", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: finalPrompt,
					primaryColor: filters.primaryColor
						? `oklch(${filters.primaryColor.l.toFixed(3)} ${filters.primaryColor.c.toFixed(3)} ${filters.primaryColor.h.toFixed(1)})`
						: undefined,
					radius: filters.radius,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Failed to generate theme");
			}

			const data = await response.json();
			const theme = data.theme as ThemeToken;

			// Store the theme and navigate to studio
			storeRemixTheme(theme);
			router.push("/studio");
		} catch (err) {
			console.error("Generation failed:", err);
			setError(err instanceof Error ? err.message : "Generation failed");
		} finally {
			setIsGenerating(false);
		}
	};

	const handleSuggestionClick = (suggestion: string) => {
		handleGenerate(`Generate a ${suggestion.toLowerCase()} style theme`);
	};

	return (
		<div className="flex h-full min-h-[280px] flex-col rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-5">
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
						Using your filters:
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

			{/* Quick style suggestions */}
			<div className="mb-4">
				<p className="mb-2 text-xs font-medium text-muted-foreground">Quick styles</p>
				<Suggestions>
					{STYLE_SUGGESTIONS.map((style) => (
						<Suggestion
							key={style.id}
							suggestion={style.label}
							onClick={handleSuggestionClick}
							disabled={isGenerating}
							className="text-xs"
						/>
					))}
				</Suggestions>
			</div>

			{/* Custom prompt input */}
			<div className="mb-4">
				<textarea
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					placeholder="Or describe your ideal theme..."
					disabled={isGenerating}
					className="h-16 w-full resize-none rounded-lg border border-border bg-background p-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
				/>
			</div>

			{/* Error message */}
			{error && (
				<div className="mb-3 rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
					{error}
				</div>
			)}

			{/* Generate button */}
			<div className="mt-auto">
				<Button
					onClick={() => handleGenerate()}
					disabled={isGenerating}
					className="w-full gap-2"
					size="sm"
				>
					{isGenerating ? (
						<>
							<Loader size={16} />
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
