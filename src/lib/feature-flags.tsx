"use client";

/**
 * Feature flags — client access layer.
 *
 * The source of truth is Vercel's flag platform (see ./flags.ts, which is
 * server-only). The root layout resolves all flags server-side with
 * getFeatureFlags() and injects them here via <FeatureFlagsProvider> so
 * client components can read them synchronously through useFeatureFlags().
 *
 * The type lives in this client module (no server imports) so importing it
 * never pulls flags/next into a client bundle.
 */

import { createContext, useContext } from "react";

export type FeatureFlagKey =
	| "theme"
	| "fonts"
	| "images"
	| "icons"
	| "wallpapers"
	| "registry"
	| "project"
	| "componentPreview";

export type FeatureFlags = Record<FeatureFlagKey, boolean>;

const FeatureFlagsContext = createContext<FeatureFlags | null>(null);

export function FeatureFlagsProvider({
	value,
	children,
}: {
	value: FeatureFlags;
	children: React.ReactNode;
}) {
	return (
		<FeatureFlagsContext.Provider value={value}>
			{children}
		</FeatureFlagsContext.Provider>
	);
}

/**
 * Read resolved feature flags inside a client component. Must be rendered
 * under <FeatureFlagsProvider> (mounted in the root layout).
 */
export function useFeatureFlags(): FeatureFlags {
	const ctx = useContext(FeatureFlagsContext);
	if (!ctx) {
		throw new Error(
			"useFeatureFlags must be used within a FeatureFlagsProvider",
		);
	}
	return ctx;
}
