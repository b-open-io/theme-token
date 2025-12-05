/**
 * Hero Patterns adapter - wraps the hero-patterns library for SVG generation
 * https://heropatterns.com - 87 professionally designed seamless SVG patterns
 */
import * as heroPatterns from "hero-patterns";

// All available hero pattern names
export const HERO_PATTERNS = [
	"anchorsAway",
	"architect",
	"autumn",
	"aztec",
	"bamboo",
	"bankNote",
	"bathroomFloor",
	"bevelCircle",
	"boxes",
	"brickWall",
	"bubbles",
	"cage",
	"charlieBrown",
	"churchOnSunday",
	"circlesAndSquares",
	"circuitBoard",
	"connections",
	"corkScrew",
	"current",
	"curtain",
	"cutout",
	"deathStar",
	"diagonalLines",
	"diagonalStripes",
	"dominos",
	"endlessClouds",
	"eyes",
	"fallingTriangles",
	"fancyRectangles",
	"flippedDiamonds",
	"floatingCogs",
	"floorTile",
	"formalInvitation",
	"fourPointStars",
	"glamorous",
	"graphPaper",
	"groovy",
	"happyIntersection",
	"heavyRain",
	"hexagons",
	"hideout",
	"houndstooth",
	"iLikeFood",
	"intersectingCircles",
	"jigsaw",
	"jupiter",
	"kiwi",
	"leaf",
	"linesInMotion",
	"lips",
	"lisbon",
	"melt",
	"moroccan",
	"morphingDiamonds",
	"overcast",
	"overlappingCircles",
	"overlappingDiamonds",
	"overlappingHexagons",
	"parkayFloor",
	"pianoMan",
	"pieFactory",
	"pixelDots",
	"plus",
	"polkaDots",
	"rails",
	"rain",
	"randomShapes",
	"roundedPlusConnected",
	"signal",
	"skulls",
	"slantedStars",
	"squares",
	"squaresInSquares",
	"stampCollection",
	"steelBeams",
	"stripes",
	"temple",
	"texture",
	"ticTacToe",
	"tinyCheckers",
	"topography",
	"volcanoLamp",
	"wallpaper",
	"wiggle",
	"xEquals",
	"yyy",
	"zigZag",
] as const;

export type HeroPatternName = (typeof HERO_PATTERNS)[number];

export interface HeroPatternOptions {
	pattern: HeroPatternName;
	color?: string; // Fill color (hex)
	opacity?: number; // 0-1
}

export interface HeroPatternResult {
	svg: string;
	pattern: HeroPatternName;
	color: string;
	opacity: number;
}

/**
 * Generate an SVG pattern using hero-patterns
 */
export function generateHeroPattern(opts: HeroPatternOptions): HeroPatternResult {
	const color = opts.color || "#000000";
	const opacity = opts.opacity ?? 0.4;
	
	const patternFn = heroPatterns[opts.pattern as keyof typeof heroPatterns];
	if (typeof patternFn !== "function") {
		throw new Error(`Unknown hero pattern: ${opts.pattern}`);
	}
	
	// Get the CSS url() value
	const url = patternFn(color, opacity);
	
	// Extract raw SVG from url("data:image/svg+xml,...")
	const match = url.match(/url\(['"]data:image\/svg\+xml,(.+)['"]\)/);
	if (!match) {
		throw new Error(`Failed to extract SVG from pattern: ${opts.pattern}`);
	}
	
	const svg = decodeURIComponent(match[1]);
	
	return {
		svg,
		pattern: opts.pattern,
		color,
		opacity,
	};
}

/**
 * Get a friendly display name for a pattern
 */
export function getHeroPatternLabel(name: HeroPatternName): string {
	// Convert camelCase to Title Case
	return name
		.replace(/([A-Z])/g, " $1")
		.replace(/^./, (str) => str.toUpperCase())
		.trim();
}

// Curated featured patterns (best for backgrounds)
export const FEATURED_HERO_PATTERNS: HeroPatternName[] = [
	"topography",
	"circuitBoard",
	"hexagons",
	"diagonalStripes",
	"polkaDots",
	"graphPaper",
	"wiggle",
	"brickWall",
	"plus",
	"overlappingCircles",
	"morphingDiamonds",
	"jigsaw",
	"bubbles",
	"fourPointStars",
	"aztec",
	"zigZag",
];

