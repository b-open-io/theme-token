"use client";

import { Sparkles, Wand2, Wallet, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { ThemeToken } from "@theme-token/sdk";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ai-elements/loader";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { storeRemixTheme } from "@/components/theme-gallery";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { AI_GENERATION_COST_SATS, FEE_ADDRESS } from "@/lib/yours-wallet";
import type { FilterState } from "./filter-sidebar";

const GENERATION_TIMEOUT_MS = 90_000; // 90 second timeout (AI can be slow)
const PENDING_PAYMENT_KEY = "theme:pendingPayment";

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

// Format satoshis as BSV
const formatBsv = (sats: number) => {
	const bsv = sats / 100_000_000;
	// Show more decimals for small amounts
	if (bsv < 0.01) return bsv.toFixed(5);
	if (bsv < 1) return bsv.toFixed(2);
	return bsv.toFixed(1);
};

type GenerationState = "idle" | "paying" | "generating";

interface PendingPayment {
	txid: string;
	prompt: string;
	filters: FilterState;
	timestamp: number;
}

function loadPendingPayment(): PendingPayment | null {
	if (typeof window === "undefined") return null;
	try {
		const stored = localStorage.getItem(PENDING_PAYMENT_KEY);
		if (!stored) return null;
		const data = JSON.parse(stored) as PendingPayment;
		// Expire after 1 hour
		if (Date.now() - data.timestamp > 60 * 60 * 1000) {
			localStorage.removeItem(PENDING_PAYMENT_KEY);
			return null;
		}
		return data;
	} catch {
		return null;
	}
}

function savePendingPayment(payment: PendingPayment) {
	localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(payment));
}

function clearPendingPayment() {
	localStorage.removeItem(PENDING_PAYMENT_KEY);
}

export function GenerateCard({ filters }: GenerateCardProps) {
	const router = useRouter();
	const { status, connect, balance, sendPayment, isSending } = useYoursWallet();
	const [state, setState] = useState<GenerationState>("idle");
	const [prompt, setPrompt] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
	const [showRecovery, setShowRecovery] = useState(false);
	const [recoveryTxid, setRecoveryTxid] = useState("");

	// Check for pending payment on mount
	useEffect(() => {
		const pending = loadPendingPayment();
		if (pending) {
			setPendingPayment(pending);
			setPrompt(pending.prompt);
		}
	}, []);

	const isConnected = status === "connected";
	const hasEnoughBalance = (balance?.satoshis ?? 0) >= AI_GENERATION_COST_SATS;
	const isProcessing = state !== "idle" || isSending;

	const hasFilters =
		filters.primaryColor !== null ||
		filters.radius !== null ||
		filters.fontTypes.length > 0;

	const handleConnect = async () => {
		setError(null);
		try {
			await connect();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to connect wallet";
			toast.error("Connection Failed", { description: message });
		}
	};

	const handleGenerate = async (stylePrompt?: string, existingTxid?: string) => {
		if (!isConnected) {
			await handleConnect();
			return;
		}

		const DEV_BYPASS_PAYMENT = false;

		// Skip balance check if we have an existing payment to retry
		if (!existingTxid && !DEV_BYPASS_PAYMENT && !hasEnoughBalance) {
			toast.error("Insufficient Balance", {
				description: `You need at least ${formatBsv(AI_GENERATION_COST_SATS)} BSV to generate a theme.`,
			});
			return;
		}

		setError(null);
		const finalPrompt = stylePrompt || prompt || "Generate a modern, professional theme";

		// Create abort controller for timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

		try {
			let paymentTxid = existingTxid || "dev-test-bypass";

			if (!existingTxid && !DEV_BYPASS_PAYMENT) {
				// Step 1: Process payment
				setState("paying");
				const paymentResult = await sendPayment(FEE_ADDRESS, AI_GENERATION_COST_SATS);

				if (!paymentResult) {
					throw new Error("Payment failed or was cancelled");
				}
				paymentTxid = paymentResult.txid;

				// Save payment info BEFORE calling API so we can recover on failure
				savePendingPayment({
					txid: paymentTxid,
					prompt: finalPrompt,
					filters,
					timestamp: Date.now(),
				});
				setPendingPayment({ txid: paymentTxid, prompt: finalPrompt, filters, timestamp: Date.now() });
			}

			// Step 2: Generate theme
			setState("generating");

			const response = await fetch("/api/generate-theme", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: finalPrompt,
					primaryColor: filters.primaryColor
						? `oklch(${filters.primaryColor.l.toFixed(3)} ${filters.primaryColor.c.toFixed(3)} ${filters.primaryColor.h.toFixed(1)})`
						: undefined,
					radius: filters.radius,
					paymentTxid,
				}),
				signal: controller.signal,
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Failed to generate theme");
			}

			const data = await response.json();
			const theme = data.theme as ThemeToken;

			// Success! Clear pending payment
			clearPendingPayment();
			setPendingPayment(null);

			// Store the theme with AI generation metadata and navigate to studio
			storeRemixTheme(theme, {
				source: "ai-generate",
				txid: paymentTxid,
			});
			router.push("/studio");
		} catch (err) {
			console.error("Generation failed:", err);

			let message = "Generation failed. Please try again.";
			// Check localStorage directly since state might not be updated yet
			const hasPending = loadPendingPayment() !== null;
			
			if (err instanceof Error) {
				if (err.name === "AbortError") {
					message = "Request timed out. The AI service may be busy.";
					// Don't clear pending payment on timeout - user can retry
					if (hasPending) {
						message += " Your payment was saved - click 'Retry' to try again without paying.";
					}
				} else {
					message = err.message;
				}
			}

			toast.error("Generation Failed", { description: message });
			setError(message);
			
			// Refresh pending payment state from localStorage
			setPendingPayment(loadPendingPayment());
		} finally {
			clearTimeout(timeoutId);
			setState("idle");
		}
	};

	const handleRetry = () => {
		if (pendingPayment) {
			handleGenerate(pendingPayment.prompt, pendingPayment.txid);
		}
	};

	const handleDismissPending = () => {
		clearPendingPayment();
		setPendingPayment(null);
		setError(null);
	};

	const handleManualRecovery = () => {
		const txid = recoveryTxid.trim();
		if (!txid || txid.length < 60) {
			toast.error("Invalid TXID", { description: "Please enter a valid transaction ID" });
			return;
		}
		// Use the current prompt or a default
		const recoveryPrompt = prompt || "Generate a modern, professional theme";
		handleGenerate(recoveryPrompt, txid);
		setShowRecovery(false);
		setRecoveryTxid("");
	};

	const handleSuggestionClick = (suggestion: string) => {
		handleGenerate(`Generate a ${suggestion.toLowerCase()} style theme`);
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
					<Loader size={16} />
					Processing Payment...
				</>
			);
		}

		if (state === "generating") {
			return (
				<>
					<Loader size={16} />
					Generating Theme...
				</>
			);
		}

		return (
			<>
				<Sparkles className="h-4 w-4" />
				Generate ({formatBsv(AI_GENERATION_COST_SATS)} BSV)
			</>
		);
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
							disabled={isProcessing || !isConnected || !hasEnoughBalance}
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
					disabled={isProcessing}
					className="h-16 w-full resize-none rounded-lg border border-border bg-background p-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
				/>
			</div>

			{/* Pending payment recovery - subtle but actionable */}
			{pendingPayment && (
				<div className="mb-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
					<div className="flex items-start justify-between gap-2">
						<div className="flex-1">
							<p className="text-xs font-medium">
								Resume generation?
							</p>
							<p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
								{pendingPayment.txid.slice(0, 12)}...
							</p>
						</div>
						<div className="flex items-center gap-1">
							<Button
								size="sm"
								onClick={handleRetry}
								disabled={isProcessing}
								className="h-7 gap-1 px-2 text-xs"
							>
								<RotateCcw className="h-3 w-3" />
								Resume
							</Button>
							<button
								type="button"
								onClick={handleDismissPending}
								className="p-1 text-muted-foreground/50 hover:text-muted-foreground"
								title="Dismiss"
							>
								<span className="sr-only">Dismiss</span>
								×
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Error message */}
			{error && !pendingPayment && (
				<div className="mb-3 rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
					{error}
				</div>
			)}

			{/* Balance info when connected */}
			{isConnected && balance && (
				<div className="mb-3 text-center text-xs text-muted-foreground">
					Balance: {formatBsv(balance.satoshis)} BSV
				</div>
			)}

			{/* Generate button */}
			<div className="mt-auto">
				<Button
					onClick={() => handleGenerate()}
					disabled={isProcessing || (isConnected && !hasEnoughBalance)}
					className="w-full gap-2"
					size="sm"
				>
					{getButtonContent()}
				</Button>
				<p className="mt-2 text-center text-[10px] text-muted-foreground">
					{formatBsv(AI_GENERATION_COST_SATS)} BSV per generation
					{/* Subtle recovery link - only visible on hover/focus */}
					{!pendingPayment && !showRecovery && (
						<>
							{" · "}
							<button
								type="button"
								onClick={() => setShowRecovery(true)}
								className="text-muted-foreground/60 underline-offset-2 transition-colors hover:text-muted-foreground hover:underline"
							>
								recover
							</button>
						</>
					)}
				</p>

				{/* Manual recovery - clean slide-down */}
				{showRecovery && !pendingPayment && (
					<div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/30 p-3">
						<div className="flex items-center justify-between">
							<p className="text-[10px] font-medium text-muted-foreground">
								Enter payment TX to retry
							</p>
							<button
								type="button"
								onClick={() => {
									setShowRecovery(false);
									setRecoveryTxid("");
								}}
								className="text-muted-foreground/50 hover:text-muted-foreground"
							>
								×
							</button>
						</div>
						<input
							type="text"
							value={recoveryTxid}
							onChange={(e) => setRecoveryTxid(e.target.value)}
							placeholder="Transaction ID..."
							className="w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-[10px] placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none"
						/>
						<Button
							size="sm"
							onClick={handleManualRecovery}
							disabled={isProcessing || !recoveryTxid.trim()}
							className="h-7 w-full text-xs"
						>
							Retry Generation
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
