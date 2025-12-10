"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
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
		closeChat,
		setNavigating,
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

				// Set payment pending - UI will show payment request
				setPaymentPending({
					toolName,
					cost,
					args: toolCall.input as Record<string, unknown>,
				});

				// Return - payment will be handled separately
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

	// Compute loading state from status
	const isLoading = status === "submitted" || status === "streaming";

	// Handle non-paid tool execution (client-side)
	const handleToolExecution = useCallback(
		(toolName: ToolName, args: Record<string, unknown>): string => {
			switch (toolName) {
				case "navigate": {
					const path = args.path as string;
					const params = args.params as Record<string, string> | undefined;
					const url = params
						? `${path}?${new URLSearchParams(params).toString()}`
						: path;
					setNavigating(true);
					router.push(url);
					closeChat();
					return `Navigating to ${path}`;
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

				case "browseThemes":
					setNavigating(true);
					router.push("/themes");
					closeChat();
					return "Opening themes gallery";

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
		[router, closeChat, setNavigating, walletStatus, balance, setThemeColor, setThemeRadius, setThemeFont, setPatternParams, setPatternColors],
	);

	// Handle payment confirmation for paid tools
	const handlePaymentConfirmed = useCallback(async () => {
		if (!paymentPending) return;

		const { toolName, cost } = paymentPending;

		try {
			// Process payment via Yours Wallet
			const result = await sendPayment(FEE_ADDRESS, cost);

			if (result?.txid) {
				// Payment successful - confirm in store
				confirmPayment(result.txid);

				// Send a follow-up message indicating payment was successful
				await sendMessage({
					text: `[Payment confirmed: ${result.txid}] Please proceed with ${toolName} using the parameters I specified.`,
				});
			}
		} catch (error) {
			console.error("[Payment Error]", error);
			// Cancel payment on error
			cancelPayment();
		}
	}, [paymentPending, sendPayment, confirmPayment, cancelPayment, sendMessage]);

	// Form submission handler
	const handleSubmit = useCallback(
		async (e?: React.FormEvent) => {
			e?.preventDefault();
			if (!input.trim() || isLoading) return;

			const message = input.trim();
			setInput(""); // Clear input immediately

			await sendMessage({
				text: message,
			});
		},
		[input, isLoading, sendMessage],
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
	};
}
