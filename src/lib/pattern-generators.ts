import type {
	ScatterParams,
	LineParams,
	NoiseParams,
	ParallelogramParams,
	Token,
} from "./tools/pattern-tools";
import { tokenToCss } from "./tools/pattern-tools";

/**
 * Seeded random number generator (mulberry32)
 */
function seededRng(seed: string) {
	let h = 0;
	for (let i = 0; i < seed.length; i++) {
		h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
	}
	return () => {
		h |= 0;
		h = h + 0x6d2b79f5 | 0;
		let t = Math.imul(h ^ h >>> 15, 1 | h);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}

function genSeed(): string {
	return Math.random().toString(36).substring(2, 10);
}

function getColor(token: Token | undefined, fallback: string): string {
	return token ? tokenToCss[token] : fallback;
}

export interface GenResult {
	svg: string;
	seed: string;
}

/**
 * Wrap shapes in a pattern SVG
 */
function wrapPattern(
	inner: string,
	width: number,
	height: number,
	patternId = "p"
): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <defs>
    <pattern id="${patternId}" width="${width}" height="${height}" patternUnits="userSpaceOnUse">
      ${inner}
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#${patternId})"/>
</svg>`;
}

/**
 * Generate scatter pattern with random shapes
 */
export function generateScatter(params: ScatterParams): GenResult {
	const seed = params.seed || genSeed();
	const rng = seededRng(seed);

	const shape = params.shape || "circle";
	const count = params.count ?? Math.round((params.density ?? 0.3) * 30);
	const sizeMin = params.sizeMin ?? 8;
	const sizeMax = params.sizeMax ?? 24;
	const jitter = params.jitter ?? 0.5;
	const fill = getColor(params.fillToken, "currentColor");
	const stroke = params.strokeToken ? getColor(params.strokeToken, "none") : "none";
	const strokeWidth = params.strokeWidth ?? 0;

	const tileSize = 80;
	const shapes: string[] = [];

	for (let i = 0; i < count; i++) {
		const size = sizeMin + rng() * (sizeMax - sizeMin);
		const x = rng() * tileSize;
		const y = rng() * tileSize;
		const rotation = params.rotationRange ? rng() * params.rotationRange : 0;

		const transform = rotation ? ` transform="rotate(${rotation.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"` : "";

		if (shape === "circle") {
			shapes.push(
				`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(size / 2).toFixed(1)}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${transform}/>`
			);
		} else if (shape === "polygon") {
			// Triangle
			const r = size / 2;
			const pts = [0, 1, 2].map((n) => {
				const a = (n * 2 * Math.PI) / 3 - Math.PI / 2;
				return `${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`;
			}).join(" ");
			shapes.push(
				`<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${transform}/>`
			);
		} else if (shape === "emoji" || shape === "symbol") {
			const sym = params.symbol || "●";
			shapes.push(
				`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size.toFixed(1)}" fill="${fill}" text-anchor="middle" dominant-baseline="central"${transform}>${sym}</text>`
			);
		}
	}

	// Handle edge wrapping for seamless tiling
	const edgeShapes: string[] = [];
	for (const s of shapes) {
		const match = s.match(/(?:cx|x)="([\d.]+)"/);
		const yMatch = s.match(/(?:cy|y)="([\d.]+)"/);
		if (match && yMatch) {
			const x = Number.parseFloat(match[1]);
			const y = Number.parseFloat(yMatch[1]);
			// Wrap shapes near edges for seamless tiling
			if (x < 15) edgeShapes.push(s.replace(/(?:cx|x)="[\d.]+"/, `cx="${(x + tileSize).toFixed(1)}"`));
			if (y < 15) edgeShapes.push(s.replace(/(?:cy|y)="[\d.]+"/, `cy="${(y + tileSize).toFixed(1)}"`));
		}
	}

	const svg = wrapPattern([...shapes, ...edgeShapes].join("\n      "), tileSize, tileSize);
	return { svg, seed };
}

/**
 * Generate grid pattern with configurable shapes
 * This is the main pattern generator - places shapes in a regular grid
 */
export interface GridParams {
	cols?: number;
	rows?: number;
	gap?: number;
	dotSize?: number;
	shape?: "circle" | "square" | "triangle" | "hexagon" | "star" | "diamond";
	rotation?: number;
	fillToken?: Token;
	strokeToken?: Token;
	strokeWidth?: number;
	filled?: boolean;
	seed?: string;
}

/**
 * Generate a single shape SVG element
 */
function generateShapeSvg(
	shape: string,
	x: number,
	y: number,
	size: number,
	rotation: number,
	fill: string,
	stroke: string,
	strokeWidth: number,
	filled: boolean
): string {
	const r = size / 2;
	const transform = rotation !== 0 ? ` transform="rotate(${rotation} ${x} ${y})"` : "";
	const fillAttr = filled ? fill : "none";
	const strokeAttr = filled ? "none" : stroke;
	const sw = filled ? 0 : strokeWidth;

	switch (shape) {
		case "circle":
			return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fillAttr}" stroke="${strokeAttr}" stroke-width="${sw}"${transform}/>`;
		
		case "square":
			return `<rect x="${x - r}" y="${y - r}" width="${size}" height="${size}" fill="${fillAttr}" stroke="${strokeAttr}" stroke-width="${sw}"${transform}/>`;
		
		case "diamond":
			// Square rotated 45 degrees
			const dr = r * 0.7; // Slightly smaller to look proportional
			return `<rect x="${x - dr}" y="${y - dr}" width="${dr * 2}" height="${dr * 2}" fill="${fillAttr}" stroke="${strokeAttr}" stroke-width="${sw}" transform="rotate(45 ${x} ${y})${rotation !== 0 ? ` rotate(${rotation} ${x} ${y})` : ""}"/>`;
		
		case "triangle":
			const triPts = [0, 1, 2].map((n) => {
				const a = (n * 2 * Math.PI) / 3 - Math.PI / 2;
				return `${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`;
			}).join(" ");
			return `<polygon points="${triPts}" fill="${fillAttr}" stroke="${strokeAttr}" stroke-width="${sw}"${transform}/>`;
		
		case "hexagon":
			const hexPts = [0, 1, 2, 3, 4, 5].map((n) => {
				const a = (n * Math.PI) / 3;
				return `${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`;
			}).join(" ");
			return `<polygon points="${hexPts}" fill="${fillAttr}" stroke="${strokeAttr}" stroke-width="${sw}"${transform}/>`;
		
		case "star":
			const starPts: string[] = [];
			for (let i = 0; i < 10; i++) {
				const a = (i * Math.PI) / 5 - Math.PI / 2;
				const sr = i % 2 === 0 ? r : r * 0.4;
				starPts.push(`${(x + sr * Math.cos(a)).toFixed(1)},${(y + sr * Math.sin(a)).toFixed(1)}`);
			}
			return `<polygon points="${starPts.join(" ")}" fill="${fillAttr}" stroke="${strokeAttr}" stroke-width="${sw}"${transform}/>`;
		
		default:
			return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fillAttr}" stroke="${strokeAttr}" stroke-width="${sw}"${transform}/>`;
	}
}

export function generateGrid(params: GridParams): GenResult {
	const seed = params.seed || genSeed();
	const cols = params.cols ?? 4;
	const rows = params.rows ?? 4;
	const gap = params.gap ?? 24;
	const dotSize = params.dotSize ?? 8;
	const shape = params.shape ?? "circle";
	const rotation = params.rotation ?? 0;
	const fill = getColor(params.fillToken, "currentColor");
	const stroke = getColor(params.strokeToken, "currentColor");
	const strokeWidth = params.strokeWidth ?? 1.5;
	const filled = params.filled !== false; // Default to filled

	const tileW = cols * gap;
	const tileH = rows * gap;
	const shapes: string[] = [];

	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			const x = c * gap + gap / 2;
			const y = r * gap + gap / 2;
			shapes.push(generateShapeSvg(shape, x, y, dotSize, rotation, fill, stroke, strokeWidth, filled));
		}
	}

	const svg = wrapPattern(shapes.join("\n      "), tileW, tileH);
	return { svg, seed };
}

/**
 * Generate line pattern
 */
export function generateLines(params: LineParams): GenResult {
	const seed = params.seed || genSeed();
	const rng = seededRng(seed);

	const angle = params.angleDeg ?? 45;
	const spacing = params.spacing ?? 16;
	const strokeWidth = params.strokeWidth ?? 2;
	const jitter = params.jitter ?? 0;
	const dash = params.dash || "";
	const stroke = getColor(params.strokeToken, "currentColor");
	const opacity = params.opacity ?? 1;

	// Calculate tile size based on angle for seamless tiling
	const rad = (angle * Math.PI) / 180;
	const isVertical = Math.abs(Math.cos(rad)) < 0.01;
	const isHorizontal = Math.abs(Math.sin(rad)) < 0.01;

	let tileSize = spacing * 2;
	if (!isVertical && !isHorizontal) {
		tileSize = Math.abs(spacing / Math.sin(rad)) * 2;
	}
	tileSize = Math.min(Math.max(tileSize, 20), 100);

	const lines: string[] = [];
	const numLines = Math.ceil(tileSize / spacing) + 2;

	for (let i = -1; i < numLines; i++) {
		const offset = i * spacing + (jitter > 0 ? (rng() - 0.5) * spacing * jitter : 0);

		if (isHorizontal) {
			lines.push(
				`<line x1="0" y1="${offset.toFixed(1)}" x2="${tileSize}" y2="${offset.toFixed(1)}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`
			);
		} else if (isVertical) {
			lines.push(
				`<line x1="${offset.toFixed(1)}" y1="0" x2="${offset.toFixed(1)}" y2="${tileSize}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`
			);
		} else {
			// Diagonal lines
			const dx = Math.cos(rad) * tileSize * 2;
			const dy = Math.sin(rad) * tileSize * 2;
			const x1 = -tileSize + offset * Math.cos(rad + Math.PI / 2);
			const y1 = offset * Math.sin(rad + Math.PI / 2);
			lines.push(
				`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${(x1 + dx).toFixed(1)}" y2="${(y1 + dy).toFixed(1)}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`
			);
		}
	}

	const svg = wrapPattern(lines.join("\n      "), tileSize, tileSize);
	return { svg, seed };
}

/**
 * Generate wave pattern
 */
export interface WaveParams {
	amplitude?: number;
	frequency?: number;
	strokeWidth?: number;
	strokeToken?: Token;
	opacity?: number;
	seed?: string;
}

export function generateWaves(params: WaveParams): GenResult {
	const seed = params.seed || genSeed();
	const amplitude = params.amplitude ?? 12;
	const frequency = params.frequency ?? 1;
	const strokeWidth = params.strokeWidth ?? 2.5;
	const stroke = getColor(params.strokeToken, "currentColor");
	const opacity = params.opacity ?? 1;

	const tileWidth = 100;
	const tileHeight = amplitude * 4;
	const waves: string[] = [];

	const cy = tileHeight / 2;
	const points: string[] = [];

	for (let x = 0; x <= tileWidth; x += 2) {
		const y = cy + Math.sin((x / tileWidth) * Math.PI * 2 * frequency) * amplitude;
		points.push(`${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)}`);
	}

	waves.push(
		`<path d="${points.join(" ")}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`
	);

	const svg = wrapPattern(waves.join("\n      "), tileWidth, tileHeight);
	return { svg, seed };
}

/**
 * Generate noise/grain pattern
 */
export function generateNoise(params: NoiseParams): GenResult {
	const seed = params.seed || genSeed();
	const rng = seededRng(seed);

	const intensity = params.intensity ?? 0.3;
	const granularity = params.granularity ?? 2;
	const fill = getColor(params.fillToken, "currentColor");
	const opacity = params.opacity ?? 0.3;

	const tileSize = 50;
	const particleCount = Math.round(intensity * 500);
	const particles: string[] = [];

	for (let i = 0; i < particleCount; i++) {
		const x = rng() * tileSize;
		const y = rng() * tileSize;
		const size = 0.5 + rng() * granularity;
		const particleOpacity = 0.3 + rng() * 0.7;
		particles.push(
			`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${size.toFixed(2)}" fill="${fill}" opacity="${(particleOpacity * opacity).toFixed(2)}"/>`
		);
	}

	const svg = wrapPattern(particles.join("\n      "), tileSize, tileSize);
	return { svg, seed };
}

/**
 * Generate topographic contour pattern
 */
export interface TopoParams {
	levels?: number;
	strokeWidth?: number;
	strokeToken?: Token;
	opacity?: number;
	seed?: string;
}

export function generateTopo(params: TopoParams): GenResult {
	const seed = params.seed || genSeed();
	const rng = seededRng(seed);

	const levels = params.levels ?? 4;
	const strokeWidth = params.strokeWidth ?? 1.5;
	const stroke = getColor(params.strokeToken, "currentColor");
	const opacity = params.opacity ?? 0.7;

	const tileSize = 100;
	const paths: string[] = [];

	// Generate concentric irregular shapes
	const cx = tileSize / 2 + (rng() - 0.5) * 20;
	const cy = tileSize / 2 + (rng() - 0.5) * 20;

	for (let l = 0; l < levels; l++) {
		const baseRadius = 5 + l * (tileSize / levels / 2);
		const points: string[] = [];
		const segments = 12;

		for (let i = 0; i <= segments; i++) {
			const angle = (i / segments) * Math.PI * 2;
			const r = baseRadius + (rng() - 0.5) * baseRadius * 0.4;
			const x = cx + Math.cos(angle) * r;
			const y = cy + Math.sin(angle) * r;
			points.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
		}

		paths.push(
			`<path d="${points.join(" ")} Z" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`
		);
	}

	const svg = wrapPattern(paths.join("\n      "), tileSize, tileSize);
	return { svg, seed };
}

/**
 * Generate parallelogram pattern
 */
export function generateParallelogram(params: ParallelogramParams): GenResult {
	const seed = params.seed || genSeed();
	const width = params.width ?? 40;
	const height = params.height ?? 40;
	const skew = params.skew ?? 20;
	const gap = params.gap ?? 4;
	const fill = getColor(params.fillToken, "currentColor");
	const stroke = params.strokeToken ? getColor(params.strokeToken, "none") : "none";
	const strokeWidth = params.strokeWidth ?? 0;

	// Calculate bounding box for the skewed shape
	const skewRad = (skew * Math.PI) / 180;
	const skewOffset = height * Math.tan(skewRad);
	const tileW = width + gap + Math.abs(skewOffset);
	const tileH = height + gap;

	const shapes: string[] = [];

	// Draw the parallelogram using a polygon
	// Points: Top-Left, Top-Right, Bottom-Right, Bottom-Left
	// Center it in the tile
	const cx = tileW / 2;
	const cy = tileH / 2;
	
	const halfW = width / 2;
	const halfH = height / 2;
	const halfSkew = skewOffset / 2;

	const p1 = `${(cx - halfW + halfSkew).toFixed(1)},${(cy - halfH).toFixed(1)}`;
	const p2 = `${(cx + halfW + halfSkew).toFixed(1)},${(cy - halfH).toFixed(1)}`;
	const p3 = `${(cx + halfW - halfSkew).toFixed(1)},${(cy + halfH).toFixed(1)}`;
	const p4 = `${(cx - halfW - halfSkew).toFixed(1)},${(cy + halfH).toFixed(1)}`;

	shapes.push(
		`<polygon points="${p1} ${p2} ${p3} ${p4}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`
	);

	const svg = wrapPattern(shapes.join("\n      "), tileW, tileH);
	return { svg, seed };
}

/**
 * All generators as a map for dynamic invocation
 */
export const generators = {
	scatter: generateScatter,
	grid: generateGrid,
	lines: generateLines,
	stripes: generateLines, // Alias for lines
	waves: generateWaves,
	noise: generateNoise,
	topo: generateTopo,
	parallelogram: generateParallelogram,
} as const;

export type GeneratorType = keyof typeof generators;

// Re-export types for external usage
export type { ParallelogramParams } from "./tools/pattern-tools";
