/**
 * Feature Flags
 *
 * Centralized feature flag checks using NEXT_PUBLIC_* env vars.
 * Set in Vercel:
 * - Production: false (features disabled)
 * - Preview/Development: true (features enabled)
 */

export const featureFlags = {
	/**
	 * Font Studio - AI font generation and on-chain font inscription
	 */
	fonts: process.env.NEXT_PUBLIC_FEATURE_FONTS === "true",

	/**
	 * Pattern Generator - AI SVG pattern generation and inscription
	 */
	patterns: process.env.NEXT_PUBLIC_FEATURE_PATTERNS === "true",

	/**
	 * Images Market - Browse and use existing 1sat ordinal images
	 * Always enabled - leverages existing ecosystem
	 */
	images: true,
} as const;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(
	feature: keyof typeof featureFlags,
): boolean {
	return featureFlags[feature];
}
