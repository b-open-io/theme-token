import { create } from "zustand";
import type { ToolName } from "@/lib/agent/tools";

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

interface SwatchyStore {
	// UI State
	position: SwatchyPosition;
	side: SwatchySide;

	// Navigation tracking - when Swatchy triggers navigation, we don't reset position
	isNavigating: boolean;

	// Payment State
	paymentPending: PaymentRequest | null;
	paymentTxid: string | null;

	// Generation State
	generation: GenerationState;

	// Actions
	openChat: () => void;
	closeChat: () => void;
	toggleChat: () => void;

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
}

const initialGenerationState: GenerationState = {
	status: "idle",
	toolName: null,
};

export const useSwatchyStore = create<SwatchyStore>()((set, get) => ({
	position: "corner",
	side: "left",
	isNavigating: false,
	paymentPending: null,
	paymentTxid: null,
	generation: initialGenerationState,

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
}));
