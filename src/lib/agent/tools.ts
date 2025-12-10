import { tool } from "ai";
import { z } from "zod";

// ============================================================================
// Navigation Tool (Free)
// ============================================================================

export const navigate = tool({
	description: `Navigate the user to any page in Theme Token. This is the main navigation tool.

Available pages:
- "/" or "home" - Homepage
- "/themes" or "themes" or "browse" - Browse all published themes
- "/studio/theme" or "theme studio" - Create/edit themes
- "/studio/font" or "font studio" - Create/edit fonts
- "/studio/patterns" or "pattern studio" - Create/edit patterns
- "/studio/icon" or "icon studio" - Create icons
- "/studio/wallpaper" or "wallpaper studio" - Create wallpapers
- "/market" or "market" or "marketplace" - Main marketplace
- "/market/browse" - Browse marketplace listings
- "/market/my-themes" or "my themes" - User's owned themes
- "/market/my-fonts" or "my fonts" - User's owned fonts
- "/market/sell" or "sell" - Create a listing
- "/spec" or "docs" or "specification" - Theme specification docs

Use natural language intent to pick the right destination.`,
	inputSchema: z.object({
		destination: z
			.string()
			.describe("Where to navigate - can be a path like '/themes' or natural language like 'theme studio', 'browse themes', 'my collection'"),
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

export const generateWallpaper = tool({
	description:
		"Generate a custom wallpaper image using AI. This costs 1,000,000 satoshis (~0.01 BSV). The AI will create a high-resolution wallpaper based on your description. Optionally specify aspect ratio and style.",
	inputSchema: z.object({
		prompt: z
			.string()
			.describe(
				"Description of the desired wallpaper (e.g., 'cyberpunk cityscape at night with neon lights', 'serene mountain landscape at sunset')",
			),
		aspectRatio: z
			.enum(["16:9", "9:16", "1:1", "4:3", "3:2"])
			.optional()
			.describe(
				"Output aspect ratio - 16:9 for desktop, 9:16 for mobile, 1:1 for square",
			),
		style: z
			.enum(["photorealistic", "artistic", "abstract", "minimal", "3d-render"])
			.optional()
			.describe(
				"Style direction for the wallpaper - photorealistic, artistic, abstract, minimal, or 3D rendered",
			),
	}),
});

// ============================================================================
// Registry Tools (Paid - generate shadcn blocks and components)
// ============================================================================

export const generateBlock = tool({
	description: `Generate a shadcn UI block using AI. This costs 1,000,000 satoshis (~0.01 BSV).

A block is a complex, multi-component UI composition like:
- Dashboard sections (stats, charts, activity feeds)
- Authentication flows (login forms, signup wizards)
- Feature sections (pricing tables, testimonials, hero sections)
- Data displays (data tables with filters, card grids)

The AI generates production-ready React code following shadcn patterns.
All blocks use CSS variables for theme-awareness.`,
	inputSchema: z.object({
		prompt: z
			.string()
			.describe(
				"Description of the desired block (e.g., 'pricing table with three tiers and feature comparison', 'dashboard stats section with 4 metric cards')",
			),
		name: z
			.string()
			.optional()
			.describe("Optional name for the block (e.g., 'pricing-table', 'stats-dashboard')"),
		includeHook: z
			.boolean()
			.optional()
			.describe("Whether to generate a companion React hook for state/logic"),
	}),
});

export const generateComponent = tool({
	description: `Generate a single shadcn UI component using AI. This costs 500,000 satoshis (~0.005 BSV).

A component is a reusable UI element like:
- Custom buttons with specific styling
- Specialized input fields
- Card variants
- Custom badges, avatars, or indicators

The AI generates production-ready React code following shadcn patterns.
All components use CSS variables for theme-awareness.`,
	inputSchema: z.object({
		prompt: z
			.string()
			.describe(
				"Description of the desired component (e.g., 'animated submit button with loading state', 'user avatar with online status indicator')",
			),
		name: z
			.string()
			.optional()
			.describe("Optional name for the component (e.g., 'submit-button', 'user-avatar')"),
		variants: z
			.array(z.string())
			.optional()
			.describe("Optional variant names to generate (e.g., ['default', 'outline', 'ghost'])"),
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

import { featureFlags } from "@/lib/feature-flags";

/**
 * Get all available tools based on feature flags
 */
export function getAvailableTools() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const tools: Record<string, any> = {
		navigate,
		generateTheme,
		setThemeColor,
		setThemeRadius,
		setThemeFont,
		prepareInscribe,
		prepareListing,
		getWalletBalance,
		getExchangeRate,
	};

	// Add font-related tools if fonts feature is enabled
	if (featureFlags.fonts) {
		tools.generateFont = generateFont;
	}

	// Add pattern-related tools if images feature is enabled
	if (featureFlags.images) {
		tools.generatePattern = generatePattern;
		tools.setPatternParams = setPatternParams;
	}

	// Add wallpaper-related tools if wallpapers feature is enabled
	if (featureFlags.wallpapers) {
		tools.generateWallpaper = generateWallpaper;
	}

	// Add registry-related tools if registry feature is enabled
	if (featureFlags.registry) {
		tools.generateBlock = generateBlock;
		tools.generateComponent = generateComponent;
	}

	return tools;
}

export const allTools = {
	navigate,
	generateTheme,
	generateFont,
	generatePattern,
	generateWallpaper,
	generateBlock,
	generateComponent,
	setThemeColor,
	setThemeRadius,
	setThemeFont,
	setPatternParams,
	prepareInscribe,
	prepareListing,
	getWalletBalance,
	getExchangeRate,
};

export type ToolName = keyof typeof allTools;
