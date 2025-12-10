/**
 * Generate a PNG preview image from a loaded font
 *
 * This creates a simple preview showing sample characters rendered in the font.
 * The preview is generated client-side using Canvas API.
 */

const DEFAULT_SAMPLE_TEXT = "Aa Bb Cc 123";
const PREVIEW_WIDTH = 400;
const PREVIEW_HEIGHT = 100;
const FONT_SIZE = 48;
const BACKGROUND_COLOR = "#1a1a1a";
const TEXT_COLOR = "#ffffff";

export interface FontPreviewResult {
	base64: string;
	width: number;
	height: number;
	sizeBytes: number;
}

/**
 * Generate a PNG preview image for a font
 *
 * @param fontFamily - The CSS font-family name (must already be loaded)
 * @param sampleText - Text to render (default: "Aa Bb Cc 123")
 * @returns Promise with base64 PNG data and dimensions
 */
export async function generateFontPreview(
	fontFamily: string,
	sampleText: string = DEFAULT_SAMPLE_TEXT,
): Promise<FontPreviewResult> {
	// Create canvas
	const canvas = document.createElement("canvas");
	canvas.width = PREVIEW_WIDTH;
	canvas.height = PREVIEW_HEIGHT;

	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Could not get canvas 2D context");
	}

	// Fill background
	ctx.fillStyle = BACKGROUND_COLOR;
	ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);

	// Set up text rendering
	ctx.fillStyle = TEXT_COLOR;
	ctx.font = `${FONT_SIZE}px "${fontFamily}", sans-serif`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	// Render text centered
	ctx.fillText(sampleText, PREVIEW_WIDTH / 2, PREVIEW_HEIGHT / 2);

	// Convert to PNG base64
	const dataUrl = canvas.toDataURL("image/png");
	// Remove data URL prefix to get pure base64
	const base64 = dataUrl.split(",")[1];

	// Calculate approximate size
	const sizeBytes = Math.ceil((base64.length * 3) / 4);

	return {
		base64,
		width: PREVIEW_WIDTH,
		height: PREVIEW_HEIGHT,
		sizeBytes,
	};
}

/**
 * Generate preview from a font file that hasn't been loaded yet
 *
 * This loads the font temporarily, generates the preview, then cleans up.
 *
 * @param fontData - Base64 encoded font data (WOFF2, WOFF, or TTF)
 * @param fontFamily - Name to use for the font-family
 * @param mimeType - MIME type of the font (font/woff2, font/woff, font/ttf)
 * @param sampleText - Text to render
 */
export async function generateFontPreviewFromData(
	fontData: string,
	fontFamily: string,
	mimeType: string,
	sampleText: string = DEFAULT_SAMPLE_TEXT,
): Promise<FontPreviewResult> {
	// Create a unique font family name to avoid conflicts
	const uniqueFamilyName = `preview-${fontFamily}-${Date.now()}`;

	// Create FontFace and load it
	const fontFace = new FontFace(
		uniqueFamilyName,
		`url(data:${mimeType};base64,${fontData})`,
	);

	await fontFace.load();
	document.fonts.add(fontFace);

	try {
		// Wait for font to be ready
		await document.fonts.ready;

		// Generate the preview
		return await generateFontPreview(uniqueFamilyName, sampleText);
	} finally {
		// Clean up - remove the temporary font
		document.fonts.delete(fontFace);
	}
}
