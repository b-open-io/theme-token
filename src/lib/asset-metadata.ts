/**
 * On-chain asset metadata schema for theme-token inscriptions.
 *
 * PRINCIPLE: Metadata should only contain information that:
 * 1. Cannot be derived from the inscribed content itself
 * 2. Is not already present in the inscribed file
 *
 * For example:
 * - Theme JSON already contains name, author, colors → no metadata needed
 * - Font WOFF2 doesn't expose license/name easily → metadata needed
 * - SVG pattern prompt is provenance info → metadata needed
 */

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
 * Build MAP metadata for pattern inscription
 *
 * Only includes metadata that cannot be derived from the SVG content:
 * - prompt: The AI prompt used to generate the pattern (provenance)
 *
 * NOT included (derivable from SVG):
 * - name, tile dimensions, color mode - all in the SVG itself
 */
export function buildPatternMetadata(params: {
	prompt?: string;
}): Record<string, string> {
	const result: Record<string, string> = {
		app: "theme-token",
		type: "pattern",
	};

	if (params.prompt) result.prompt = params.prompt;

	return result;
}

/**
 * Build MAP metadata for font inscription
 *
 * Only includes metadata that cannot be easily derived from WOFF2 content:
 * - name: Font family name (not easily accessible in binary)
 * - weight: Font weight (400, 700, etc.)
 * - style: Font style (normal, italic)
 * - license: License identifier (CC0, OFL, etc.)
 * - author: Font designer/author
 * - aiGenerated: Whether the font was AI-generated
 *
 * NOT included (derivable or not useful):
 * - glyphCount: Can be derived from font file
 * - role: Subjective, depends on usage
 */
export function buildFontMetadata(params: {
	name: string;
	weight?: FontWeight;
	style?: FontStyle;
	author?: string;
	license?: string;
	aiGenerated?: boolean;
}): Record<string, string> {
	const result: Record<string, string> = {
		app: "theme-token",
		type: "font",
		name: params.name,
	};

	if (params.weight) result.weight = params.weight;
	if (params.style && params.style !== "normal") result.style = params.style;
	if (params.author) result.author = params.author;
	if (params.license) result.license = params.license;
	if (params.aiGenerated) result.aiGenerated = "true";

	return result;
}

/**
 * Build MAP metadata for theme inscription
 *
 * Themes require NO metadata - all information is in the JSON content:
 * - name: In JSON root
 * - author: In JSON root
 * - colors: In styles.light / styles.dark
 * - mode: Derivable from presence of light/dark keys
 *
 * Only app/type for indexer discovery.
 */
export function buildThemeMetadata(): Record<string, string> {
	return {
		app: "theme-token",
		type: "theme",
	};
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
