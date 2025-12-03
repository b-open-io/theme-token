import opentype from "opentype.js";
import { compress } from "wawoff2";
import { svgPathToOpentypePath, getPathBounds } from "./svg-to-path";

/**
 * Font Compiler
 *
 * Compiles AI-generated glyph data into real font files (OTF/WOFF2).
 * Uses opentype.js for font construction and wawoff2 for compression.
 */

export interface GlyphData {
	char: string;
	unicode: number;
	width: number;
	path: string; // SVG path data
}

export interface FontData {
	name: string;
	style: string;
	unitsPerEm: number;
	ascender: number;
	descender: number;
	capHeight: number;
	xHeight: number;
	glyphs: GlyphData[];
}

export interface CompiledFont {
	otf: ArrayBuffer;
	woff2: ArrayBuffer;
	metadata: {
		familyName: string;
		styleName: string;
		glyphCount: number;
		fileSize: {
			otf: number;
			woff2: number;
		};
	};
}

// Font metrics constants
const DEFAULT_METRICS = {
	unitsPerEm: 1000,
	ascender: 800,
	descender: -200,
	capHeight: 700,
	xHeight: 500,
};

// Side bearing calculation (percentage of advance width)
const SIDE_BEARING_RATIO = 0.05; // 5% on each side

/**
 * Create the required .notdef glyph
 * This glyph is shown when a character is missing
 */
function createNotdefGlyph(unitsPerEm: number, ascender: number): opentype.Glyph {
	const width = unitsPerEm * 0.5;
	const height = ascender;
	const thickness = unitsPerEm * 0.05;

	const path = new opentype.Path();

	// Outer rectangle
	path.moveTo(thickness, 0);
	path.lineTo(width - thickness, 0);
	path.lineTo(width - thickness, height);
	path.lineTo(thickness, height);
	path.closePath();

	// Inner rectangle (cut out)
	path.moveTo(thickness * 2, thickness);
	path.lineTo(thickness * 2, height - thickness);
	path.lineTo(width - thickness * 2, height - thickness);
	path.lineTo(width - thickness * 2, thickness);
	path.closePath();

	return new opentype.Glyph({
		name: ".notdef",
		unicode: 0,
		advanceWidth: width,
		path: path,
	});
}

/**
 * Create a space glyph
 */
function createSpaceGlyph(advanceWidth: number): opentype.Glyph {
	return new opentype.Glyph({
		name: "space",
		unicode: 32,
		advanceWidth: advanceWidth,
		path: new opentype.Path(),
	});
}

/**
 * Calculate optimal advance width with side bearings
 */
function calculateAdvanceWidth(
	pathBounds: ReturnType<typeof getPathBounds>,
	providedWidth: number,
): number {
	// Use the larger of provided width or calculated width
	const contentWidth = pathBounds.width;
	const sideBearing = Math.max(contentWidth, providedWidth) * SIDE_BEARING_RATIO;

	return Math.round(contentWidth + sideBearing * 2);
}

/**
 * Convert a single glyph from AI data to opentype.js Glyph
 */
function convertGlyph(
	glyphData: GlyphData,
	ascender: number,
): opentype.Glyph {
	// Convert SVG path to opentype path
	const path = svgPathToOpentypePath(glyphData.path, ascender);

	// Calculate bounds for advance width
	const bounds = getPathBounds(glyphData.path);
	const advanceWidth = calculateAdvanceWidth(bounds, glyphData.width);

	// Get glyph name from character
	const name = getGlyphName(glyphData.char, glyphData.unicode);

	return new opentype.Glyph({
		name,
		unicode: glyphData.unicode,
		advanceWidth,
		path,
	});
}

/**
 * Get standard glyph name from character
 */
function getGlyphName(char: string, unicode: number): string {
	// Standard glyph names for common characters
	const standardNames: Record<string, string> = {
		" ": "space",
		"!": "exclam",
		'"': "quotedbl",
		"#": "numbersign",
		$: "dollar",
		"%": "percent",
		"&": "ampersand",
		"'": "quotesingle",
		"(": "parenleft",
		")": "parenright",
		"*": "asterisk",
		"+": "plus",
		",": "comma",
		"-": "hyphen",
		".": "period",
		"/": "slash",
		":": "colon",
		";": "semicolon",
		"<": "less",
		"=": "equal",
		">": "greater",
		"?": "question",
		"@": "at",
		"[": "bracketleft",
		"\\": "backslash",
		"]": "bracketright",
		"^": "asciicircum",
		_: "underscore",
		"`": "grave",
		"{": "braceleft",
		"|": "bar",
		"}": "braceright",
		"~": "asciitilde",
	};

	if (standardNames[char]) {
		return standardNames[char];
	}

	// Letters use their character as name
	if (/[A-Za-z]/.test(char)) {
		return char;
	}

	// Numbers use word names
	const numberNames = [
		"zero",
		"one",
		"two",
		"three",
		"four",
		"five",
		"six",
		"seven",
		"eight",
		"nine",
	];
	if (/[0-9]/.test(char)) {
		return numberNames[Number.parseInt(char, 10)];
	}

	// Fallback to uni format
	return `uni${unicode.toString(16).toUpperCase().padStart(4, "0")}`;
}

/**
 * Compile font data into OTF and WOFF2 formats
 */
export async function compileFont(fontData: FontData): Promise<CompiledFont> {
	const {
		name,
		style,
		unitsPerEm = DEFAULT_METRICS.unitsPerEm,
		ascender = DEFAULT_METRICS.ascender,
		descender = DEFAULT_METRICS.descender,
		glyphs: glyphsData,
	} = fontData;

	// Create glyphs array starting with .notdef
	const glyphs: opentype.Glyph[] = [createNotdefGlyph(unitsPerEm, ascender)];

	// Check if we have a space glyph, if not create one
	const hasSpace = glyphsData.some((g) => g.char === " " || g.unicode === 32);
	if (!hasSpace) {
		glyphs.push(createSpaceGlyph(unitsPerEm * 0.25));
	}

	// Convert all glyphs
	for (const glyphData of glyphsData) {
		// Skip space if we already added it
		if (glyphData.char === " " || glyphData.unicode === 32) {
			if (!hasSpace) continue;
		}

		try {
			const glyph = convertGlyph(glyphData, ascender);
			glyphs.push(glyph);
		} catch (error) {
			console.warn(`Failed to convert glyph '${glyphData.char}':`, error);
		}
	}

	// Create the font
	const font = new opentype.Font({
		familyName: name,
		styleName: style || "Regular",
		unitsPerEm,
		ascender,
		descender,
		glyphs,
	});

	// Export to OTF
	const otfBuffer = font.toArrayBuffer();

	// Compress to WOFF2
	const woff2Buffer = await compress(new Uint8Array(otfBuffer));

	return {
		otf: otfBuffer,
		woff2: woff2Buffer.buffer as ArrayBuffer,
		metadata: {
			familyName: name,
			styleName: style || "Regular",
			glyphCount: glyphs.length,
			fileSize: {
				otf: otfBuffer.byteLength,
				woff2: woff2Buffer.byteLength,
			},
		},
	};
}

/**
 * Export font as downloadable blob
 */
export function fontToBlob(
	buffer: ArrayBuffer,
	type: "otf" | "woff2",
): Blob {
	const mimeType = type === "woff2" ? "font/woff2" : "font/otf";
	return new Blob([buffer], { type: mimeType });
}

/**
 * Export font as base64 string (for blockchain inscription)
 */
export function fontToBase64(buffer: ArrayBuffer): string {
	const uint8Array = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < uint8Array.length; i++) {
		binary += String.fromCharCode(uint8Array[i]);
	}
	return btoa(binary);
}

/**
 * Create a data URL for font preview
 */
export function fontToDataUrl(
	buffer: ArrayBuffer,
	type: "otf" | "woff2",
): string {
	const base64 = fontToBase64(buffer);
	const mimeType = type === "woff2" ? "font/woff2" : "font/otf";
	return `data:${mimeType};base64,${base64}`;
}
