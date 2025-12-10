import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SwatchyPosition = "corner" | "expanded";

export interface SwatchyMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: number;
}

interface SwatchyStore {
	// UI State
	position: SwatchyPosition;

	// Chat State
	messages: SwatchyMessage[];
	isStreaming: boolean;

	// Actions
	openChat: () => void;
	closeChat: () => void;
	toggleChat: () => void;
	addMessage: (message: Omit<SwatchyMessage, "id" | "timestamp">) => void;
	clearMessages: () => void;
	setStreaming: (streaming: boolean) => void;
}

export const useSwatchyStore = create<SwatchyStore>()(
	persist(
		(set, get) => ({
			position: "corner",
			messages: [],
			isStreaming: false,

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

			addMessage: (message) =>
				set((state) => ({
					messages: [
						...state.messages,
						{
							...message,
							id: crypto.randomUUID(),
							timestamp: Date.now(),
						},
					],
				})),

			clearMessages: () => set({ messages: [] }),
			setStreaming: (isStreaming) => set({ isStreaming }),
		}),
		{
			name: "swatchy-assistant",
			partialize: (state) => ({ messages: state.messages }),
		}
	)
);
