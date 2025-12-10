"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useSwatchyStore } from "./swatchy-store";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import {
	PAID_TOOLS,
	TOOL_COSTS,
	FEE_ADDRESS,
} from "@/lib/agent/config";
import type { ToolName } from "@/lib/agent/tools";
import { useStudioStore, type ThemeColorKey, type FontSlot, type ThemeMode } from "@/lib/stores/studio-store";
import { usePatternStore } from "@/lib/pattern-store";

export function useSwatchyChat() {
	const router = useRouter();
	const { sendPayment, status: walletStatus, balance } = useYoursWallet();
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
	} = useSwatchyStore();

	// Studio stores for tool execution
	const { setThemeColor, setThemeRadius, setThemeFont } = useStudioStore();
	const { setParams: setPatternParams, setColors: setPatternColors } = usePatternStore();

	// In v6, input state is managed externally
	const [input, setInput] = useState("");

	const {
		messages,
		status,
		error,
		sendMessage,
		setMessages,
		addToolOutput,
	} = useChat({
		id: "swatchy-chat",
		transport: new DefaultChatTransport({
			api: "/api/swatchy",
		}),
		onToolCall: async ({ toolCall }) => {
			const toolName = toolCall.toolName as ToolName;

			// Check if this is a paid tool
			if (PAID_TOOLS.has(toolName)) {
				const cost = TOOL_COSTS[toolName as keyof typeof TOOL_COSTS];

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
		[router, setNavigating, walletStatus, balance, setThemeColor, setThemeRadius, setThemeFont, setPatternParams, setPatternColors, resolveDestination],
	);

	// Execute paid tool after payment is confirmed
	const executePaidTool = useCallback(
		async (toolName: ToolName, toolCallId: string, args: Record<string, unknown>, txid: string): Promise<string> => {
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
						setGenerationSuccess(data.theme);

						// Store the theme for the studio
						if (typeof window !== "undefined") {
							sessionStorage.setItem("swatchy-generated-theme", JSON.stringify(data.theme));
						}

						return `Theme "${data.theme.name}" generated successfully! Payment txid: ${txid}. You can now navigate to the Theme Studio to view and customize it.`;
					} catch (err) {
						const errorMsg = err instanceof Error ? err.message : "Generation failed";
						setGenerationError(errorMsg);
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
						setGenerationError(errorMsg);
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
						setGenerationError(errorMsg);
						return `Error generating font: ${errorMsg}`;
					}
				}

				default:
					return `Unknown paid tool: ${toolName}`;
			}
		},
		[setGenerating, setGenerationSuccess, setGenerationError],
	);

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
			}
		} catch (error) {
			console.error("[Payment Error]", error);
			// Cancel payment on error
			cancelPayment();

			// Use output-error state per AI SDK v6 best practices
			addToolOutputRef.current({
				tool: toolName,
				toolCallId,
				state: "output-error",
				errorText: error instanceof Error ? error.message : "Payment failed",
			});
		}
	}, [paymentPending, sendPayment, confirmPayment, cancelPayment, executePaidTool]);

	// Form submission handler
	const handleSubmit = useCallback(
		async (e?: React.FormEvent) => {
			e?.preventDefault();
			if (!input.trim() || isLoading) return;

			// Clear any previous generation state
			clearGeneration();

			const message = input.trim();
			setInput(""); // Clear input immediately

			await sendMessage({
				text: message,
			});
		},
		[input, isLoading, sendMessage, clearGeneration],
	);

	return {
		messages,
		input,
		setInput,
		handleSubmit,
		isLoading,
		error,
		paymentPending,
		handlePaymentConfirmed,
		cancelPayment,
		walletStatus,
		balance,
		setMessages,
		generation,
	};
}
