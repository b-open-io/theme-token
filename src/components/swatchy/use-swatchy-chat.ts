"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	dispatchRemixTheme,
	saveAIThemeToDrafts,
} from "@/components/theme-gallery";
import { useTheme } from "@/components/theme-provider";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { isAdminIdentity } from "@/lib/admins";
import { FEE_ADDRESS, type SwatchyContext } from "@/lib/agent/config";
import {
	getToolValidationError,
	isToolValidForPage,
} from "@/lib/agent/tool-routing";
import type { ToolName } from "@/lib/agent/tools";
import { usePatternStore } from "@/lib/pattern-store";
import { getPrice, PAID_TOOLS, type PricingTool } from "@/lib/pricing";
import {
	type IconStudioTab,
	useIconStudioStore,
} from "@/lib/stores/icon-studio-store";
import {
	type FontSlot,
	type ThemeColorKey,
	type ThemeMode,
	useStudioStore,
} from "@/lib/stores/studio-store";
import { useSwatchyStore } from "./swatchy-store";

/**
 * Finalize any tool calls left in a non-terminal state in a restored
 * conversation. A page reload/redeploy mid-generation leaves a `tool-*` part
 * stuck in "input-available"/"input-streaming" — which renders as a perpetual
 * "Generating…" spinner and also produces an invalid history (a tool_use with
 * no tool_result) when replayed to the model. Mark these as errored so the UI
 * shows them as interrupted and the conversation stays valid.
 */
function finalizeInterruptedToolCalls(messages: UIMessage[]): UIMessage[] {
	return messages.map((message) => {
		if (!message.parts) return message;
		let changed = false;
		const parts = message.parts.map((part) => {
			const type = (part as { type?: string }).type;
			const state = (part as { state?: string }).state;
			if (
				typeof type === "string" &&
				(type.startsWith("tool-") || type === "dynamic-tool") &&
				(state === "input-available" || state === "input-streaming")
			) {
				changed = true;
				return {
					...part,
					state: "output-error",
					errorText:
						"Interrupted — the page was reloaded before this finished.",
				} as typeof part;
			}
			return part;
		});
		return changed ? { ...message, parts } : message;
	});
}

/**
 * Extract a useful message from a failed API response. The server may return a
 * non-JSON body (e.g. a platform timeout/runtime 500 that starts with "An error
 * occurred"), so read text and only parse JSON when it actually is JSON — never
 * throw a misleading "not valid JSON" on top of the real failure.
 */
async function readApiError(
	response: Response,
	fallback: string,
): Promise<string> {
	const text = await response.text().catch(() => "");
	if (!text) return fallback;
	try {
		const parsed: unknown = JSON.parse(text);
		if (
			parsed &&
			typeof parsed === "object" &&
			"error" in parsed &&
			typeof (parsed as { error: unknown }).error === "string"
		) {
			return (parsed as { error: string }).error;
		}
	} catch {
		// Non-JSON body — fall through to the raw text.
	}
	return text.slice(0, 200);
}

export function useSwatchyChat() {
	const router = useRouter();
	const pathname = usePathname();
	const { mode: themeMode } = useTheme();
	const {
		sendPayment,
		status: walletStatus,
		addresses,
		hasPrismPass,
	} = useYoursWallet();
	const ordAddress = addresses?.ordAddress;
	// Admins get every paid generation for free (payment skipped client-side).
	const isAdmin = isAdminIdentity(addresses?.identityKey);
	const {
		paymentPending,
		setPaymentPending,
		confirmPayment,
		cancelPayment,
		setNavigating,
		setGenerating,
		setGenerationSuccess,
		setGenerationError,
		clearGeneration,
		generation,
		failedRequest,
		clearFailedRequest,
		chatMessages,
		setChatMessages,
		chatInput,
		setChatInput,
		remixContext,
		consumePendingMessage,
		consumePendingPrefill,
		position,
		setAIGeneratedTheme,
		setGeneratedRegistryItem,
		hasHydrated,
	} = useSwatchyStore();

	// Studio stores for tool execution
	const studioStore = useStudioStore();
	const { setThemeColor, setThemeRadius, setThemeFont } = studioStore;
	const patternStore = usePatternStore();
	const { setParams: setPatternParams, setColors: setPatternColors } =
		patternStore;
	const iconStudioStore = useIconStudioStore();
	const {
		setActiveTab: setIconStudioTab,
		setIconSetPrompt,
		setIconSetNamesText,
		applyIconSetSlotPreset,
		setIconSetParams,
		setFaviconPrompt,
		setFaviconParams,
		setGeneratedIconSet,
		setGeneratedFavicon,
	} = iconStudioStore;

	const { cacheRegistryItem } = useSwatchyStore();
	const [hasFreeGeneration, setHasFreeGeneration] = useState(false);
	// Error from the most recent payment attempt (e.g. insufficient funds).
	// When set, the payment card stays open so the user can add funds and retry.
	const [paymentError, setPaymentError] = useState<string | null>(null);

	// Fetch user storage to check for free generation eligibility
	useEffect(() => {
		if (walletStatus === "connected" && ordAddress) {
			fetch(`/api/user/storage?userId=${ordAddress}`)
				.then((res) => res.json())
				.then((data) => {
					// User gets first generation free if they have 0 total drafts
					if (data.totalDrafts === 0) {
						console.log("[Swatchy] User eligible for free first generation!");
						setHasFreeGeneration(true);
					} else {
						setHasFreeGeneration(false);
					}
				})
				.catch((err) => console.error("Failed to check storage usage:", err));
		}
	}, [walletStatus, ordAddress]);

	// Update pending payment if user becomes eligible for free generation while it's open
	// This handles the flow: Generate -> Connect Wallet -> Become Eligible -> Update UI
	useEffect(() => {
		if (
			paymentPending &&
			!paymentPending.isFree &&
			(isAdmin || hasFreeGeneration)
		) {
			console.log("[Swatchy] Updating pending payment to be free");
			setPaymentPending({
				...paymentPending,
				isFree: true,
			});
		}
	}, [paymentPending, isAdmin, hasFreeGeneration, setPaymentPending]);

	// Build context to pass to API - includes current state for Swatchy's awareness
	const context = useMemo((): SwatchyContext => {
		const ctx: SwatchyContext = {
			currentPage: pathname,
			themeMode: themeMode as "light" | "dark",
			walletConnected: walletStatus === "connected",
		};

		// Add current theme being edited if in studio
		if (pathname.includes("/studio/theme") && studioStore.themeColors) {
			const { themeColors, themeRadius, themeFonts } = studioStore;
			ctx.currentTheme = {
				name: "Current Theme",
				colors: {
					primary: themeColors.light.primary,
					secondary: themeColors.light.secondary,
					accent: themeColors.light.accent,
					background: themeColors.light.background,
					foreground: themeColors.light.foreground,
					muted: themeColors.light.muted,
				},
				radius: themeRadius,
				fonts: {
					sans: themeFonts.sans,
					serif: themeFonts.serif,
					mono: themeFonts.mono,
				},
			};
		}

		// Add remix context if remixing a theme
		if (remixContext) {
			const { theme } = remixContext;
			ctx.currentTheme = {
				name: theme.name,
				colors: {
					primary: theme.styles.light.primary,
					secondary: theme.styles.light.secondary,
					accent: theme.styles.light.accent,
					background: theme.styles.light.background,
					foreground: theme.styles.light.foreground,
					muted: theme.styles.light.muted,
				},
				radius: theme.styles.light.radius,
			};
		}

		// Add pattern state if in pattern studio
		if (pathname.includes("/studio/pattern")) {
			ctx.patternState = {
				source: patternStore.generatorType,
				scale: patternStore.params.spacing,
				opacity: patternStore.params.opacity,
			};
		}

		// Add icon state if in icon studio
		if (pathname.includes("/studio/icon")) {
			ctx.iconState = {
				activeTab: iconStudioStore.activeTab,
				iconSet: {
					prompt: iconStudioStore.iconSet.prompt,
					iconNamesText: iconStudioStore.iconSet.iconNamesText,
					slotPreset: iconStudioStore.iconSet.slotPreset,
					params: iconStudioStore.iconSet.params,
				},
				favicon: {
					prompt: iconStudioStore.favicon.prompt,
					params: iconStudioStore.favicon.params,
				},
			};
		}

		return ctx;
	}, [
		pathname,
		themeMode,
		walletStatus,
		studioStore,
		patternStore,
		remixContext,
		iconStudioStore,
	]);

	// Create transport with context in body - recreate when context changes
	const transport = useMemo(() => {
		return new DefaultChatTransport({
			api: "/api/swatchy",
			body: { context },
		});
	}, [context]);

	const { messages, status, error, sendMessage, setMessages, addToolOutput } =
		useChat({
			id: "swatchy-chat",
			transport,
			onToolCall: async ({ toolCall }) => {
				const toolName = toolCall.toolName as ToolName;

				// Check if this is a paid tool
				if (PAID_TOOLS.has(toolName as PricingTool)) {
					// Get price with Prism Pass discount if applicable
					const cost = getPrice(toolName as PricingTool, hasPrismPass);

					// Free when admin (unlimited) or eligible for the one-time free gen
					if (isAdmin || hasFreeGeneration) {
						console.log(
							isAdmin
								? "[Swatchy] Admin — generation is free"
								: "[Swatchy] User eligible for free generation, showing claim UI",
						);
						setPaymentPending({
							toolName,
							toolCallId: toolCall.toolCallId,
							cost: cost, // Keep original cost for display/comparison
							args: toolCall.input as Record<string, unknown>,
							isFree: true,
						});
						return;
					}

					// Set payment pending with toolCallId - UI will show payment request
					setPaymentPending({
						toolName,
						toolCallId: toolCall.toolCallId,
						cost,
						args: toolCall.input as Record<string, unknown>,
					});

					// Don't return anything - we'll complete the tool call after payment
					// The AI will wait for the tool result
					return;
				}

				// Handle free tools immediately
				const result = handleToolExecution(
					toolName,
					toolCall.input as Record<string, unknown>,
				);

				// Provide tool output back to the model
				addToolOutput({
					tool: toolName,
					toolCallId: toolCall.toolCallId,
					output: result,
				});
			},
			onError: (err) => {
				console.error("[Swatchy Chat Error]", err);
			},
		});

	// Store addToolOutput in ref so we can call it after payment
	// Using typeof to get the exact type from useChat return value
	const addToolOutputRef = useRef<typeof addToolOutput>(addToolOutput);
	addToolOutputRef.current = addToolOutput;

	// For "navigate then generate" flows (e.g. blocks/components must be created in /studio/components),
	// store the last user request and re-send it after navigation so Swatchy can continue seamlessly.
	const lastUserMessageRef = useRef<string | null>(null);
	const queuedFollowupRef = useRef<{
		destination: string;
		text: string;
	} | null>(null);

	useEffect(() => {
		const queued = queuedFollowupRef.current;
		if (!queued) return;
		if (pathname !== queued.destination) return;
		if (position !== "expanded") return;

		queuedFollowupRef.current = null;
		sendMessage({ text: queued.text });
	}, [pathname, position, sendMessage]);

	// Restore messages from store after hydration completes
	const hasRestoredRef = useRef(false);
	useEffect(() => {
		// Wait for store to hydrate from localStorage before restoring
		if (!hasHydrated) return;

		if (!hasRestoredRef.current && chatMessages.length > 0) {
			console.log(
				"[Swatchy] Restoring",
				chatMessages.length,
				"messages from storage",
			);
			setMessages(finalizeInterruptedToolCalls(chatMessages));
			hasRestoredRef.current = true;
		} else if (!hasRestoredRef.current) {
			// Mark as restored even if no messages, so sync can start
			hasRestoredRef.current = true;
		}
	}, [hasHydrated, chatMessages, setMessages]);

	// Sync messages to store when they change (only after initial restore)
	useEffect(() => {
		if (hasRestoredRef.current && hasHydrated) {
			setChatMessages(messages);
		}
	}, [messages, setChatMessages, hasHydrated]);

	// Handle pending input when chat opens.
	const hasSentPendingRef = useRef(false);
	useEffect(() => {
		if (position === "expanded" && !hasSentPendingRef.current) {
			// Remix flow: auto-send the rich, intentional context message.
			const pendingMessage = consumePendingMessage();
			if (pendingMessage) {
				hasSentPendingRef.current = true;
				lastUserMessageRef.current = pendingMessage;
				sendMessage({ text: pendingMessage });
			} else {
				// CTA flow (e.g. "create a new theme"): only prefill the input when
				// the conversation is empty; otherwise just open and let the user
				// type. Never auto-send these.
				const prefill = consumePendingPrefill();
				if (prefill) {
					hasSentPendingRef.current = true;
					if (messages.length === 0) {
						setChatInput(prefill);
					}
				}
			}
		}
		// Reset when chat closes
		if (position === "corner") {
			hasSentPendingRef.current = false;
		}
	}, [
		position,
		consumePendingMessage,
		consumePendingPrefill,
		sendMessage,
		messages.length,
		setChatInput,
	]);

	// Compute loading state from status
	const isLoading = status === "submitted" || status === "streaming";

	// Resolve natural language destination to actual path
	const resolveDestination = useCallback(
		(destination: string): { path: string; label: string } => {
			const d = destination.toLowerCase().trim();

			// Direct paths
			if (d.startsWith("/")) {
				return { path: d, label: d };
			}

			// Natural language mappings
			if (d === "home" || d === "homepage") {
				return { path: "/", label: "home" };
			}
			if (
				d.includes("theme") &&
				(d.includes("browse") || d.includes("gallery") || d.includes("all"))
			) {
				return { path: "/themes", label: "themes gallery" };
			}
			if (d === "themes" || d === "browse" || d === "browse themes") {
				return { path: "/themes", label: "themes gallery" };
			}
			if (d.includes("theme") && d.includes("studio")) {
				return { path: "/studio/theme", label: "theme studio" };
			}
			if (d.includes("font") && d.includes("studio")) {
				return { path: "/studio/font", label: "font studio" };
			}
			if (d.includes("pattern") && d.includes("studio")) {
				return { path: "/studio/patterns", label: "pattern studio" };
			}
			if (d.includes("icon") && d.includes("studio")) {
				return { path: "/studio/icon", label: "icon studio" };
			}
			if (d.includes("wallpaper") && d.includes("studio")) {
				return { path: "/studio/wallpaper", label: "wallpaper studio" };
			}
			if (d === "studio" || d === "studios") {
				return { path: "/studio", label: "studios" };
			}
			if (d.includes("my") && d.includes("theme")) {
				return { path: "/market/my-themes", label: "your themes" };
			}
			if (d.includes("my") && d.includes("font")) {
				return { path: "/market/my-fonts", label: "your fonts" };
			}
			if (d === "sell" || d.includes("list") || d.includes("listing")) {
				return { path: "/market/sell", label: "sell page" };
			}
			if (d.includes("market") || d.includes("marketplace")) {
				return { path: "/market", label: "marketplace" };
			}
			if (
				d === "spec" ||
				d === "docs" ||
				d.includes("specification") ||
				d.includes("documentation")
			) {
				return { path: "/spec", label: "specification" };
			}

			// Default fallback - try to use as path or go home
			return { path: "/themes", label: "themes gallery" };
		},
		[],
	);

	// Handle non-paid tool execution (client-side)
	const handleToolExecution = useCallback(
		(toolName: ToolName, args: Record<string, unknown>): string => {
			// Execution-time validation - fail-safe for page-specific tools
			if (!isToolValidForPage(toolName, pathname)) {
				return getToolValidationError(toolName, pathname);
			}

			switch (toolName) {
				case "navigate": {
					const destination = args.destination as string;
					const { path, label } = resolveDestination(destination);

					// If we're navigating to a studio that gates certain generation tools,
					// re-send the last user request once we arrive so the model can call the now-available tools.
					if (
						(path === "/studio/components" ||
							path === "/studio/wallpaper" ||
							path === "/studio/icon") &&
						lastUserMessageRef.current
					) {
						const text = lastUserMessageRef.current;
						// Heuristic: only auto-followup for generation-ish requests to avoid spamming on generic navigation.
						if (
							/\b(generate|create|make|build|block|component|wallpaper|icon|icons|favicon)\b/i.test(
								text,
							)
						) {
							queuedFollowupRef.current = { destination: path, text };
						}
					}

					setNavigating(true);
					router.push(path);
					// Don't close chat - let Swatchy stay open and animate
					return `Navigating to ${label}`;
				}

				case "setThemeColor": {
					const colorKey = args.colorKey as ThemeColorKey;
					const value = args.value as string;
					const mode = (args.mode as ThemeMode) || "both";
					// Use the store - theme-studio subscribes to pending changes
					setThemeColor(colorKey, value, mode);
					return `Set ${colorKey} to ${value} in ${mode} mode`;
				}

				case "setThemeRadius": {
					const radius = args.radius as string;
					setThemeRadius(radius);
					return `Set border radius to ${radius}`;
				}

				case "setThemeFont": {
					const slot = args.slot as FontSlot;
					const fontFamily = args.fontFamily as string;
					setThemeFont(slot, fontFamily);
					return `Set ${slot} font to ${fontFamily}`;
				}

				case "setPatternParams": {
					const patternArgs = args as {
						source?: string;
						scale?: number;
						opacity?: number;
						foregroundColor?: string;
					};
					if (patternArgs.opacity !== undefined) {
						setPatternParams({ opacity: patternArgs.opacity });
					}
					if (patternArgs.foregroundColor) {
						setPatternColors({ fill: patternArgs.foregroundColor });
					}
					return "Updated pattern parameters";
				}

				case "setIconStudioTab": {
					const tab = args.tab as IconStudioTab;
					setIconStudioTab(tab);
					return `Set Icon Studio tab to ${tab}`;
				}

				case "setIconSetPrompt": {
					setIconSetPrompt(args.prompt as string);
					return "Updated icon set prompt";
				}

				case "setIconSetNamesText": {
					setIconSetNamesText(args.iconNamesText as string);
					return "Updated icon names list";
				}

				case "applyIconSetSlotPreset": {
					applyIconSetSlotPreset(args.preset as "theme-token");
					return `Applied icon slot preset: ${args.preset as string}`;
				}

				case "setIconSetParams": {
					const next = args as Partial<{
						style: "outline" | "solid";
						strokeWidth: number;
						padding: number;
						size: 16 | 20 | 24;
					}>;
					setIconSetParams(next);
					return "Updated icon set parameters";
				}

				case "setIconSetStyle": {
					setIconSetParams({ style: args.style as "outline" | "solid" });
					return "Updated icon set style";
				}

				case "setIconSetStrokeWidth": {
					setIconSetParams({ strokeWidth: args.strokeWidth as number });
					return "Updated icon set stroke width";
				}

				case "setIconSetPadding": {
					setIconSetParams({ padding: args.padding as number });
					return "Updated icon set padding";
				}

				case "setIconSetSize": {
					setIconSetParams({ size: args.size as 16 | 20 | 24 });
					return "Updated icon set size";
				}

				case "setFaviconPrompt": {
					setFaviconPrompt(args.prompt as string);
					return "Updated favicon prompt";
				}

				case "setFaviconParams": {
					const next = args as Partial<{
						shape: "glyph" | "badge";
						background: "transparent" | "theme" | "solid";
						foreground: string;
						backgroundColor: string;
						size: 32 | 64 | 128;
						padding: number;
						radius: number;
					}>;
					setFaviconParams(next);
					return "Updated favicon parameters";
				}

				case "setFaviconShape": {
					setFaviconParams({ shape: args.shape as "glyph" | "badge" });
					return "Updated favicon shape";
				}

				case "setFaviconBackground": {
					setFaviconParams({
						background: args.background as "transparent" | "theme" | "solid",
					});
					return "Updated favicon background";
				}

				case "setFaviconForeground": {
					setFaviconParams({ foreground: args.foreground as string });
					return "Updated favicon foreground";
				}

				case "setFaviconBackgroundColor": {
					setFaviconParams({ backgroundColor: args.backgroundColor as string });
					return "Updated favicon background color";
				}

				case "setFaviconSize": {
					setFaviconParams({ size: args.size as 32 | 64 | 128 });
					return "Updated favicon size";
				}

				case "setFaviconPadding": {
					setFaviconParams({ padding: args.padding as number });
					return "Updated favicon padding";
				}

				case "setFaviconRadius": {
					setFaviconParams({ radius: args.radius as number });
					return "Updated favicon radius";
				}

				case "prepareInscribe":
					setNavigating(true);
					router.push(
						`/studio/${args.assetType}?inscribe=true&name=${encodeURIComponent(args.name as string)}`,
					);
					return `Opening ${args.assetType} studio for inscription`;

				case "prepareListing":
					setNavigating(true);
					router.push(
						`/market/sell?origin=${encodeURIComponent(args.origin as string)}&price=${args.priceSatoshis}`,
					);
					return "Opening marketplace listing page";

				case "getExchangeRate":
					// TODO: Fetch real exchange rate
					return "Exchange rate lookup not yet implemented";

				default:
					return `Unknown tool: ${toolName}`;
			}
		},
		[
			router,
			setNavigating,
			setThemeColor,
			setThemeRadius,
			setThemeFont,
			setPatternParams,
			setPatternColors,
			resolveDestination,
			pathname,
			setIconStudioTab,
			setIconSetPrompt,
			setIconSetNamesText,
			applyIconSetSlotPreset,
			setIconSetParams,
			setFaviconPrompt,
			setFaviconParams,
		],
	);

	// Execute paid tool after payment is confirmed
	const executePaidTool = useCallback(
		async (
			toolName: ToolName,
			toolCallId: string,
			args: Record<string, unknown>,
			txid: string,
		): Promise<string | object> => {
			switch (toolName) {
				case "generateTheme": {
					setGenerating(toolName, "Generating your theme...");
					try {
						const response = await fetch("/api/generate-theme", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								prompt: args.prompt,
								primaryColor: args.primaryColor,
								radius: args.radius,
								style: args.style,
								userId: ordAddress,
								paymentTxid: txid,
							}),
						});

						if (!response.ok) {
							throw new Error(
								await readApiError(response, "Failed to generate theme"),
							);
						}

						const data = await response.json();

						// UNIFIED FLOW: Always save to drafts first (ensures persistence)
						saveAIThemeToDrafts(data.theme, txid);

						// Set in Swatchy store - theme-studio will react to this for modal/confetti
						setAIGeneratedTheme(data.theme, txid);

						// If already on theme studio, dispatch event to load theme directly
						if (pathname === "/studio/theme") {
							dispatchRemixTheme(data.theme);
							setGenerationSuccess(data.theme);
							return `Theme "${data.theme.name}" generated and saved to drafts!`;
						}

						// Otherwise hard-navigate to the studio with the FULL theme in the
						// URL. This is a single SSR load (like pasting the link), so the
						// generated theme is rendered from the URL on arrival. The old
						// approach — soft-push to a clean /studio/theme then rewrite the
						// URL client-side — loaded the session theme first and never
						// re-read the rewritten styles, so you saw the previous theme; it
						// also turned the long URL into a failing RSC fetch.
						setNavigating(true);
						setGenerationSuccess(data.theme);
						const params = new URLSearchParams({
							styles: btoa(JSON.stringify(data.theme.styles)),
							name: data.theme.name,
						});
						window.location.href = `/studio/theme?${params.toString()}`;
						return `Theme "${data.theme.name}" generated! Opening studio...`;
					} catch (err) {
						const errorMsg =
							err instanceof Error ? err.message : "Generation failed";
						// Store failed request context for free retry (already paid)
						setGenerationError(errorMsg, { toolName, toolCallId, args, txid });
						return `Error generating theme: ${errorMsg}`;
					}
				}

				case "generatePattern": {
					setGenerating(toolName, "Generating your pattern...");
					try {
						const response = await fetch("/api/generate-pattern", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								prompt: args.prompt,
								colorMode: args.colorMode,
							}),
						});

						if (!response.ok) {
							throw new Error(
								await readApiError(response, "Failed to generate pattern"),
							);
						}

						const data = await response.json();
						setGenerationSuccess(data);
						return `Pattern generated successfully! Payment txid: ${txid}. Navigate to the Pattern Studio to view it.`;
					} catch (err) {
						const errorMsg =
							err instanceof Error ? err.message : "Generation failed";
						// Store failed request context for free retry (already paid)
						setGenerationError(errorMsg, { toolName, toolCallId, args, txid });
						return `Error generating pattern: ${errorMsg}`;
					}
				}

				case "generateIconSet": {
					setGenerating(toolName, "Generating your icon set...");
					try {
						const state = useIconStudioStore.getState();
						const iconNamesText =
							(typeof args.iconNamesText === "string"
								? (args.iconNamesText as string)
								: state.iconSet.iconNamesText) || "";

						const iconNames = iconNamesText
							.split("\n")
							.map((l) => l.trim())
							.filter(Boolean);

						const response = await fetch("/api/generate-icon-set", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								prompt:
									(typeof args.prompt === "string"
										? (args.prompt as string)
										: state.iconSet.prompt) || "",
								iconNames,
								params: {
									...state.iconSet.params,
									...(typeof args.params === "object" && args.params
										? (args.params as Record<string, unknown>)
										: {}),
								},
							}),
						});

						if (!response.ok) {
							throw new Error(
								await readApiError(response, "Failed to generate icon set"),
							);
						}

						const data = await response.json();
						setGeneratedIconSet(data.generated);

						if (pathname !== "/studio/icon") {
							setNavigating(true);
							router.push("/studio/icon");
						}

						setGenerationSuccess(data);
						return `Icon set generated! (${iconNames.length} icons)`;
					} catch (err) {
						const errorMsg =
							err instanceof Error ? err.message : "Generation failed";
						setGenerationError(errorMsg, { toolName, toolCallId, args, txid });
						return `Error generating icon set: ${errorMsg}`;
					}
				}

				case "generateFavicon": {
					setGenerating(toolName, "Generating your favicon...");
					try {
						const state = useIconStudioStore.getState();
						const response = await fetch("/api/generate-favicon", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								prompt:
									(typeof args.prompt === "string"
										? (args.prompt as string)
										: state.favicon.prompt) || "",
								params: {
									...state.favicon.params,
									...(typeof args.params === "object" && args.params
										? (args.params as Record<string, unknown>)
										: {}),
								},
							}),
						});

						if (!response.ok) {
							throw new Error(
								await readApiError(response, "Failed to generate favicon"),
							);
						}

						const data = await response.json();
						setGeneratedFavicon(data.generated);

						if (pathname !== "/studio/icon") {
							setNavigating(true);
							router.push("/studio/icon");
						}

						setGenerationSuccess(data);
						return "Favicon generated!";
					} catch (err) {
						const errorMsg =
							err instanceof Error ? err.message : "Generation failed";
						setGenerationError(errorMsg, { toolName, toolCallId, args, txid });
						return `Error generating favicon: ${errorMsg}`;
					}
				}

				case "generateFont": {
					setGenerating(
						toolName,
						"Starting font generation (this may take 1-3 minutes)...",
					);
					try {
						const response = await fetch("/api/generate-font", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								prompt: args.prompt,
								preset: args.preset,
							}),
						});

						if (!response.ok) {
							throw new Error(
								await readApiError(response, "Failed to generate font"),
							);
						}

						const data = await response.json();
						setGenerationSuccess(data);
						return `Font generation started! Payment txid: ${txid}. This is an async process - check back in a few minutes.`;
					} catch (err) {
						const errorMsg =
							err instanceof Error ? err.message : "Generation failed";
						// Store failed request context for free retry (already paid)
						setGenerationError(errorMsg, { toolName, toolCallId, args, txid });
						return `Error generating font: ${errorMsg}`;
					}
				}

				case "generateBlock": {
					try {
						// biome-ignore lint/suspicious/noExplicitAny: generation response shape varies per endpoint
						let data: any = null;
						let previousErrors: string[] = [];
						let lastErrorMsg = "Generation failed";

						for (let attempt = 1; attempt <= 3; attempt++) {
							setGenerating(
								toolName,
								`Attempt ${attempt}/3: Generating your block...`,
							);

							const response = await fetch("/api/generate-block", {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
									prompt: args.prompt,
									name: args.name,
									includeHook: args.includeHook,
									userId: ordAddress,
									paymentTxid: txid,
									attempt,
									previousErrors,
								}),
							});

							data = await response.json();

							if (response.ok) break;

							// Handle validation failure (422) by looping back to AI with errors
							if (response.status === 422) {
								const errors = data.validation?.errors || [];
								previousErrors = Array.isArray(errors) ? errors : [];
								lastErrorMsg =
									previousErrors.length > 0
										? previousErrors.join("; ")
										: data.error || "Validation failed";
								continue;
							}

							throw new Error(data.error || "Failed to generate block");
						}

						if (!data?.block) {
							const errorMsg = lastErrorMsg;
							setGenerationError(errorMsg, {
								toolName,
								toolCallId,
								args,
								txid,
							});
							return `Error generating block: ${errorMsg}`;
						}

						console.log(
							"[Swatchy] Block generated:",
							data.block?.name,
							"draftId:",
							data.draftId,
						);

						// Cache the generated item for Generative UI
						const cacheId = data.draftId || `${txid}-${Date.now()}`;
						const item = {
							manifest: data.block,
							txid,
							timestamp: Date.now(),
							validation: data.validation,
							previewUrl: data.previewUrl,
						};

						// Update global preview and cache
						setGeneratedRegistryItem(
							data.block,
							txid,
							data.validation,
							data.previewUrl,
						);
						cacheRegistryItem(cacheId, item);
						setGenerationSuccess(data.block);

						const fileCount = data.block.files.length;
						const deps =
							data.block.registryDependencies.length > 0
								? ` Uses: ${data.block.registryDependencies.join(", ")}.`
								: "";

						const savedMsg = data.draftId ? " Saved to your drafts." : "";
						const attemptsMsg =
							data.validation?.attempts > 1
								? ` (validated after ${data.validation.attempts} attempts)`
								: "";

						const summary = `Block "${data.block.name}" generated!${savedMsg} ${fileCount} file(s).${deps}${attemptsMsg} You can preview it in the chat or inscribe it to make it installable via shadcn CLI.`;

						// Return structured output for Generative UI
						return {
							summary,
							cacheId,
							type: "registry:block",
							name: data.block.name,
						};
					} catch (err) {
						const errorMsg =
							err instanceof Error ? err.message : "Generation failed";
						setGenerationError(errorMsg, { toolName, toolCallId, args, txid });
						return `Error generating block: ${errorMsg}`;
					}
				}

				case "generateComponent": {
					try {
						// biome-ignore lint/suspicious/noExplicitAny: generation response shape varies per endpoint
						let data: any = null;
						let previousErrors: string[] = [];
						let lastErrorMsg = "Generation failed";

						for (let attempt = 1; attempt <= 3; attempt++) {
							setGenerating(
								toolName,
								`Attempt ${attempt}/3: Generating your component...`,
							);

							const response = await fetch("/api/generate-component", {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
									prompt: args.prompt,
									name: args.name,
									variants: args.variants,
									userId: ordAddress,
									paymentTxid: txid,
									attempt,
									previousErrors,
								}),
							});

							data = await response.json();

							if (response.ok) break;

							if (response.status === 422) {
								const errors = data.validation?.errors || [];
								previousErrors = Array.isArray(errors) ? errors : [];
								lastErrorMsg =
									previousErrors.length > 0
										? previousErrors.join("; ")
										: data.error || "Validation failed";
								continue;
							}

							throw new Error(data.error || "Failed to generate component");
						}

						if (!data?.component) {
							const errorMsg = lastErrorMsg;
							setGenerationError(errorMsg, {
								toolName,
								toolCallId,
								args,
								txid,
							});
							return `Error generating component: ${errorMsg}`;
						}

						// Cache the generated item for Generative UI
						const cacheId = data.draftId || `${txid}-${Date.now()}`;
						const item = {
							manifest: data.component,
							txid,
							timestamp: Date.now(),
							validation: data.validation,
							previewUrl: data.previewUrl,
						};

						// Update global preview and cache
						setGeneratedRegistryItem(
							data.component,
							txid,
							data.validation,
							data.previewUrl,
						);
						cacheRegistryItem(cacheId, item);
						setGenerationSuccess(data.component);

						const deps =
							data.component.registryDependencies.length > 0
								? ` Based on: ${data.component.registryDependencies.join(", ")}.`
								: "";

						const savedMsg = data.draftId ? " Saved to your drafts." : "";
						const attemptsMsg =
							data.validation?.attempts > 1
								? ` (validated after ${data.validation.attempts} attempts)`
								: "";

						const summary = `Component "${data.component.name}" generated!${savedMsg}${deps}${attemptsMsg} You can preview the code in the chat or inscribe it to make it installable via shadcn CLI.`;

						// Return structured output for Generative UI
						return {
							summary,
							cacheId,
							type: "registry:component",
							name: data.component.name,
						};
					} catch (err) {
						const errorMsg =
							err instanceof Error ? err.message : "Generation failed";
						setGenerationError(errorMsg, { toolName, toolCallId, args, txid });
						return `Error generating component: ${errorMsg}`;
					}
				}

				default:
					return `Unknown paid tool: ${toolName}`;
			}
		},
		[
			setGenerating,
			setGenerationSuccess,
			setGenerationError,
			setNavigating,
			setAIGeneratedTheme,
			setGeneratedRegistryItem,
			router,
			pathname,
			setGeneratedIconSet,
			setGeneratedFavicon,
			ordAddress,
			cacheRegistryItem,
		],
	);

	// Safely add tool error output, only if the tool call still exists in messages
	const safeAddToolError = useCallback(
		(toolName: ToolName, toolCallId: string, errorText: string) => {
			if (!addToolOutputRef.current || messages.length === 0) return;

			// Check if the tool call actually exists in the messages
			// Parts with tool-* type have toolCallId directly on the part
			const hasToolCall = messages.some((m) =>
				m.parts?.some(
					(p) =>
						p.type?.startsWith("tool-") &&
						"toolCallId" in p &&
						p.toolCallId === toolCallId,
				),
			);

			if (hasToolCall) {
				try {
					addToolOutputRef.current({
						tool: toolName,
						toolCallId,
						state: "output-error",
						errorText,
					});
				} catch (err) {
					console.warn("[Swatchy] Failed to add tool error output:", err);
				}
			}
		},
		[messages],
	);

	// Handle payment confirmation for paid tools
	const handlePaymentConfirmed = useCallback(async () => {
		if (!paymentPending || !addToolOutputRef.current) return;

		const { toolName, toolCallId, args, cost, isFree } = paymentPending;

		// Clear any prior error before re-attempting (retry path).
		setPaymentError(null);

		try {
			let txid: string | null = null;

			if (isFree) {
				console.log("[Payment] Processing free generation claim");
				txid = "free-first-gen";
				setHasFreeGeneration(false);
			} else {
				// Process payment via Yours Wallet
				const result = await sendPayment(FEE_ADDRESS, cost);
				txid = result?.txid || null;
			}

			if (txid) {
				// Payment successful (or free claim) - confirm in store
				confirmPayment(txid);

				// Execute the actual tool and get the result
				const toolResult = await executePaidTool(
					toolName,
					toolCallId,
					args,
					txid,
				);

				// Provide the tool output back to the model to complete the tool call
				addToolOutputRef.current({
					tool: toolName,
					toolCallId,
					output: toolResult,
				});
			} else {
				// Payment returned null - treat as a wallet-level cancel.
				console.log("[Payment] User cancelled or wallet returned null");
				cancelPayment();
				clearGeneration();

				// Only inform the AI if tool call still exists in messages
				safeAddToolError(toolName, toolCallId, "Payment was cancelled by user");
			}
		} catch (error) {
			console.error("[Payment Error]", error);
			// The new wallet can't report balance up front, so insufficient funds
			// (or any payment failure) surfaces here. Keep the payment card open and
			// the tool call pending so the user can add funds and retry without
			// re-prompting Swatchy.
			setPaymentError(
				error instanceof Error ? error.message : "Payment failed",
			);
		}
	}, [
		paymentPending,
		sendPayment,
		confirmPayment,
		cancelPayment,
		clearGeneration,
		executePaidTool,
		safeAddToolError,
	]);

	// Handle explicit cancel button click
	const handlePaymentCancelled = useCallback(() => {
		if (!paymentPending) return;

		const { toolName, toolCallId } = paymentPending;

		console.log("[Payment] User clicked cancel button");
		setPaymentError(null);
		cancelPayment();
		clearGeneration();

		// Use the safe helper to inform the AI that payment was cancelled
		safeAddToolError(toolName, toolCallId, "Payment was cancelled by user");
	}, [paymentPending, cancelPayment, clearGeneration, safeAddToolError]);

	// Form submission handler
	const handleSubmit = useCallback(
		async (e?: React.FormEvent) => {
			e?.preventDefault();
			if (!chatInput.trim() || isLoading) return;

			// Clear any previous generation state
			clearGeneration();

			const message = chatInput.trim();
			lastUserMessageRef.current = message;
			setChatInput(""); // Clear input immediately

			await sendMessage({
				text: message,
			});
		},
		[chatInput, isLoading, sendMessage, clearGeneration, setChatInput],
	);

	// Handle free retry for failed paid tool (user already paid, just retry the generation)
	const handleRetry = useCallback(async () => {
		if (!failedRequest) return;

		const { toolName, toolCallId, args, txid } = failedRequest;

		// Clear the failed state first
		clearFailedRequest();

		// Re-execute the paid tool with the original payment txid
		await executePaidTool(toolName, toolCallId, args, txid);
	}, [failedRequest, clearFailedRequest, executePaidTool]);

	return {
		messages,
		input: chatInput,
		setInput: setChatInput,
		handleSubmit,
		isLoading,
		error,
		paymentPending,
		handlePaymentConfirmed,
		handlePaymentCancelled,
		handleRetry,
		walletStatus,
		paymentError,
		setMessages,
		generation,
		failedRequest,
	};
}
