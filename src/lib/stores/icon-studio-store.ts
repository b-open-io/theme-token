import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { ICON_SLOT_PRESETS } from "@/lib/icon-pack/slot-presets";

export type IconStudioTab = "icon-set" | "favicon";

export type IconSetStyle = "outline" | "solid";

export type IconSlotPresetId = "theme-token" | "custom";

export interface IconSetParams {
	style: IconSetStyle;
	strokeWidth: number;
	padding: number;
	size: 16 | 20 | 24;
}

export type IconSetItemStatus = "generated" | "missing" | "flagged";

export interface IconSetGeneratedState {
	iconsByName: Record<string, string>;
	statusByName: Record<string, IconSetItemStatus>;
}

export interface IconSetState {
	prompt: string;
	iconNamesText: string;
	slotPreset: IconSlotPresetId;
	params: IconSetParams;
	generated: IconSetGeneratedState;
}

export type FaviconShape = "glyph" | "badge";
export type FaviconBackground = "transparent" | "theme" | "solid";

export interface FaviconParams {
	shape: FaviconShape;
	background: FaviconBackground;
	foreground: string;
	backgroundColor: string;
	size: 32 | 64 | 128;
	padding: number;
	radius: number;
}

export interface FaviconGeneratedState {
	svg: string | null;
	pngBySize: Record<number, string>;
}

export interface FaviconState {
	prompt: string;
	params: FaviconParams;
	generated: FaviconGeneratedState;
}

export interface IconStudioState {
	activeTab: IconStudioTab;
	iconSet: IconSetState;
	favicon: FaviconState;
}

export interface IconStudioActions {
	setActiveTab: (tab: IconStudioTab) => void;

	setIconSetPrompt: (prompt: string) => void;
	setIconSetNamesText: (text: string) => void;
	applyIconSetSlotPreset: (preset: Exclude<IconSlotPresetId, "custom">) => void;
	setIconSetParams: (params: Partial<IconSetParams>) => void;
	setIconSetParam: <K extends keyof IconSetParams>(
		key: K,
		value: IconSetParams[K],
	) => void;
	setGeneratedIconSet: (generated: IconSetGeneratedState) => void;
	flagIcon: (name: string) => void;

	setFaviconPrompt: (prompt: string) => void;
	setFaviconParams: (params: Partial<FaviconParams>) => void;
	setFaviconParam: <K extends keyof FaviconParams>(
		key: K,
		value: FaviconParams[K],
	) => void;
	setGeneratedFavicon: (generated: FaviconGeneratedState) => void;

	reset: () => void;
}

export type IconStudioStore = IconStudioState & IconStudioActions;

const defaultIconNames = ICON_SLOT_PRESETS["theme-token"].join("\n");

const defaultState: IconStudioState = {
	activeTab: "icon-set",
	iconSet: {
		prompt: "",
		iconNamesText: defaultIconNames,
		slotPreset: "theme-token",
		params: {
			style: "outline",
			strokeWidth: 2,
			padding: 2,
			size: 24,
		},
		generated: {
			iconsByName: {},
			statusByName: {},
		},
	},
	favicon: {
		prompt: "",
		params: {
			shape: "badge",
			background: "theme",
			foreground: "currentColor",
			backgroundColor: "#000000",
			size: 64,
			padding: 6,
			radius: 12,
		},
		generated: {
			svg: null,
			pngBySize: {},
		},
	},
};

export const useIconStudioStore = create<IconStudioStore>()(
	subscribeWithSelector((set, get) => ({
		...defaultState,

		setActiveTab: (tab) => set({ activeTab: tab }),

		setIconSetPrompt: (prompt) =>
			set((state) => ({ iconSet: { ...state.iconSet, prompt } })),

		setIconSetNamesText: (iconNamesText) =>
			set((state) => ({
				iconSet: { ...state.iconSet, iconNamesText, slotPreset: "custom" },
			})),

		applyIconSetSlotPreset: (preset) => {
			const presetNames = ICON_SLOT_PRESETS[preset].join("\n");
			set((state) => ({
				iconSet: {
					...state.iconSet,
					slotPreset: preset,
					iconNamesText: presetNames,
				},
			}));
		},

		setIconSetParams: (params) =>
			set((state) => ({
				iconSet: { ...state.iconSet, params: { ...state.iconSet.params, ...params } },
			})),

		setIconSetParam: (key, value) =>
			set((state) => ({
				iconSet: {
					...state.iconSet,
					params: { ...state.iconSet.params, [key]: value },
				},
			})),

		setGeneratedIconSet: (generated) =>
			set((state) => ({
				iconSet: {
					...state.iconSet,
					generated: {
						iconsByName: generated.iconsByName,
						statusByName: generated.statusByName,
					},
				},
			})),

		flagIcon: (name) => {
			const current = get().iconSet.generated;
			set((state) => ({
				iconSet: {
					...state.iconSet,
					generated: {
						...current,
						statusByName: { ...current.statusByName, [name]: "flagged" },
					},
				},
			}));
		},

		setFaviconPrompt: (prompt) =>
			set((state) => ({ favicon: { ...state.favicon, prompt } })),

		setFaviconParams: (params) =>
			set((state) => ({
				favicon: { ...state.favicon, params: { ...state.favicon.params, ...params } },
			})),

		setFaviconParam: (key, value) =>
			set((state) => ({
				favicon: {
					...state.favicon,
					params: { ...state.favicon.params, [key]: value },
				},
			})),

		setGeneratedFavicon: (generated) =>
			set((state) => ({
				favicon: {
					...state.favicon,
					generated: {
						svg: generated.svg,
						pngBySize: generated.pngBySize,
					},
				},
			})),

		reset: () => set(defaultState),
	})),
);
