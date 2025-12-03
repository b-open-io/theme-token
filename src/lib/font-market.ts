/**
 * Font Market Filter Types
 *
 * Types for filtering fonts in the marketplace UI.
 * The actual market listing types and fetching are in yours-wallet.ts.
 */

export interface FontFilterState {
	category: string[];
	priceRange: [number, number];
	glyphCountMin: number;
}

export const DEFAULT_FONT_FILTERS: FontFilterState = {
	category: [],
	priceRange: [0, 10],
	glyphCountMin: 0,
};
