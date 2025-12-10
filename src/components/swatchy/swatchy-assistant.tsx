"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useSwatchyStore } from "./swatchy-store";
import { SwatchyAvatar } from "./swatchy-avatar";
import { SwatchyChatBubble } from "./swatchy-chat-bubble";

export function SwatchyAssistant() {
	const { position, side, toggleChat, handleExternalNavigation } = useSwatchyStore();
	const pathname = usePathname();
	const previousPathname = useRef(pathname);

	// Listen for route changes and reset Swatchy to corner if external navigation
	useEffect(() => {
		if (pathname !== previousPathname.current) {
			handleExternalNavigation();
			previousPathname.current = pathname;
		}
	}, [pathname, handleExternalNavigation]);

	return (
		<>
			{/* Swatchy Avatar - Always visible, animates between corners */}
			<SwatchyAvatar position={position} side={side} onClick={toggleChat} />

			{/* Chat Bubble - Conditional */}
			<AnimatePresence>
				{position === "expanded" && <SwatchyChatBubble />}
			</AnimatePresence>
		</>
	);
}
