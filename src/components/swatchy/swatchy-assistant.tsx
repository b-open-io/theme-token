"use client";

import { AnimatePresence } from "framer-motion";
import { useSwatchyStore } from "./swatchy-store";
import { SwatchyAvatar } from "./swatchy-avatar";
import { SwatchyChatBubble } from "./swatchy-chat-bubble";

export function SwatchyAssistant() {
	const { position, toggleChat } = useSwatchyStore();

	return (
		<>
			{/* Swatchy Avatar - Always visible */}
			<SwatchyAvatar position={position} onClick={toggleChat} />

			{/* Chat Bubble - Conditional */}
			<AnimatePresence>
				{position === "expanded" && <SwatchyChatBubble />}
			</AnimatePresence>
		</>
	);
}
