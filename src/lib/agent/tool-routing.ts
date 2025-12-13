/**
 * Page-Aware Tool Routing
 *
 * Maps tools to pages where they are available. This enables:
 * 1. Only exposing relevant tools to the model per page
 * 2. System prompt hints about tools available after navigation
 * 3. Execution-time validation as a fail-safe
 */

/**
 * All possible tool names in the system
 */
export type ToolName =
	| "navigate"
	| "generateTheme"
	| "generateFont"
	| "generatePattern"
	| "generateWallpaper"
	| "generateBlock"
	| "generateComponent"
	| "createProject"
	| "setThemeColor"
	| "setThemeRadius"
	| "setThemeFont"
	| "setPatternParams"
	| "prepareInscribe"
	| "prepareListing"
	| "getWalletBalance"
	| "getExchangeRate";

/**
 * Tools available on every page
 */
export const GLOBAL_TOOLS: ToolName[] = [
	"navigate",
	"getWalletBalance",
	"getExchangeRate",
];

/** Tools that work with the wallet but don't require a specific page */
export const WALLET_TOOLS: ToolName[] = [
	"prepareInscribe",
	"prepareListing",
];

/**
 * Generation tools that are available on every page.
 * NOTE: Some generation tools (like registry blocks/components) are intentionally
 * page-scoped so the model navigates to the right studio first.
 */
export const GENERATION_TOOLS: ToolName[] = [
	"generateTheme",
	"generateFont",
	"generatePattern",
	"createProject",
];

/**
 * Studio-specific tools - require being on the correct page
 * These tools manipulate the *current* studio state
 */
export const STUDIO_TOOLS: Record<string, ToolName[]> = {
	"/studio/theme": [
		"setThemeColor",
		"setThemeRadius",
		"setThemeFont",
	],
	"/studio/patterns": ["setPatternParams"],
	"/studio/registry": ["generateBlock", "generateComponent"],
	"/studio/wallpaper": ["generateWallpaper"],
};

/**
 * Human-readable page names for navigation hints
 */
const PAGE_NAMES: Record<string, string> = {
	"/studio/theme": "Theme Studio",
	"/studio/font": "Font Studio",
	"/studio/patterns": "Pattern Studio",
	"/studio/wallpaper": "Wallpaper Studio",
	"/studio/registry": "Component Studio",
	"/studio/project": "Project Studio",
};

/**
 * Get all tools available for a specific page
 */
export function getToolsForPage(pathname: string): Set<ToolName> {
	const tools = new Set<ToolName>([
		...GLOBAL_TOOLS,
		...WALLET_TOOLS,
		...GENERATION_TOOLS,
	]);

	// Add studio-specific tools if on a studio page
	const studioTools = STUDIO_TOOLS[pathname];
	if (studioTools) {
		for (const tool of studioTools) {
			tools.add(tool);
		}
	}

	return tools;
}

/**
 * Check if a tool is valid for the current page
 */
export function isToolValidForPage(toolName: ToolName, pathname: string): boolean {
	// Global, wallet, and globally-allowed generation tools work everywhere
	if (
		GLOBAL_TOOLS.includes(toolName) ||
		WALLET_TOOLS.includes(toolName) ||
		GENERATION_TOOLS.includes(toolName)
	) {
		return true;
	}

	// Check if tool is available on this studio page
	const studioTools = STUDIO_TOOLS[pathname];
	return studioTools?.includes(toolName) ?? false;
}

/**
 * Get the required page for a studio tool
 */
export function getRequiredPageForTool(toolName: ToolName): string | null {
	for (const [page, tools] of Object.entries(STUDIO_TOOLS)) {
		if (tools.includes(toolName)) {
			return page;
		}
	}
	return null;
}

/**
 * Generate navigation hints for the system prompt
 * Shows which tools become available on which pages
 */
export function getNavigationHints(currentPathname: string): string {
	const hints: string[] = [];
	const currentTools = getToolsForPage(currentPathname);

	for (const [page, tools] of Object.entries(STUDIO_TOOLS)) {
		// Skip current page
		if (page === currentPathname) continue;

		// Get tools not currently available
		const unavailableTools = tools.filter((t) => !currentTools.has(t));
		if (unavailableTools.length === 0) continue;

		const pageName = PAGE_NAMES[page] || page;
		hints.push(`Navigate to ${pageName} (${page}) to use: ${unavailableTools.join(", ")}`);
	}

	return hints.join("\n");
}

/**
 * Get a helpful error message for invalid tool usage
 */
export function getToolValidationError(toolName: ToolName, currentPathname: string): string {
	const requiredPage = getRequiredPageForTool(toolName);
	if (!requiredPage) {
		return `Tool "${toolName}" is not a valid tool.`;
	}

	const currentPageName = PAGE_NAMES[currentPathname] || currentPathname;
	const requiredPageName = PAGE_NAMES[requiredPage] || requiredPage;
	return `The "${toolName}" tool requires being in ${requiredPageName}, but you're currently on ${currentPageName}. Navigate to ${requiredPage} first, then try again.`;
}
