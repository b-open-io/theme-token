import type {
	ScatterParams,
	LineParams,
	NoiseParams,
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
	const count = params.count ?? Math.round((params.density ?? 0.3) * 50);
	const sizeMin = params.sizeMin ?? 3;
	const sizeMax = params.sizeMax ?? 8;
	const jitter = params.jitter ?? 0.5;
	const fill = getColor(params.fillToken, "currentColor");
	const stroke = params.strokeToken ? getColor(params.strokeToken, "none") : "none";
	const strokeWidth = params.strokeWidth ?? 0;

	const tileSize = 50;
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
			// Wrap shapes near edges
			if (x < 10) edgeShapes.push(s.replace(/(?:cx|x)="[\d.]+"/, `cx="${(x + tileSize).toFixed(1)}"`));
			if (y < 10) edgeShapes.push(s.replace(/(?:cy|y)="[\d.]+"/, `cy="${(y + tileSize).toFixed(1)}"`));
		}
	}

	const svg = wrapPattern([...shapes, ...edgeShapes].join("\n      "), tileSize, tileSize);
	return { svg, seed };
}

/**
 * Generate grid pattern
 */
export interface GridParams {
	cols?: number;
	rows?: number;
	gap?: number;
	dotSize?: number;
	fillToken?: Token;
	strokeToken?: Token;
	strokeWidth?: number;
	seed?: string;
}

export function generateGrid(params: GridParams): GenResult {
	const seed = params.seed || genSeed();
	const cols = params.cols ?? 5;
	const rows = params.rows ?? 5;
	const gap = params.gap ?? 10;
	const dotSize = params.dotSize ?? 2;
	const fill = getColor(params.fillToken, "currentColor");
	const stroke = params.strokeToken ? getColor(params.strokeToken, "none") : "none";
	const strokeWidth = params.strokeWidth ?? 0;

	const tileW = cols * gap;
	const tileH = rows * gap;
	const shapes: string[] = [];

	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			const x = c * gap + gap / 2;
			const y = r * gap + gap / 2;
			shapes.push(
				`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${dotSize}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`
			);
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
	const spacing = params.spacing ?? 10;
	const strokeWidth = params.strokeWidth ?? 1;
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
	const amplitude = params.amplitude ?? 8;
	const frequency = params.frequency ?? 1;
	const strokeWidth = params.strokeWidth ?? 1.5;
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

	const intensity = params.intensity ?? 0.5;
	const granularity = params.granularity ?? 1;
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

	const levels = params.levels ?? 5;
	const strokeWidth = params.strokeWidth ?? 0.8;
	const stroke = getColor(params.strokeToken, "currentColor");
	const opacity = params.opacity ?? 0.6;

	const tileSize = 80;
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
} as const;

export type GeneratorType = keyof typeof generators;

