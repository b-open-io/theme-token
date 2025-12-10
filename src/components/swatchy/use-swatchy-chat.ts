"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSwatchyStore } from "./swatchy-store";

export function useSwatchyChat() {
	const router = useRouter();
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { addMessage, setStreaming } = useSwatchyStore();

	const handleSubmit = useCallback(async () => {
		if (!input.trim() || isLoading) return;

		const userMessage = input.trim();
		setInput("");
		addMessage({ role: "user", content: userMessage });

		setIsLoading(true);
		setStreaming(true);

		try {
			const response = await fetch("/api/swatchy-chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: userMessage }),
			});

			if (!response.ok) throw new Error("Chat request failed");

			const data = await response.json();
			addMessage({ role: "assistant", content: data.response });

			// Handle actions (navigation, theme generation, etc.)
			if (data.action) {
				handleAction(data.action);
			}
		} catch {
			addMessage({
				role: "assistant",
				content: "Sorry, I encountered an error. Please try again!",
			});
		} finally {
			setIsLoading(false);
			setStreaming(false);
		}
	}, [input, isLoading, addMessage, setStreaming]);

	const handleAction = useCallback(
		(action: { type: string; payload?: unknown }) => {
			switch (action.type) {
				case "navigate":
					router.push(action.payload as string);
					break;
				case "generate_theme":
					router.push(
						`/studio/theme?prompt=${encodeURIComponent(action.payload as string)}`
					);
					break;
				// Future actions: apply_theme, browse_themes, etc.
			}
		},
		[router]
	);

	return {
		input,
		setInput,
		handleSubmit,
		isLoading,
	};
}
