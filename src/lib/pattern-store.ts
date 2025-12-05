import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generators } from "./pattern-generators";
import type { Token } from "./tools/pattern-tools";

// Re-export Token as ThemeToken for UI
export type ThemeToken = Token;

export type GeneratorType = "ai" | "scatter" | "grid" | "waves" | "stripes" | "noise" | "topo" | "chevron" | "crosshatch" | "dots" | "hexagon";
export type SymmetryMode = "none" | "mirrorX" | "mirrorY" | "rotate";
export type ShapeType = "circle" | "polygon" | "emoji" | "symbol" | "text";
export type PatternStatus = "idle" | "generating" | "error";
export type GradientType = "none" | "linear" | "radial";
export type AspectRatio = "1:1" | "16:9" | "4:3" | "3:2" | "2:1";

export interface PatternParams {
	// Size
	sizeMin: number;      // 1-100
	sizeMax: number;      // 1-100
	spacing: number;      // 1-200
	density: number;      // 1-100

	// Transform
	rotation: number;     // 0-360
	jitter: number;       // 0-100 (position randomness)
	strokeWidth: number;  // 0.1-20

	// Opacity
	opacity: number;           // 0-100
	randomizeOpacity: boolean;
	opacityMin: number;        // 0-100
	opacityMax: number;        // 0-100

	// Symmetry & copies
	symmetry: SymmetryMode;
	rotateCopies: boolean;
	numberOfCopies: number;    // 1-12
	rotateOffsetX: number;     // 0-100
	rotateOffsetY: number;     // 0-100

	// Shape
	shape: ShapeType;
	customSymbol: string;      // emoji or symbol

	// Text
	textInput: string;
	fontSize: number;          // 8-72
	fontWeight: "normal" | "bold";
	fontStyle: "normal" | "italic";

	// Aspect
	aspectRatio: AspectRatio;
}

export interface TileConfig {
	width: number;
	height: number;
	scale: number;
	rotateDeg: number;
}

export interface ColorConfig {
	// Shape colors (can be token OR hex)
	fill: ThemeToken | string;
	stroke: ThemeToken | string;
	background: ThemeToken | string;

	// Shape gradient
	shapeGradientType: GradientType;
	shapeGradientColor1: string;  // hex
	shapeGradientColor2: string;  // hex
	shapeGradientAngle: number;   // 0-360

	// Background gradient
	bgGradientType: GradientType;
	bgGradientColor1: string;     // hex
	bgGradientColor2: string;     // hex
	bgGradientAngle: number;      // 0-360
	bgGradientRadius: number;     // for radial, 0-100
}

export interface AnimationConfig {
	enabled: boolean;

	// Rotation animation
	animateRotation: boolean;
	rotationDuration: number;     // seconds
	rotationOffset: number;       // degrees

	// Opacity animation
	animateOpacity: boolean;
	opacityDuration: number;      // seconds
	opacityMin: number;           // 0-1
	opacityMax: number;           // 0-1

	// Scale animation
	animateScale: boolean;
	scaleDuration: number;        // seconds
	scaleMin: number;             // 0.1-2
	scaleMax: number;             // 0.1-2

	// Translation animation
	animateTranslation: boolean;
	translationDuration: number;  // seconds
	translationDistanceX: number; // px
	translationDistanceY: number; // px

	// Blur animation
	animateBlur: boolean;
	blurDuration: number;         // seconds
	blurMin: number;              // 0-20
	blurMax: number;              // 0-20
}

export interface PatternHistoryEntry {
	svg: string;
	prompt: string;
	params: PatternParams;
	timestamp: number;
}

export interface PatternError {
	code: "INVALID_SVG" | "TIMEOUT" | "RATE_LIMIT" | "PAYMENT_FAILED" | "GENERATION_FAILED";
	message: string;
	recoverable: boolean;
}

export interface PatternState {
	svg: string | null;
	prompt: string;
	generatorType: GeneratorType;
	seed: string;
	params: PatternParams;
	tile: TileConfig;
	colors: ColorConfig;
	animation: AnimationConfig;
	status: PatternStatus;
	error: PatternError | null;
	history: PatternHistoryEntry[];
	historyIndex: number;
}

const defaultParams: PatternParams = {
	// Size
	sizeMin: 5,
	sizeMax: 20,
	spacing: 20,
	density: 50,

	// Transform
	rotation: 0,
	jitter: 0,
	strokeWidth: 1,

	// Opacity
	opacity: 100,
	randomizeOpacity: false,
	opacityMin: 30,
	opacityMax: 100,

	// Symmetry
	symmetry: "none",
	rotateCopies: false,
	numberOfCopies: 6,
	rotateOffsetX: 50,
	rotateOffsetY: 50,

	// Shape
	shape: "circle",
	customSymbol: "●",

	// Text
	textInput: "",
	fontSize: 24,
	fontWeight: "normal",
	fontStyle: "normal",

	// Aspect
	aspectRatio: "1:1",
};

const defaultTile: TileConfig = {
	width: 50,
	height: 50,
	scale: 1,
	rotateDeg: 0,
};

const defaultColors: ColorConfig = {
	fill: "currentColor",
	stroke: "currentColor",
	background: "background",

	// Shape gradient
	shapeGradientType: "none",
	shapeGradientColor1: "#FF9500",
	shapeGradientColor2: "#FF2D55",
	shapeGradientAngle: 0,

	// Background gradient
	bgGradientType: "none",
	bgGradientColor1: "#000000",
	bgGradientColor2: "#333333",
	bgGradientAngle: 0,
	bgGradientRadius: 50,
};

const defaultAnimation: AnimationConfig = {
	enabled: false,

	// Rotation
	animateRotation: false,
	rotationDuration: 10,
	rotationOffset: 0,

	// Opacity
	animateOpacity: false,
	opacityDuration: 5,
	opacityMin: 0.3,
	opacityMax: 1,

	// Scale
	animateScale: false,
	scaleDuration: 5,
	scaleMin: 0.9,
	scaleMax: 1.2,

	// Translation
	animateTranslation: false,
	translationDuration: 20,
	translationDistanceX: 100,
	translationDistanceY: -100,

	// Blur
	animateBlur: false,
	blurDuration: 5,
	blurMin: 0,
	blurMax: 10,
};

function genSeed(): string {
	return Math.random().toString(36).substring(2, 10);
}

/**
 * Map unified params to generator-specific params
 */
function mapToGeneratorParams(type: GeneratorType, params: PatternParams, colors: ColorConfig, seed: string) {
	// For theme tokens, keep as-is; for hex colors, pass directly
	const fillToken = typeof colors.fill === "string" && colors.fill.startsWith("#")
		? undefined
		: colors.fill as Token;
	const strokeToken = typeof colors.stroke === "string" && colors.stroke.startsWith("#")
		? undefined
		: colors.stroke as Token;

	const base = { seed, fillToken, strokeToken };

	switch (type) {
		case "scatter":
		case "dots":
			return {
				...base,
				shape: params.shape === "text" ? "symbol" : params.shape,
				symbol: params.customSymbol || params.textInput,
				count: Math.round(params.density * 2),
				sizeMin: params.sizeMin,
				sizeMax: params.sizeMax,
				jitter: params.jitter / 100,
				rotationRange: params.rotation,
				spacing: params.spacing,
				strokeWidth: params.strokeWidth,
			};
		case "grid":
		case "hexagon":
			return {
				...base,
				cols: Math.round(params.density / 10) || 5,
				rows: Math.round(params.density / 10) || 5,
				gap: params.spacing,
				dotSize: (params.sizeMin + params.sizeMax) / 4,
				strokeWidth: params.strokeWidth,
			};
		case "stripes":
		case "chevron":
		case "crosshatch":
			return {
				...base,
				angleDeg: params.rotation,
				spacing: params.spacing,
				strokeWidth: params.strokeWidth,
				jitter: params.jitter / 100,
				opacity: params.opacity / 100,
			};
		case "waves":
			return {
				...base,
				amplitude: params.sizeMax / 2,
				frequency: params.density / 50,
				strokeWidth: params.strokeWidth,
				opacity: params.opacity / 100,
			};
		case "noise":
			return {
				...base,
				intensity: params.density / 100,
				granularity: (params.sizeMin + params.sizeMax) / 20,
				opacity: params.opacity / 100,
			};
		case "topo":
			return {
				...base,
				levels: Math.round(params.density / 20) || 5,
				strokeWidth: params.strokeWidth,
				opacity: params.opacity / 100,
			};
		default:
			return base;
	}
}

export interface PatternActions {
	generate: (prompt: string) => Promise<void>;
	runGenerator: (type: GeneratorType, params?: Partial<PatternParams>) => void;
	setParams: (params: Partial<PatternParams>) => void;
	setColors: (colors: Partial<ColorConfig>) => void;
	setTile: (tile: Partial<TileConfig>) => void;
	setAnimation: (animation: Partial<AnimationConfig>) => void;
	shuffleSeed: () => void;
	setSeed: (seed: string) => void;
	applyToolCall: (toolName: string, args: unknown) => void;
	undo: () => void;
	redo: () => void;
	reset: () => void;
	exportSvg: () => string;
	exportCss: () => string;
}

export type PatternStore = PatternState & PatternActions;

export const usePatternStore = create<PatternStore>()(
	persist(
		(set, get) => ({
			// Initial state
			svg: null,
			prompt: "",
			generatorType: "scatter",
			seed: genSeed(),
			params: defaultParams,
			tile: defaultTile,
			colors: defaultColors,
			animation: defaultAnimation,
			status: "idle",
			error: null,
			history: [],
			historyIndex: -1,

			// Actions
			generate: async (prompt: string) => {
				set({ status: "generating", error: null, prompt });

				try {
					const { seed, colors } = get();
					const res = await fetch("/api/generate-pattern", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ prompt, seed, colorMode: "currentColor" }),
					});

					if (!res.ok) {
						const data = await res.json();
						throw new Error(data.error || "Generation failed");
					}

					const data = await res.json();
					const state = get();

					set({
						svg: data.svg,
						seed: data.seed || seed,
						status: "idle",
						generatorType: "ai",
						history: [
							...state.history,
							{ svg: data.svg, prompt, params: state.params, timestamp: Date.now() },
						],
						historyIndex: state.history.length,
					});
				} catch (err) {
					set({
						status: "error",
						error: {
							code: "GENERATION_FAILED",
							message: err instanceof Error ? err.message : "Unknown error",
							recoverable: true,
						},
					});
				}
			},

			runGenerator: (type, overrideParams) => {
				const state = get();
				const params = { ...state.params, ...overrideParams };
				const genParams = mapToGeneratorParams(type, params, state.colors, state.seed);

				if (type === "ai") return;

				let result: { svg: string; seed: string };
				switch (type) {
					case "scatter":
					case "dots":
						result = generators.scatter(genParams as Parameters<typeof generators.scatter>[0]);
						break;
					case "grid":
					case "hexagon":
						result = generators.grid(genParams as Parameters<typeof generators.grid>[0]);
						break;
					case "stripes":
					case "chevron":
					case "crosshatch":
						result = generators.lines(genParams as Parameters<typeof generators.lines>[0]);
						break;
					case "waves":
						result = generators.waves(genParams as Parameters<typeof generators.waves>[0]);
						break;
					case "noise":
						result = generators.noise(genParams as Parameters<typeof generators.noise>[0]);
						break;
					case "topo":
						result = generators.topo(genParams as Parameters<typeof generators.topo>[0]);
						break;
					default:
						return;
				}

				set({
					svg: result.svg,
					seed: result.seed,
					generatorType: type,
					params,
					status: "idle",
					error: null,
					history: [
						...state.history,
						{ svg: result.svg, prompt: state.prompt, params, timestamp: Date.now() },
					],
					historyIndex: state.history.length,
				});
			},

			setParams: (newParams) => {
				const state = get();
				const params = { ...state.params, ...newParams };
				set({ params });

				// Re-run generator if not AI
				if (state.generatorType !== "ai" && state.svg) {
					get().runGenerator(state.generatorType);
				}
			},

			setColors: (newColors) => {
				const state = get();
				set({ colors: { ...state.colors, ...newColors } });

				if (state.generatorType !== "ai" && state.svg) {
					get().runGenerator(state.generatorType);
				}
			},

			setTile: (newTile) => {
				set((state) => ({ tile: { ...state.tile, ...newTile } }));
			},

			setAnimation: (newAnimation) => {
				set((state) => ({ animation: { ...state.animation, ...newAnimation } }));
			},

			shuffleSeed: () => {
				const newSeed = genSeed();
				set({ seed: newSeed });

				const state = get();
				if (state.generatorType !== "ai" && state.svg) {
					get().runGenerator(state.generatorType);
				}
			},

			setSeed: (seed) => {
				set({ seed });

				const state = get();
				if (state.generatorType !== "ai" && state.svg) {
					get().runGenerator(state.generatorType);
				}
			},

			applyToolCall: (toolName, args) => {
				// Handle tool results from AI (future: apply transforms)
				console.log("Tool call:", toolName, args);
			},

			undo: () => {
				const { history, historyIndex } = get();
				if (historyIndex > 0) {
					const prev = history[historyIndex - 1];
					set({
						svg: prev.svg,
						prompt: prev.prompt,
						params: prev.params,
						historyIndex: historyIndex - 1,
					});
				}
			},

			redo: () => {
				const { history, historyIndex } = get();
				if (historyIndex < history.length - 1) {
					const next = history[historyIndex + 1];
					set({
						svg: next.svg,
						prompt: next.prompt,
						params: next.params,
						historyIndex: historyIndex + 1,
					});
				}
			},

			reset: () => {
				set({
					svg: null,
					prompt: "",
					generatorType: "scatter",
					seed: genSeed(),
					params: defaultParams,
					tile: defaultTile,
					colors: defaultColors,
					animation: defaultAnimation,
					status: "idle",
					error: null,
				});
			},

			exportSvg: () => {
				return get().svg || "";
			},

			exportCss: () => {
				const { svg, tile, colors } = get();
				if (!svg) return "";

				const encoded = encodeURIComponent(svg);
				return `.pattern-bg {
  background-color: var(--${colors.background});
  background-image: url("data:image/svg+xml,${encoded}");
  background-repeat: repeat;
  background-size: ${tile.width * tile.scale}px ${tile.height * tile.scale}px;
  ${tile.rotateDeg ? `transform: rotate(${tile.rotateDeg}deg);` : ""}
}`;
			},
		}),
		{
			name: "pattern-state",
			partialize: (state) => ({
				params: state.params,
				colors: state.colors,
				tile: state.tile,
				seed: state.seed,
				generatorType: state.generatorType,
			}),
		}
	)
);

/**
 * Serialize state to URL params (matching svg.designcode.io format where possible)
 */
export function serializeState(state: PatternState): URLSearchParams {
	const p = new URLSearchParams();

	// Core
	p.set("patternType", state.generatorType);
	p.set("seed", state.seed);
	if (state.prompt) p.set("prompt", state.prompt);

	// Size params
	p.set("minSize", String(state.params.sizeMin));
	p.set("maxSize", String(state.params.sizeMax));
	p.set("spacing", String(state.params.spacing));
	p.set("rotation", String(state.params.rotation));
	p.set("strokeWidth", String(state.params.strokeWidth));

	// Opacity
	p.set("opacity", String(state.params.opacity));
	p.set("randomizeOpacity", String(state.params.randomizeOpacity));
	p.set("minOpacity", String(state.params.opacityMin / 100));
	p.set("maxOpacity", String(state.params.opacityMax / 100));

	// Position
	p.set("positionRandomness", String(state.params.jitter));

	// Shape
	p.set("shape", state.params.shape);
	if (state.params.customSymbol) p.set("selectedEmoji", state.params.customSymbol);
	if (state.params.textInput) p.set("textInput", state.params.textInput);
	p.set("fontSize", String(state.params.fontSize));
	p.set("fontWeight", state.params.fontWeight);
	p.set("fontStyle", state.params.fontStyle);

	// Copies
	p.set("rotateCopies", String(state.params.rotateCopies));
	p.set("numberOfCopies", String(state.params.numberOfCopies));
	p.set("rotateOffsetX", String(state.params.rotateOffsetX));
	p.set("rotateOffsetY", String(state.params.rotateOffsetY));

	// Colors
	p.set("shapeColor", String(state.colors.fill));
	p.set("backgroundColor", String(state.colors.background));
	p.set("shapeColorType", state.colors.shapeGradientType);
	if (state.colors.shapeGradientType !== "none") {
		p.set("shapeGradientColor1", state.colors.shapeGradientColor1);
		p.set("shapeGradientColor2", state.colors.shapeGradientColor2);
		p.set("shapeGradientAngle", String(state.colors.shapeGradientAngle));
	}
	p.set("backgroundType", state.colors.bgGradientType);
	if (state.colors.bgGradientType !== "none") {
		p.set("gradientColor1", state.colors.bgGradientColor1);
		p.set("gradientColor2", state.colors.bgGradientColor2);
		p.set("gradientAngle", String(state.colors.bgGradientAngle));
	}

	// Animation
	p.set("animateRotation", String(state.animation.animateRotation));
	p.set("animationDuration", String(state.animation.rotationDuration));
	p.set("animateOpacity", String(state.animation.animateOpacity));
	p.set("opacityAnimationDuration", String(state.animation.opacityDuration));
	p.set("animateScale", String(state.animation.animateScale));
	p.set("scaleAnimationDuration", String(state.animation.scaleDuration));
	p.set("minScale", String(state.animation.scaleMin));
	p.set("maxScale", String(state.animation.scaleMax));
	p.set("animateTranslation", String(state.animation.animateTranslation));
	p.set("translationAnimationDuration", String(state.animation.translationDuration));
	p.set("translationDistanceX", String(state.animation.translationDistanceX));
	p.set("translationDistanceY", String(state.animation.translationDistanceY));
	p.set("animateBlur", String(state.animation.animateBlur));
	p.set("blurAnimationDuration", String(state.animation.blurDuration));
	p.set("minBlur", String(state.animation.blurMin));
	p.set("maxBlur", String(state.animation.blurMax));

	// Aspect
	p.set("aspectRatio", state.params.aspectRatio);

	return p;
}

const VALID_GENERATORS: GeneratorType[] = ["ai", "scatter", "grid", "waves", "stripes", "noise", "topo", "chevron", "crosshatch", "dots", "hexagon"];
const VALID_SHAPES: ShapeType[] = ["circle", "polygon", "emoji", "symbol", "text"];
const VALID_SYMMETRY: SymmetryMode[] = ["none", "mirrorX", "mirrorY", "rotate"];

/**
 * Deserialize URL params to partial state
 */
export function deserializeState(p: URLSearchParams): Partial<PatternState> {
	const state: Partial<PatternState> = {};
	const params: Partial<PatternParams> = {};
	const colors: Partial<ColorConfig> = {};
	const animation: Partial<AnimationConfig> = {};

	// Core
	const gen = p.get("patternType") || p.get("generator");
	if (gen && VALID_GENERATORS.includes(gen as GeneratorType)) {
		state.generatorType = gen as GeneratorType;
	}
	const seed = p.get("seed");
	if (seed) state.seed = seed;
	const prompt = p.get("prompt");
	if (prompt) state.prompt = prompt;

	// Size
	const minSize = p.get("minSize") || p.get("sizeMin");
	if (minSize) params.sizeMin = Number(minSize);
	const maxSize = p.get("maxSize") || p.get("sizeMax");
	if (maxSize) params.sizeMax = Number(maxSize);
	const spacing = p.get("spacing");
	if (spacing) params.spacing = Number(spacing);
	const rotation = p.get("rotation");
	if (rotation) params.rotation = Number(rotation);
	const strokeWidth = p.get("strokeWidth");
	if (strokeWidth) params.strokeWidth = Number(strokeWidth);

	// Opacity
	const opacity = p.get("opacity");
	if (opacity) params.opacity = Number(opacity);
	const randomizeOpacity = p.get("randomizeOpacity");
	if (randomizeOpacity) params.randomizeOpacity = randomizeOpacity === "true";
	const minOpacity = p.get("minOpacity");
	if (minOpacity) params.opacityMin = Number(minOpacity) * 100;
	const maxOpacity = p.get("maxOpacity");
	if (maxOpacity) params.opacityMax = Number(maxOpacity) * 100;

	// Position
	const jitter = p.get("positionRandomness") || p.get("jitter");
	if (jitter) params.jitter = Number(jitter);

	// Shape
	const shape = p.get("shape");
	if (shape && VALID_SHAPES.includes(shape as ShapeType)) {
		params.shape = shape as ShapeType;
	}
	const emoji = p.get("selectedEmoji");
	if (emoji) params.customSymbol = emoji;
	const textInput = p.get("textInput");
	if (textInput) params.textInput = textInput;
	const fontSize = p.get("fontSize");
	if (fontSize) params.fontSize = Number(fontSize);
	const fontWeight = p.get("fontWeight");
	if (fontWeight === "bold" || fontWeight === "normal") params.fontWeight = fontWeight;
	const fontStyle = p.get("fontStyle");
	if (fontStyle === "italic" || fontStyle === "normal") params.fontStyle = fontStyle;

	// Copies
	const rotateCopies = p.get("rotateCopies");
	if (rotateCopies) params.rotateCopies = rotateCopies === "true";
	const numCopies = p.get("numberOfCopies");
	if (numCopies) params.numberOfCopies = Number(numCopies);
	const rotOffX = p.get("rotateOffsetX");
	if (rotOffX) params.rotateOffsetX = Number(rotOffX);
	const rotOffY = p.get("rotateOffsetY");
	if (rotOffY) params.rotateOffsetY = Number(rotOffY);

	// Colors
	const fill = p.get("shapeColor") || p.get("fill");
	if (fill) colors.fill = fill;
	const bg = p.get("backgroundColor") || p.get("background");
	if (bg) colors.background = bg;
	const shapeGradType = p.get("shapeColorType");
	if (shapeGradType === "linear" || shapeGradType === "radial") {
		colors.shapeGradientType = shapeGradType;
		const c1 = p.get("shapeGradientColor1");
		if (c1) colors.shapeGradientColor1 = c1;
		const c2 = p.get("shapeGradientColor2");
		if (c2) colors.shapeGradientColor2 = c2;
		const angle = p.get("shapeGradientAngle");
		if (angle) colors.shapeGradientAngle = Number(angle);
	}
	const bgGradType = p.get("backgroundType");
	if (bgGradType === "linear" || bgGradType === "radial") {
		colors.bgGradientType = bgGradType;
		const c1 = p.get("gradientColor1");
		if (c1) colors.bgGradientColor1 = c1;
		const c2 = p.get("gradientColor2");
		if (c2) colors.bgGradientColor2 = c2;
		const angle = p.get("gradientAngle");
		if (angle) colors.bgGradientAngle = Number(angle);
	}

	// Animation
	const animRot = p.get("animateRotation");
	if (animRot) animation.animateRotation = animRot === "true";
	const animDur = p.get("animationDuration");
	if (animDur) animation.rotationDuration = Number(animDur);
	const animOp = p.get("animateOpacity");
	if (animOp) animation.animateOpacity = animOp === "true";
	const opDur = p.get("opacityAnimationDuration");
	if (opDur) animation.opacityDuration = Number(opDur);
	const animScale = p.get("animateScale");
	if (animScale) animation.animateScale = animScale === "true";
	const scaleDur = p.get("scaleAnimationDuration");
	if (scaleDur) animation.scaleDuration = Number(scaleDur);
	const scaleMin = p.get("minScale");
	if (scaleMin) animation.scaleMin = Number(scaleMin);
	const scaleMax = p.get("maxScale");
	if (scaleMax) animation.scaleMax = Number(scaleMax);
	const animTrans = p.get("animateTranslation");
	if (animTrans) animation.animateTranslation = animTrans === "true";
	const transDur = p.get("translationAnimationDuration");
	if (transDur) animation.translationDuration = Number(transDur);
	const transX = p.get("translationDistanceX");
	if (transX) animation.translationDistanceX = Number(transX);
	const transY = p.get("translationDistanceY");
	if (transY) animation.translationDistanceY = Number(transY);
	const animBlur = p.get("animateBlur");
	if (animBlur) animation.animateBlur = animBlur === "true";
	const blurDur = p.get("blurAnimationDuration");
	if (blurDur) animation.blurDuration = Number(blurDur);
	const blurMin = p.get("minBlur");
	if (blurMin) animation.blurMin = Number(blurMin);
	const blurMax = p.get("maxBlur");
	if (blurMax) animation.blurMax = Number(blurMax);

	// Aspect
	const aspect = p.get("aspectRatio");
	if (aspect && ["1:1", "16:9", "4:3", "3:2", "2:1"].includes(aspect)) {
		params.aspectRatio = aspect as AspectRatio;
	}

	// Assemble
	if (Object.keys(params).length) state.params = { ...defaultParams, ...params };
	if (Object.keys(colors).length) state.colors = { ...defaultColors, ...colors };
	if (Object.keys(animation).length) state.animation = { ...defaultAnimation, ...animation };

	return state;
}

