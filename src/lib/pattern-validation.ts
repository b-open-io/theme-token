/**
 * SVG Pattern Validation & Sanitization
 *
 * Ensures generated SVG patterns are safe and well-formed
 */

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

export interface PatternMeta {
	hasPattern: boolean;
	tileWidth?: number;
	tileHeight?: number;
	patternId?: string;
	nodeCount: number;
	byteSize: number;
}

// Unsafe elements that should never appear in patterns
const UNSAFE_ELEMENTS = [
	"script",
	"foreignObject",
	"iframe",
	"embed",
	"object",
	"use", // can reference external resources
	"image", // external images
	"a", // links
];

// Unsafe attributes
const UNSAFE_ATTRS = [
	"onclick",
	"onload",
	"onerror",
	"onmouseover",
	"onfocus",
	"onblur",
	"xlink:href", // can load external resources
	"href", // same
];

// Max limits
const MAX_SVG_BYTES = 50_000; // 50KB
const MAX_NODE_COUNT = 500;

/**
 * Validate an SVG pattern string
 */
export function validatePatternSvg(svg: string): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Basic structure checks
	if (!svg.includes("<svg")) {
		errors.push("Missing <svg> root element");
		return { valid: false, errors, warnings };
	}

	if (!svg.includes("</svg>")) {
		errors.push("Unclosed <svg> element");
		return { valid: false, errors, warnings };
	}

	// Pattern element check
	if (!svg.includes("<pattern")) {
		errors.push("Missing <pattern> element - SVG must define a tileable pattern");
	}

	if (!svg.includes("</pattern>") && !svg.includes("/>")) {
		if (svg.includes("<pattern") && !svg.includes("</pattern>")) {
			errors.push("Unclosed <pattern> element");
		}
	}

	// patternUnits check
	if (svg.includes("<pattern") && !svg.includes('patternUnits="userSpaceOnUse"')) {
		warnings.push('Pattern should use patternUnits="userSpaceOnUse" for predictable tiling');
	}

	// Unsafe element checks
	for (const elem of UNSAFE_ELEMENTS) {
		const regex = new RegExp(`<${elem}[\\s>]`, "i");
		if (regex.test(svg)) {
			errors.push(`Unsafe element <${elem}> detected`);
		}
	}

	// Unsafe attribute checks
	for (const attr of UNSAFE_ATTRS) {
		const regex = new RegExp(`${attr}\\s*=`, "i");
		if (regex.test(svg)) {
			errors.push(`Unsafe attribute "${attr}" detected`);
		}
	}

	// External resource checks
	if (/url\s*\(\s*["']?https?:/i.test(svg)) {
		errors.push("External URL references not allowed");
	}

	if (/data:/i.test(svg)) {
		warnings.push("Data URLs detected - may increase size significantly");
	}

	// Size checks
	if (svg.length > MAX_SVG_BYTES) {
		errors.push(`SVG exceeds ${MAX_SVG_BYTES} byte limit (${svg.length} bytes)`);
	}

	// Node count estimate (rough)
	const nodeCount = (svg.match(/<[a-z]/gi) || []).length;
	if (nodeCount > MAX_NODE_COUNT) {
		warnings.push(`High node count (${nodeCount}) may impact performance`);
	}

	// Filter checks
	if (/<filter/i.test(svg)) {
		warnings.push("SVG filters may impact rendering performance");
	}

	// Mask/clip checks (can be expensive)
	if (/<(mask|clipPath)/i.test(svg)) {
		warnings.push("Masks/clips may impact rendering performance");
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Sanitize SVG by removing unsafe elements and attributes
 */
export function sanitizeSvg(svg: string): string {
	let cleaned = svg;

	// Remove unsafe elements
	for (const elem of UNSAFE_ELEMENTS) {
		// Self-closing
		cleaned = cleaned.replace(new RegExp(`<${elem}[^>]*/?>`, "gi"), "");
		// With content
		cleaned = cleaned.replace(new RegExp(`<${elem}[^>]*>[\\s\\S]*?</${elem}>`, "gi"), "");
	}

	// Remove unsafe attributes
	for (const attr of UNSAFE_ATTRS) {
		cleaned = cleaned.replace(new RegExp(`\\s*${attr}\\s*=\\s*["'][^"']*["']`, "gi"), "");
		cleaned = cleaned.replace(new RegExp(`\\s*${attr}\\s*=\\s*[^\\s>]+`, "gi"), "");
	}

	// Remove external URLs in url() functions
	cleaned = cleaned.replace(/url\s*\(\s*["']?https?:[^)]+\)/gi, 'url("")');

	// Remove javascript: protocols
	cleaned = cleaned.replace(/javascript:[^"']*/gi, "");

	// Clean up empty tags that might result
	cleaned = cleaned.replace(/<(\w+)[^>]*>\s*<\/\1>/g, "");

	return cleaned;
}

/**
 * Extract metadata from SVG pattern
 */
export function extractPatternMeta(svg: string): PatternMeta {
	const meta: PatternMeta = {
		hasPattern: false,
		nodeCount: (svg.match(/<[a-z]/gi) || []).length,
		byteSize: svg.length,
	};

	// Find pattern element
	const patternMatch = svg.match(/<pattern\s+([^>]*)>/i);
	if (!patternMatch) {
		return meta;
	}

	meta.hasPattern = true;
	const attrs = patternMatch[1];

	// Extract id
	const idMatch = attrs.match(/id\s*=\s*["']([^"']+)["']/);
	if (idMatch) {
		meta.patternId = idMatch[1];
	}

	// Extract width
	const widthMatch = attrs.match(/width\s*=\s*["']?([\d.]+)["']?/);
	if (widthMatch) {
		meta.tileWidth = Number.parseFloat(widthMatch[1]);
	}

	// Extract height
	const heightMatch = attrs.match(/height\s*=\s*["']?([\d.]+)["']?/);
	if (heightMatch) {
		meta.tileHeight = Number.parseFloat(heightMatch[1]);
	}

	return meta;
}

/**
 * Quick check if SVG is valid pattern (for fast rejection)
 */
export function isValidPattern(svg: string): boolean {
	return (
		svg.includes("<svg") &&
		svg.includes("</svg>") &&
		svg.includes("<pattern") &&
		!UNSAFE_ELEMENTS.some((elem) => new RegExp(`<${elem}[\\s>]`, "i").test(svg))
	);
}

/**
 * Ensure pattern has proper structure for seamless tiling
 */
export function ensureSeamlessStructure(svg: string): string {
	// Add patternUnits if missing
	if (svg.includes("<pattern") && !svg.includes("patternUnits")) {
		return svg.replace(/<pattern\s/, '<pattern patternUnits="userSpaceOnUse" ');
	}
	return svg;
}


