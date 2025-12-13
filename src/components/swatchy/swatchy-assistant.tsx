"use client";

import { AnimatePresence } from "framer-motion";

import { usePathname } from "next/navigation";

import { useEffect, useRef, useState } from "react";

import { useSwatchyStore } from "./swatchy-store";

import { SwatchyAvatar } from "./swatchy-avatar";

import { SwatchyChatBubble } from "./swatchy-chat-bubble";

import { SwatchyTalkBubble } from "./swatchy-talk-bubble";

import { getScriptsForPath, type ScriptEvent } from "@/lib/agent/swatchy-scripts";



export function SwatchyAssistant() {

	const { position, side, toggleChat, handleExternalNavigation } = useSwatchyStore();

	const pathname = usePathname();

	const previousPathname = useRef(pathname);

	

	const [activeScriptEvent, setActiveScriptEvent] = useState<ScriptEvent | null>(null);

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

		if (Math.random() > 0.2) return;



		const scripts = getScriptsForPath(pathname);

		if (scripts.length === 0) return;



		const script = scripts[Math.floor(Math.random() * scripts.length)];

		let stepIndex = 0;



		const playStep = () => {

			if (stepIndex >= script.length) {

				setActiveScriptEvent(null);

				return;

			}



			const event = script[stepIndex];

			

			if (event.type === "wait") {

				setActiveScriptEvent(null);

			} else {

				setActiveScriptEvent(event);

			}



			const duration = event.duration || 3000;

			stepIndex++;

			scriptTimeoutRef.current = setTimeout(playStep, duration);

		};



		// Start with a small delay after navigation (1s) to let page load

		scriptTimeoutRef.current = setTimeout(playStep, 1000);



		return () => {

			if (scriptTimeoutRef.current) clearTimeout(scriptTimeoutRef.current);

		};

	}, [pathname]);



	return (

		<SwatchyAvatar position={position} side={side} onClick={toggleChat}>

			<AnimatePresence>

				{position === "expanded" && <SwatchyChatBubble />}

				{activeScriptEvent && (activeScriptEvent.type === "say" || activeScriptEvent.type === "think") && activeScriptEvent.text && (

					<SwatchyTalkBubble 

						key="talk-bubble"

						type={activeScriptEvent.type} 

						text={activeScriptEvent.text} 

					/>

				)}

			</AnimatePresence>

		</SwatchyAvatar>

	);

}
