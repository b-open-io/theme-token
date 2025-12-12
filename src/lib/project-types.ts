/**
 * Project Types - Extended types for shadcn/create registry:base support
 *
 * These types extend the base ThemeToken SDK types to support the full
 * shadcn/create preset format with sidebar colors, chart colors, and
 * project configuration.
 */

import type { ThemeStyleProps, ThemeToken } from "@theme-token/sdk";

/**
 * Extended CSS variables that match shadcn/create output
 * Includes sidebar colors and chart colors in addition to base theme colors
 */
export interface ExtendedThemeStyleProps extends ThemeStyleProps {
	// Sidebar colors (8 new vars)
	sidebar: string;
	"sidebar-foreground": string;
	"sidebar-primary": string;
	"sidebar-primary-foreground": string;
	"sidebar-accent": string;
	"sidebar-accent-foreground": string;
	"sidebar-border": string;
	"sidebar-ring": string;

	// Chart colors (5 new vars)
	"chart-1": string;
	"chart-2": string;
	"chart-3": string;
	"chart-4": string;
	"chart-5": string;
}

/**
 * Icon library options supported by shadcn/create
 */
export type IconLibrary = "lucide" | "hugeicons" | "tabler";

/**
 * Base color palette options
 */
export type BaseColor = "neutral" | "gray" | "zinc" | "stone" | "slate";

/**
 * Menu color options
 */
export type MenuColor = "default" | "primary" | "accent";

/**
 * Menu accent style options
 */
export type MenuAccent = "subtle" | "normal" | "bold";

/**
 * Project configuration matching shadcn/create config output
 */
export interface ProjectConfig {
	/** Style name (matches project name or preset) */
	style: string;
	/** Tailwind configuration */
	tailwind: {
		baseColor: BaseColor;
	};
	/** Icon library to use */
	iconLibrary: IconLibrary;
	/** Menu color scheme */
	menuColor: MenuColor;
	/** Menu accent level */
	menuAccent: MenuAccent;
}

/**
 * Project asset types for bundle
 */
export type ProjectAssetType = "font" | "icons" | "pattern" | "wallpaper";

/**
 * Asset entry in project bundle
 */
export interface ProjectAsset {
	/** Output index in transaction */
	vout: number;
	/** Asset type */
	type: ProjectAssetType;
	/** Slot or library identifier */
	slot?: string;
	library?: string;
}

/**
 * Project bundle metadata (version 2 for projects)
 */
export interface ProjectBundle {
	/** Bundle format version - 2 for projects */
	version: 2;
	/** Assets in this bundle */
	assets: ProjectAsset[];
}

/**
 * CSS rules for project (imports and layer definitions)
 */
export interface ProjectCss {
	/** tw-animate-css import */
	"@import \"tw-animate-css\""?: Record<string, unknown>;
	/** shadcn tailwind import */
	"@import \"shadcn/tailwind.css\""?: Record<string, unknown>;
	/** Base layer rules */
	"@layer base"?: Record<string, Record<string, string>>;
}

/**
 * Project manifest - registry:base format for shadcn/create
 *
 * This is the complete project configuration that can be inscribed
 * and served via the /init endpoint for `bunx shadcn create --preset`
 */
export interface ProjectManifest {
	/** Registry type - always "registry:base" for projects */
	type: "registry:base";
	/** Project name */
	name: string;
	/** Extension base - "none" for standalone projects */
	extends: "none";
	/** npm dependencies to install */
	dependencies: string[];
	/** Other registry items to install (utils, fonts, etc.) */
	registryDependencies: string[];
	/** CSS variables for light and dark modes */
	cssVars: {
		light: ExtendedThemeStyleProps;
		dark: ExtendedThemeStyleProps;
	};
	/** CSS imports and layer rules */
	css: ProjectCss;
	/** Project configuration for CLI */
	config: ProjectConfig;
	/** Bundle metadata for on-chain assets (optional) */
	bundle?: ProjectBundle;
}

/**
 * Default dependencies for a project
 */
export const DEFAULT_PROJECT_DEPENDENCIES = [
	"shadcn@latest",
	"class-variance-authority",
	"tw-animate-css",
];

/**
 * Icon library npm packages
 */
export const ICON_LIBRARY_PACKAGES: Record<IconLibrary, string[]> = {
	lucide: ["lucide-react"],
	hugeicons: ["@hugeicons/react", "@hugeicons/core-free-icons"],
	tabler: ["@tabler/icons-react"],
};

/**
 * Default CSS rules for projects
 */
export const DEFAULT_PROJECT_CSS: ProjectCss = {
	"@import \"tw-animate-css\"": {},
	"@import \"shadcn/tailwind.css\"": {},
	"@layer base": {
		"*": {
			"@apply border-border outline-ring/50": "",
		},
		body: {
			"@apply bg-background text-foreground": "",
		},
	},
};

/**
 * Derive sidebar colors from theme colors
 * Uses primary/secondary as base for sidebar accent
 */
export function deriveSidebarColors(
	theme: ThemeStyleProps,
): Pick<
	ExtendedThemeStyleProps,
	| "sidebar"
	| "sidebar-foreground"
	| "sidebar-primary"
	| "sidebar-primary-foreground"
	| "sidebar-accent"
	| "sidebar-accent-foreground"
	| "sidebar-border"
	| "sidebar-ring"
> {
	return {
		sidebar: theme.card,
		"sidebar-foreground": theme["card-foreground"],
		"sidebar-primary": theme.primary,
		"sidebar-primary-foreground": theme["primary-foreground"],
		"sidebar-accent": theme.accent,
		"sidebar-accent-foreground": theme["accent-foreground"],
		"sidebar-border": theme.border,
		"sidebar-ring": theme.ring,
	};
}

/**
 * Derive chart colors from theme colors
 * Creates a gradient from primary through accent
 */
export function deriveChartColors(
	theme: ThemeStyleProps,
): Pick<
	ExtendedThemeStyleProps,
	"chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5"
> {
	// For now, use primary and muted as base
	// TODO: Generate proper gradient based on primary hue
	return {
		"chart-1": theme.primary,
		"chart-2": theme.secondary,
		"chart-3": theme.accent,
		"chart-4": theme.muted,
		"chart-5": theme["muted-foreground"],
	};
}

/**
 * Extend a ThemeToken to include sidebar and chart colors
 */
export function extendThemeStyles(
	theme: ThemeToken,
): { light: ExtendedThemeStyleProps; dark: ExtendedThemeStyleProps } {
	const lightStyles = theme.styles.light;
	const darkStyles = theme.styles.dark;

	return {
		light: {
			...lightStyles,
			...deriveSidebarColors(lightStyles),
			...deriveChartColors(lightStyles),
		} as ExtendedThemeStyleProps,
		dark: {
			...darkStyles,
			...deriveSidebarColors(darkStyles),
			...deriveChartColors(darkStyles),
		} as ExtendedThemeStyleProps,
	};
}

/**
 * Create a ProjectManifest from a ThemeToken and configuration
 */
export function createProjectManifest(
	theme: ThemeToken,
	config: Partial<ProjectConfig> = {},
	bundle?: ProjectBundle,
): ProjectManifest {
	const fullConfig: ProjectConfig = {
		style: theme.name.toLowerCase().replace(/\s+/g, "-"),
		tailwind: {
			baseColor: config.tailwind?.baseColor ?? "zinc",
		},
		iconLibrary: config.iconLibrary ?? "lucide",
		menuColor: config.menuColor ?? "default",
		menuAccent: config.menuAccent ?? "subtle",
	};

	const iconDeps = ICON_LIBRARY_PACKAGES[fullConfig.iconLibrary];

	return {
		type: "registry:base",
		name: theme.name,
		extends: "none",
		dependencies: [...DEFAULT_PROJECT_DEPENDENCIES, ...iconDeps],
		registryDependencies: ["utils"],
		cssVars: extendThemeStyles(theme),
		css: DEFAULT_PROJECT_CSS,
		config: fullConfig,
		...(bundle && { bundle }),
	};
}
