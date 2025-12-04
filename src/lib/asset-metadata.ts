export function buildTileMetadata(params: {
	name?: string;
	author?: string;
	license?: string;
	prompt?: string;
}): Record<string, string> {
	const result: Record<string, string> = {
		app: "theme-token",
		type: "tile",
	};

	if (params.name) result.name = params.name;
	if (params.author) result.author = params.author;
	// Default to CC0 (public domain) if no license specified
	result.license = params.license || "CC0";
	if (params.prompt) result.prompt = params.prompt;

	return result;
}

export function buildFontMetadata(params: {
	author?: string;
	license?: string;
	prompt?: string;
}): Record<string, string> {
	const result: Record<string, string> = {
		app: "theme-token",
		type: "font",
	};

	if (params.author) result.author = params.author;
	if (params.license) result.license = params.license;
	if (params.prompt) result.prompt = params.prompt;

	return result;
}

export function buildThemeMetadata(): Record<string, string> {
	return {
		app: "theme-token",
		type: "theme",
	};
}

