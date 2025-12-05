declare module "geopattern" {
	interface GeoPatternOptions {
		generator?: string;
		baseColor?: string;
		color?: string;
	}

	interface GeoPatternInstance {
		color: string;
		toSvg(): string;
		toString(): string;
		toBase64(): string;
		toDataUri(): string;
		toDataUrl(): string;
	}

	function generate(string: string, options?: GeoPatternOptions): GeoPatternInstance;

	export { generate };
	export default { generate };
}

