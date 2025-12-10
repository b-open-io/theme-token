/**
 * Font Upload Store
 *
 * Manages uploaded fonts that haven't been inscribed yet.
 * Allows cross-studio sharing so fonts uploaded in Font Studio
 * can be previewed in Theme Studio before inscription.
 */

import { create } from "zustand";

export interface UploadedFont {
	/** Unique ID for this upload session */
	id: string;
	/** Original file name */
	fileName: string;
	/** Font family name (extracted or user-provided) */
	familyName: string;
	/** Base64 encoded font data */
	base64Data: string;
	/** MIME type (font/woff2, font/woff, font/ttf) */
	mimeType: string;
	/** Blob URL for immediate preview */
	blobUrl: string;
	/** File size in bytes */
	sizeBytes: number;
	/** When the font was uploaded */
	uploadedAt: number;
}

export interface FontUploadState {
	/** Currently uploaded fonts (not yet inscribed) */
	uploadedFonts: UploadedFont[];

	/** The currently selected uploaded font for preview */
	selectedFontId: string | null;
}

export interface FontUploadActions {
	/** Add an uploaded font */
	addFont: (font: Omit<UploadedFont, "id" | "uploadedAt">) => string;

	/** Remove an uploaded font */
	removeFont: (id: string) => void;

	/** Select a font for preview */
	selectFont: (id: string | null) => void;

	/** Get a font by ID */
	getFont: (id: string) => UploadedFont | undefined;

	/** Get a font by family name */
	getFontByFamily: (familyName: string) => UploadedFont | undefined;

	/** Clear all uploaded fonts */
	clearAll: () => void;

	/** Load a font into the document for preview */
	loadFontForPreview: (id: string) => Promise<string>;
}

export type FontUploadStore = FontUploadState & FontUploadActions;

// Generate unique ID
const generateId = () => `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Track loaded fonts to avoid duplicate loading
const loadedFonts = new Set<string>();

export const useFontUploadStore = create<FontUploadStore>()((set, get) => ({
	uploadedFonts: [],
	selectedFontId: null,

	addFont: (fontData) => {
		const id = generateId();
		const font: UploadedFont = {
			...fontData,
			id,
			uploadedAt: Date.now(),
		};

		set((state) => ({
			uploadedFonts: [...state.uploadedFonts, font],
			selectedFontId: id,
		}));

		return id;
	},

	removeFont: (id) => {
		const font = get().uploadedFonts.find((f) => f.id === id);
		if (font?.blobUrl) {
			URL.revokeObjectURL(font.blobUrl);
		}
		loadedFonts.delete(id);

		set((state) => ({
			uploadedFonts: state.uploadedFonts.filter((f) => f.id !== id),
			selectedFontId: state.selectedFontId === id ? null : state.selectedFontId,
		}));
	},

	selectFont: (id) => {
		set({ selectedFontId: id });
	},

	getFont: (id) => {
		return get().uploadedFonts.find((f) => f.id === id);
	},

	getFontByFamily: (familyName) => {
		return get().uploadedFonts.find((f) => f.familyName === familyName);
	},

	clearAll: () => {
		// Revoke all blob URLs
		for (const font of get().uploadedFonts) {
			if (font.blobUrl) {
				URL.revokeObjectURL(font.blobUrl);
			}
		}
		loadedFonts.clear();

		set({
			uploadedFonts: [],
			selectedFontId: null,
		});
	},

	loadFontForPreview: async (id) => {
		const font = get().getFont(id);
		if (!font) {
			throw new Error(`Font not found: ${id}`);
		}

		// Already loaded
		if (loadedFonts.has(id)) {
			return font.familyName;
		}

		// Create FontFace and add to document
		const fontFace = new FontFace(
			font.familyName,
			`url(${font.blobUrl})`,
		);

		await fontFace.load();
		document.fonts.add(fontFace);
		loadedFonts.add(id);

		return font.familyName;
	},
}));

/**
 * Helper to create an uploaded font from a File
 */
export async function createUploadedFontFromFile(
	file: File,
	familyName?: string,
): Promise<Omit<UploadedFont, "id" | "uploadedAt">> {
	// Read file as base64
	const base64Data = await new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			resolve(result.split(",")[1]); // Remove data URL prefix
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});

	// Determine MIME type
	let mimeType = "font/woff2";
	if (file.name.endsWith(".woff")) {
		mimeType = "font/woff";
	} else if (file.name.endsWith(".ttf")) {
		mimeType = "font/ttf";
	} else if (file.name.endsWith(".otf")) {
		mimeType = "font/otf";
	}

	// Create blob URL for preview
	const blobUrl = URL.createObjectURL(file);

	// Extract family name from filename if not provided
	const extractedName = familyName || file.name.replace(/\.(woff2?|ttf|otf)$/i, "");

	return {
		fileName: file.name,
		familyName: extractedName,
		base64Data,
		mimeType,
		blobUrl,
		sizeBytes: file.size,
	};
}

/**
 * Special path prefix for uploaded fonts (not yet on chain)
 * Used to distinguish from /content/{origin} paths
 */
export const UPLOADED_FONT_PREFIX = "/uploaded/";

/**
 * Check if a font path refers to an uploaded (not inscribed) font
 */
export function isUploadedFontPath(path: string): boolean {
	return path.startsWith(UPLOADED_FONT_PREFIX);
}

/**
 * Extract font ID from uploaded font path
 */
export function extractUploadedFontId(path: string): string | null {
	if (!isUploadedFontPath(path)) return null;
	return path.slice(UPLOADED_FONT_PREFIX.length);
}

/**
 * Create a font path for an uploaded font
 */
export function createUploadedFontPath(id: string): string {
	return `${UPLOADED_FONT_PREFIX}${id}`;
}
