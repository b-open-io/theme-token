/**
 * Feature Flags
 *
 * Centralized feature flag checks using NEXT_PUBLIC_* env vars.
 * In development (local), all features are enabled by default.
 * In production, set explicitly in Vercel environment.
 */

const isDev = process.env.NODE_ENV === "development";

export const featureFlags = {
	/**
	 * Font Studio - AI font generation and on-chain font inscription
	 * Controls: /studio/font, /market/fonts, /market/my-fonts
	 */
	fonts: process.env.NEXT_PUBLIC_FEATURE_FONTS === "true" || isDev,

	/**
	 * Images - Tile/Pattern Studio + Images Market
	 * Controls: /studio/patterns (tile generation), /market/images (browse wallpapers/icons/tiles)
	 */
	images: process.env.NEXT_PUBLIC_FEATURE_IMAGES === "true" || isDev,

	/**
	 * AI Studio - Chat-based theme generation
	 * Controls: /studio/ai
	 */
	ai: process.env.NEXT_PUBLIC_FEATURE_AI === "true" || isDev,

	/**
	 * Icon Studio - Custom icon generation for themes
	 * Controls: /studio/icon
	 */
	icons: process.env.NEXT_PUBLIC_FEATURE_ICONS === "true" || isDev,

	/**
	 * Wallpaper Studio - Wallpaper generation for desktop and mobile
	 * Controls: /studio/wallpaper
	 */
	wallpapers: process.env.NEXT_PUBLIC_FEATURE_WALLPAPERS === "true" || isDev,
} as const;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(
	feature: keyof typeof featureFlags,
): boolean {
	return featureFlags[feature];
}
