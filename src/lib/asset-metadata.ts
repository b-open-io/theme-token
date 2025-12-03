export function buildPatternMetadata(params: {
	prompt?: string;
}): Record<string, string> {
	const result: Record<string, string> = {
		app: "theme-token",
		type: "pattern",
	};

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

export function extractTileDimensions(svg: string): {
	width: number;
	height: number;
} | null {
	const patternMatch = svg.match(
		/<pattern[^>]*width="(\d+)"[^>]*height="(\d+)"/,
	);
	if (patternMatch) {
		return {
			width: Number.parseInt(patternMatch[1], 10),
			height: Number.parseInt(patternMatch[2], 10),
		};
	}
	const altMatch = svg.match(/<pattern[^>]*height="(\d+)"[^>]*width="(\d+)"/);
	if (altMatch) {
		return {
			width: Number.parseInt(altMatch[2], 10),
			height: Number.parseInt(altMatch[1], 10),
		};
	}
	return null;
}
