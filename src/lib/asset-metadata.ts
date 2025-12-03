/**
 * On-chain asset metadata schema for theme-token inscriptions.
 *
 * Context (ctx): CSS rendering physics - how the asset tiles/scales
 * Role (role): Semantic slot - what the asset is used for (following MAP context/subcontext pattern)
 * Meta (meta): Dimensions as "width,height" string
 */

/**
 * Context values define CSS rendering behavior
 */
export type AssetContext = "tile" | "wallpaper" | "sprite" | "avatar";

/**
 * Role values define semantic intent (subcontext in MAP pattern)
 */
export type AssetRole =
	| "banner"
	| "card"
	| "story"
	| "square"
	| "icon"
	| "default";

/**
 * Color mode for SVG patterns
 */
export type ColorMode = "currentColor" | "theme" | "grayscale";

/**
 * Metadata for on-chain image/SVG assets
 */
export interface AssetMetadata {
	// Required - rendering context
	ctx: AssetContext;

	// Required - content type
	contentType: string;

	// Optional - semantic role (subcontext)
	role?: AssetRole;

	// Optional - dimensions as "width,height"
	meta?: string;

	// Optional - human-readable name
	name?: string;

	// Optional - AI generation prompt
	prompt?: string;

	// Optional - color mode for SVG patterns
	colorMode?: ColorMode;
}

/**
 * Full MAP data for theme-token inscriptions
 */
export interface ThemeTokenMapData extends AssetMetadata {
	app: "theme-token";
	type: "pattern" | "font" | "theme";
}

/**
 * Common social media format dimensions for reference
 */
export const SOCIAL_FORMATS = {
	// Banner formats (3:1 or similar)
	"twitter-header": { width: 1500, height: 500, role: "banner" as AssetRole },
	"linkedin-cover": { width: 1584, height: 396, role: "banner" as AssetRole },
	"youtube-banner": { width: 2560, height: 1440, role: "banner" as AssetRole },

	// Card formats (1.91:1 or 2:1)
	"og-image": { width: 1200, height: 630, role: "card" as AssetRole },
	"twitter-card": { width: 1200, height: 675, role: "card" as AssetRole },
	"linkedin-post": { width: 1200, height: 627, role: "card" as AssetRole },

	// Story formats (9:16)
	"instagram-story": { width: 1080, height: 1920, role: "story" as AssetRole },
	"tiktok-video": { width: 1080, height: 1920, role: "story" as AssetRole },

	// Square formats (1:1)
	"instagram-post": { width: 1080, height: 1080, role: "square" as AssetRole },
	"profile-pic": { width: 400, height: 400, role: "square" as AssetRole },

	// Icon formats
	favicon: { width: 32, height: 32, role: "icon" as AssetRole },
	"app-icon": { width: 512, height: 512, role: "icon" as AssetRole },
} as const;

/**
 * Infer the best role based on dimensions
 */
export function inferRoleFromDimensions(
	width: number,
	height: number,
): AssetRole {
	const ratio = width / height;

	if (ratio >= 2.5) return "banner"; // Very wide (3:1, 4:1)
	if (ratio >= 1.5) return "card"; // Wide (1.91:1, 2:1)
	if (ratio <= 0.7) return "story"; // Tall (9:16)
	if (Math.abs(ratio - 1) < 0.1) {
		// Square-ish
		return width <= 64 ? "icon" : "square";
	}
	return "default";
}

/**
 * Build MAP metadata for pattern inscription
 * Returns Record<string, string> for compatibility with wallet.inscribe()
 */
export function buildPatternMetadata(params: {
	name?: string;
	prompt?: string;
	colorMode?: ColorMode;
	tileWidth?: number;
	tileHeight?: number;
}): Record<string, string> {
	const meta =
		params.tileWidth && params.tileHeight
			? `${params.tileWidth},${params.tileHeight}`
			: undefined;

	const result: Record<string, string> = {
		app: "theme-token",
		type: "pattern",
		ctx: "tile",
		contentType: "image/svg+xml",
	};

	if (params.name) result.name = params.name;
	if (params.prompt) result.prompt = params.prompt;
	if (params.colorMode) result.colorMode = params.colorMode;
	if (meta) result.meta = meta;

	return result;
}

/**
 * Build MAP metadata for wallpaper/background inscription
 * Returns Record<string, string> for compatibility with wallet.inscribe()
 */
export function buildWallpaperMetadata(params: {
	name?: string;
	width?: number;
	height?: number;
	contentType: string;
}): Record<string, string> {
	const meta =
		params.width && params.height
			? `${params.width},${params.height}`
			: undefined;
	const role = meta
		? inferRoleFromDimensions(params.width!, params.height!)
		: "default";

	const result: Record<string, string> = {
		app: "theme-token",
		type: "pattern", // Using pattern type for now, could add "image" type later
		ctx: "wallpaper",
		contentType: params.contentType,
		role,
	};

	if (params.name) result.name = params.name;
	if (meta) result.meta = meta;

	return result;
}
