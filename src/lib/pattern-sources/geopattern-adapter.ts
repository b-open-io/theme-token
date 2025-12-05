/**
 * GeoPattern adapter - wraps the geopattern library for SVG generation
 * https://github.com/btmills/geopattern
 */
import GeoPattern from "geopattern";

// All available GeoPattern generator types
export const GEO_GENERATORS = [
	"hexagons",
	"sineWaves",
	"chevrons",
	"plusSigns",
	"xes",
	"overlappingCircles",
	"octogons",
	"squares",
	"concentricCircles",
	"overlappingRings",
	"triangles",
	"diamonds",
	"nestedSquares",
	"mosaicSquares",
	"plaid",
	"tessellation",
] as const;

export type GeoGeneratorType = (typeof GEO_GENERATORS)[number];

export interface GeoPatternOptions {
	seed: string;
	generator?: GeoGeneratorType;
	color?: string; // Base color (hex)
}

export interface GeoPatternResult {
	svg: string;
	seed: string;
	generator: GeoGeneratorType;
	color: string;
}

/**
 * Generate an SVG pattern using GeoPattern
 */
export function generateGeoPattern(opts: GeoPatternOptions): GeoPatternResult {
	const generator = opts.generator || "hexagons";
	
	// Map our generator name to the library's internal name
	const generatorMap: Record<GeoGeneratorType, string> = {
		hexagons: "hexagons",
		sineWaves: "sineWaves",
		chevrons: "chevrons",
		plusSigns: "plusSigns",
		xes: "xes",
		overlappingCircles: "overlappingCircles",
		octogons: "octogons",
		squares: "squares",
		concentricCircles: "concentricCircles",
		overlappingRings: "overlappingRings",
		triangles: "triangles",
		diamonds: "diamonds",
		nestedSquares: "nestedSquares",
		mosaicSquares: "mosaicSquares",
		plaid: "plaid",
		tessellation: "tessellation",
	};

	const pattern = GeoPattern.generate(opts.seed, {
		generator: generatorMap[generator],
		baseColor: opts.color,
	});

	let svg = pattern.toSvg();

	// 1. Remove background rect to allow transparency (crucial for mask-image)
	// GeoPattern adds a full-size rect as the first element
	svg = svg.replace(/<rect[^>]*width="100%"[^>]*height="100%"[^>]*>/, "");

	// 2. Force all remaining shapes to be white for consistent mask opacity
	// Since we use mask-image, the actual color comes from CSS background-color
	svg = svg.replace(/fill="rgb\([^"]+\)"/g, 'fill="#ffffff"');
	svg = svg.replace(/fill="#[0-9a-fA-F]{3,6}"/g, 'fill="#ffffff"');
	svg = svg.replace(/stroke="rgb\([^"]+\)"/g, 'stroke="#ffffff"');
	svg = svg.replace(/stroke="#[0-9a-fA-F]{3,6}"/g, 'stroke="#ffffff"');

	return {
		svg,
		seed: opts.seed,
		generator,
		color: pattern.color,
	};
}

/**
 * Get a friendly display name for a generator type
 */
export function getGeoGeneratorLabel(gen: GeoGeneratorType): string {
	const labels: Record<GeoGeneratorType, string> = {
		hexagons: "Hexagons",
		sineWaves: "Sine Waves",
		chevrons: "Chevrons",
		plusSigns: "Plus Signs",
		xes: "X Pattern",
		overlappingCircles: "Circles",
		octogons: "Octogons",
		squares: "Squares",
		concentricCircles: "Concentric",
		overlappingRings: "Rings",
		triangles: "Triangles",
		diamonds: "Diamonds",
		nestedSquares: "Nested",
		mosaicSquares: "Mosaic",
		plaid: "Plaid",
		tessellation: "Tessellation",
	};
	return labels[gen];
}

