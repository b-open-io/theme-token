"use client";

import { AnimatePresence } from "framer-motion";

import { usePathname } from "next/navigation";

import { useEffect, useRef, useState } from "react";
import {
	getScriptsForPath,
	type ScriptEvent,
} from "@/lib/agent/swatchy-scripts";

import { SwatchyAvatar } from "./swatchy-avatar";

import { SwatchyChatBubble } from "./swatchy-chat-bubble";
import { useSwatchyStore } from "./swatchy-store";
import { SwatchyTalkBubble } from "./swatchy-talk-bubble";

export function SwatchyAssistant() {
	const { position, side, toggleChat, handleExternalNavigation } =
		useSwatchyStore();

	const pathname = usePathname();

	const previousPathname = useRef(pathname);

	const [activeScriptEvent, setActiveScriptEvent] =
		useState<ScriptEvent | null>(null);

	const scriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Listen for route changes and reset Swatchy to corner if external navigation

	useEffect(() => {
		if (pathname !== previousPathname.current) {
			handleExternalNavigation();

			previousPathname.current = pathname;
		}
	}, [pathname, handleExternalNavigation]);

	// Script engine: Triggers on navigation

	useEffect(() => {
		// Cancel any running script

		if (scriptTimeoutRef.current) clearTimeout(scriptTimeoutRef.current);

		setActiveScriptEvent(null);

		// 20% chance to start a script (10% think + 10% say approx)
		const scripts = Math.random() <= 0.2 ? getScriptsForPath(pathname) : [];

		if (scripts.length > 0) {
			const script = scripts[Math.floor(Math.random() * scripts.length)];
			let stepIndex = 0;

			const playStep = () => {
				if (stepIndex >= script.length) {
					setActiveScriptEvent(null);
					return;
				}

				const event = script[stepIndex];
				setActiveScriptEvent(event.type === "wait" ? null : event);
				stepIndex++;
				scriptTimeoutRef.current = setTimeout(playStep, event.duration || 3000);
			};

			// Start after navigation so the page can settle first.
			scriptTimeoutRef.current = setTimeout(playStep, 1000);
		}

		return () => {
			if (scriptTimeoutRef.current) clearTimeout(scriptTimeoutRef.current);
		};
	}, [pathname]);

	return (
		<>
			<SwatchyAvatar
				position={position}
				side={side}
				onClick={toggleChat}
				mobileBottomOffset={pathname.startsWith("/studio/") ? 104 : 16}
			>
				<AnimatePresence>
					{activeScriptEvent &&
						(activeScriptEvent.type === "say" ||
							activeScriptEvent.type === "think") &&
						activeScriptEvent.text && (
							<SwatchyTalkBubble
								key="talk-bubble"
								type={activeScriptEvent.type}
								text={activeScriptEvent.text}
								side={side}
							/>
						)}
				</AnimatePresence>
			</SwatchyAvatar>

			<SwatchyChatBubble isOpen={position === "expanded"} />
		</>
	);
}
