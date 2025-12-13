"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSwatchyStore } from "./swatchy-store";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import {
	FEE_ADDRESS,
	type SwatchyContext,
} from "@/lib/agent/config";
import { PAID_TOOLS, getPrice, type PricingTool } from "@/lib/pricing";
import type { ToolName } from "@/lib/agent/tools";
import { isToolValidForPage, getToolValidationError } from "@/lib/agent/tool-routing";
import { useStudioStore, type ThemeColorKey, type FontSlot, type ThemeMode } from "@/lib/stores/studio-store";
import { usePatternStore } from "@/lib/pattern-store";
import { dispatchRemixTheme, saveAIThemeToDrafts } from "@/components/theme-gallery";
import { useTheme } from "@/components/theme-provider";

export function useSwatchyChat() {
	const router = useRouter();
	const pathname = usePathname();
	const { mode: themeMode } = useTheme();
	const { sendPayment, status: walletStatus, balance, addresses, hasPrismPass } = useYoursWallet();
	const ordAddress = addresses?.ordAddress;
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
		position,
		setAIGeneratedTheme,
		setGeneratedRegistryItem,
		hasHydrated,
	} = useSwatchyStore();

	// Studio stores for tool execution
	const studioStore = useStudioStore();
	const { setThemeColor, setThemeRadius, setThemeFont } = studioStore;
	const patternStore = usePatternStore();
	const { setParams: setPatternParams, setColors: setPatternColors } = patternStore;

	const { cacheRegistryItem } = useSwatchyStore();

	// Build context to pass to API - includes current state for Swatchy's awareness
	const context = useMemo((): SwatchyContext => {
		const ctx: SwatchyContext = {
			currentPage: pathname,
			themeMode: themeMode as "light" | "dark",
			walletConnected: walletStatus === "connected",
			walletBalance: balance?.satoshis,
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

		return ctx;
	}, [pathname, themeMode, walletStatus, balance, studioStore, patternStore, remixContext]);

	// Create transport with context in body - recreate when context changes
	const transport = useMemo(() => {
		return new DefaultChatTransport({
			api: "/api/swatchy",
			body: { context },
		});
	}, [context]);

	const {
		messages,
		status,
		error,
		sendMessage,
		setMessages,
		addToolOutput,
	} = useChat({
		id: "swatchy-chat",
		transport,
		onToolCall: async ({ toolCall }) => {
			const toolName = toolCall.toolName as ToolName;

			// Check if this is a paid tool
			if (PAID_TOOLS.has(toolName as PricingTool)) {
				// Get price with Prism Pass discount if applicable
				const cost = getPrice(toolName as PricingTool, hasPrismPass);

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
			const result = handleToolExecution(toolName, toolCall.input as Record<string, unknown>);

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

	// Restore messages from store after hydration completes
	const hasRestoredRef = useRef(false);
	useEffect(() => {
		// Wait for store to hydrate from localStorage before restoring
		if (!hasHydrated) return;

		if (!hasRestoredRef.current && chatMessages.length > 0) {
			console.log("[Swatchy] Restoring", chatMessages.length, "messages from storage");
			setMessages(chatMessages);
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

	// Handle pending message when chat opens (e.g., from remix button)
	const hasSentPendingRef = useRef(false);
	useEffect(() => {
		if (position === "expanded" && !hasSentPendingRef.current) {
			const pendingMessage = consumePendingMessage();
			if (pendingMessage) {
				hasSentPendingRef.current = true;
				// Send the pending message automatically
				sendMessage({ text: pendingMessage });
			}
		}
		// Reset when chat closes
		if (position === "corner") {
			hasSentPendingRef.current = false;
		}
	}, [position, consumePendingMessage, sendMessage]);

	// Compute loading state from status
	const isLoading = status === "submitted" || status === "streaming";

	// Resolve natural language destination to actual path
	const resolveDestination = useCallback((destination: string): { path: string; label: string } => {
		const d = destination.toLowerCase().trim();

		// Direct paths
		if (d.startsWith("/")) {
			return { path: d, label: d };
		}

		// Natural language mappings
		if (d === "home" || d === "homepage") {
			return { path: "/", label: "home" };
		}
		if (d.includes("theme") && (d.includes("browse") || d.includes("gallery") || d.includes("all"))) {
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
		if (d === "spec" || d === "docs" || d.includes("specification") || d.includes("documentation")) {
			return { path: "/spec", label: "specification" };
		}

		// Default fallback - try to use as path or go home
		return { path: "/themes", label: "themes gallery" };
	}, []);

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

				case "prepareInscribe":
					setNavigating(true);
					router.push(`/studio/${args.assetType}?inscribe=true&name=${encodeURIComponent(args.name as string)}`);
					return `Opening ${args.assetType} studio for inscription`;

				case "prepareListing":
					setNavigating(true);
					router.push(`/market/sell?origin=${encodeURIComponent(args.origin as string)}&price=${args.priceSatoshis}`);
					return "Opening marketplace listing page";

				case "getWalletBalance":
					if (walletStatus !== "connected") {
						return "Wallet not connected. Please connect your Yours Wallet to check balance.";
					}
					return `Current balance: ${balance?.satoshis?.toLocaleString() ?? 0} satoshis`;

				case "getExchangeRate":
					// TODO: Fetch real exchange rate
					return "Exchange rate lookup not yet implemented";

				default:
					return `Unknown tool: ${toolName}`;
			}
		},
		[router, setNavigating, walletStatus, balance, setThemeColor, setThemeRadius, setThemeFont, setPatternParams, setPatternColors, resolveDestination, pathname],
	);

	// Execute paid tool after payment is confirmed
	const executePaidTool = useCallback(
		async (toolName: ToolName, toolCallId: string, args: Record<string, unknown>, txid: string): Promise<string | object> => {
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
							}),
						});

						if (!response.ok) {
							const error = await response.json();
							throw new Error(error.error || "Failed to generate theme");
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

						// Otherwise navigate to studio (it will pick up aiGeneratedTheme from store)
						setNavigating(true);
						router.push("/studio/theme");

						setGenerationSuccess(data.theme);
						return `Theme "${data.theme.name}" generated! Opening studio...`;
					} catch (err) {
						const errorMsg = err instanceof Error ? err.message : "Generation failed";
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
							const error = await response.json();
							throw new Error(error.error || "Failed to generate pattern");
						}

						const data = await response.json();
						setGenerationSuccess(data);
						return `Pattern generated successfully! Payment txid: ${txid}. Navigate to the Pattern Studio to view it.`;
					} catch (err) {
						const errorMsg = err instanceof Error ? err.message : "Generation failed";
						// Store failed request context for free retry (already paid)
						setGenerationError(errorMsg, { toolName, toolCallId, args, txid });
						return `Error generating pattern: ${errorMsg}`;
					}
				}

				case "generateFont": {
					setGenerating(toolName, "Starting font generation (this may take 1-3 minutes)...");
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
							const error = await response.json();
							throw new Error(error.error || "Failed to generate font");
						}

						const data = await response.json();
						setGenerationSuccess(data);
						return `Font generation started! Payment txid: ${txid}. This is an async process - check back in a few minutes.`;
					} catch (err) {
						const errorMsg = err instanceof Error ? err.message : "Generation failed";
						// Store failed request context for free retry (already paid)
						setGenerationError(errorMsg, { toolName, toolCallId, args, txid });
						return `Error generating font: ${errorMsg}`;
					}
				}

				case "generateBlock": {
					setGenerating(toolName, "Generating your block...");
					try {
						const response = await fetch("/api/generate-block", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								prompt: args.prompt,
								name: args.name,
								includeHook: args.includeHook,
								userId: ordAddress,
								paymentTxid: txid,
							}),
						});

						const data = await response.json();

						// Handle validation failure (422)
						if (response.status === 422) {
							const errors = data.validation?.errors || [];
							const attempts = data.attempts || 1;
							const errorMsg = `Code validation failed after ${attempts} attempt(s): ${errors.join("; ")}`;
							setGenerationError(errorMsg, { toolName, toolCallId, args, txid });
							return `Error generating block: ${errorMsg}. You can retry for free using the Retry button.`;
						}

						if (!response.ok) {
							throw new Error(data.error || "Failed to generate block");
						}

						console.log("[Swatchy] Block generated:", data.block?.name, "draftId:", data.draftId);

						if (!data.block) {
							console.error("[Swatchy] No block in response:", data);
							throw new Error("No block returned from API");
						}

						// Cache the generated item for Generative UI
						const cacheId = data.draftId || `${txid}-${Date.now()}`;
						const item = {
							manifest: data.block,
							txid,
							timestamp: Date.now(),
							validation: data.validation,
						};
						
						// Update global preview and cache
						setGeneratedRegistryItem(data.block, txid, data.validation);
						cacheRegistryItem(cacheId, item);
						setGenerationSuccess(data.block);

						const fileCount = data.block.files.length;
						const deps = data.block.registryDependencies.length > 0
							? ` Uses: ${data.block.registryDependencies.join(", ")}.`
							: "";

						const savedMsg = data.draftId ? " Saved to your drafts." : "";
						const attemptsMsg = data.validation?.attempts > 1
							? ` (validated after ${data.validation.attempts} attempts)`
							: "";

						const summary = `Block "${data.block.name}" generated!${savedMsg} ${fileCount} file(s).${deps}${attemptsMsg} You can preview it in the chat or inscribe it to make it installable via shadcn CLI.`;

						// Return structured output for Generative UI
						return {
							summary,
							cacheId,
							type: "registry:block",
							name: data.block.name
						};
					} catch (err) {
						const errorMsg = err instanceof Error ? err.message : "Generation failed";
						setGenerationError(errorMsg, { toolName, toolCallId, args, txid });
						return `Error generating block: ${errorMsg}`;
					}
				}

				case "generateComponent": {
					setGenerating(toolName, "Generating your component...");
					try {
						const response = await fetch("/api/generate-component", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								prompt: args.prompt,
								name: args.name,
								variants: args.variants,
								userId: ordAddress,
								paymentTxid: txid,
							}),
						});

						const data = await response.json();

						// Handle validation failure (422)
						if (response.status === 422) {
							const errors = data.validation?.errors || [];
							const attempts = data.attempts || 1;
							const errorMsg = `Code validation failed after ${attempts} attempt(s): ${errors.join("; ")}`;
							setGenerationError(errorMsg, { toolName, toolCallId, args, txid });
							return `Error generating component: ${errorMsg}. You can retry for free using the Retry button.`;
						}

						if (!response.ok) {
							throw new Error(data.error || "Failed to generate component");
						}

						// Cache the generated item for Generative UI
						const cacheId = data.draftId || `${txid}-${Date.now()}`;
						const item = {
							manifest: data.component,
							txid,
							timestamp: Date.now(),
							validation: data.validation,
						};

						// Update global preview and cache
						setGeneratedRegistryItem(data.component, txid, data.validation);
						cacheRegistryItem(cacheId, item);
						setGenerationSuccess(data.component);

						const deps = data.component.registryDependencies.length > 0
							? ` Based on: ${data.component.registryDependencies.join(", ")}.`
							: "";

						const savedMsg = data.draftId ? " Saved to your drafts." : "";
						const attemptsMsg = data.validation?.attempts > 1
							? ` (validated after ${data.validation.attempts} attempts)`
							: "";

						const summary = `Component "${data.component.name}" generated!${savedMsg}${deps}${attemptsMsg} You can preview the code in the chat or inscribe it to make it installable via shadcn CLI.`;

						// Return structured output for Generative UI
						return {
							summary,
							cacheId,
							type: "registry:component",
							name: data.component.name
						};
					} catch (err) {
						const errorMsg = err instanceof Error ? err.message : "Generation failed";
						setGenerationError(errorMsg, { toolName, toolCallId, args, txid });
						return `Error generating component: ${errorMsg}`;
					}
				}

				default:
					return `Unknown paid tool: ${toolName}`;
			}
		},
		[setGenerating, setGenerationSuccess, setGenerationError, setNavigating, setAIGeneratedTheme, setGeneratedRegistryItem, router, pathname],
	);

	// Safely add tool error output, only if the tool call still exists in messages
	const safeAddToolError = useCallback((toolName: ToolName, toolCallId: string, errorText: string) => {
		if (!addToolOutputRef.current || messages.length === 0) return;

		// Check if the tool call actually exists in the messages
		// Parts with tool-* type have toolCallId directly on the part
		const hasToolCall = messages.some(
			(m) => m.parts?.some((p) => p.type?.startsWith("tool-") && "toolCallId" in p && p.toolCallId === toolCallId)
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
	}, [messages]);

	// Handle payment confirmation for paid tools
	const handlePaymentConfirmed = useCallback(async () => {
		if (!paymentPending || !addToolOutputRef.current) return;

		const { toolName, toolCallId, args, cost } = paymentPending;

		try {
			// Process payment via Yours Wallet
			const result = await sendPayment(FEE_ADDRESS, cost);

			if (result?.txid) {
				// Payment successful - confirm in store
				confirmPayment(result.txid);

				// Execute the actual tool and get the result
				const toolResult = await executePaidTool(toolName, toolCallId, args, result.txid);

				// Provide the tool output back to the model to complete the tool call
				addToolOutputRef.current({
					tool: toolName,
					toolCallId,
					output: toolResult,
				});
			} else {
				// Payment returned null - user cancelled or wallet error
				console.log("[Payment] User cancelled or wallet returned null");
				cancelPayment();
				clearGeneration();

				// Only inform the AI if tool call still exists in messages
				safeAddToolError(toolName, toolCallId, "Payment was cancelled by user");
			}
		} catch (error) {
			console.error("[Payment Error]", error);
			// Cancel payment on error
			cancelPayment();
			clearGeneration();

			// Only inform the AI if tool call still exists in messages
			safeAddToolError(toolName, toolCallId, error instanceof Error ? error.message : "Payment failed");
		}
	}, [paymentPending, sendPayment, confirmPayment, cancelPayment, clearGeneration, executePaidTool, safeAddToolError]);

	// Handle explicit cancel button click
	const handlePaymentCancelled = useCallback(() => {
		if (!paymentPending) return;

		const { toolName, toolCallId } = paymentPending;

		console.log("[Payment] User clicked cancel button");
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
		balance,
		setMessages,
		generation,
		failedRequest,
	};
}
