/**
 * Generate inline CSS for SSR theme injection
 *
 * Server-only utility to create CSS that can be injected into <head>
 * for zero-FOUC theme rendering.
 */

import { toCss, type ThemeToken, type ThemeStyleProps } from "@theme-token/sdk";

/**
 * Generate inline CSS for a theme token
 *
 * Creates CSS variables for both light and dark modes that can be
 * injected as inline styles in the document head.
 */
export function generateInlineThemeCss(theme: ThemeToken): string {
	return toCss(theme);
}

/**
 * Generate CSS variables from theme style props for a single mode
 */
export function generateStylePropsCss(
	styles: ThemeStyleProps,
	selector: ":root" | ".dark"
): string {
	const cssVars = Object.entries(styles)
		.map(([key, value]) => `  --${key}: ${value};`)
		.join("\n");

	return `${selector} {\n${cssVars}\n}`;
}
