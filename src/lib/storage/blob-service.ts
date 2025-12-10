/**
 * Vercel Blob Service Wrapper
 *
 * Handles binary asset storage for drafts:
 * - Wallpaper images (PNG, JPEG, WebP)
 * - Pattern SVGs
 * - Font files (WOFF2, TTF, OTF)
 */

import { del, list, put } from "@vercel/blob";
import { BLOB_PATHS, type DraftType } from "./types";

/**
 * Calculate size of data in bytes
 */
function calculateDataSize(data: Blob | Buffer | ArrayBuffer | string): number {
	if (Buffer.isBuffer(data)) {
		return data.length;
	}
	if (data instanceof ArrayBuffer) {
		return data.byteLength;
	}
	if (typeof Blob !== "undefined" && data instanceof Blob) {
		return data.size;
	}
	if (typeof data === "string") {
		return new TextEncoder().encode(data).length;
	}
	// Fallback for unknown types
	return 0;
}

/**
 * Upload a file to Vercel Blob
 */
export async function uploadBlob(
	userId: string,
	type: DraftType,
	id: string,
	data: Blob | Buffer | ArrayBuffer | string,
	options: {
		contentType: string;
		cacheControlMaxAge?: number;
	},
): Promise<{ url: string; size: number }> {
	const ext = getExtensionFromMimeType(options.contentType);
	const pathname = BLOB_PATHS.draft(userId, type, id, ext);

	// Calculate size before upload (PutBlobResult doesn't include size)
	const size = calculateDataSize(data);

	const blob = await put(pathname, data, {
		access: "public",
		contentType: options.contentType,
		cacheControlMaxAge: options.cacheControlMaxAge ?? 31536000, // 1 year default
		addRandomSuffix: false, // Use exact path for predictable URLs
	});

	return {
		url: blob.url,
		size,
	};
}

/**
 * Upload a base64-encoded file
 */
export async function uploadBase64Blob(
	userId: string,
	type: DraftType,
	id: string,
	base64Data: string,
	mimeType: string,
): Promise<{ url: string; size: number }> {
	// Convert base64 to buffer
	const buffer = Buffer.from(base64Data, "base64");

	return uploadBlob(userId, type, id, buffer, {
		contentType: mimeType,
	});
}

/**
 * Delete a blob by URL
 */
export async function deleteBlob(url: string): Promise<void> {
	await del(url);
}

/**
 * Delete multiple blobs by URLs
 */
export async function deleteBlobs(urls: string[]): Promise<void> {
	if (urls.length === 0) return;
	await del(urls);
}

/**
 * List blobs for a user and type
 */
export async function listUserBlobs(
	userId: string,
	type?: DraftType,
): Promise<{ url: string; pathname: string; size: number; uploadedAt: Date }[]> {
	const prefix = type
		? `drafts/${userId}/${type}/`
		: `drafts/${userId}/`;

	const result = await list({ prefix });

	return result.blobs.map((blob) => ({
		url: blob.url,
		pathname: blob.pathname,
		size: blob.size,
		uploadedAt: blob.uploadedAt,
	}));
}

/**
 * Get total blob storage used by a user
 */
export async function getUserBlobStorageUsed(userId: string): Promise<number> {
	const blobs = await listUserBlobs(userId);
	return blobs.reduce((total, blob) => total + blob.size, 0);
}

/**
 * Delete all blobs for a user (use with caution!)
 */
export async function deleteAllUserBlobs(userId: string): Promise<number> {
	const blobs = await listUserBlobs(userId);
	if (blobs.length === 0) return 0;

	await deleteBlobs(blobs.map((b) => b.url));
	return blobs.length;
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
	const mimeToExt: Record<string, string> = {
		// Images
		"image/png": "png",
		"image/jpeg": "jpg",
		"image/webp": "webp",
		"image/svg+xml": "svg",
		"image/gif": "gif",

		// Fonts
		"font/woff2": "woff2",
		"font/woff": "woff",
		"font/ttf": "ttf",
		"font/otf": "otf",
		"application/font-woff2": "woff2",
		"application/font-woff": "woff",
		"application/x-font-ttf": "ttf",
		"application/x-font-opentype": "otf",

		// Data
		"application/json": "json",
	};

	return mimeToExt[mimeType] || "bin";
}

/**
 * Generate a unique draft ID
 */
export function generateDraftId(type: DraftType): string {
	const prefix = type.slice(0, 2); // th, wa, pa, fo
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 8);
	return `${prefix}_${timestamp}_${random}`;
}
