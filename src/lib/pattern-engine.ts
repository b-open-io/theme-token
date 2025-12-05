/**
 * Pattern Engine - unified interface for pattern generation
 * 
 * Combines GeoPattern, hero-patterns, and AI sources with animation support.
 */

import { generateGeoPattern, GEO_GENERATORS, type GeoGeneratorType, type GeoPatternResult } from "./pattern-sources/geopattern-adapter";
import { generateHeroPattern, HERO_PATTERNS, FEATURED_HERO_PATTERNS, type HeroPatternName, type HeroPatternResult } from "./pattern-sources/heropattern-adapter";
import { injectAnimations, type AnimationOptions, DEFAULT_ANIMATION_OPTIONS } from "./pattern-animations";

// Re-export for convenience
export { GEO_GENERATORS, type GeoGeneratorType } from "./pattern-sources/geopattern-adapter";
export { HERO_PATTERNS, FEATURED_HERO_PATTERNS, type HeroPatternName } from "./pattern-sources/heropattern-adapter";
export { type AnimationOptions, DEFAULT_ANIMATION_OPTIONS } from "./pattern-animations";

export type PatternSource = "geopattern" | "hero" | "ai";

export interface PatternParams {
	// Source selection
	source: PatternSource;
	
	// GeoPattern options
	geoSeed: string;
	geoGenerator: GeoGeneratorType;
	
	// Hero pattern options
	heroPattern: HeroPatternName;
	
	// AI options (for future use)
	aiPrompt?: string;
	aiSvg?: string; // Pre-generated AI SVG
	
	// Appearance (shared)
	foregroundColor: string;
	backgroundColor: string;
	opacity: number; // 0-100
	scale: number; // Pattern tile scale (pixels)
	
	// Animation
	animation: AnimationOptions;
}

export interface PatternResult {
	svg: string;
	source: PatternSource;
	meta: GeoPatternResult | HeroPatternResult | { prompt: string };
}

/**
 * Default pattern parameters
 */
export const DEFAULT_PATTERN_PARAMS: PatternParams = {
	source: "geopattern",
	geoSeed: "theme-token",
	geoGenerator: "hexagons",
	heroPattern: "topography",
	foregroundColor: "#ffffff",
	backgroundColor: "#000000",
	opacity: 40,
	scale: 100,
	animation: DEFAULT_ANIMATION_OPTIONS,
};

/**
 * Generate a pattern from parameters
 */
export function generatePattern(params: PatternParams): PatternResult {
	let svg: string;
	let meta: PatternResult["meta"];

	switch (params.source) {
		case "geopattern": {
			const result = generateGeoPattern({
				seed: params.geoSeed,
				generator: params.geoGenerator,
				color: params.foregroundColor,
			});
			svg = result.svg;
			meta = result;
			break;
		}
		
		case "hero": {
			const result = generateHeroPattern({
				pattern: params.heroPattern,
				color: params.foregroundColor,
				opacity: params.opacity / 100,
			});
			svg = result.svg;
			meta = result;
			break;
		}
		
		case "ai": {
			// AI mode uses pre-generated SVG
			if (!params.aiSvg) {
				throw new Error("AI mode requires aiSvg to be set");
			}
			svg = params.aiSvg;
			meta = { prompt: params.aiPrompt || "" };
			break;
		}
		
		default:
			throw new Error(`Unknown pattern source: ${params.source}`);
	}

	// Inject animations if any are enabled
	svg = injectAnimations(svg, params.animation);

	return { svg, source: params.source, meta };
}

/**
 * Generate a random seed string
 */
export function randomSeed(): string {
	return Math.random().toString(36).substring(2, 10);
}

/**
 * Get all available generators for a source
 */
export function getGenerators(source: PatternSource): readonly string[] {
	switch (source) {
		case "geopattern":
			return GEO_GENERATORS;
		case "hero":
			return HERO_PATTERNS;
		case "ai":
			return [];
		default:
			return [];
	}
}

