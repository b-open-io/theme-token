import { tool } from "ai";
import { z } from "zod";

// ============================================================================
// Navigation Tools (Free)
// ============================================================================

export const navigate = tool({
	description:
		"Navigate the user to a specific page in Theme Token. Use this when users want to browse themes, go to a studio, or visit other pages.",
	inputSchema: z.object({
		path: z
			.enum([
				"/",
				"/themes",
				"/studio/theme",
				"/studio/font",
				"/studio/patterns",
				"/studio/icon",
				"/studio/wallpaper",
				"/market",
				"/market/browse",
				"/market/my-themes",
				"/market/sell",
				"/spec",
			])
			.describe("The page path to navigate to"),
		params: z
			.record(z.string(), z.string())
			.optional()
			.describe("Optional URL query parameters"),
	}),
});

// ============================================================================
// Generation Tools (Paid - require payment before execution)
// ============================================================================

export const generateTheme = tool({
	description:
		"Generate a new ShadCN theme using AI. This costs 1,000,000 satoshis (~0.01 BSV). The AI will create a complete theme with light and dark mode colors, typography, and border radius settings.",
	inputSchema: z.object({
		prompt: z
			.string()
			.describe(
				"Description of the desired theme (e.g., 'cyberpunk neon with purple accents', 'warm earthy tones for a wellness app')",
			),
		primaryColor: z
			.string()
			.optional()
			.describe("Optional seed color in OKLCH format to base the palette on"),
		radius: z
			.enum(["0rem", "0.25rem", "0.5rem", "0.75rem", "1rem"])
			.optional()
			.describe("Border radius preference"),
		style: z
			.enum(["modern", "classic", "playful", "minimal", "bold"])
			.optional()
			.describe("Overall style direction for the theme"),
	}),
});

export const generateFont = tool({
	description:
		"Generate a custom display font using AI. This costs 10,000,000 satoshis (~0.10 BSV). The AI will create a complete character set with A-Z, a-z, 0-9, and punctuation. This is an async operation that may take 1-3 minutes.",
	inputSchema: z.object({
		prompt: z
			.string()
			.describe(
				"Description of the desired font style (e.g., 'futuristic tech font with sharp angles', 'friendly rounded sans-serif')",
			),
		preset: z
			.enum([
				"modern-sans",
				"cyber-gothic",
				"organic-script",
				"brutalist",
				"retro-display",
				"pixel-art",
			])
			.optional()
			.describe("Optional style preset to guide generation"),
	}),
});

export const generatePattern = tool({
	description:
		"Generate a seamless SVG pattern for backgrounds using AI. This costs 1,000,000 satoshis (~0.01 BSV). The pattern will tile seamlessly and use theme-aware colors.",
	inputSchema: z.object({
		prompt: z
			.string()
			.describe(
				"Description of the desired pattern (e.g., 'geometric hexagons', 'organic flowing waves', 'minimalist dots')",
			),
		colorMode: z
			.enum(["theme", "currentColor", "grayscale"])
			.optional()
			.describe(
				"How colors should be applied - theme uses CSS variables, currentColor inherits, grayscale is neutral",
			),
	}),
});

// ============================================================================
// Studio Control Tools (Free - manipulate current studio state)
// ============================================================================

export const setThemeColor = tool({
	description:
		"Set a specific color in the current theme being edited. Only works when the user is in the Theme Studio.",
	inputSchema: z.object({
		colorKey: z
			.enum([
				"primary",
				"secondary",
				"accent",
				"muted",
				"background",
				"foreground",
				"card",
				"popover",
				"border",
				"input",
				"ring",
				"destructive",
				"chart-1",
				"chart-2",
				"chart-3",
				"chart-4",
				"chart-5",
			])
			.describe("The color token to update"),
		value: z
			.string()
			.describe("The new color value in OKLCH format (e.g., 'oklch(0.7 0.15 250)')"),
		mode: z
			.enum(["light", "dark", "both"])
			.optional()
			.default("both")
			.describe("Which theme mode(s) to update"),
	}),
});

export const setThemeRadius = tool({
	description:
		"Set the border radius for the current theme. Only works when the user is in the Theme Studio.",
	inputSchema: z.object({
		radius: z
			.string()
			.describe("CSS border-radius value (e.g., '0.5rem', '0.75rem', '1rem')"),
	}),
});

export const setThemeFont = tool({
	description:
		"Set a font family in the current theme. Only works when the user is in the Theme Studio.",
	inputSchema: z.object({
		slot: z
			.enum(["sans", "serif", "mono"])
			.describe("Which font slot to update"),
		fontFamily: z
			.string()
			.describe("The font family name (e.g., 'Inter', 'Playfair Display', 'JetBrains Mono')"),
	}),
});

export const setPatternParams = tool({
	description:
		"Update pattern parameters in the Pattern Studio. Only works when the user is in the Pattern Studio.",
	inputSchema: z.object({
		source: z
			.enum(["geopattern", "hero", "ai"])
			.optional()
			.describe("The pattern generation source"),
		scale: z
			.number()
			.min(10)
			.max(500)
			.optional()
			.describe("Pattern scale in pixels"),
		opacity: z
			.number()
			.min(0)
			.max(100)
			.optional()
			.describe("Pattern opacity percentage"),
		foregroundColor: z
			.string()
			.optional()
			.describe("Foreground color for the pattern"),
	}),
});

// ============================================================================
// Publishing Tools (Require wallet connection)
// ============================================================================

export const prepareInscribe = tool({
	description:
		"Prepare a theme, font, or pattern for inscription to the blockchain. This will show the user the inscription dialog with metadata options. Requires wallet connection.",
	inputSchema: z.object({
		assetType: z
			.enum(["theme", "font", "pattern"])
			.describe("Type of asset to inscribe"),
		name: z.string().describe("Name for the inscription"),
		author: z.string().optional().describe("Author name for attribution"),
	}),
});

export const prepareListing = tool({
	description:
		"Prepare to list an owned ordinal on the marketplace for sale. Requires wallet connection and ownership of the ordinal.",
	inputSchema: z.object({
		origin: z
			.string()
			.describe("The ordinal origin/outpoint to list (format: txid_vout)"),
		priceSatoshis: z
			.number()
			.min(1)
			.describe("Sale price in satoshis"),
	}),
});

// ============================================================================
// Information Tools (Free)
// ============================================================================

export const browseThemes = tool({
	description:
		"Browse and search themes from the gallery or marketplace. Returns a list of available themes.",
	inputSchema: z.object({
		filter: z
			.enum(["all", "popular", "recent", "forSale"])
			.optional()
			.default("all")
			.describe("How to filter the results"),
		limit: z
			.number()
			.min(1)
			.max(20)
			.optional()
			.default(5)
			.describe("Maximum number of results to return"),
		search: z
			.string()
			.optional()
			.describe("Optional search query to filter by name or description"),
	}),
});

export const getWalletBalance = tool({
	description:
		"Get the connected wallet's current BSV balance. Requires wallet connection.",
	inputSchema: z.object({}),
});

export const getExchangeRate = tool({
	description:
		"Get the current BSV to USD exchange rate for price calculations.",
	inputSchema: z.object({}),
});

// ============================================================================
// Tool Registry
// ============================================================================

export const allTools = {
	navigate,
	generateTheme,
	generateFont,
	generatePattern,
	setThemeColor,
	setThemeRadius,
	setThemeFont,
	setPatternParams,
	prepareInscribe,
	prepareListing,
	browseThemes,
	getWalletBalance,
	getExchangeRate,
};

export type ToolName = keyof typeof allTools;
