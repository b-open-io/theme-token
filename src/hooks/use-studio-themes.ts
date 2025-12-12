/**
 * Unified Theme Hook for Studio Pages
 *
 * Combines cached on-chain themes with the active theme context.
 * Use this hook in studio pages that need access to all published themes.
 */

import { useQuery } from "@tanstack/react-query";
import { fetchCachedThemes, type CachedTheme } from "@/lib/themes-cache";
import { useTheme } from "@/components/theme-provider";

/**
 * Hook for accessing all on-chain themes and current theme state
 *
 * @example
 * ```tsx
 * const { themes, activeTheme, mode, isLoading, applyTheme } = useStudioThemes();
 *
 * // Render theme selector
 * themes.map(({ origin, theme }) => (
 *   <button onClick={() => applyTheme(theme, origin)}>
 *     {theme.name}
 *   </button>
 * ));
 * ```
 */
export function useStudioThemes() {
	const {
		activeTheme,
		applyTheme,
		applyThemeAnimated,
		mode,
		availableThemes,
		setAvailableThemes,
		resetTheme,
	} = useTheme();

	const {
		data: cachedThemes = [],
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: ["cached-themes"],
		queryFn: fetchCachedThemes,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
	});

	return {
		/** All published on-chain themes */
		themes: cachedThemes,
		/** Currently active theme (applied to document) */
		activeTheme,
		/** Current color mode (light/dark) */
		mode,
		/** Whether themes are loading */
		isLoading,
		/** Whether there was an error loading themes */
		isError,
		/** Refetch themes from cache */
		refetch,
		/** Apply a theme (no animation) */
		applyTheme,
		/** Apply a theme with animation */
		applyThemeAnimated,
		/** Reset to default theme */
		resetTheme,
		/** Available themes in context */
		availableThemes,
		/** Update available themes in context */
		setAvailableThemes,
	};
}

/**
 * Find a cached theme by origin
 */
export function findThemeByOrigin(
	themes: CachedTheme[],
	origin: string,
): CachedTheme | undefined {
	return themes.find((t) => t.origin === origin);
}

/**
 * Get theme preview colors for a given mode
 */
export function getThemePreviewColors(
	theme: CachedTheme["theme"],
	mode: "light" | "dark",
): {
	primary: string;
	secondary: string;
	accent: string;
	background: string;
	foreground: string;
} {
	const styles = theme.styles[mode];
	return {
		primary: styles.primary,
		secondary: styles.secondary,
		accent: styles.accent,
		background: styles.background,
		foreground: styles.foreground,
	};
}
