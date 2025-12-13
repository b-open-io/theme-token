import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UIMessage } from "ai";
import type { ToolName } from "@/lib/agent/tools";
import type { ThemeToken } from "@theme-token/sdk";
import type { SwatchyContext } from "@/lib/agent/config";

export type SwatchyPosition = "corner" | "expanded" | "hero";
export type SwatchySide = "left" | "right";

// Payment request for paid tools
export interface PaymentRequest {
	toolName: ToolName;
	toolCallId: string;
	cost: number;
	args: Record<string, unknown>;
	isFree?: boolean;
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

// Failed request context for free retry
export interface FailedRequest {
	toolName: ToolName;
	toolCallId: string;
	args: Record<string, unknown>;
	txid: string; // The original payment txid (already paid)
}

// Theme being remixed/previewed
export interface RemixContext {
	theme: ThemeToken;
	origin?: string;
}

// AI-generated theme awaiting confirmation in studio
export interface AIGeneratedTheme {
	theme: ThemeToken;
	txid: string;
	timestamp: number;
}

// Validation metadata from code generation
export interface ValidationInfo {
	valid: boolean;
	attempts: number;
	warnings: string[];
}

// Generated registry item (block or component)
export interface GeneratedRegistryItem {
	manifest: {
		name: string;
		type: "registry:block" | "registry:component";
		description: string;
		dependencies: string[];
		registryDependencies: string[];
		files: Array<{
			path: string;
			type: string;
			content: string;
			vout?: number;
		}>;
	};
	txid: string;
	timestamp: number;
	validation?: ValidationInfo;
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

	// AI-generated theme (single source of truth for success modal/confetti)
	aiGeneratedTheme: AIGeneratedTheme | null;

	// Generated registry item (block or component) for preview
	generatedRegistryItem: GeneratedRegistryItem | null;

	// Cache of generated items for history
	registryItemsCache: Record<string, GeneratedRegistryItem>;

	// Payment State
	paymentPending: PaymentRequest | null;
	paymentTxid: string | null;

	// Generation State
	generation: GenerationState;

	// Failed Request (for free retry)
	failedRequest: FailedRequest | null;

	// Chat State (persisted)
	chatMessages: UIMessage[];
	chatInput: string;

	// Hydration state - true when store has loaded from localStorage
	hasHydrated: boolean;

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

	// AI Generation Actions
	setAIGeneratedTheme: (theme: ThemeToken, txid: string) => void;
	clearAIGeneratedTheme: () => void;

	// Registry Item Generation Actions
	setGeneratedRegistryItem: (manifest: GeneratedRegistryItem["manifest"], txid: string, validation?: ValidationInfo) => void;
	clearGeneratedRegistryItem: () => void;
	cacheRegistryItem: (id: string, item: GeneratedRegistryItem) => void;

	// Navigation Actions
	setNavigating: (navigating: boolean) => void;
	handleExternalNavigation: () => void;

	// Hero mode (homepage only)
	setHeroMode: (isHero: boolean) => void;
	isChatOpen: () => boolean;

	// Payment Actions
	setPaymentPending: (payment: PaymentRequest | null) => void;
	confirmPayment: (txid: string) => void;
	cancelPayment: () => void;
	clearPayment: () => void;

	// Generation Actions
	setGenerating: (toolName: ToolName, progress?: string) => void;
	setGenerationSuccess: (result: unknown) => void;
	setGenerationError: (error: string, failedRequest?: FailedRequest) => void;
	clearGeneration: () => void;

	// Retry Actions
	clearFailedRequest: () => void;

	// Chat Actions
	setChatMessages: (messages: UIMessage[]) => void;
	setChatInput: (input: string) => void;
	setPendingMessage: (message: string | null) => void;
	consumePendingMessage: () => string | null;

	// Hydration Actions
	setHasHydrated: (hydrated: boolean) => void;
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
			aiGeneratedTheme: null,
			generatedRegistryItem: null,
			registryItemsCache: {},
			paymentPending: null,
			paymentTxid: null,
			generation: initialGenerationState,
			failedRequest: null,
			chatMessages: [],
			chatInput: "",
			hasHydrated: false,
			pendingMessage: null,

			openChat: () =>
				set({
					position: "expanded",
				}),

			closeChat: () => {
				// Determine if we should return to hero or corner based on scroll position
				// Hero threshold is 150px, only on homepage
				const isHomepage = typeof window !== "undefined" && window.location.pathname === "/";
				const isAboveThreshold = typeof window !== "undefined" && window.scrollY < 150;
				const shouldBeHero = isHomepage && isAboveThreshold;
				set({
					position: shouldBeHero ? "hero" : "corner",
				});
			},

			toggleChat: () => {
				const { position } = get();
				if (position === "corner" || position === "hero") {
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

			setAIGeneratedTheme: (theme, txid) =>
				set({
					aiGeneratedTheme: {
						theme,
						txid,
						timestamp: Date.now(),
					},
				}),

			clearAIGeneratedTheme: () => set({ aiGeneratedTheme: null }),

			setGeneratedRegistryItem: (manifest, txid, validation) =>
				set({
					generatedRegistryItem: {
						manifest,
						txid,
						timestamp: Date.now(),
						validation,
					},
				}),

			clearGeneratedRegistryItem: () => set({ generatedRegistryItem: null }),

			cacheRegistryItem: (id, item) =>
				set((state) => ({
					registryItemsCache: {
						...state.registryItemsCache,
						[id]: item,
					},
				})),

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
				const { isNavigating, position } = get();
				if (isNavigating) {
					// Navigation was triggered by Swatchy, just reset the flag but keep chat open
					set({ isNavigating: false });
				} else if (position === "expanded") {
					// External navigation while chat is open - close chat and go to corner
					// The target page's controller (e.g., SwatchyHeroController) will set the appropriate position
					set({ position: "corner" });
				}
				// If position is "corner" or "hero", let page-specific controllers manage it
			},

			setHeroMode: (isHero) => {
				const { position } = get();
				// Don't change position if chat is open
				if (position === "expanded") return;
				set({ position: isHero ? "hero" : "corner" });
			},

			isChatOpen: () => get().position === "expanded",

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

			setGenerationError: (error, failedRequest) =>
				set({
					generation: {
						status: "error",
						toolName: get().generation.toolName,
						error,
					},
					failedRequest: failedRequest ?? null,
				}),

			clearGeneration: () =>
				set({
					generation: initialGenerationState,
					failedRequest: null,
				}),

			clearFailedRequest: () => set({ failedRequest: null }),

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

			setHasHydrated: (hasHydrated) => set({ hasHydrated }),
		}),
		{
			name: "swatchy-state",
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				chatMessages: state.chatMessages,
				chatInput: state.chatInput,
				side: state.side,
				generatedRegistryItem: state.generatedRegistryItem,
				registryItemsCache: state.registryItemsCache,
			}),
			onRehydrateStorage: () => (state) => {
				// Called when hydration is complete
				state?.setHasHydrated(true);
			},
		}
	)
);
