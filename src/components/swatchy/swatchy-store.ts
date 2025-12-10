import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UIMessage } from "ai";
import type { ToolName } from "@/lib/agent/tools";
import type { ThemeToken } from "@theme-token/sdk";
import type { SwatchyContext } from "@/lib/agent/config";

export type SwatchyPosition = "corner" | "expanded";
export type SwatchySide = "left" | "right";

// Payment request for paid tools
export interface PaymentRequest {
	toolName: ToolName;
	toolCallId: string;
	cost: number;
	args: Record<string, unknown>;
}

// Generation state for progress tracking
export type GenerationStatus = "idle" | "generating" | "success" | "error";

export interface GenerationState {
	status: GenerationStatus;
	toolName: ToolName | null;
	progress?: string;
	result?: unknown;
	error?: string;
}

// Theme being remixed/previewed
export interface RemixContext {
	theme: ThemeToken;
	origin?: string;
}

interface SwatchyStore {
	// UI State
	position: SwatchyPosition;
	side: SwatchySide;

	// Navigation tracking - when Swatchy triggers navigation, we don't reset position
	isNavigating: boolean;

	// Context for API calls (page, wallet, theme state)
	context: SwatchyContext | null;

	// Remix context - theme being remixed
	remixContext: RemixContext | null;

	// Payment State
	paymentPending: PaymentRequest | null;
	paymentTxid: string | null;

	// Generation State
	generation: GenerationState;

	// Chat State (persisted)
	chatMessages: UIMessage[];
	chatInput: string;

	// Pending initial message to send on next chat open
	pendingMessage: string | null;

	// Actions
	openChat: () => void;
	closeChat: () => void;
	toggleChat: () => void;

	// Context Actions
	setContext: (context: SwatchyContext) => void;
	openWithRemix: (theme: ThemeToken, origin?: string) => void;
	clearRemixContext: () => void;

	// Navigation Actions
	setNavigating: (navigating: boolean) => void;
	handleExternalNavigation: () => void;

	// Payment Actions
	setPaymentPending: (payment: PaymentRequest | null) => void;
	confirmPayment: (txid: string) => void;
	cancelPayment: () => void;
	clearPayment: () => void;

	// Generation Actions
	setGenerating: (toolName: ToolName, progress?: string) => void;
	setGenerationSuccess: (result: unknown) => void;
	setGenerationError: (error: string) => void;
	clearGeneration: () => void;

	// Chat Actions
	setChatMessages: (messages: UIMessage[]) => void;
	setChatInput: (input: string) => void;
	setPendingMessage: (message: string | null) => void;
	consumePendingMessage: () => string | null;
}

const initialGenerationState: GenerationState = {
	status: "idle",
	toolName: null,
};

export const useSwatchyStore = create<SwatchyStore>()(
	persist(
		(set, get) => ({
			position: "corner",
			side: "left",
			isNavigating: false,
			context: null,
			remixContext: null,
			paymentPending: null,
			paymentTxid: null,
			generation: initialGenerationState,
			chatMessages: [],
			chatInput: "",
			pendingMessage: null,

			openChat: () =>
				set({
					position: "expanded",
				}),

			closeChat: () =>
				set({
					position: "corner",
				}),

			toggleChat: () => {
				const { position } = get();
				if (position === "corner") {
					get().openChat();
				} else {
					get().closeChat();
				}
			},

			setContext: (context) => set({ context }),

			openWithRemix: (theme, origin) => {
				// Build a context message about the theme colors
				const lightColors = theme.styles.light;
				const darkColors = theme.styles.dark;

				const colorSummary = `I want to remix "${theme.name}"${origin ? ` (${origin.slice(0, 8)}...)` : ""}.

Current theme colors:
**Light Mode:**
- Primary: ${lightColors.primary}
- Secondary: ${lightColors.secondary}
- Accent: ${lightColors.accent}
- Background: ${lightColors.background}
- Muted: ${lightColors.muted}
- Radius: ${lightColors.radius}

**Dark Mode:**
- Primary: ${darkColors.primary}
- Background: ${darkColors.background}

How would you like to modify this theme?`;

				set({
					position: "expanded",
					remixContext: { theme, origin },
					// Clear old messages when starting a remix session
					chatMessages: [],
					pendingMessage: colorSummary,
				});
			},

			clearRemixContext: () => set({ remixContext: null }),

			setNavigating: (isNavigating) => {
				// When Swatchy triggers navigation, toggle which side he's on for fun
				if (isNavigating) {
					const currentSide = get().side;
					set({
						isNavigating: true,
						side: currentSide === "left" ? "right" : "left",
					});
				} else {
					set({ isNavigating: false });
				}
			},

			handleExternalNavigation: () => {
				const { isNavigating } = get();
				if (isNavigating) {
					// Navigation was triggered by Swatchy, just reset the flag but keep chat open
					set({ isNavigating: false });
				} else {
					// External navigation - close chat and return to corner
					set({ position: "corner" });
				}
			},

			setPaymentPending: (paymentPending) => set({ paymentPending }),

			confirmPayment: (txid) =>
				set({
					paymentTxid: txid,
					paymentPending: null,
				}),

			cancelPayment: () =>
				set({
					paymentPending: null,
				}),

			clearPayment: () =>
				set({
					paymentPending: null,
					paymentTxid: null,
				}),

			setGenerating: (toolName, progress) =>
				set({
					generation: {
						status: "generating",
						toolName,
						progress,
					},
				}),

			setGenerationSuccess: (result) =>
				set({
					generation: {
						status: "success",
						toolName: get().generation.toolName,
						result,
					},
				}),

			setGenerationError: (error) =>
				set({
					generation: {
						status: "error",
						toolName: get().generation.toolName,
						error,
					},
				}),

			clearGeneration: () =>
				set({
					generation: initialGenerationState,
				}),

			setChatMessages: (chatMessages) => set({ chatMessages }),

			setChatInput: (chatInput) => set({ chatInput }),

			setPendingMessage: (pendingMessage) => set({ pendingMessage }),

			consumePendingMessage: () => {
				const { pendingMessage } = get();
				if (pendingMessage) {
					set({ pendingMessage: null });
				}
				return pendingMessage;
			},
		}),
		{
			name: "swatchy-state",
			partialize: (state) => ({
				chatMessages: state.chatMessages,
				chatInput: state.chatInput,
				side: state.side,
			}),
		}
	)
);
