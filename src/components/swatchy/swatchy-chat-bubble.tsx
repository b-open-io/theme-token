"use client";

import { isTextUIPart, isToolOrDynamicToolUIPart, type UIMessage } from "ai";
import { motion } from "framer-motion";
import { Loader2, X, CheckCircle2, XCircle, Wrench, Sparkles, ArrowRight, RotateCcw } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
	PromptInput,
	PromptInputTextarea,
	PromptInputFooter,
	PromptInputTools,
	PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { useSwatchyStore } from "./swatchy-store";
import { useSwatchyChat } from "./use-swatchy-chat";
import { PaymentRequestCard } from "./payment-request";
import { featureFlags } from "@/lib/feature-flags";
import type { ThemeToken } from "@theme-token/sdk";

/**
 * Get dynamic suggestions based on enabled feature flags
 */
function getSuggestions(): string[] {
	// First suggestion is always "Create a Barbie theme"
	const firstSuggestion = "Create a Barbie theme";

	const otherSuggestions = [
		"Create a dark cyberpunk theme",
		"Make my theme more accessible",
		"Show me warm color palettes",
		"Take me to the marketplace",
		"Generate a minimalist theme",
		"Browse popular themes",
		"How do I mint a theme?",
	];

	const featureSuggestions: string[] = [];

	if (featureFlags.fonts) {
		featureSuggestions.push("Create a custom display font");
	}

	if (featureFlags.images) {
		featureSuggestions.push("Generate a geometric pattern");
	}

	if (featureFlags.ai) {
		featureSuggestions.push("Help me design a wellness app theme");
	}

	// Combine other suggestions with feature-specific ones and shuffle
	const shuffledOthers = [...otherSuggestions, ...featureSuggestions]
		.sort(() => Math.random() - 0.5)
		.slice(0, 3);

	// Return first suggestion followed by 3 random others
	return [firstSuggestion, ...shuffledOthers];
}

const SUGGESTIONS = getSuggestions();

// Tool name display mapping
const TOOL_DISPLAY_NAMES: Record<string, string> = {
	navigate: "Navigating",
	generateTheme: "Generating theme",
	generateFont: "Generating font",
	generatePattern: "Generating pattern",
	setThemeColor: "Setting color",
	setThemeRadius: "Setting radius",
	setThemeFont: "Setting font",
	setPatternParams: "Updating pattern",
	prepareInscribe: "Preparing inscription",
	prepareListing: "Preparing listing",
	getWalletBalance: "Checking balance",
	getExchangeRate: "Getting exchange rate",
};

export function SwatchyChatBubble() {
	const router = useRouter();
	const pathname = usePathname();
	const { closeChat, setNavigating, clearGeneration } = useSwatchyStore();
	const {
		messages,
		input,
		setInput,
		handleSubmit,
		isLoading,
		paymentPending,
		handlePaymentConfirmed,
		handlePaymentCancelled,
		handleRetry,
		generation,
		failedRequest,
	} = useSwatchyChat();

	const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const chatContainerRef = useRef<HTMLDivElement>(null);

	// Close on Escape (only when textarea not focused)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				const activeElement = document.activeElement;
				const isTextareaFocused = activeElement?.tagName === "TEXTAREA";
				if (!isTextareaFocused) {
					closeChat();
				}
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [closeChat]);

	// Close on click outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (chatContainerRef.current && !chatContainerRef.current.contains(e.target as Node)) {
				closeChat();
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [closeChat]);

	const handleSuggestionClick = (suggestion: string) => {
		setInput(suggestion);
	};

	const onPromptSubmit = () => {
		if (!input.trim() || isLoading) return;
		handleSubmit();
	};

	const onPaymentConfirm = async () => {
		setIsPaymentProcessing(true);
		try {
			await handlePaymentConfirmed();
		} finally {
			setIsPaymentProcessing(false);
		}
	};

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
		}
	}, [messages, paymentPending, generation.status]);

	return (
		<motion.div
			ref={chatContainerRef}
			className="fixed right-4 top-32 z-[55] flex h-[500px] w-[380px] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl max-sm:inset-x-4 max-sm:bottom-4 max-sm:left-4 max-sm:right-4 max-sm:top-auto max-sm:h-[70vh] max-sm:w-auto"
			initial={{ opacity: 0, scale: 0.9, x: 20 }}
			animate={{ opacity: 1, scale: 1, x: 0 }}
			exit={{ opacity: 0, scale: 0.9, x: 20 }}
			transition={{
				type: "spring",
				stiffness: 300,
				damping: 25,
				delay: 0.1, // Wait for Swatchy to start moving
			}}
		>
			{/* Speech bubble pointer - desktop only */}
			<div className="absolute -top-3 right-8 hidden h-0 w-0 border-b-[12px] border-l-[12px] border-r-[12px] border-b-border border-l-transparent border-r-transparent sm:block" />
			<div className="absolute -top-2.5 right-8 hidden h-0 w-0 border-b-[11px] border-l-[11px] border-r-[11px] border-b-background border-l-transparent border-r-transparent sm:block" />

			{/* Header */}
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium">Swatchy</span>
					<span className="text-xs text-muted-foreground">Theme Assistant</span>
				</div>
				<Button variant="ghost" size="icon" onClick={closeChat}>
					<X className="h-4 w-4" />
				</Button>
			</div>

			{/* Messages */}
			<Conversation className="flex-1">
				<ConversationContent className="gap-4 p-3">
					<div ref={scrollContainerRef} className="flex flex-col gap-4">
						{messages.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
								<p className="text-sm text-muted-foreground">
									Hi! I&apos;m Swatchy, your theme assistant. How can I help you
									today?
								</p>
								<Suggestions className="flex-wrap justify-center gap-2">
									{SUGGESTIONS.map((suggestion) => (
										<Suggestion
											key={suggestion}
											suggestion={suggestion}
											onClick={handleSuggestionClick}
											className="text-xs"
										/>
									))}
								</Suggestions>
							</div>
						) : (
							<>
								{messages.map((msg) => {
									const uiMessage = msg as UIMessage;
									const hasContent = uiMessage.parts?.some(
										(part) => isTextUIPart(part) || isToolOrDynamicToolUIPart(part)
									);
									if (!hasContent) return null;

									return (
										<Message key={msg.id} from={msg.role === "user" ? "user" : "assistant"}>
											{uiMessage.parts?.map((part, index) => {
												// Render text parts
												if (isTextUIPart(part) && part.text) {
													return (
														<MessageContent key={index}>
															{part.text}
														</MessageContent>
													);
												}

												// Render tool invocation parts
												if (isToolOrDynamicToolUIPart(part)) {
													const toolName = "toolName" in part ? part.toolName : part.type.replace("tool-", "");
													const displayName = TOOL_DISPLAY_NAMES[toolName] || toolName;

													// Show different UI based on tool state
													if (part.state === "input-streaming" || part.state === "input-available") {
														return (
															<div key={index} className="flex items-center gap-2 text-xs text-muted-foreground py-1">
																<Loader2 className="h-3 w-3 animate-spin" />
																<span>{displayName}...</span>
															</div>
														);
													}

													if (part.state === "output-available") {
														return (
															<div key={index} className="flex items-center gap-2 text-xs text-muted-foreground py-1">
																<CheckCircle2 className="h-3 w-3 text-green-500" />
																<span>{displayName}</span>
															</div>
														);
													}

													if (part.state === "output-error") {
														return (
															<div key={index} className="flex items-center gap-2 text-xs text-destructive py-1">
																<XCircle className="h-3 w-3" />
																<span>{displayName} failed</span>
															</div>
														);
													}

													// Default: show tool is being called
													return (
														<div key={index} className="flex items-center gap-2 text-xs text-muted-foreground py-1">
															<Wrench className="h-3 w-3" />
															<span>{displayName}</span>
														</div>
													);
												}

												return null;
											})}
										</Message>
									);
								})}
							</>
						)}

						{/* Loading indicator */}
						{isLoading && !paymentPending && (
							<Message from="assistant">
								<MessageContent>
									<span className="animate-pulse">Thinking...</span>
								</MessageContent>
							</Message>
						)}

						{/* Payment request card */}
						{paymentPending && (
							<div className="mt-2">
								<PaymentRequestCard
									payment={paymentPending}
									onConfirm={onPaymentConfirm}
									onCancel={handlePaymentCancelled}
									isProcessing={isPaymentProcessing}
								/>
							</div>
						)}

						{/* Generation progress indicator */}
						{generation.status === "generating" && (
							<div className="mt-2 rounded-lg border bg-muted/50 p-3">
								<div className="flex items-center gap-2">
									<Loader2 className="h-4 w-4 animate-spin text-primary" />
									<span className="text-sm font-medium">
										{generation.progress || "Processing..."}
									</span>
								</div>
							</div>
						)}

						{/* Generation success */}
						{generation.status === "success" && (
							<motion.div
								className="mt-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3"
								initial={{ scale: 0.9, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								transition={{ type: "spring", stiffness: 300, damping: 20 }}
							>
								<div className="flex items-center gap-2">
									<motion.div
										animate={{
											rotate: [0, 10, -10, 0],
											scale: [1, 1.2, 1]
										}}
										transition={{
											duration: 0.5,
											repeat: 2,
											repeatDelay: 0.5
										}}
									>
										<Sparkles className="h-4 w-4 text-green-500" />
									</motion.div>
									<span className="text-sm font-medium text-green-700 dark:text-green-300">
										{generation.toolName === "generateTheme" && generation.result
											? `"${(generation.result as ThemeToken).name}" created!`
											: "Generation complete!"}
									</span>
								</div>
								{generation.toolName === "generateTheme" && (
									<div className="mt-2 flex items-center justify-between">
										<p className="text-xs text-green-600/70 dark:text-green-400/70">
											Saved to drafts
										</p>
										{pathname !== "/studio/theme" && (
											<button
												type="button"
												onClick={() => {
													setNavigating(true);
													clearGeneration();
													router.push("/studio/theme");
												}}
												className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
											>
												View in Studio
												<ArrowRight className="h-3 w-3" />
											</button>
										)}
									</div>
								)}
							</motion.div>
						)}

						{/* Generation error */}
						{generation.status === "error" && (
							<div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
								<div className="flex items-center gap-2">
									<XCircle className="h-4 w-4 text-destructive" />
									<span className="text-sm text-destructive">
										{generation.error || "Generation failed"}
									</span>
								</div>
								{/* Free Retry button - shown when we have a failed paid request */}
								{failedRequest && (
									<div className="mt-2 flex items-center justify-between">
										<p className="text-xs text-destructive/70">
											Your payment was processed - retry is free
										</p>
										<button
											type="button"
											onClick={handleRetry}
											className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
										>
											<RotateCcw className="h-3 w-3" />
											Free Retry
										</button>
									</div>
								)}
							</div>
						)}
					</div>
				</ConversationContent>
				<ConversationScrollButton />
			</Conversation>

			{/* Input */}
			<div className="border-t p-3">
				<PromptInput
					onSubmit={onPromptSubmit}
					className="rounded-lg border bg-muted/30"
				>
					<PromptInputTextarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Ask me anything about themes..."
						className="min-h-10 max-h-24 text-sm"
						disabled={!!paymentPending}
					/>
					<PromptInputFooter>
						<PromptInputTools />
						<PromptInputSubmit
							disabled={!input.trim() || isLoading || !!paymentPending}
							status={isLoading ? "submitted" : undefined}
						/>
					</PromptInputFooter>
				</PromptInput>
			</div>
		</motion.div>
	);
}
