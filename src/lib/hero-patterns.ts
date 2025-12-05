/**
 * Hero Patterns integration
 * 87 professionally designed, seamless SVG patterns from heropatterns.com
 */
import * as heroPatterns from "hero-patterns";

// All available pattern names
export const HERO_PATTERN_NAMES = [
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

export type HeroPatternName = (typeof HERO_PATTERN_NAMES)[number];

// Curated presets - best patterns for backgrounds
export const HERO_PATTERN_PRESETS: {
	id: string;
	name: HeroPatternName;
	label: string;
	description: string;
}[] = [
	{
		id: "topography",
		name: "topography",
		label: "Topography",
		description: "Beautiful contour lines",
	},
	{
		id: "circuitBoard",
		name: "circuitBoard",
		label: "Circuit Board",
		description: "Tech circuit traces",
	},
	{
		id: "hexagons",
		name: "hexagons",
		label: "Hexagons",
		description: "Honeycomb grid",
	},
	{
		id: "diagonalStripes",
		name: "diagonalStripes",
		label: "Diagonal Stripes",
		description: "Clean diagonal lines",
	},
	{
		id: "polkaDots",
		name: "polkaDots",
		label: "Polka Dots",
		description: "Classic dot pattern",
	},
	{
		id: "graphPaper",
		name: "graphPaper",
		label: "Graph Paper",
		description: "Clean grid lines",
	},
	{
		id: "wiggle",
		name: "wiggle",
		label: "Wiggle",
		description: "Wavy flowing lines",
	},
	{
		id: "brickWall",
		name: "brickWall",
		label: "Brick Wall",
		description: "Stacked brick layout",
	},
	{
		id: "plus",
		name: "plus",
		label: "Plus Signs",
		description: "Medical/Swiss style",
	},
	{
		id: "overlappingCircles",
		name: "overlappingCircles",
		label: "Overlapping Circles",
		description: "Interlocking rings",
	},
	{
		id: "morphingDiamonds",
		name: "morphingDiamonds",
		label: "Diamonds",
		description: "Diamond shapes",
	},
	{
		id: "jigsaw",
		name: "jigsaw",
		label: "Jigsaw",
		description: "Puzzle pieces",
	},
	{
		id: "bubbles",
		name: "bubbles",
		label: "Bubbles",
		description: "Floating circles",
	},
	{
		id: "fourPointStars",
		name: "fourPointStars",
		label: "Stars",
		description: "Four-point stars",
	},
	{
		id: "aztec",
		name: "aztec",
		label: "Aztec",
		description: "Geometric tribal",
	},
	{
		id: "zigZag",
		name: "zigZag",
		label: "Zig Zag",
		description: "Chevron pattern",
	},
];

/**
 * Get a hero pattern as a CSS background-image value
 * @param name Pattern name
 * @param fillColor Fill color (hex or CSS color)
 * @param opacity Opacity 0-1
 * @returns CSS url() string for background-image
 */
export function getHeroPattern(
	name: HeroPatternName,
	fillColor = "#000000",
	opacity = 0.4
): string {
	const patternFn = heroPatterns[name as keyof typeof heroPatterns];
	if (typeof patternFn !== "function") {
		console.warn(`Unknown hero pattern: ${name}`);
		return "";
	}
	return patternFn(fillColor, opacity);
}

/**
 * Get raw SVG from a hero pattern URL
 * @param name Pattern name
 * @param fillColor Fill color
 * @param opacity Opacity 0-1
 * @returns Raw SVG string
 */
export function getHeroPatternSvg(
	name: HeroPatternName,
	fillColor = "#000000",
	opacity = 0.4
): string {
	const url = getHeroPattern(name, fillColor, opacity);
	// Extract SVG from url("data:image/svg+xml,...")
	const match = url.match(/url\("data:image\/svg\+xml,(.+)"\)/);
	if (!match) return "";
	return decodeURIComponent(match[1]);
}

/**
 * Get all pattern names
 */
export function getAllPatternNames(): HeroPatternName[] {
	return [...HERO_PATTERN_NAMES];
}

/**
 * Human-readable label for a pattern name
 */
export function patternNameToLabel(name: HeroPatternName): string {
	// Convert camelCase to Title Case with spaces
	return name
		.replace(/([A-Z])/g, " $1")
		.replace(/^./, (str) => str.toUpperCase())
		.trim();
}

