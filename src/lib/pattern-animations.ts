/**
 * Pattern Animations - inject CSS @keyframes into SVG
 * 
 * Injects a <defs><style> section with animations that can be applied
 * to pattern elements (rotation, scale, opacity, translation).
 */

export interface AnimationOptions {
	rotate?: {
		enabled: boolean;
		duration?: number; // seconds
		direction?: "cw" | "ccw"; // clockwise or counter-clockwise
	};
	scale?: {
		enabled: boolean;
		duration?: number;
		min?: number;
		max?: number;
	};
	opacity?: {
		enabled: boolean;
		duration?: number;
		min?: number;
		max?: number;
	};
	translate?: {
		enabled: boolean;
		duration?: number;
		x?: number; // pixels
		y?: number;
	};
}

/**
 * Generate CSS @keyframes for the enabled animations
 */
function generateKeyframes(opts: AnimationOptions): string {
	const keyframes: string[] = [];

	if (opts.rotate?.enabled) {
		const dir = opts.rotate.direction === "ccw" ? "-360deg" : "360deg";
		keyframes.push(`
@keyframes pattern-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(${dir}); }
}`);
	}

	if (opts.scale?.enabled) {
		const min = opts.scale.min ?? 0.9;
		const max = opts.scale.max ?? 1.1;
		keyframes.push(`
@keyframes pattern-scale {
  0%, 100% { transform: scale(${min}); }
  50% { transform: scale(${max}); }
}`);
	}

	if (opts.opacity?.enabled) {
		const min = opts.opacity.min ?? 0.3;
		const max = opts.opacity.max ?? 1;
		keyframes.push(`
@keyframes pattern-opacity {
  0%, 100% { opacity: ${min}; }
  50% { opacity: ${max}; }
}`);
	}

	if (opts.translate?.enabled) {
		const x = opts.translate.x ?? 10;
		const y = opts.translate.y ?? 10;
		keyframes.push(`
@keyframes pattern-translate {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(${x}px, ${y}px); }
}`);
	}

	return keyframes.join("\n");
}

/**
 * Generate animation CSS properties for elements
 */
function generateAnimationProps(opts: AnimationOptions): string {
	const animations: string[] = [];

	if (opts.rotate?.enabled) {
		const dur = opts.rotate.duration ?? 10;
		animations.push(`pattern-rotate ${dur}s linear infinite`);
	}

	if (opts.scale?.enabled) {
		const dur = opts.scale.duration ?? 5;
		animations.push(`pattern-scale ${dur}s ease-in-out infinite`);
	}

	if (opts.opacity?.enabled) {
		const dur = opts.opacity.duration ?? 5;
		animations.push(`pattern-opacity ${dur}s ease-in-out infinite`);
	}

	if (opts.translate?.enabled) {
		const dur = opts.translate.duration ?? 5;
		animations.push(`pattern-translate ${dur}s ease-in-out infinite`);
	}

	if (animations.length === 0) return "";

	return `animation: ${animations.join(", ")};`;
}

/**
 * Inject CSS animations into an SVG string
 * 
 * This adds a <defs><style> block with @keyframes and applies
 * animations to a wrapper <g> element around the pattern content.
 */
export function injectAnimations(svg: string, opts: AnimationOptions): string {
	// Check if any animation is enabled
	const hasAnimation = 
		opts.rotate?.enabled || 
		opts.scale?.enabled || 
		opts.opacity?.enabled || 
		opts.translate?.enabled;

	if (!hasAnimation) return svg;

	const keyframes = generateKeyframes(opts);
	const animProps = generateAnimationProps(opts);

	// Build the style block
	const styleBlock = `<defs><style>
${keyframes}
.pattern-animated {
  ${animProps}
  transform-origin: center center;
  transform-box: fill-box;
}
</style></defs>`;

	// Find the closing </svg> tag
	const closingTag = "</svg>";
	const closingIndex = svg.lastIndexOf(closingTag);
	
	if (closingIndex === -1) {
		console.warn("Invalid SVG: no closing </svg> tag found");
		return svg;
	}

	// Extract content between <svg ...> and </svg>
	const svgOpenMatch = svg.match(/<svg[^>]*>/);
	if (!svgOpenMatch) {
		console.warn("Invalid SVG: no opening <svg> tag found");
		return svg;
	}

	const svgOpenTag = svgOpenMatch[0];
	const svgOpenEnd = svgOpenMatch.index! + svgOpenTag.length;
	const innerContent = svg.slice(svgOpenEnd, closingIndex);

	// Check if there's already a <defs> section
	const hasDefs = /<defs[^>]*>/.test(svg);

	if (hasDefs) {
		// Insert keyframes into existing defs
		const result = svg.replace(/<defs[^>]*>/, (match) => {
			return `${match}<style>
${keyframes}
.pattern-animated {
  ${animProps}
  transform-origin: center center;
  transform-box: fill-box;
}
</style>`;
		});

		// Wrap inner content (excluding defs) in animated group
		// This is more complex, so for simplicity we'll just add a new wrapper
		return result.replace(closingTag, `<g class="pattern-animated">${innerContent}</g>${closingTag}`);
	}

	// Build new SVG with injected style and animated wrapper
	return `${svgOpenTag}${styleBlock}<g class="pattern-animated">${innerContent}</g>${closingTag}`;
}

/**
 * Default animation options (all disabled)
 */
export const DEFAULT_ANIMATION_OPTIONS: AnimationOptions = {
	rotate: { enabled: false, duration: 10, direction: "cw" },
	scale: { enabled: false, duration: 5, min: 0.9, max: 1.1 },
	opacity: { enabled: false, duration: 5, min: 0.3, max: 1 },
	translate: { enabled: false, duration: 5, x: 10, y: 10 },
};

