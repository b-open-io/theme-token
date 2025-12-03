"use client";

import { Loader2, Paperclip, Sparkles, Wallet, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { FEE_ADDRESS } from "@/lib/yours-wallet";
import type { ThemeToken } from "@theme-token/sdk";

// Types for font data (from ai-generate-tab)
export interface GeneratedFont {
	name: string;
	style: string;
	unitsPerEm: number;
	ascender: number;
	descender: number;
	capHeight: number;
	xHeight: number;
	glyphs: Array<{
		char: string;
		unicode: number;
		width: number;
		path: string;
	}>;
	generatedBy: string;
	generatedAt: string;
}

export interface CompiledFont {
	woff2Base64: string;
	otfBase64: string;
	woff2Size: number;
	otfSize: number;
	familyName: string;
	glyphCount: number;
}

type RemixType = "font" | "theme";
type ModelOption = "gemini" | "claude-opus-4.5";

// Pricing matrix: cost in satoshis by type and model
const MODEL_COSTS: Record<ModelOption, Record<RemixType, number>> = {
	gemini: {
		font: 10_000_000, // 0.1 BSV
		theme: 1_000_000, // 0.01 BSV
	},
	"claude-opus-4.5": {
		font: 50_000_000, // 0.5 BSV
		theme: 5_000_000, // 0.05 BSV
	},
};

const MODEL_LABELS: Record<ModelOption, string> = {
	gemini: "Gemini 3 Pro",
	"claude-opus-4.5": "Claude Opus 4.5",
};

interface UnifiedRemixDialogProps {
	isOpen: boolean;
	onClose: () => void;
	type: RemixType;
	// For fonts
	previousFont?: GeneratedFont;
	compiledFont?: CompiledFont;
	onFontRemixComplete?: (
		newFont: GeneratedFont,
		newCompiled?: CompiledFont,
	) => void;
	// For themes
	previousTheme?: ThemeToken;
	onThemeRemixComplete?: (theme: ThemeToken) => void;
}

type RemixState = "idle" | "paying" | "generating" | "compiling";

// Format satoshis as BSV
const formatBsv = (sats: number) => {
	const bsv = sats / 100_000_000;
	if (bsv < 0.01) return bsv.toFixed(5);
	if (bsv < 0.1) return bsv.toFixed(3);
	if (bsv < 1) return bsv.toFixed(2);
	return bsv.toFixed(1);
};

// Format bytes as human-readable
const formatBytes = (bytes: number): string => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function UnifiedRemixDialog({
	isOpen,
	onClose,
	type,
	previousFont,
	compiledFont,
	onFontRemixComplete,
	previousTheme,
	onThemeRemixComplete,
}: UnifiedRemixDialogProps) {
	const { status, connect, balance, sendPayment, isSending } = useYoursWallet();
	const [state, setState] = useState<RemixState>("idle");
	const [prompt, setPrompt] = useState("");
	const [model, setModel] = useState<ModelOption>("gemini");
	const [error, setError] = useState<string | null>(null);

	const isConnected = status === "connected";
	const currentCost = MODEL_COSTS[model][type];
	const hasEnoughBalance = (balance?.satoshis ?? 0) >= currentCost;
	const isProcessing = state !== "idle" || isSending;

	// Calculate attachment size
	const attachmentSize =
		type === "font" && previousFont
			? JSON.stringify({
					name: previousFont.name,
					style: previousFont.style,
					capHeight: previousFont.capHeight,
					xHeight: previousFont.xHeight,
					glyphs: previousFont.glyphs.map((g) => ({
						char: g.char,
						path: g.path,
						width: g.width,
					})),
				}).length
			: type === "theme" && previousTheme
				? JSON.stringify(previousTheme).length
				: 0;

	if (!isOpen) return null;

	const handleConnect = async () => {
		setError(null);
		try {
			await connect();
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to connect wallet";
			toast.error("Connection Failed", { description: message });
		}
	};

	const handleRemix = async () => {
		if (!isConnected) {
			await handleConnect();
			return;
		}

		if (!hasEnoughBalance) {
			toast.error("Insufficient Balance", {
				description: `You need at least ${formatBsv(currentCost)} BSV to remix.`,
			});
			return;
		}

		if (!prompt.trim()) {
			setError(
				`Please describe how you want to modify the ${type === "font" ? "font" : "theme"}`,
			);
			return;
		}

		setError(null);

		try {
			// Step 1: Process payment
			setState("paying");
			const paymentResult = await sendPayment(FEE_ADDRESS, currentCost);

			if (!paymentResult) {
				throw new Error("Payment failed or was cancelled");
			}

			const paymentTxid = paymentResult.txid;

			// Step 2: Generate remixed content
			setState("generating");

			if (type === "font" && previousFont && onFontRemixComplete) {
				// Font remix
				const response = await fetch("/api/generate-font", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						prompt: `Remix this font: ${prompt}`,
						model: model === "claude-opus-4.5" ? "claude-opus-4.5" : "gemini",
						paymentTxid,
						previousFont: {
							name: previousFont.name,
							style: previousFont.style,
							capHeight: previousFont.capHeight,
							xHeight: previousFont.xHeight,
							glyphs: previousFont.glyphs.map((g) => ({
								char: g.char,
								path: g.path,
								width: g.width,
							})),
						},
					}),
				});

				if (!response.ok) {
					const data = await response.json();
					throw new Error(data.error || "Failed to generate font");
				}

				const data = await response.json();

				// Step 3: Compile the font
				setState("compiling");

				const compileResponse = await fetch("/api/compile-font", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data.font),
				});

				let newCompiledFont: CompiledFont | undefined;

				if (compileResponse.ok) {
					const compileData = await compileResponse.json();
					newCompiledFont = {
						woff2Base64: compileData.woff2.base64,
						otfBase64: compileData.otf.base64,
						woff2Size: compileData.woff2.size,
						otfSize: compileData.otf.size,
						familyName: compileData.metadata.familyName,
						glyphCount: compileData.metadata.glyphCount,
					};
				}

				toast.success("Font Remixed", {
					description: `Your font "${data.font.name}" has been remixed!`,
				});

				onFontRemixComplete(data.font, newCompiledFont);
			} else if (type === "theme" && previousTheme && onThemeRemixComplete) {
				// Theme remix
				const response = await fetch("/api/generate-theme", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						prompt: `Remix this theme: ${prompt}`,
						model: model === "claude-opus-4.5" ? "claude-opus-4.5" : "gemini",
						paymentTxid,
						previousTheme,
					}),
				});

				if (!response.ok) {
					const data = await response.json();
					throw new Error(data.error || "Failed to generate theme");
				}

				const data = await response.json();

				toast.success("Theme Remixed", {
					description: `Your theme "${data.theme.name}" has been remixed!`,
				});

				onThemeRemixComplete(data.theme);
			}

			onClose();
		} catch (err) {
			console.error("Remix failed:", err);
			const message =
				err instanceof Error ? err.message : "Remix failed. Please try again.";
			toast.error("Remix Failed", { description: message });
			setError(message);
		} finally {
			setState("idle");
		}
	};

	const getButtonContent = () => {
		if (status === "not-installed") {
			return (
				<>
					<Wallet className="h-4 w-4" />
					Install Yours Wallet
				</>
			);
		}

		if (!isConnected) {
			return (
				<>
					<Wallet className="h-4 w-4" />
					Connect Wallet
				</>
			);
		}

		if (!hasEnoughBalance) {
			return (
				<>
					<Wallet className="h-4 w-4" />
					Insufficient Balance
				</>
			);
		}

		if (state === "paying" || isSending) {
			return (
				<>
					<Loader2 className="h-4 w-4 animate-spin" />
					Processing Payment...
				</>
			);
		}

		if (state === "generating") {
			return (
				<>
					<Loader2 className="h-4 w-4 animate-spin" />
					Generating Remix...
				</>
			);
		}

		if (state === "compiling") {
			return (
				<>
					<Loader2 className="h-4 w-4 animate-spin" />
					Compiling...
				</>
			);
		}

		return (
			<>
				<Sparkles className="h-4 w-4" />
				Pay & Remix ({formatBsv(currentCost)} BSV)
			</>
		);
	};

	const typeLabel = type === "font" ? "Font" : "Theme";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-md rounded-lg border border-border bg-background shadow-xl">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-border px-4 py-3">
					<h2 className="font-mono text-sm font-medium">
						// REMIX_{type.toUpperCase()}
					</h2>
					<button
						type="button"
						onClick={onClose}
						disabled={isProcessing}
						className="text-muted-foreground hover:text-foreground disabled:opacity-50"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Content */}
				<div className="space-y-4 p-4">
					{/* Prompt Input */}
					<div>
						<label className="mb-2 block font-mono text-xs text-muted-foreground">
							Describe how to modify this {typeLabel.toLowerCase()}:
						</label>
						<textarea
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							placeholder={
								type === "font"
									? "e.g., Make it bolder with rounded corners..."
									: "e.g., Make it darker with more vibrant accent colors..."
							}
							disabled={isProcessing}
							className="h-24 w-full resize-none rounded border border-border bg-transparent px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none disabled:opacity-50"
						/>
					</div>

					{/* Attachment Badge */}
					{attachmentSize > 0 && (
						<div className="flex items-center gap-2 rounded border border-dashed border-primary/50 bg-primary/5 px-3 py-2">
							<Paperclip className="h-4 w-4 text-primary" />
							<span className="font-mono text-xs text-primary">
								Previous {typeLabel.toLowerCase()} attached:{" "}
								{formatBytes(attachmentSize)}
							</span>
						</div>
					)}

					{/* Model Selector */}
					<div className="space-y-2">
						<label className="font-mono text-xs text-muted-foreground">
							Model:
						</label>
						<RadioGroup
							value={model}
							onValueChange={(v) => setModel(v as ModelOption)}
							disabled={isProcessing}
							className="space-y-2"
						>
							{(["gemini", "claude-opus-4.5"] as const).map((modelOption) => (
								<div
									key={modelOption}
									className="flex items-center space-x-3 rounded border border-border px-3 py-2 hover:bg-muted/50"
								>
									<RadioGroupItem value={modelOption} id={modelOption} />
									<Label
										htmlFor={modelOption}
										className="flex flex-1 cursor-pointer items-center justify-between"
									>
										<span className="font-mono text-xs">
											{MODEL_LABELS[modelOption]}
										</span>
										<span className="font-mono text-xs text-muted-foreground">
											{formatBsv(MODEL_COSTS[modelOption][type])} BSV
										</span>
									</Label>
								</div>
							))}
						</RadioGroup>
					</div>

					{/* Preview Info */}
					{type === "font" && previousFont && (
						<div className="rounded border border-border bg-muted/30 p-3 font-mono text-[10px]">
							<div className="grid grid-cols-2 gap-1 text-muted-foreground">
								<span>Original:</span>
								<span className="text-foreground">{previousFont.name}</span>
								<span>Style:</span>
								<span className="text-foreground">{previousFont.style}</span>
								<span>Glyphs:</span>
								<span className="text-foreground">
									{previousFont.glyphs.length}
								</span>
								{compiledFont && (
									<>
										<span>Compiled:</span>
										<span className="text-primary">
											{formatBytes(compiledFont.woff2Size)} WOFF2
										</span>
									</>
								)}
							</div>
						</div>
					)}

					{type === "theme" && previousTheme && (
						<div className="rounded border border-border bg-muted/30 p-3 font-mono text-[10px]">
							<div className="grid grid-cols-2 gap-1 text-muted-foreground">
								<span>Original:</span>
								<span className="text-foreground">{previousTheme.name}</span>
								<span>Modes:</span>
								<span className="text-foreground">
									{Object.keys(previousTheme.styles).join(", ")}
								</span>
							</div>
						</div>
					)}

					{/* Error Message */}
					{error && (
						<div className="rounded border border-destructive/50 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
							{error}
						</div>
					)}

					{/* Balance Info */}
					{isConnected && balance && (
						<div className="text-center font-mono text-xs text-muted-foreground">
							Balance: {formatBsv(balance.satoshis)} BSV
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="border-t border-border px-4 py-3">
					<div className="flex items-center justify-between gap-4">
						<span className="font-mono text-xs text-muted-foreground">
							Cost: {formatBsv(currentCost)} BSV
						</span>
						<Button
							onClick={handleRemix}
							disabled={isProcessing || (isConnected && !hasEnoughBalance)}
							className="gap-2 font-mono text-xs"
						>
							{getButtonContent()}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
