"use client";

import {
	applyTheme as applyThemeStyles,
	clearTheme as clearThemeStyles,
	type ThemeStyleProps,
	type ThemeToken,
	validateThemeToken,
} from "@theme-token/sdk";
import { loadThemeFonts } from "@/lib/fonts";
import { setSessionTheme } from "@/app/actions/theme-session";
import {
	createContext,
	type MouseEvent,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
	useRef,
} from "react";

interface ThemeContextValue {
	/** Currently active theme token */
	activeTheme: ThemeToken | null;
	/** Current mode (light/dark) */
	mode: "light" | "dark";
	/** Session theme origin (from SSR) */
	sessionThemeOrigin: string | null;
	/** List of available theme tokens from wallet */
	availableThemes: ThemeToken[];
	/** Set available themes (called by wallet hook) */
	setAvailableThemes: (themes: ThemeToken[]) => void;
	/** Apply a theme token */
	applyTheme: (theme: ThemeToken | null) => void;
	/** Apply a theme token with splash animation from click position */
	applyThemeAnimated: (theme: ThemeToken | null, e?: MouseEvent) => void;
	/** Toggle light/dark mode with optional click event for animation */
	toggleMode: (e?: MouseEvent) => void;
	/** Set mode explicitly */
	setMode: (mode: "light" | "dark") => void;
	/** Reset to default site theme */
	resetTheme: () => void;
}

interface ThemeProviderProps {
	children: ReactNode;
	/** Theme origin from SSR session */
	initialThemeOrigin?: string | null;
	/** Whether user already has a session cookie */
	hasExistingSession?: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "theme-token-selection";
const MODE_STORAGE_KEY = "theme-token-mode";

// Calculate max radius for circular reveal animation
function getMaxRadius(x: number, y: number): number {
	const right = window.innerWidth - x;
	const bottom = window.innerHeight - y;
	return Math.hypot(Math.max(x, right), Math.max(y, bottom));
}

// Creative animations for view transitions
type AnimationConfig = {
	name: string;
	keyframes: { clipPath: string[] };
	options: { duration: number; easing: string };
};

function getCreativeAnimations(
	x: number,
	y: number,
	maxRadius: number,
): AnimationConfig[] {
	// Helper for starburst polygon
	const createStarPolygon = (
		points: number,
		outerRadius: number,
		innerRadius: number = 0,
	): string => {
		const angleStep = (Math.PI * 2) / (points * 2);
		const path: string[] = [];
		for (let i = 0; i < points * 2; i++) {
			const radius = i % 2 === 0 ? outerRadius : innerRadius;
			const angle = i * angleStep - Math.PI / 2;
			path.push(
				`${x + radius * Math.cos(angle)}px ${y + radius * Math.sin(angle)}px`,
			);
		}
		return `polygon(${path.join(", ")})`;
	};

	return [
		// 1. Classic Circle
		{
			name: "Circle",
			keyframes: {
				clipPath: [
					`circle(0px at ${x}px ${y}px)`,
					`circle(${maxRadius}px at ${x}px ${y}px)`,
				],
			},
			options: { duration: 500, easing: "ease-in-out" },
		},
		// 2. Diamond Wipe
		{
			name: "Diamond",
			keyframes: {
				clipPath: [
					`polygon(${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px)`,
					`polygon(${x}px ${y - maxRadius}px, ${x + maxRadius}px ${y}px, ${x}px ${y + maxRadius}px, ${x - maxRadius}px ${y}px)`,
				],
			},
			options: { duration: 600, easing: "cubic-bezier(0.25, 1, 0.5, 1)" },
		},
		// 3. Hexagon Iris
		{
			name: "Hexagon",
			keyframes: {
				clipPath: [
					`polygon(${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px)`,
					`polygon(
            ${x + maxRadius * Math.cos(0)}px ${y + maxRadius * Math.sin(0)}px,
            ${x + maxRadius * Math.cos(Math.PI / 3)}px ${y + maxRadius * Math.sin(Math.PI / 3)}px,
            ${x + maxRadius * Math.cos((2 * Math.PI) / 3)}px ${y + maxRadius * Math.sin((2 * Math.PI) / 3)}px,
            ${x + maxRadius * Math.cos(Math.PI)}px ${y + maxRadius * Math.sin(Math.PI)}px,
            ${x + maxRadius * Math.cos((4 * Math.PI) / 3)}px ${y + maxRadius * Math.sin((4 * Math.PI) / 3)}px,
            ${x + maxRadius * Math.cos((5 * Math.PI) / 3)}px ${y + maxRadius * Math.sin((5 * Math.PI) / 3)}px
          )`,
				],
			},
			options: { duration: 550, easing: "ease-in-out" },
		},
		// 4. Starburst
		{
			name: "Starburst",
			keyframes: {
				clipPath: [
					createStarPolygon(8, 0, 0),
					createStarPolygon(8, maxRadius * 1.2, maxRadius * 0.4),
					createStarPolygon(8, maxRadius, maxRadius),
				],
			},
			options: {
				duration: 700,
				easing: "cubic-bezier(0.68, -0.55, 0.27, 1.55)",
			},
		},
		// 5. Asymmetric Ellipse
		{
			name: "Ellipse",
			keyframes: {
				clipPath: [
					`ellipse(0px 0px at ${x}px ${y}px)`,
					`ellipse(${maxRadius * 0.5}px ${maxRadius}px at ${x}px ${y}px)`,
					`ellipse(${maxRadius}px ${maxRadius}px at ${x}px ${y}px)`,
				],
			},
			options: { duration: 600, easing: "ease-out" },
		},
		// 6. Horizontal Line Reveal
		{
			name: "Horizontal",
			keyframes: {
				clipPath: [
					`inset(${y}px 0px ${window.innerHeight - y}px 0px)`,
					`inset(0px 0px 0px 0px)`,
				],
			},
			options: { duration: 450, easing: "ease-in-out" },
		},
	];
}

// Animate the view transition with random creative effect
function animateTransition(x: number, y: number): void {
	const maxRadius = getMaxRadius(x, y);
	const animations = getCreativeAnimations(x, y, maxRadius);
	const selected = animations[Math.floor(Math.random() * animations.length)];

	document.documentElement.animate(selected.keyframes, {
		...selected.options,
		pseudoElement: "::view-transition-new(root)",
	});
}

interface StoredThemeSelection {
	outpoint?: string;
	themeName?: string;
}

function applyThemeToDocument(styles: ThemeStyleProps | null): void {
	if (!styles) {
		clearThemeStyles();
		return;
	}
	applyThemeStyles(styles);
}

export function ThemeProvider({
	children,
	initialThemeOrigin,
	hasExistingSession,
}: ThemeProviderProps) {
	const [activeTheme, setActiveTheme] = useState<ThemeToken | null>(null);
	const [availableThemes, setAvailableThemes] = useState<ThemeToken[]>([]);
	const [mode, setModeState] = useState<"light" | "dark">("light");
	const [sessionThemeOrigin] = useState<string | null>(initialThemeOrigin ?? null);
	const sessionPersisted = useRef(false);

	// Persist session theme on first visit (when SSR picked a random theme)
	useEffect(() => {
		if (
			initialThemeOrigin &&
			!hasExistingSession &&
			!sessionPersisted.current
		) {
			sessionPersisted.current = true;
			// Fire and forget - persist the random theme selection
			setSessionTheme(initialThemeOrigin).catch(console.error);
		}
	}, [initialThemeOrigin, hasExistingSession]);

	// Load saved mode preference on mount
	useEffect(() => {
		const savedMode = localStorage.getItem(MODE_STORAGE_KEY);
		if (savedMode === "dark" || savedMode === "light") {
			setModeState(savedMode);
		} else {
			// Check system preference
			const prefersDark = window.matchMedia(
				"(prefers-color-scheme: dark)",
			).matches;
			setModeState(prefersDark ? "dark" : "light");
		}
	}, []);

	// Apply dark class to html element
	useEffect(() => {
		if (mode === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}, [mode]);

	// Apply theme when activeTheme or mode changes
	useEffect(() => {
		if (activeTheme) {
			loadThemeFonts(activeTheme);
			applyThemeToDocument(activeTheme.styles[mode]);
		}
	}, [activeTheme, mode]);

	const applyTheme = useCallback(
		(theme: ThemeToken | null) => {
			setActiveTheme(theme);

			if (theme) {
				loadThemeFonts(theme);
				applyThemeToDocument(theme.styles[mode]);
				// Save selection
				localStorage.setItem(
					STORAGE_KEY,
					JSON.stringify({ themeName: theme.name }),
				);
			} else {
				applyThemeToDocument(null);
				localStorage.removeItem(STORAGE_KEY);
			}
		},
		[mode],
	);

	const resetTheme = useCallback(() => {
		setActiveTheme(null);
		applyThemeToDocument(null);
		localStorage.removeItem(STORAGE_KEY);
	}, []);

	const applyThemeAnimated = useCallback(
		async (theme: ThemeToken | null, e?: MouseEvent): Promise<void> => {
			// Use View Transitions API if available
			if (
				typeof document !== "undefined" &&
				"startViewTransition" in document
			) {
				const x = e?.clientX ?? window.innerWidth / 2;
				const y = e?.clientY ?? window.innerHeight / 2;

				const transition = (
					document as Document & {
						startViewTransition: (cb: () => void) => {
							ready: Promise<void>;
							finished: Promise<void>;
						};
					}
				).startViewTransition(() => {
					applyTheme(theme);
				});

				// Wait for transition to be ready, then animate
				await transition.ready;
				animateTransition(x, y);
				// Wait for animation to complete
				await transition.finished;
			} else {
				applyTheme(theme);
			}
		},
		[applyTheme],
	);

	const setMode = useCallback((newMode: "light" | "dark") => {
		setModeState(newMode);
		localStorage.setItem(MODE_STORAGE_KEY, newMode);
	}, []);

	const toggleMode = useCallback(
		async (e?: MouseEvent) => {
			const newMode = mode === "light" ? "dark" : "light";

			// Use View Transitions API if available
			if (
				typeof document !== "undefined" &&
				"startViewTransition" in document
			) {
				const x = e?.clientX ?? window.innerWidth / 2;
				const y = e?.clientY ?? window.innerHeight / 2;

				const transition = (
					document as Document & {
						startViewTransition: (cb: () => void) => {
							ready: Promise<void>;
							finished: Promise<void>;
						};
					}
				).startViewTransition(() => {
					setMode(newMode);
				});

				// Wait for transition to be ready, then animate
				await transition.ready;
				animateTransition(x, y);
			} else {
				setMode(newMode);
			}
		},
		[mode, setMode],
	);

	// Try to restore saved theme when availableThemes changes
	useEffect(() => {
		if (availableThemes.length === 0) return;

		const saved = localStorage.getItem(STORAGE_KEY);
		if (!saved) return;

		try {
			const { themeName } = JSON.parse(saved) as StoredThemeSelection;
			if (themeName) {
				const found = availableThemes.find((t) => t.name === themeName);
				if (found) {
					setActiveTheme(found);
					applyThemeToDocument(found.styles[mode]);
				}
			}
		} catch {
			// Ignore parse errors
		}
	}, [availableThemes, mode]);

	return (
		<ThemeContext.Provider
			value={{
				activeTheme,
				mode,
				sessionThemeOrigin,
				availableThemes,
				setAvailableThemes,
				applyTheme,
				applyThemeAnimated,
				toggleMode,
				setMode,
				resetTheme,
			}}
		>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}

/**
 * Parse and validate a potential ThemeToken from fetched content
 */
export function parseThemeToken(data: unknown): ThemeToken | null {
	const result = validateThemeToken(data);
	return result.valid ? result.theme : null;
}
