/**
 * AI SDK Tools for Theme Token
 *
 * These tools extend AI capabilities for theme generation,
 * allowing models to fetch real color data and build better themes.
 */

export {
	type GeneratePaletteResult,
	generatePaletteTool,
	type TintsPalette,
} from "./generate-palette";

export {
	type LineParams,
	LineParamsSchema,
	lineParamsTool,
	type NoiseParams,
	NoiseParamsSchema,
	noiseParamsTool,
	type PaletteMapParams,
	PaletteMapSchema,
	paletteMapTool,
	// Tools
	patternTools,
	type RemapColorsParams,
	RemapColorsSchema,
	remapColorsTool,
	type ScatterParams,
	ScatterParamsSchema,
	type SeedShuffleParams,
	SeedShuffleSchema,
	type SymmetryParams,
	SymmetrySchema,
	scatterParamsTool,
	seedShuffleTool,
	symmetryTool,
	type TileScaleRotateParams,
	TileScaleRotateSchema,
	// Types
	type Token,
	// Schemas
	TokenEnum,
	type TransformPatternParams,
	TransformPatternSchema,
	tileScaleRotateTool,
	// Utils
	tokenToCss,
	transformPatternTool,
} from "./pattern-tools";
