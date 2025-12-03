/**
 * Context values define CSS rendering physics
 */
export type AssetContext = "tile" | "wallpaper" | "sprite" | "avatar";

/**
 * Role values define semantic intent/slot
 */
export type AssetRole = "banner" | "card" | "story" | "square" | "icon" | "default";

/**
 * Color mode for SVG patterns
 */
export type ColorMode = "currentColor" | "theme" | "grayscale";

export function buildPatternMetadata(params: {
	name?: string;
	author?: string;
	license?: string;
	prompt?: string;
	ctx?: AssetContext;
	role?: AssetRole;
	meta?: [number, number];
	colorMode?: ColorMode;
}): Record<string, string> {
	const result: Record<string, string> = {
		app: "theme-token",
		ctx: params.ctx || "tile", // Default to tile for patterns
	};

	if (params.role) result.role = params.role;
	if (params.meta) result.meta = params.meta.join(",");
	if (params.name) result.name = params.name;
	if (params.author) result.author = params.author;
	// Default to CC0 (public domain) if no license specified
	result.license = params.license || "CC0";
	if (params.prompt) result.prompt = params.prompt;
	if (params.colorMode) result.colorMode = params.colorMode;

	return result;
}

export function buildFontMetadata(params: {
	author?: string;
	license?: string;
	prompt?: string;
}): Record<string, string> {
	const result: Record<string, string> = {
		app: "theme-token",
		type: "font",
	};

	if (params.author) result.author = params.author;
	if (params.license) result.license = params.license;
	if (params.prompt) result.prompt = params.prompt;

	return result;
}

export function buildThemeMetadata(): Record<string, string> {
	return {
		app: "theme-token",
		type: "theme",
	};
}

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
	const altMatch = svg.match(/<pattern[^>]*height="(\d+)"[^>]*width="(\d+)"/);
	if (altMatch) {
		return {
			width: Number.parseInt(altMatch[2], 10),
			height: Number.parseInt(altMatch[1], 10),
		};
	}
	return null;
}
