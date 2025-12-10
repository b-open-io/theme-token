/**
 * Wallpaper Engine
 *
 * Types, utilities, and constants for AI wallpaper generation.
 */

// ============================================================================
// Types
// ============================================================================

export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3" | "3:2";
export type WallpaperStyle =
	| "photorealistic"
	| "artistic"
	| "abstract"
	| "minimal"
	| "3d-render";
export type SourceType = "prompt" | "pattern" | "wallpaper";

export interface WallpaperParams {
	prompt: string;
	aspectRatio: AspectRatio;
	style?: WallpaperStyle;
	sourceType: SourceType;
	// For pattern source
	sourcePatternSvg?: string;
	// For wallpaper remix
	sourceWallpaperId?: string;
	sourceWallpaperBase64?: string;
}

export interface GeneratedWallpaper {
	id: string;
	timestamp: number;
	imageBase64: string;
	mimeType: string;
	prompt: string;
	aspectRatio: AspectRatio;
	style?: WallpaperStyle;
	sourceType: SourceType;
	dimensions: { width: number; height: number };
}

export interface WallpaperGenerationResponse {
	image: string;
	mimeType: string;
	prompt: string;
	aspectRatio: AspectRatio;
	style: WallpaperStyle | null;
	dimensions: { width: number; height: number };
	provider: string;
	model: string;
}

// ============================================================================
// Constants
// ============================================================================

export const ASPECT_RATIOS: {
	value: AspectRatio;
	label: string;
	icon: string;
}[] = [
	{ value: "16:9", label: "Desktop", icon: "monitor" },
	{ value: "9:16", label: "Mobile", icon: "smartphone" },
	{ value: "1:1", label: "Square", icon: "square" },
	{ value: "4:3", label: "Classic", icon: "monitor" },
	{ value: "3:2", label: "Photo", icon: "image" },
];

export const WALLPAPER_STYLES: {
	value: WallpaperStyle;
	label: string;
	description: string;
}[] = [
	{
		value: "photorealistic",
		label: "Photo",
		description: "Realistic photography",
	},
	{ value: "artistic", label: "Artistic", description: "Painterly style" },
	{ value: "abstract", label: "Abstract", description: "Geometric shapes" },
	{ value: "minimal", label: "Minimal", description: "Clean & simple" },
	{ value: "3d-render", label: "3D", description: "3D rendered" },
];

export const ASPECT_DIMENSIONS: Record<
	AspectRatio,
	{ width: number; height: number }
> = {
	"16:9": { width: 1920, height: 1080 },
	"9:16": { width: 1080, height: 1920 },
	"1:1": { width: 1024, height: 1024 },
	"4:3": { width: 1600, height: 1200 },
	"3:2": { width: 1800, height: 1200 },
};

export const DEFAULT_WALLPAPER_PARAMS: WallpaperParams = {
	prompt: "",
	aspectRatio: "16:9",
	style: undefined,
	sourceType: "prompt",
};

// ============================================================================
// Utilities
// ============================================================================

/**
 * Convert an SVG pattern to a base64 PNG image for use as wallpaper source
 */
export async function patternToImage(
	svg: string,
	width = 1024,
	height = 1024,
	backgroundColor = "#1a1a1a",
	foregroundColor = "#ffffff",
): Promise<string> {
	return new Promise((resolve, reject) => {
		// Replace currentColor with actual color
		let processedSvg = svg.replace(/currentColor/gi, foregroundColor);

		// Ensure we have a background rect if needed
		if (!processedSvg.includes('fill="url(#p)"')) {
			// Wrap the pattern in a proper structure with background
			processedSvg = processedSvg.replace(
				/<svg([^>]*)>/,
				`<svg$1><rect width="100%" height="100%" fill="${backgroundColor}"/>`,
			);
		}

		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext("2d");

		if (!ctx) {
			reject(new Error("Failed to get canvas context"));
			return;
		}

		// Fill background
		ctx.fillStyle = backgroundColor;
		ctx.fillRect(0, 0, width, height);

		const img = new Image();
		const blob = new Blob([processedSvg], { type: "image/svg+xml" });
		const url = URL.createObjectURL(blob);

		img.onload = () => {
			// Draw the SVG tiled across the canvas
			const patternCanvas = document.createElement("canvas");
			patternCanvas.width = 100;
			patternCanvas.height = 100;
			const patternCtx = patternCanvas.getContext("2d");

			if (patternCtx) {
				patternCtx.drawImage(img, 0, 0, 100, 100);
				const pattern = ctx.createPattern(patternCanvas, "repeat");
				if (pattern) {
					ctx.fillStyle = pattern;
					ctx.fillRect(0, 0, width, height);
				}
			}

			URL.revokeObjectURL(url);
			resolve(canvas.toDataURL("image/png").split(",")[1]);
		};

		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Failed to load SVG pattern"));
		};

		img.src = url;
	});
}

/**
 * Generate a unique ID for a wallpaper
 */
export function generateWallpaperId(): string {
	return `wp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Create a data URL from base64 image data
 */
export function createImageDataUrl(
	base64: string,
	mimeType = "image/png",
): string {
	return `data:${mimeType};base64,${base64}`;
}

/**
 * Extract dominant colors from an image (for ambient bleed effect)
 * Returns an array of hex colors
 */
export async function extractDominantColors(
	imageBase64: string,
	_mimeType = "image/png",
	numColors = 3,
): Promise<string[]> {
	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement("canvas");
			const size = 50; // Sample at low resolution for performance
			canvas.width = size;
			canvas.height = size;
			const ctx = canvas.getContext("2d");

			if (!ctx) {
				resolve(["#1a1a1a", "#333333", "#666666"]);
				return;
			}

			ctx.drawImage(img, 0, 0, size, size);
			const imageData = ctx.getImageData(0, 0, size, size);
			const pixels = imageData.data;

			// Simple color quantization
			const colorCounts = new Map<string, number>();

			for (let i = 0; i < pixels.length; i += 4) {
				// Quantize to reduce color space
				const r = Math.round(pixels[i] / 32) * 32;
				const g = Math.round(pixels[i + 1] / 32) * 32;
				const b = Math.round(pixels[i + 2] / 32) * 32;
				const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

				colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
			}

			// Sort by frequency and return top colors
			const sortedColors = [...colorCounts.entries()]
				.sort((a, b) => b[1] - a[1])
				.slice(0, numColors)
				.map(([color]) => color);

			resolve(sortedColors);
		};

		img.onerror = () => {
			resolve(["#1a1a1a", "#333333", "#666666"]);
		};

		img.src = `data:image/png;base64,${imageBase64}`;
	});
}

/**
 * Download a wallpaper image
 */
export function downloadWallpaper(
	base64: string,
	mimeType = "image/png",
	filename = "wallpaper",
): void {
	const extension = mimeType.split("/")[1] || "png";
	const link = document.createElement("a");
	link.href = createImageDataUrl(base64, mimeType);
	link.download = `${filename}.${extension}`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}
