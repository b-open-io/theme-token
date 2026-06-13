/**
 * MAP metadata for a registry package manifest.
 * Mirrors PackageMapMetadata from @1sat/actions.
 */
export interface PackageMapMetadata {
	app: string;
	type: string;
	name: string;
	version: string;
	description: string;
	language?: string;
	homepage?: string;
	prev?: string;
	"opns.name"?: string;
	"opns.outpoint"?: string;
	title?: string;
	author?: string;
	dependencies?: string;
	devDependencies?: string;
	registryDependencies?: string;
	categories?: string;
	[key: string]: string | undefined;
}

export function buildTileMetadata(params: {
	name: string;
	version?: string;
	description?: string;
	author?: string;
	license?: string;
	prompt?: string;
	provider?: string;
	model?: string;
}): PackageMapMetadata {
	return {
		app: "theme-token",
		type: "registry:file",
		name: params.name,
		version: params.version || "1.0.0",
		description: params.description || params.name,
		categories: JSON.stringify(["pattern", "svg"]),
		...(params.author && { author: params.author }),
		license: params.license || "CC0",
		...(params.prompt && { prompt: params.prompt }),
		...(params.provider && { provider: params.provider }),
		...(params.model && { model: params.model }),
	};
}

export function buildFontMetadata(params: {
	name: string;
	version?: string;
	description?: string;
	author?: string;
	license?: string;
	prompt?: string;
	provider?: string;
	model?: string;
	"font.family"?: string;
	"font.variable"?: string;
	"font.weight"?: string;
}): PackageMapMetadata {
	return {
		app: "theme-token",
		type: "registry:font",
		name: params.name,
		version: params.version || "1.0.0",
		description: params.description || params.name,
		...(params.author && { author: params.author }),
		...(params.license && { license: params.license }),
		...(params.prompt && { prompt: params.prompt }),
		...(params.provider && { provider: params.provider }),
		...(params.model && { model: params.model }),
		...(params["font.family"] && { "font.family": params["font.family"] }),
		...(params["font.variable"] && {
			"font.variable": params["font.variable"],
		}),
		...(params["font.weight"] && { "font.weight": params["font.weight"] }),
	};
}

export function buildThemeMetadata(params: {
	name: string;
	version?: string;
	description?: string;
	prompt?: string;
	provider?: string;
	model?: string;
}): PackageMapMetadata {
	return {
		app: "theme-token",
		type: "registry:style",
		name: params.name,
		version: params.version || "1.0.0",
		description: params.description || params.name,
		...(params.prompt && { prompt: params.prompt }),
		...(params.provider && { provider: params.provider }),
		...(params.model && { model: params.model }),
	};
}
