/**
 * On-chain asset metadata schema for theme-token inscriptions.
 *
 * Uses MAP protocol context/subcontext pattern for indexer-friendly discovery:
 * - context: Points to the field name containing the primary identifier
 * - [context]: The actual value (e.g., context="name" → name="Dot Grid")
 * - subcontext: Points to the field name containing secondary qualifier
 * - [subcontext]: The actual value (e.g., subcontext="tile" → tile="50,50")
 *
 * This allows indexers to filter without checking every possible field name.
 */

/**
 * Color mode for SVG patterns
 */
export type ColorMode = "currentColor" | "theme" | "grayscale";

/**
 * Font weight classification
 */
export type FontWeight =
	| "100"
	| "200"
	| "300"
	| "400"
	| "500"
	| "600"
	| "700"
	| "800"
	| "900";

/**
 * Font style
 */
export type FontStyle = "normal" | "italic" | "oblique";

/**
 * Font role - typographic purpose
 */
export type FontRole = "heading" | "body" | "mono" | "display" | "accent";

/**
 * Theme mode - color scheme preference
 */
export type ThemeMode = "light" | "dark" | "auto";

/**
 * Pattern rendering type
 */
export type PatternRender = "tile" | "cover" | "contain";

/**
 * Common social media format dimensions for reference
 */
export const SOCIAL_FORMATS = {
	// Banner formats (3:1 or similar)
	"twitter-header": { width: 1500, height: 500 },
	"linkedin-cover": { width: 1584, height: 396 },
	"youtube-banner": { width: 2560, height: 1440 },

	// Card formats (1.91:1 or 2:1)
	"og-image": { width: 1200, height: 630 },
	"twitter-card": { width: 1200, height: 675 },
	"linkedin-post": { width: 1200, height: 627 },

	// Story formats (9:16)
	"instagram-story": { width: 1080, height: 1920 },
	"tiktok-video": { width: 1080, height: 1920 },

	// Square formats (1:1)
	"instagram-post": { width: 1080, height: 1080 },
	"profile-pic": { width: 400, height: 400 },

	// Icon formats
	favicon: { width: 32, height: 32 },
	"app-icon": { width: 512, height: 512 },
} as const;

/**
 * Build MAP metadata for pattern inscription
 *
 * context: "name" → name: "Dot Grid"
 * subcontext: "render" → render: "tile"
 *
 * Additional fields: tile (dimensions), colorMode, prompt
 */
export function buildPatternMetadata(params: {
	name: string;
	render?: PatternRender;
	tileWidth?: number;
	tileHeight?: number;
	colorMode?: ColorMode;
	prompt?: string;
}): Record<string, string> {
	const result: Record<string, string> = {
		app: "theme-token",
		type: "pattern",
		context: "name",
		name: params.name,
		contentType: "image/svg+xml",
	};

	// Add render mode as subcontext (default: tile)
	const render = params.render || "tile";
	result.subcontext = "render";
	result.render = render;

	// Add tile dimensions if provided
	if (params.tileWidth && params.tileHeight) {
		result.tile = `${params.tileWidth},${params.tileHeight}`;
	}

	if (params.colorMode) result.colorMode = params.colorMode;
	if (params.prompt) result.prompt = params.prompt;

	return result;
}

/**
 * Build MAP metadata for font inscription
 *
 * context: "name" → name: "MyFont"
 * subcontext: "weight" → weight: "400"
 *
 * Additional fields: style, role, author, license, glyphCount
 */
export function buildFontMetadata(params: {
	name: string;
	weight?: FontWeight;
	style?: FontStyle;
	role?: FontRole;
	author?: string;
	license?: string;
	website?: string;
	aiGenerated?: boolean;
	glyphCount?: number;
	contentType: string;
}): Record<string, string> {
	const result: Record<string, string> = {
		app: "theme-token",
		type: "font",
		context: "name",
		name: params.name,
		contentType: params.contentType,
	};

	// Add weight as subcontext (most common filter)
	if (params.weight) {
		result.subcontext = "weight";
		result.weight = params.weight;
	}

	if (params.style && params.style !== "normal") result.style = params.style;
	if (params.role) result.role = params.role;
	if (params.author) result.author = params.author;
	if (params.license) result.license = params.license;
	if (params.website) result.website = params.website;
	if (params.aiGenerated) result.aiGenerated = "true";
	if (params.glyphCount) result.glyphCount = String(params.glyphCount);

	return result;
}

/**
 * Infer font role from weight
 */
export function inferFontRoleFromWeight(weight: string): FontRole {
	const w = Number.parseInt(weight, 10);
	if (w >= 700) return "heading"; // Bold weights good for headings
	if (w <= 300) return "accent"; // Light weights for accent/display
	return "body"; // Normal weights (400-600) for body text
}

/**
 * Build MAP metadata for theme inscription
 *
 * context: "name" → name: "Midnight"
 * subcontext: "mode" → mode: "dark"
 *
 * Additional fields: author, description, colorCount
 */
export function buildThemeMetadata(params: {
	name: string;
	mode?: ThemeMode;
	colorCount?: number;
	author?: string;
	description?: string;
}): Record<string, string> {
	const result: Record<string, string> = {
		app: "theme-token",
		type: "theme",
		context: "name",
		name: params.name,
		contentType: "application/json",
	};

	// Add mode as subcontext
	if (params.mode) {
		result.subcontext = "mode";
		result.mode = params.mode;
	}

	if (params.author) result.author = params.author;
	if (params.description) result.description = params.description;
	if (params.colorCount) result.colorCount = String(params.colorCount);

	return result;
}

/**
 * Infer theme mode from background color
 * Analyzes luminance to determine if light or dark
 */
export function inferThemeMode(backgroundColor: string): ThemeMode {
	// Parse hex color to RGB
	const hex = backgroundColor.replace("#", "");
	if (hex.length !== 6) return "dark"; // Default to dark if invalid

	const r = Number.parseInt(hex.substring(0, 2), 16);
	const g = Number.parseInt(hex.substring(2, 4), 16);
	const b = Number.parseInt(hex.substring(4, 6), 16);

	// Calculate relative luminance
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

	return luminance > 0.5 ? "light" : "dark";
}

/**
 * Count unique colors in a theme
 */
export function countThemeColors(theme: Record<string, unknown>): number {
	const colors = new Set<string>();

	function extractColors(obj: unknown): void {
		if (typeof obj === "string" && obj.startsWith("#")) {
			colors.add(obj.toLowerCase());
		} else if (typeof obj === "object" && obj !== null) {
			for (const value of Object.values(obj)) {
				extractColors(value);
			}
		}
	}

	extractColors(theme);
	return colors.size;
}

/**
 * Extract pattern tile dimensions from SVG
 */
export function extractTileDimensions(svg: string): {
	width: number;
	height: number;
} | null {
	const patternMatch = svg.match(
		/<pattern[^>]*width="(\d+)"[^>]*height="(\d+)"/,
	);
	if (patternMatch) {
		return {
			width: Number.parseInt(patternMatch[1], 10),
			height: Number.parseInt(patternMatch[2], 10),
		};
	}
	// Try alternate order
	const altMatch = svg.match(/<pattern[^>]*height="(\d+)"[^>]*width="(\d+)"/);
	if (altMatch) {
		return {
			width: Number.parseInt(altMatch[2], 10),
			height: Number.parseInt(altMatch[1], 10),
		};
	}
	return null;
}
