/**
 * AI SDK Tools for Theme Token
 *
 * These tools extend AI capabilities for theme generation,
 * allowing models to fetch real color data and build better themes.
 */

export {
	generatePaletteTool,
	type GeneratePaletteResult,
	type TintsPalette,
} from "./generate-palette";

export {
	// Tools
	patternTools,
	remapColorsTool,
	transformPatternTool,
	scatterParamsTool,
	lineParamsTool,
	noiseParamsTool,
	symmetryTool,
	paletteMapTool,
	tileScaleRotateTool,
	seedShuffleTool,
	// Schemas
	TokenEnum,
	RemapColorsSchema,
	TransformPatternSchema,
	ScatterParamsSchema,
	LineParamsSchema,
	NoiseParamsSchema,
	SymmetrySchema,
	PaletteMapSchema,
	TileScaleRotateSchema,
	SeedShuffleSchema,
	// Utils
	tokenToCss,
	// Types
	type Token,
	type RemapColorsParams,
	type TransformPatternParams,
	type ScatterParams,
	type LineParams,
	type NoiseParams,
	type SymmetryParams,
	type PaletteMapParams,
	type TileScaleRotateParams,
	type SeedShuffleParams,
} from "./pattern-tools";
