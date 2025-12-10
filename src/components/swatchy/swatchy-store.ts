import { create } from "zustand";
import type { ToolName } from "@/lib/agent/tools";

export type SwatchyPosition = "corner" | "expanded";

// Payment request for paid tools
export interface PaymentRequest {
	toolName: ToolName;
	cost: number;
	args: Record<string, unknown>;
}

interface SwatchyStore {
	// UI State
	position: SwatchyPosition;

	// Navigation tracking - when Swatchy triggers navigation, we don't reset position
	isNavigating: boolean;

	// Payment State
	paymentPending: PaymentRequest | null;
	paymentTxid: string | null;

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
}

export const useSwatchyStore = create<SwatchyStore>()((set, get) => ({
	position: "corner",
	isNavigating: false,
	paymentPending: null,
	paymentTxid: null,

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

	setNavigating: (isNavigating) => set({ isNavigating }),

	handleExternalNavigation: () => {
		const { isNavigating } = get();
		if (isNavigating) {
			// Navigation was triggered by Swatchy, just reset the flag
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
}));
