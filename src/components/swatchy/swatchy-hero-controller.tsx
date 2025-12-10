"use client";

import { useEffect } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";
import { useSwatchyStore } from "./swatchy-store";

/**
 * Controller component that manages Swatchy's hero pose on the homepage.
 * When at the top of the page, Swatchy appears larger as part of the hero scene.
 * When scrolled down, Swatchy returns to the corner position.
 *
 * This component renders nothing - it only manages scroll-based state.
 */
export function SwatchyHeroController() {
	const { scrollY } = useScroll();
	const { position, setHeroMode, isChatOpen } = useSwatchyStore();

	// Set initial state based on scroll position on mount
	useEffect(() => {
		// Skip on mobile - hero pose might block content
		if (typeof window !== "undefined" && window.innerWidth < 768) {
			return;
		}

		// Check initial scroll position to prevent flicker on refresh
		const initialScroll = typeof window !== "undefined" ? window.scrollY : 0;
		if (!isChatOpen()) {
			setHeroMode(initialScroll < 150);
		}

		// Cleanup: ensure Swatchy goes back to corner when leaving the page
		return () => {
			if (!useSwatchyStore.getState().isChatOpen()) {
				setHeroMode(false);
			}
		};
	}, [isChatOpen, setHeroMode]);

	// Listen to scroll changes
	useMotionValueEvent(scrollY, "change", (latest) => {
		// Skip on mobile
		if (typeof window !== "undefined" && window.innerWidth < 768) {
			return;
		}

		// If chat is open, scroll should NOT affect Swatchy
		if (isChatOpen()) return;

		// Threshold: switch between hero and corner
		const threshold = 150;

		if (latest < threshold && position !== "hero" && position !== "expanded") {
			setHeroMode(true);
		} else if (latest >= threshold && position === "hero") {
			setHeroMode(false);
		}
	});

	// This component renders nothing visual
	return null;
}
