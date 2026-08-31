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
	"feImage",
	"a", // links
	"audio",
	"video",
	"animate",
	"animateMotion",
	"animateTransform",
	"set",
];

// Max limits
const MAX_SVG_BYTES = 100_000;
const MAX_NODE_COUNT = 500;

const CSS_URL = /url\s*\(\s*([^)]*?)\s*\)/gi;

function byteSize(value: string): number {
	return new TextEncoder().encode(value).byteLength;
}

function unsafeElementPattern(element: string): RegExp {
	return new RegExp(`<(?:[\\w.-]+:)?${element}\\b`, "i");
}

function isLocalFragmentUrl(value: string): boolean {
	const unquoted = value.trim().replace(/^(["'])(.*)\1$/, "$2");
	return /^#[A-Za-z_][\w:.-]*$/.test(unquoted);
}

function hasUnsafeCssUrl(svg: string): boolean {
	return Array.from(svg.matchAll(CSS_URL)).some(
		(match) => !isLocalFragmentUrl(match[1] ?? ""),
	);
}

/**
 * Validate an SVG pattern string
 */
export function validatePatternSvg(svg: string): ValidationResult {
	const issues: string[] = [];
	const warnings: string[] = [];

	if (/<!DOCTYPE|<!ENTITY|<\?(?!xml\s)/i.test(svg)) {
		issues.push("Unsafe XML declaration detected");
	}
	if (/&(?!(?:amp|lt|gt|quot|apos);|#\d+;|#x[0-9a-f]+;)/i.test(svg)) {
		issues.push("Unknown XML entity detected");
	}

	// Keep one standalone SVG root. Pattern libraries emit either a tile SVG or
	// an SVG containing a <pattern>; both are valid seamless pattern assets.
	if (!/^\s*(?:<\?xml\s+[^?]*\?>\s*)?<svg\b[\s\S]*<\/svg>\s*$/i.test(svg)) {
		issues.push("Missing <svg> root element");
		return { valid: false, errors: issues, warnings };
	}

	if ((svg.match(/<svg\b/gi) ?? []).length !== 1) {
		issues.push("SVG must contain exactly one root element");
	}

	const patternTag = svg.match(/<pattern\b[^>]*>/i)?.[0];
	if (
		patternTag &&
		!patternTag.endsWith("/>") &&
		!/<\/pattern\s*>/i.test(svg)
	) {
		issues.push("Unclosed <pattern> element");
	}

	// patternUnits check
	if (
		patternTag &&
		!/patternUnits\s*=\s*["']userSpaceOnUse["']/.test(patternTag)
	) {
		warnings.push(
			'Pattern should use patternUnits="userSpaceOnUse" for predictable tiling',
		);
	}

	// Unsafe element checks
	for (const elem of UNSAFE_ELEMENTS) {
		if (unsafeElementPattern(elem).test(svg)) {
			issues.push(`Unsafe element <${elem}> detected`);
		}
	}
	if (/(?:^|\s)(?:[\w.-]+:)?on[\w.-]*\s*=/i.test(svg)) {
		issues.push("Unsafe event handler attribute detected");
	}

	if (/(?:^|\s)(?:[\w.-]+:)?href\s*=/i.test(svg)) {
		issues.push('Unsafe attribute "href" detected');
	}

	// External resource checks
	if (hasUnsafeCssUrl(svg) || /@import\b/i.test(svg)) {
		issues.push("External URL references not allowed");
	}

	// Size checks
	const svgBytes = byteSize(svg);
	if (svgBytes > MAX_SVG_BYTES) {
		issues.push(`SVG exceeds ${MAX_SVG_BYTES} byte limit (${svgBytes} bytes)`);
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
		valid: issues.length === 0,
		errors: issues,
		warnings,
	};
}

/**
 * Sanitize SVG by removing unsafe elements and attributes
 */
export function sanitizeSvg(svg: string): string {
	let cleaned = svg
		.replace(/<!DOCTYPE[\s\S]*?\]>/gi, "")
		.replace(/<!DOCTYPE[^>]*>/gi, "")
		.replace(/<!ENTITY[^>]*>/gi, "")
		.replace(/<\?(?!xml\s)[\s\S]*?\?>/gi, "");

	// Remove unsafe elements
	for (const elem of UNSAFE_ELEMENTS) {
		// With content
		cleaned = cleaned.replace(
			new RegExp(
				`<((?:[\\w.-]+:)?${elem})\\b[^>]*>[\\s\\S]*?<\\/\\1\\s*>`,
				"gi",
			),
			"",
		);
		// Self-closing or unmatched tags
		cleaned = cleaned.replace(
			new RegExp(`<\\/?(?:[\\w.-]+:)?${elem}\\b[^>]*\\/?>`, "gi"),
			"",
		);
	}
	cleaned = cleaned.replace(
		/\s+(?:[\w.-]+:)?on[\w.-]*\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
		"",
	);

	cleaned = cleaned.replace(
		/\s+(?:[\w.-]+:)?href\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
		"",
	);

	// Keep local paint-server references such as url(#pattern), never remote data.
	cleaned = cleaned.replace(CSS_URL, (match, value: string) =>
		isLocalFragmentUrl(value) ? match : "none",
	);
	cleaned = cleaned.replace(/@import\b[^;{}]*(?:;|$)/gi, "");

	const result = validatePatternSvg(cleaned);
	if (!result.valid) {
		throw new Error(`Sanitized SVG is invalid: ${result.errors.join("; ")}`);
	}

	return cleaned;
}

/**
 * Extract metadata from SVG pattern
 */
export function extractPatternMeta(svg: string): PatternMeta {
	const meta: PatternMeta = {
		hasPattern: false,
		nodeCount: (svg.match(/<[a-z]/gi) || []).length,
		byteSize: byteSize(svg),
	};

	// Find pattern element
	const patternMatch = svg.match(/<pattern\b([^>]*)>/i);
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
	return validatePatternSvg(svg).valid;
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
