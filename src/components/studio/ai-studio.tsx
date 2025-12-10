"use client";

import { Bot, Sparkles, Wallet, RotateCcw, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ThemeToken } from "@theme-token/sdk";
import { Button } from "@/components/ui/button";
import { Message, MessageContent, MessageActions, MessageAction } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter } from "@/components/ai-elements/prompt-input";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { storeRemixTheme } from "@/components/theme-gallery";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { AI_GENERATION_COST_SATS, FEE_ADDRESS } from "@/lib/yours-wallet";

const GENERATION_TIMEOUT_MS = 90_000;
const PENDING_PAYMENT_KEY = "theme:ai-studio:pendingPayment";

// Format satoshis as BSV
const formatBsv = (sats: number) => {
	const bsv = sats / 100_000_000;
	if (bsv < 0.01) return bsv.toFixed(5);
	if (bsv < 1) return bsv.toFixed(2);
	return bsv.toFixed(1);
};

interface PendingPayment {
	txid: string;
	prompt: string;
	timestamp: number;
}

type ChatMessage = {
	id: string;
	role: "user" | "assistant";
	content: React.ReactNode;
	actions?: React.ReactNode;
};

export function AiStudio() {
	const router = useRouter();
	const { status, connect, balance, sendPayment, isSending } = useYoursWallet();
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<ChatMessage[]>([
		{
			id: "welcome",
			role: "assistant",
			content: (
				<div className="space-y-2">
					<p>Hi! I can help you generate a unique theme using AI.</p>
					<p>
						Describe the look and feel you want (e.g., "Cyberpunk neon dark mode" or "Soft pastel nature theme"), and I'll create it for you.
					</p>
					<p className="text-xs text-muted-foreground">
						Cost: {formatBsv(AI_GENERATION_COST_SATS)} BSV per generation.
					</p>
				</div>
			),
		},
	]);
	const [isGenerating, setIsGenerating] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const isConnected = status === "connected";
	const hasEnoughBalance = (balance?.satoshis ?? 0) >= AI_GENERATION_COST_SATS;

	// Scroll to bottom on new messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Check for pending payment recovery
	useEffect(() => {
		const stored = localStorage.getItem(PENDING_PAYMENT_KEY);
		if (stored) {
			try {
				const pending = JSON.parse(stored) as PendingPayment;
				if (Date.now() - pending.timestamp < 60 * 60 * 1000) {
					addMessage({
						role: "assistant",
						content: (
							<div className="space-y-2">
								<p>I found an interrupted generation session.</p>
								<div className="rounded-lg border bg-muted/50 p-3">
									<p className="text-xs font-medium">Pending Prompt:</p>
									<p className="text-sm italic">"{pending.prompt}"</p>
									<p className="mt-2 text-xs font-mono text-muted-foreground">TX: {pending.txid.slice(0, 12)}...</p>
								</div>
								<Button 
									size="sm" 
									onClick={() => handleGenerate(pending.prompt, pending.txid)}
									className="gap-2"
								>
									<RotateCcw className="h-3 w-3" />
									Resume Generation
								</Button>
							</div>
						),
					});
				} else {
					localStorage.removeItem(PENDING_PAYMENT_KEY);
				}
			} catch (e) {
				localStorage.removeItem(PENDING_PAYMENT_KEY);
			}
		}
	}, []);

	const addMessage = (msg: Omit<ChatMessage, "id">) => {
		setMessages((prev) => [...prev, { ...msg, id: Math.random().toString(36).substring(7) }]);
	};

	const handleConnect = async () => {
		try {
			await connect();
		} catch (err) {
			toast.error("Failed to connect wallet");
		}
	};

	const handleGenerate = async (promptText: string, existingTxid?: string) => {
		if (!isConnected) {
			await handleConnect();
			return;
		}

		if (!existingTxid && !hasEnoughBalance) {
			addMessage({
				role: "assistant",
				content: (
					<div className="flex items-center gap-2 text-destructive">
						<AlertCircle className="h-4 w-4" />
						<span>Insufficient balance. You need {formatBsv(AI_GENERATION_COST_SATS)} BSV.</span>
					</div>
				),
			});
			return;
		}

		setIsGenerating(true);
		
		// Create abort controller for timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

		try {
			let paymentTxid = existingTxid;

			if (!paymentTxid) {
				// Payment Step
				addMessage({
					role: "assistant",
					content: (
						<div className="flex items-center gap-2">
							<Wallet className="h-4 w-4 animate-pulse" />
							<span>Processing payment...</span>
						</div>
					),
				});

				const paymentResult = await sendPayment(FEE_ADDRESS, AI_GENERATION_COST_SATS);
				if (!paymentResult) throw new Error("Payment failed or cancelled");
				
				paymentTxid = paymentResult.txid;
				
				// Save pending state
				const pendingData: PendingPayment = {
					txid: paymentTxid,
					prompt: promptText,
					timestamp: Date.now(),
				};
				localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(pendingData));
			}

			// Generation Step
			addMessage({
				role: "assistant",
				content: (
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Sparkles className="h-4 w-4 animate-spin" />
							<span>Generating theme... (this may take a minute)</span>
						</div>
						<Reasoning>
							<ReasoningTrigger>
								<div className="flex items-center gap-2">
									<Bot className="h-4 w-4" />
									<span>AI Processing</span>
								</div>
							</ReasoningTrigger>
							<ReasoningContent>
								{`Analyzing prompt: "${promptText}" → Generating color palette → Selecting typography → Calculating component styles...`}
							</ReasoningContent>
						</Reasoning>
					</div>
				),
			});

			const response = await fetch("/api/generate-theme", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: promptText,
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

			// Cleanup
			localStorage.removeItem(PENDING_PAYMENT_KEY);
			clearTimeout(timeoutId);

			// Success Message & Action
			addMessage({
				role: "assistant",
				content: (
					<div className="space-y-4">
						<p>Theme <strong>{theme.name}</strong> generated successfully!</p>
						<div className="flex gap-2">
							<div className="h-12 w-12 rounded-lg border shadow-sm" style={{ backgroundColor: theme.styles.light.background }}></div>
							<div className="h-12 w-12 rounded-lg border shadow-sm" style={{ backgroundColor: theme.styles.light.primary }}></div>
							<div className="h-12 w-12 rounded-lg border shadow-sm" style={{ backgroundColor: theme.styles.light.secondary }}></div>
							<div className="h-12 w-12 rounded-lg border shadow-sm" style={{ backgroundColor: theme.styles.light.accent }}></div>
						</div>
					</div>
				),
				actions: (
					<Button
						onClick={() => {
							storeRemixTheme(theme, { source: "ai-generate", paymentTxid: paymentTxid! });
							router.push("/studio/theme");
						}}
					>
						Open in Studio
					</Button>
				)
			});

		} catch (err) {
			console.error("Generation failed:", err);
			let message = "Something went wrong.";
			if (err instanceof Error) {
				if (err.name === "AbortError") message = "Generation timed out.";
				else message = err.message;
			}

			addMessage({
				role: "assistant",
				content: (
					<div className="text-destructive space-y-2">
						<p>Error: {message}</p>
						<p className="text-xs text-muted-foreground">Your payment info is saved. You can retry.</p>
					</div>
				),
			});
		} finally {
			setIsGenerating(false);
		}
	};

	const handleSubmit = () => {
		if (!input.trim() || isGenerating) return;
		
		const userPrompt = input.trim();
		setInput("");
		addMessage({ role: "user", content: userPrompt });
		handleGenerate(userPrompt);
	};

	return (
		<div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
			<div className="flex-1 overflow-y-auto p-4">
				<div className="mx-auto max-w-3xl space-y-6">
					{messages.map((msg) => (
						<Message key={msg.id} from={msg.role}>
							<MessageContent>{msg.content}</MessageContent>
							{msg.actions && <MessageActions>{msg.actions}</MessageActions>}
						</Message>
					))}
					<div ref={messagesEndRef} />
				</div>
			</div>

			<div className="border-t bg-background/95 backdrop-blur p-4">
				<div className="mx-auto max-w-3xl">
					<PromptInput onSubmit={() => handleSubmit()}>
						<PromptInputTextarea 
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder={isConnected ? "Describe your theme..." : "Connect wallet to generate..."}
							disabled={isGenerating}
						/>
						<PromptInputFooter>
							<div className="flex-1" />
							{!isConnected ? (
								<Button size="sm" onClick={handleConnect}>Connect Wallet</Button>
							) : (
								<Button size="sm" onClick={handleSubmit} disabled={!input.trim() || isGenerating}>
									{isGenerating ? (
										<>
											<Sparkles className="mr-2 h-4 w-4 animate-spin" />
											Generating...
										</>
									) : (
										<>
											Generate <span className="ml-1 text-xs opacity-70">({formatBsv(AI_GENERATION_COST_SATS)} BSV)</span>
										</>
									)}
								</Button>
							)}
						</PromptInputFooter>
					</PromptInput>
				</div>
			</div>
		</div>
	);
}
