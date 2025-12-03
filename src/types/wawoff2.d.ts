declare module "wawoff2" {
	/**
	 * Compress TTF/OTF font data to WOFF2 format
	 */
	export function compress(input: Uint8Array): Promise<Uint8Array>;

	/**
	 * Decompress WOFF2 font data to TTF/OTF format
	 */
	export function decompress(input: Uint8Array): Promise<Uint8Array>;
}
