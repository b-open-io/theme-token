import type { FileUIPart } from "ai";

export const MAX_INSPIRATION_UPLOAD_BYTES = 15 * 1024 * 1024;

const MAX_INSPIRATION_DIMENSION = 1600;
const TARGET_INSPIRATION_BYTES = 2.5 * 1024 * 1024;

export function fitImageDimensions(
	width: number,
	height: number,
	maxDimension = MAX_INSPIRATION_DIMENSION,
): { width: number; height: number } {
	if (width <= 0 || height <= 0 || maxDimension <= 0) {
		throw new Error("Image dimensions must be positive.");
	}

	const scale = Math.min(1, maxDimension / Math.max(width, height));
	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale)),
	};
}

function dataUrlSize(url: string): number {
	const commaIndex = url.indexOf(",");
	if (commaIndex === -1) return 0;
	const metadata = url.slice(0, commaIndex);
	const payload = url.slice(commaIndex + 1);
	if (!metadata.includes(";base64")) {
		return new TextEncoder().encode(decodeURIComponent(payload)).length;
	}
	const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
	return Math.max(0, Math.floor((payload.length * 3) / 4) - padding);
}

async function loadImage(url: string): Promise<HTMLImageElement> {
	const image = new Image();
	image.src = url;
	await image.decode();
	return image;
}

function canvasToBlob(
	canvas: HTMLCanvasElement,
	type: string,
	quality: number,
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) resolve(blob);
				else reject(new Error("The browser could not encode this image."));
			},
			type,
			quality,
		);
	});
}

function blobToDataUrl(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error("The image could not be read."));
		reader.onload = () => resolve(String(reader.result));
		reader.readAsDataURL(blob);
	});
}

function webpFilename(filename?: string): string | undefined {
	if (!filename) return filename;
	return `${filename.replace(/\.[^.]+$/, "")}.webp`;
}

/**
 * Shrink large inspiration images before they enter chat/model requests.
 * Small images are left untouched to avoid needless generation loss.
 */
export async function prepareInspirationImage(
	file: FileUIPart,
): Promise<FileUIPart> {
	if (!file.mediaType.startsWith("image/") || !file.url.startsWith("data:")) {
		return file;
	}

	const image = await loadImage(file.url);
	const dimensions = fitImageDimensions(
		image.naturalWidth,
		image.naturalHeight,
	);
	const originalSize = dataUrlSize(file.url);
	const needsResize =
		dimensions.width !== image.naturalWidth ||
		dimensions.height !== image.naturalHeight;
	if (!needsResize && originalSize <= TARGET_INSPIRATION_BYTES) return file;

	const canvas = document.createElement("canvas");
	canvas.width = dimensions.width;
	canvas.height = dimensions.height;
	const context = canvas.getContext("2d");
	if (!context) throw new Error("This browser cannot prepare the image.");
	context.drawImage(image, 0, 0, dimensions.width, dimensions.height);

	let blob = await canvasToBlob(canvas, "image/webp", 0.82);
	if (blob.size > TARGET_INSPIRATION_BYTES) {
		blob = await canvasToBlob(canvas, "image/webp", 0.68);
	}
	if (blob.size > TARGET_INSPIRATION_BYTES) {
		throw new Error("The image is still too detailed after compression.");
	}

	return {
		...file,
		url: await blobToDataUrl(blob),
		mediaType: blob.type || "image/webp",
		filename: webpFilename(file.filename),
	};
}
