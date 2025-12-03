/**
 * Image Loader - Load on-chain images/patterns from ORDFS by origin
 *
 * Fetches SVG patterns and images inscribed on the blockchain and
 * returns them as CSS-ready values (data URLs or url() strings).
 *
 * Image values can be:
 * - External URL: "https://example.com/pattern.svg"
 * - On-chain path: "/content/{outpoint}" - loads from ORDFS
 * - None: "none" - no image
 *
 * For SVG patterns, the mask-image approach is recommended:
 * - Pattern defines WHERE color shows (like a stencil)
 * - background-color defines WHAT color shows
 * - Result: 100% theme-reactive patterns
 */

const ORDFS_BASE = "https://ordfs.network";

/**
 * Check if an image value is an on-chain path
 */
export function isOnChainImage(imageValue: string): boolean {
	return imageValue.startsWith("/content/");
}

/**
 * Extract the outpoint/origin from an on-chain path
 * e.g., "/content/abc123_0" -> "abc123_0"
 */
export function extractOriginFromPath(imagePath: string): string | null {
	if (!imagePath.startsWith("/content/")) return null;
	return imagePath.slice("/content/".length);
}

export interface LoadedImage {
	origin: string;
	dataUrl: string;
	contentType: string;
	metadata?: ImageMetadata;
}

export interface ImageMetadata {
	name?: string;
	author?: string;
	width?: number;
	height?: number;
	type?: "pattern" | "image";
}

// Memory cache for loaded images
const imageCache = new Map<string, LoadedImage>();

// Loading promises to prevent duplicate fetches
const loadingPromises = new Map<string, Promise<string>>();

/**
 * Convert a Blob to a data URL
 */
async function blobToDataUrl(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

/**
 * URL-encode an SVG string for use in CSS
 * This is more efficient than base64 (33% smaller, better GZIP)
 */
export function svgToEncodedUrl(svg: string): string {
	// Minify SVG slightly
	const minified = svg
		.replace(/\s+/g, " ")
		.replace(/>\s+</g, "><")
		.trim();

	// URL encode for CSS
	const encoded = encodeURIComponent(minified)
		.replace(/'/g, "%27")
		.replace(/"/g, "%22");

	return `data:image/svg+xml,${encoded}`;
}

/**
 * Convert SVG string to CSS url() value
 */
export function svgToCssUrl(svg: string): string {
	return `url("${svgToEncodedUrl(svg)}")`;
}

/**
 * Load an image from ORDFS by its origin
 * Returns a data URL for use in CSS
 */
export async function loadImageByOrigin(origin: string): Promise<string> {
	// Return cached if already loaded
	const cached = imageCache.get(origin);
	if (cached) {
		return cached.dataUrl;
	}

	// If already loading, wait for that promise
	const existing = loadingPromises.get(origin);
	if (existing) {
		return existing;
	}

	// Create loading promise
	const loadPromise = (async () => {
		try {
			// Fetch image from ORDFS
			const response = await fetch(`${ORDFS_BASE}/content/${origin}`);
			if (!response.ok) {
				throw new Error(`Failed to fetch image: ${response.status}`);
			}

			const contentType =
				response.headers.get("content-type") || "image/svg+xml";
			let dataUrl: string;

			// For SVGs, use URL encoding (more efficient)
			if (contentType.includes("svg")) {
				const svgText = await response.text();
				dataUrl = svgToEncodedUrl(svgText);
			} else {
				// For other images, use base64
				const blob = await response.blob();
				dataUrl = await blobToDataUrl(blob);
			}

			// Cache the result
			const loadedImage: LoadedImage = {
				origin,
				dataUrl,
				contentType,
			};
			imageCache.set(origin, loadedImage);

			return dataUrl;
		} finally {
			loadingPromises.delete(origin);
		}
	})();

	loadingPromises.set(origin, loadPromise);
	return loadPromise;
}

/**
 * Resolve an image value to a CSS url() string
 * Handles on-chain paths, external URLs, and "none"
 */
export async function resolveImageUrl(imageValue: string): Promise<string> {
	// No image
	if (!imageValue || imageValue === "none") {
		return "none";
	}

	// On-chain image
	if (isOnChainImage(imageValue)) {
		const origin = extractOriginFromPath(imageValue);
		if (origin) {
			const dataUrl = await loadImageByOrigin(origin);
			return `url("${dataUrl}")`;
		}
		return "none";
	}

	// External URL - pass through
	return `url("${imageValue}")`;
}

/**
 * Get a cached image by origin (doesn't load if not cached)
 */
export function getCachedImage(origin: string): LoadedImage | undefined {
	return imageCache.get(origin);
}

/**
 * Check if an image is cached
 */
export function isImageCached(origin: string): boolean {
	return imageCache.has(origin);
}

/**
 * Clear image cache
 */
export function clearImageCache(): void {
	imageCache.clear();
}

/**
 * Load background images for a theme and apply to CSS custom properties
 */
export async function loadThemeBackgrounds(styles: {
	"bg-image"?: string;
	"bg-image-opacity"?: string;
	"bg-image-size"?: string;
	"bg-image-position"?: string;
	"bg-image-repeat"?: string;
	"bg-image-mode"?: string;
	"bg-image-color"?: string;
	"card-bg-image"?: string;
	"sidebar-bg-image"?: string;
}): Promise<void> {
	const loads: Promise<void>[] = [];

	// Background image properties that reference images
	const imageProps = ["bg-image", "card-bg-image", "sidebar-bg-image"] as const;

	for (const prop of imageProps) {
		const value = styles[prop];
		if (value && value !== "none") {
			loads.push(
				resolveImageUrl(value).then((cssUrl) => {
					document.documentElement.style.setProperty(`--${prop}`, cssUrl);
				}),
			);
		}
	}

	// Direct value properties (not images)
	const directProps = [
		"bg-image-opacity",
		"bg-image-size",
		"bg-image-position",
		"bg-image-repeat",
		"bg-image-mode",
		"bg-image-color",
	] as const;

	for (const prop of directProps) {
		const value = styles[prop];
		if (value !== undefined) {
			document.documentElement.style.setProperty(`--${prop}`, value);
		}
	}

	await Promise.all(loads);
}

/**
 * Get ORDFS content URL for an image origin
 */
export function getImageContentUrl(origin: string): string {
	return `${ORDFS_BASE}/content/${origin}`;
}

/**
 * Preload an image by origin (useful for preview)
 */
export async function preloadImage(origin: string): Promise<void> {
	await loadImageByOrigin(origin);
}

/**
 * Get all cached images
 */
export function getAllCachedImages(): LoadedImage[] {
	return Array.from(imageCache.values());
}
