export function buildTileMetadata(params: {
	name?: string;
	author?: string;
	license?: string;
	prompt?: string;
	provider?: string;
	model?: string;
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
	if (params.provider) result.provider = params.provider;
	if (params.model) result.model = params.model;

	return result;
}

export function buildFontMetadata(params: {
	name?: string;
	author?: string;
	license?: string;
	prompt?: string;
	provider?: string;
	model?: string;
	previewOutput?: number;
}): Record<string, string> {
	const result: Record<string, string> = {
		app: "theme-token",
		type: "font",
	};

	if (params.name) result.name = params.name;
	if (params.author) result.author = params.author;
	if (params.license) result.license = params.license;
	if (params.prompt) result.prompt = params.prompt;
	if (params.provider) result.provider = params.provider;
	if (params.model) result.model = params.model;
	if (params.previewOutput !== undefined) {
		result.previewOutput = params.previewOutput.toString();
	}

	return result;
}

export function buildFontPreviewMetadata(params: {
	fontName: string;
}): Record<string, string> {
	return {
		app: "theme-token",
		type: "font-preview",
		fontName: params.fontName,
	};
}

export function buildThemeMetadata(params?: {
	prompt?: string;
	provider?: string;
	model?: string;
}): Record<string, string> {
	const result: Record<string, string> = {
		app: "theme-token",
		type: "theme",
	};

	if (params?.prompt) result.prompt = params.prompt;
	if (params?.provider) result.provider = params.provider;
	if (params?.model) result.model = params.model;

	return result;
}

