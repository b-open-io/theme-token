import { tool } from "ai";
import { z } from "zod";

/**
 * Token enum for theme-aware colors in patterns
 */
export const TokenEnum = z.enum([
	"primary",
	"secondary",
	"accent",
	"muted",
	"foreground",
	"background",
	"currentColor",
]);
export type Token = z.infer<typeof TokenEnum>;

/**
 * Map token names to CSS variable references
 */
export const tokenToCss: Record<Token, string> = {
	primary: "hsl(var(--primary))",
	secondary: "hsl(var(--secondary))",
	accent: "hsl(var(--accent))",
	muted: "hsl(var(--muted))",
	foreground: "hsl(var(--foreground))",
	background: "hsl(var(--background))",
	currentColor: "currentColor",
};

/**
 * Schemas for pattern tool parameters (reusable)
 */
export const RemapColorsSchema = z.object({
	targets: z.array(
		z.object({
			selector: z.string().optional().describe("CSS selector to target specific elements"),
			role: z.enum(["fill", "stroke"]).optional().describe("Target all fills or strokes"),
			fillToken: TokenEnum.optional().describe("Token to use for fill"),
			strokeToken: TokenEnum.optional().describe("Token to use for stroke"),
			opacity: z.number().min(0).max(1).optional().describe("Opacity 0-1"),
		})
	).describe("Array of color remapping targets"),
});

export const TransformPatternSchema = z.object({
	tileScale: z.number().min(0.1).max(10).optional().describe("Scale factor for tile size"),
	tileRotateDeg: z.number().min(-180).max(180).optional().describe("Rotation in degrees"),
	tileOffsetX: z.number().optional().describe("Horizontal offset in pattern units"),
	tileOffsetY: z.number().optional().describe("Vertical offset in pattern units"),
	keepSeamless: z.boolean().default(true).describe("Maintain seamless tiling"),
});

export const ScatterParamsSchema = z.object({
	shape: z.enum(["circle", "polygon", "emoji", "symbol"]).describe("Shape type to scatter"),
	symbol: z.string().optional().describe("Emoji or symbol character when shape is emoji/symbol"),
	count: z.number().int().min(1).max(200).optional().describe("Number of shapes"),
	density: z.number().min(0).max(1).optional().describe("Density 0-1, alternative to count"),
	sizeMin: z.number().min(1).max(50).optional().describe("Minimum shape size"),
	sizeMax: z.number().min(1).max(100).optional().describe("Maximum shape size"),
	jitter: z.number().min(0).max(1).optional().describe("Position randomization 0-1"),
	rotationRange: z.number().min(0).max(360).optional().describe("Max random rotation degrees"),
	spacing: z.number().min(0).optional().describe("Minimum spacing between shapes"),
	seed: z.string().optional().describe("Random seed for reproducibility"),
	fillToken: TokenEnum.optional().describe("Fill color token"),
	strokeToken: TokenEnum.optional().describe("Stroke color token"),
	strokeWidth: z.number().min(0).max(10).optional().describe("Stroke width"),
});

export const LineParamsSchema = z.object({
	angleDeg: z.number().min(0).max(180).optional().describe("Line angle in degrees (0=horizontal, 90=vertical)"),
	spacing: z.number().min(1).max(100).optional().describe("Space between lines"),
	strokeWidth: z.number().min(0.1).max(20).optional().describe("Line thickness"),
	jitter: z.number().min(0).max(1).optional().describe("Line position randomization"),
	dash: z.string().optional().describe("SVG stroke-dasharray value"),
	seed: z.string().optional().describe("Random seed for jitter"),
	strokeToken: TokenEnum.optional().describe("Line color token"),
	opacity: z.number().min(0).max(1).optional().describe("Line opacity"),
});

export const NoiseParamsSchema = z.object({
	intensity: z.number().min(0).max(1).optional().describe("Noise strength 0-1"),
	granularity: z.number().min(0.1).max(10).optional().describe("Size of noise particles"),
	seed: z.string().optional().describe("Random seed for reproducibility"),
	fillToken: TokenEnum.optional().describe("Noise color token"),
	opacity: z.number().min(0).max(1).optional().describe("Overall opacity"),
});

export const SymmetrySchema = z.object({
	mode: z.enum(["mirrorX", "mirrorY", "rotate"]).describe("Symmetry type"),
	segments: z.number().int().min(2).max(12).optional().describe("Number of rotational segments (for rotate mode)"),
});

export const PaletteMapSchema = z.object({
	fills: z.array(TokenEnum).optional().describe("Tokens to use for fills in order"),
	strokes: z.array(TokenEnum).optional().describe("Tokens to use for strokes in order"),
});

export const TileScaleRotateSchema = z.object({
	tileWidth: z.number().min(1).max(500).optional().describe("Tile width in px"),
	tileHeight: z.number().min(1).max(500).optional().describe("Tile height in px"),
	rotateDeg: z.number().min(-180).max(180).optional().describe("Pattern rotation"),
});

export const SeedShuffleSchema = z.object({
	seed: z.string().optional().describe("Specific seed to use, or omit for random"),
});

/**
 * Remap colors in SVG pattern to theme tokens
 */
export const remapColorsTool = tool({
	description: `Remap fill and stroke colors in an SVG pattern to theme tokens.
Use this to make a pattern theme-aware by replacing hardcoded colors with CSS variables.
Targets can be specified by CSS selector or by role (fill/stroke).`,
	inputSchema: RemapColorsSchema,
});

/**
 * Transform pattern tile properties
 */
export const transformPatternTool = tool({
	description: `Transform the pattern's tile properties like scale, rotation, and offset.
Use this to adjust how the pattern tiles without regenerating it.`,
	inputSchema: TransformPatternSchema,
});

/**
 * Configure scatter pattern parameters
 */
export const scatterParamsTool = tool({
	description: `Generate or modify a scatter pattern with randomly placed shapes.
Supports circles, polygons, emoji, and symbols with configurable density and randomization.`,
	inputSchema: ScatterParamsSchema,
});

/**
 * Configure line pattern parameters
 */
export const lineParamsTool = tool({
	description: `Generate or modify a line-based pattern (stripes, diagonals, crosshatch).
Good for scanlines, hatching, and geometric backgrounds.`,
	inputSchema: LineParamsSchema,
});

/**
 * Configure noise/grain pattern parameters
 */
export const noiseParamsTool = tool({
	description: `Generate or modify a noise/grain texture pattern.
Creates organic, film-grain-like textures.`,
	inputSchema: NoiseParamsSchema,
});

/**
 * Apply symmetry transformations
 */
export const symmetryTool = tool({
	description: `Apply symmetry transformations to the pattern.
Creates mirrored or rotationally symmetric designs.`,
	inputSchema: SymmetrySchema,
});

/**
 * Map fills and strokes to theme palette
 */
export const paletteMapTool = tool({
	description: `Map pattern colors to a sequence of theme tokens.
Useful for multi-color patterns that should follow theme palette order.`,
	inputSchema: PaletteMapSchema,
});

/**
 * Set tile dimensions and rotation
 */
export const tileScaleRotateTool = tool({
	description: `Set explicit tile dimensions and rotation.
Use for precise control over pattern repetition size.`,
	inputSchema: TileScaleRotateSchema,
});

/**
 * Generate or shuffle random seed
 */
export const seedShuffleTool = tool({
	description: `Generate a new random seed or use a specific one.
Seeds ensure reproducible pattern generation.`,
	inputSchema: SeedShuffleSchema,
	execute: async ({ seed }) => {
		const newSeed = seed || Math.random().toString(36).substring(2, 10);
		return { seed: newSeed };
	},
});

/**
 * All pattern tools bundled for AI SDK registration
 */
export const patternTools = {
	remapColors: remapColorsTool,
	transformPattern: transformPatternTool,
	scatterParams: scatterParamsTool,
	lineParams: lineParamsTool,
	noiseParams: noiseParamsTool,
	symmetry: symmetryTool,
	paletteMap: paletteMapTool,
	tileScaleRotate: tileScaleRotateTool,
	seedShuffle: seedShuffleTool,
};

/**
 * Type helpers for tool parameters
 */
export type RemapColorsParams = z.infer<typeof RemapColorsSchema>;
export type TransformPatternParams = z.infer<typeof TransformPatternSchema>;
export type ScatterParams = z.infer<typeof ScatterParamsSchema>;
export type LineParams = z.infer<typeof LineParamsSchema>;
export type NoiseParams = z.infer<typeof NoiseParamsSchema>;
export type SymmetryParams = z.infer<typeof SymmetrySchema>;
export type PaletteMapParams = z.infer<typeof PaletteMapSchema>;
export type TileScaleRotateParams = z.infer<typeof TileScaleRotateSchema>;
export type SeedShuffleParams = z.infer<typeof SeedShuffleSchema>;
