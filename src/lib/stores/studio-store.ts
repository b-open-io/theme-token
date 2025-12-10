import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// Theme color keys matching shadcn/ui CSS variables
export type ThemeColorKey =
	| "primary"
	| "secondary"
	| "accent"
	| "muted"
	| "background"
	| "foreground"
	| "card"
	| "popover"
	| "border"
	| "input"
	| "ring"
	| "destructive"
	| "chart-1"
	| "chart-2"
	| "chart-3"
	| "chart-4"
	| "chart-5";

export type ThemeMode = "light" | "dark" | "both";
export type FontSlot = "sans" | "serif" | "mono";
export type ActiveStudio = "theme" | "font" | "pattern" | "icon" | "wallpaper" | null;

export interface ThemeColors {
	light: Record<ThemeColorKey, string>;
	dark: Record<ThemeColorKey, string>;
}

export interface ThemeFonts {
	sans: string;
	serif: string;
	mono: string;
}

export interface StudioState {
	// Which studio is currently active
	activeStudio: ActiveStudio;

	// Theme state (for theme studio)
	themeColors: ThemeColors | null;
	themeRadius: string;
	themeFonts: ThemeFonts;

	// Commands from Swatchy (queued for studios to consume)
	pendingColorChange: {
		colorKey: ThemeColorKey;
		value: string;
		mode: ThemeMode;
	} | null;
	pendingRadiusChange: string | null;
	pendingFontChange: {
		slot: FontSlot;
		fontFamily: string;
	} | null;
}

export interface StudioActions {
	// Set active studio
	setActiveStudio: (studio: ActiveStudio) => void;

	// Theme actions (for Swatchy to control)
	setThemeColor: (colorKey: ThemeColorKey, value: string, mode?: ThemeMode) => void;
	setThemeRadius: (radius: string) => void;
	setThemeFont: (slot: FontSlot, fontFamily: string) => void;

	// Consume pending changes (for studios to call after applying)
	consumePendingColorChange: () => void;
	consumePendingRadiusChange: () => void;
	consumePendingFontChange: () => void;

	// Sync theme state from studio
	syncThemeState: (colors: ThemeColors, radius: string, fonts: ThemeFonts) => void;

	// Reset
	reset: () => void;
}

export type StudioStore = StudioState & StudioActions;

const defaultFonts: ThemeFonts = {
	sans: "Inter",
	serif: "Merriweather",
	mono: "JetBrains Mono",
};

const defaultState: StudioState = {
	activeStudio: null,
	themeColors: null,
	themeRadius: "0.5rem",
	themeFonts: defaultFonts,
	pendingColorChange: null,
	pendingRadiusChange: null,
	pendingFontChange: null,
};

export const useStudioStore = create<StudioStore>()(
	subscribeWithSelector((set, get) => ({
		...defaultState,

		setActiveStudio: (studio) => {
			set({ activeStudio: studio });
		},

		setThemeColor: (colorKey, value, mode = "both") => {
			// Queue the change for the theme studio to consume
			set({
				pendingColorChange: { colorKey, value, mode },
			});

			// Also update local state if we have theme colors
			const { themeColors } = get();
			if (themeColors) {
				const newColors = { ...themeColors };
				if (mode === "light" || mode === "both") {
					newColors.light = { ...newColors.light, [colorKey]: value };
				}
				if (mode === "dark" || mode === "both") {
					newColors.dark = { ...newColors.dark, [colorKey]: value };
				}
				set({ themeColors: newColors });
			}
		},

		setThemeRadius: (radius) => {
			set({
				pendingRadiusChange: radius,
				themeRadius: radius,
			});
		},

		setThemeFont: (slot, fontFamily) => {
			set((state) => ({
				pendingFontChange: { slot, fontFamily },
				themeFonts: { ...state.themeFonts, [slot]: fontFamily },
			}));
		},

		consumePendingColorChange: () => {
			set({ pendingColorChange: null });
		},

		consumePendingRadiusChange: () => {
			set({ pendingRadiusChange: null });
		},

		consumePendingFontChange: () => {
			set({ pendingFontChange: null });
		},

		syncThemeState: (colors, radius, fonts) => {
			set({
				themeColors: colors,
				themeRadius: radius,
				themeFonts: fonts,
			});
		},

		reset: () => {
			set(defaultState);
		},
	}))
);

// Selector helpers for subscribing to specific changes
export const selectPendingColorChange = (state: StudioStore) => state.pendingColorChange;
export const selectPendingRadiusChange = (state: StudioStore) => state.pendingRadiusChange;
export const selectPendingFontChange = (state: StudioStore) => state.pendingFontChange;
export const selectActiveStudio = (state: StudioStore) => state.activeStudio;
