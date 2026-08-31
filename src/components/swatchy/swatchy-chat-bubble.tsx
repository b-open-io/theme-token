"use client";

import { isTextUIPart, isToolUIPart, type UIMessage } from "ai";
import { motion } from "framer-motion";
import {
	CheckCircle2,
	Loader2,
	RotateCcw,
	Wrench,
	X,
	XCircle,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
	Message,
	MessageContent,
	MessageResponse,
} from "@/components/ai-elements/message";
import {
	PromptInput,
	PromptInputFooter,
	PromptInputSubmit,
	PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import { type FeatureFlags, useFeatureFlags } from "@/lib/feature-flags";
import { BlockPreview } from "./block-preview";
import { PaymentRequestCard } from "./payment-request";
import {
	getToolPresentationKind,
	shouldShowThinking,
} from "./swatchy-chat-state";
import { useSwatchyStore } from "./swatchy-store";
import { useSwatchyChat } from "./use-swatchy-chat";

/**
 * Get dynamic suggestions based on enabled feature flags
 */
// Pop culture theme ideas - movies, games, anime, brands, iconic aesthetics
const POP_CULTURE_THEMES = [
	// Movies & TV
	"Barbie",
	"The Matrix",
	"Blade Runner",
	"Tron",
	"Star Wars",
	"Stranger Things",
	"Wes Anderson",
	"Studio Ghibli",
	"Mad Max",
	"The Grand Budapest Hotel",
	"Kill Bill",
	"Beetlejuice",
	"Avatar",
	"Dune",
	"The Godfather",
	"Pulp Fiction",
	"Drive",
	"Akira",
	"Ghost in the Shell",
	"Spirited Away",
	"Her",
	"Interstellar",
	"The Shining",
	"Midsommar",
	"Black Panther",
	"Spider-Verse",
	"Arcane",
	"Squid Game",
	"Wednesday",
	"Euphoria",
	// Video Games
	"Cyberpunk 2077",
	"The Last of Us",
	"Zelda",
	"Mario",
	"Minecraft",
	"Portal",
	"Hades",
	"Hollow Knight",
	"Elden Ring",
	"Final Fantasy",
	"Pokemon",
	"Animal Crossing",
	"Stardew Valley",
	"Celeste",
	"Undertale",
	"Bioshock",
	"Mass Effect",
	"God of War",
	"Horizon Zero Dawn",
	"Death Stranding",
	"Persona 5",
	"NieR Automata",
	"Disco Elysium",
	"Outer Wilds",
	"Splatoon",
	// Anime & Manga
	"Evangelion",
	"Sailor Moon",
	"Dragon Ball",
	"Naruto",
	"One Piece",
	"Attack on Titan",
	"Jujutsu Kaisen",
	"Demon Slayer",
	"Cowboy Bebop",
	"Death Note",
	// Music & Artists
	"Vaporwave",
	"Synthwave",
	"Lo-fi",
	"K-pop",
	"Taylor Swift Eras",
	"Beyoncé",
	"Daft Punk",
	"Prince",
	"David Bowie",
	"The Weeknd",
	// Brands & Aesthetics
	"Y2K",
	"90s Nickelodeon",
	"MTV 80s",
	"Bauhaus",
	"Memphis Design",
	"Art Deco",
	"Cottagecore",
	"Dark Academia",
	"Cyberpunk",
	"Solarpunk",
	"Steampunk",
	"Witchy",
	"Miami Vice",
	"Outrun",
	"Retrowave",
	"Liminal Space",
	// Global Pop Culture
	"Bollywood",
	"Día de los Muertos",
	"Cherry Blossom",
	"Northern Lights",
	"Moroccan",
	"Greek Mythology",
	"Egyptian",
	"Nordic",
	"Brazilian Carnival",
	"Japanese Zen",
];

function getRandomPopCultureTheme(): string {
	const randomIndex = Math.floor(Math.random() * POP_CULTURE_THEMES.length);
	return POP_CULTURE_THEMES[randomIndex];
}

// Page-specific suggestions for contextual relevance
const PAGE_SUGGESTIONS: Record<string, string[]> = {
	"/studio/theme": [
		"Make this theme darker",
		"Increase the border radius",
		"Switch to a warmer palette",
		"Add more contrast",
		"Make it more vibrant",
	],
	"/studio/font": [
		"Create a futuristic display font",
		"Generate a handwritten script",
		"Make a bold geometric sans-serif",
		"Design a pixel art font",
		"Create an elegant serif font",
	],
	"/studio/patterns": [
		"Create a subtle dot grid",
		"Make an organic wave pattern",
		"Design a geometric hexagon pattern",
		"Generate a minimalist line pattern",
	],
	"/studio/components": [
		"Generate a pricing table block",
		"Create a hero section",
		"Design a login form component",
		"Make a stats dashboard block",
		"Generate a testimonial carousel",
	],
	"/studio/wallpaper": [
		"Create a cyberpunk cityscape",
		"Generate an abstract gradient",
		"Make a serene mountain landscape",
		"Design a geometric desktop wallpaper",
	],
	"/market": [
		"Show me popular themes",
		"Find dark mode themes",
		"Take me to my collection",
		"How do I list a theme for sale?",
	],
	"/themes": [
		"Show me cyberpunk themes",
		"Find minimalist designs",
		"Browse colorful themes",
		"Filter by warm colors",
	],
};

function getSuggestions(pathname: string, flags: FeatureFlags): string[] {
	// First suggestion is a random pop culture theme
	const firstSuggestion = `Create a ${getRandomPopCultureTheme()} theme`;

	// Get page-specific suggestions based on current path
	const pageKey = Object.keys(PAGE_SUGGESTIONS).find((key) =>
		pathname.startsWith(key),
	);
	const pageSuggestions = pageKey ? PAGE_SUGGESTIONS[pageKey] : [];

	// Global suggestions (always available as fallback)
	const globalSuggestions = [
		"Take me to the marketplace",
		"Browse popular themes",
		"How do themes work?",
	];

	// Feature-gated suggestions (exclude if already on that studio)
	const featureSuggestions: string[] = [];

	if (flags.fonts && !pathname.includes("/studio/font")) {
		featureSuggestions.push("Create a custom font");
	}

	if (flags.images && !pathname.includes("/studio/pattern")) {
		featureSuggestions.push("Generate a pattern");
	}

	if (flags.components && !pathname.includes("/studio/components")) {
		featureSuggestions.push("Generate a UI block");
	}

	// Blend: prioritize page-specific, then feature-gated, then global
	const pool = [
		...pageSuggestions,
		...featureSuggestions,
		...globalSuggestions,
	];
	const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3);

	// Return first suggestion followed by 3 contextual others
	return [firstSuggestion, ...shuffled];
}

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
	getExchangeRate: "Getting exchange rate",
	generateBlock: "Generating block",
	generateComponent: "Generating component",
};

export function SwatchyChatBubble({ isOpen }: { isOpen: boolean }) {
	const pathname = usePathname();
	const { closeChat, registryItemsCache } = useSwatchyStore();
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
		paymentError,
		error,
		status,
		stop,
		regenerate,
		clearError,
		isBusy,
	} = useSwatchyChat();

	const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
	const chatContainerRef = useRef<HTMLDivElement>(null);

	// Generate context-aware suggestions based on current page
	const flags = useFeatureFlags();
	const suggestions = useMemo(
		() => getSuggestions(pathname, flags),
		[pathname, flags],
	);

	// Close the non-modal dialog on Escape from anywhere, including the composer.
	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				closeChat();
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [closeChat, isOpen]);

	// Close on click outside
	useEffect(() => {
		if (!isOpen) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (
				chatContainerRef.current &&
				!chatContainerRef.current.contains(e.target as Node)
			) {
				closeChat();
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [closeChat, isOpen]);

	// The mobile chat behaves like a viewport sheet. Keep the studio behind it
	// stationary so browser chrome and on-screen keyboards do not make the
	// composer jump while the user is chatting.
	useEffect(() => {
		if (!isOpen) return;
		const mobileQuery = window.matchMedia("(max-width: 767px)");
		if (!mobileQuery.matches) return;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [isOpen]);

	const handleSuggestionClick = (suggestion: string) => {
		setInput(suggestion);
	};

	const onPromptSubmit = () => {
		if (!input.trim() || isBusy) return;
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

	const onPaymentCancel = () => {
		setIsPaymentProcessing(false);
		handlePaymentCancelled();
	};

	const latestMessage = messages.at(-1) as UIMessage | undefined;
	const showThinking =
		!paymentPending && shouldShowThinking(messages as UIMessage[], status);
	if (!isOpen) return null;

	return (
		<motion.div
			ref={chatContainerRef}
			id="swatchy-chat"
			role="dialog"
			aria-label="Swatchy theme assistant"
			className="fixed right-[250px] top-20 z-[60] flex h-[500px] w-[380px] origin-top-right flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl max-md:inset-x-2 max-md:bottom-[max(0.5rem,env(safe-area-inset-bottom))] max-md:top-[max(0.5rem,env(safe-area-inset-top))] max-md:h-auto max-md:w-auto max-md:rounded-xl"
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
			<div className="flex min-h-12 items-center justify-between border-b px-4 py-2">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium">Swatchy</span>
					<span className="text-xs text-muted-foreground">Theme Assistant</span>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={closeChat}
					aria-label="Close Swatchy chat"
					className="size-11 md:size-9"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			{/* Messages */}
			<Conversation className="flex-1">
				<ConversationContent className="gap-4 p-3">
					{messages.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
							<p className="text-sm text-muted-foreground">
								Hi! I&apos;m Swatchy, your theme assistant. How can I help you
								today?
							</p>
							<Suggestions className="w-full flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
								{suggestions.map((suggestion) => (
									<Suggestion
										key={suggestion}
										suggestion={suggestion}
										onClick={handleSuggestionClick}
										className="h-auto min-h-10 w-full whitespace-normal px-3 py-2 text-xs sm:w-auto sm:whitespace-nowrap"
									/>
								))}
							</Suggestions>
						</div>
					) : (
						messages.map((msg) => {
							const uiMessage = msg as UIMessage;
							const hasContent = uiMessage.parts?.some(
								(part) => isTextUIPart(part) || isToolUIPart(part),
							);
							if (!hasContent) return null;

							return (
								<Message
									key={msg.id}
									from={msg.role === "user" ? "user" : "assistant"}
								>
									{uiMessage.parts?.map((part, partIndex) => {
										// Render text parts
										if (isTextUIPart(part) && part.text) {
											return (
												// biome-ignore lint/suspicious/noArrayIndexKey: AI SDK text parts have no stable ID; their append-only order stays stable while text streams.
												<MessageContent key={`${msg.id}:text:${partIndex}`}>
													{msg.role === "assistant" ? (
														<MessageResponse
															isAnimating={
																status === "streaming" &&
																msg.id === latestMessage?.id
															}
														>
															{part.text}
														</MessageResponse>
													) : (
														part.text
													)}
												</MessageContent>
											);
										}

										// Render tool invocation parts
										if (isToolUIPart(part)) {
											const toolName =
												"toolName" in part
													? part.toolName
													: part.type.replace("tool-", "");
											const displayName =
												TOOL_DISPLAY_NAMES[toolName] || toolName;
											const partKey =
												"toolCallId" in part && part.toolCallId
													? part.toolCallId
													: `${msg.id}:${part.type}`;
											const toolCallId =
												"toolCallId" in part ? part.toolCallId : null;
											const presentationKind = getToolPresentationKind(part, {
												paymentToolCallId: paymentPending?.toolCallId,
												generationToolCallId: generation.toolCallId,
												generationStatus: generation.status,
											});

											if (presentationKind === "payment" && paymentPending) {
												return (
													<div key={partKey} className="w-full py-1">
														<PaymentRequestCard
															payment={paymentPending}
															onConfirm={onPaymentConfirm}
															onCancel={onPaymentCancel}
															isProcessing={isPaymentProcessing}
															paymentError={paymentError}
														/>
													</div>
												);
											}

											if (presentationKind === "generation-running") {
												return (
													<div
														key={partKey}
														className="flex w-full items-center gap-2 rounded-lg border bg-muted/50 p-3"
													>
														<Loader2 className="size-4 shrink-0 animate-spin text-primary" />
														<span className="min-w-0 text-sm font-medium">
															{generation.progress || `${displayName}...`}
														</span>
													</div>
												);
											}

											if (presentationKind === "generation-error") {
												return (
													<div
														key={partKey}
														className="w-full rounded-lg border border-destructive/30 bg-destructive/10 p-3"
														role="alert"
													>
														<div className="flex items-start gap-2">
															<XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
															<span className="min-w-0 text-sm text-destructive">
																{generation.error || `${displayName} failed`}
															</span>
														</div>
														{failedRequest?.toolCallId === toolCallId && (
															<div className="mt-2 flex flex-wrap items-center justify-between gap-2">
																<p className="text-xs text-destructive/70">
																	Your payment was processed — retry is free
																</p>
																<Button
																	type="button"
																	variant="ghost"
																	size="sm"
																	onClick={() => void handleRetry()}
																	className="h-8 gap-1 text-primary"
																>
																	<RotateCcw className="size-3" />
																	Free Retry
																</Button>
															</div>
														)}
													</div>
												);
											}

											// Generative UI for Blocks and Components
											if (
												(toolName === "generateBlock" ||
													toolName === "generateComponent") &&
												part.state === "output-available" &&
												part.output &&
												typeof part.output === "object" &&
												"cacheId" in part.output
											) {
												// biome-ignore lint/suspicious/noExplicitAny: dynamic/third-party shape
												const cacheId = (part.output as any).cacheId;
												const item = registryItemsCache[cacheId];

												if (item) {
													return (
														<div key={partKey} className="w-full my-2">
															<BlockPreview item={item} />
														</div>
													);
												}
											}

											// Show different UI based on tool state
											if (presentationKind === "tool-running") {
												return (
													<div
														key={partKey}
														className="flex items-center gap-2 text-xs text-muted-foreground py-1"
													>
														<Loader2 className="h-3 w-3 animate-spin" />
														<span>{displayName}...</span>
													</div>
												);
											}

											if (
												presentationKind === "tool-success" ||
												presentationKind === "generation-success"
											) {
												return (
													<div
														key={partKey}
														className="flex items-center gap-2 text-xs text-muted-foreground py-1"
													>
														<CheckCircle2 className="h-3 w-3 text-green-500" />
														<span>{displayName}</span>
													</div>
												);
											}

											if (presentationKind === "tool-error") {
												return (
													<div
														key={partKey}
														className="flex items-center gap-2 text-xs text-destructive py-1"
													>
														<XCircle className="h-3 w-3" />
														<span className="min-w-0">
															{part.errorText || `${displayName} failed`}
														</span>
													</div>
												);
											}

											// Default: show tool is being called
											return (
												<div
													key={partKey}
													className="flex items-center gap-2 text-xs text-muted-foreground py-1"
												>
													<Wrench className="h-3 w-3" />
													<span>{displayName}</span>
												</div>
											);
										}

										return null;
									})}
								</Message>
							);
						})
					)}

					{/* Loading only when no assistant content has started streaming. */}
					{showThinking && (
						<Message from="assistant">
							<MessageContent>
								<span className="animate-pulse">Thinking...</span>
							</MessageContent>
						</Message>
					)}

					{error && (
						<div
							className="flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3"
							role="alert"
						>
							<div className="flex min-w-0 items-start gap-2">
								<XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
								<p className="min-w-0 text-sm text-destructive">
									{error.message || "Swatchy could not complete that response."}
								</p>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8 shrink-0 gap-1"
								onClick={() => {
									clearError();
									void regenerate();
								}}
							>
								<RotateCcw className="size-3" />
								Retry
							</Button>
						</div>
					)}
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
						disabled={isBusy}
					/>
					<PromptInputFooter className="justify-end">
						<PromptInputSubmit
							type={isLoading ? "button" : "submit"}
							disabled={!isLoading && (!input.trim() || isBusy)}
							status={status}
							onClick={
								isLoading
									? (event) => {
											event.preventDefault();
											stop();
										}
									: undefined
							}
						/>
					</PromptInputFooter>
				</PromptInput>
			</div>
		</motion.div>
	);
}
