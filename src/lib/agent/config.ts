import { featureFlags } from "@/lib/feature-flags";

// Model IDs for AI Gateway (Vercel AI SDK v6 gateway format)
// Free model for conversation - fast and cost-effective
export const conversationModel = "google/gemini-2.0-flash" as const;

// Paid model for expensive generation operations
export const generationModel = "google/gemini-3-pro-preview" as const;

// Tool cost configuration (in satoshis)
export const TOOL_COSTS = {
	generateTheme: 1_000_000, // 1M sats (~$0.01 BSV)
	generateFont: 10_000_000, // 10M sats (~$0.10 BSV)
	generatePattern: 1_000_000, // 1M sats (~$0.01 BSV)
	generateWallpaper: 1_000_000, // 1M sats (~$0.01 BSV)
} as const;

// Tools that require payment before execution
export const PAID_TOOLS = new Set([
	"generateTheme",
	"generateFont",
	"generatePattern",
	"generateWallpaper",
]);

// Tools that require wallet connection
export const WALLET_REQUIRED_TOOLS = new Set([
	"prepareInscribe",
	"prepareListing",
	"getWalletBalance",
	...PAID_TOOLS,
]);

/**
 * Context passed from client to build dynamic system prompt
 */
export interface SwatchyContext {
	// Current page/route
	currentPage: string;

	// Theme mode (light/dark)
	themeMode: "light" | "dark";

	// Wallet status
	walletConnected: boolean;
	walletBalance?: number; // in satoshis

	// Current theme being edited (when in studio)
	currentTheme?: {
		name?: string;
		// Current color values for quick reference
		colors?: {
			primary?: string;
			secondary?: string;
			accent?: string;
			background?: string;
			foreground?: string;
			muted?: string;
		};
		radius?: string;
		fonts?: {
			sans?: string;
			serif?: string;
			mono?: string;
		};
	};

	// Pattern studio state
	patternState?: {
		source?: string;
		scale?: number;
		opacity?: number;
	};
}

/**
 * Build the system prompt for Swatchy based on enabled feature flags and current context
 */
export function buildSwatchySystemPrompt(context?: SwatchyContext): string {
	// Build capabilities list based on enabled features
	const capabilities: string[] = [
		"1. **Navigation** - Take users anywhere: themes gallery, studios, marketplace, docs",
		"2. **Theme Generation** - Create AI themes (costs 1M sats - payment UI will appear)",
	];

	let capabilityNumber = 3;

	if (featureFlags.fonts) {
		capabilities.push(
			`${capabilityNumber}. **Font Generation** - Generate custom fonts (costs 10M sats)`,
		);
		capabilityNumber++;
	}

	if (featureFlags.images) {
		capabilities.push(
			`${capabilityNumber}. **Pattern Generation** - Create SVG patterns (costs 1M sats)`,
		);
		capabilityNumber++;
	}

	if (featureFlags.wallpapers) {
		capabilities.push(
			`${capabilityNumber}. **Wallpaper Generation** - Create AI wallpapers for desktop/mobile (costs 1M sats)`,
		);
		capabilityNumber++;
	}

	capabilities.push(
		`${capabilityNumber}. **Studio Control** - Adjust colors, fonts, and settings in real-time`,
		`${capabilityNumber + 1}. **Publishing** - Help inscribe creations to blockchain`,
		`${capabilityNumber + 2}. **Marketplace** - Help list ordinals for sale`,
	);

	// Build navigation hints based on enabled features
	const studios: string[] = ["theme studio (/studio/theme)"];

	if (featureFlags.fonts) {
		studios.push("font studio (/studio/font)");
	}

	if (featureFlags.images) {
		studios.push("pattern studio (/studio/patterns)");
	}

	if (featureFlags.icons) {
		studios.push("icon studio (/studio/icon)");
	}

	if (featureFlags.wallpapers) {
		studios.push("wallpaper studio (/studio/wallpaper)");
	}

	const studiosList = studios.join(", ");

	// Build current state section
	let currentStateSection = "";
	if (context) {
		const stateLines: string[] = [];

		stateLines.push(`- **Current Page**: ${context.currentPage}`);
		stateLines.push(`- **Theme Mode**: ${context.themeMode}`);
		stateLines.push(`- **Wallet**: ${context.walletConnected ? `Connected (${context.walletBalance?.toLocaleString() ?? 0} sats)` : "Not connected"}`);

		// Add theme state if in studio
		if (context.currentTheme && context.currentPage.includes("/studio/theme")) {
			stateLines.push(`- **Editing Theme**: ${context.currentTheme.name || "Untitled"}`);
			if (context.currentTheme.colors) {
				const colors = context.currentTheme.colors;
				stateLines.push(`  - Primary: ${colors.primary || "not set"}`);
				stateLines.push(`  - Secondary: ${colors.secondary || "not set"}`);
				stateLines.push(`  - Accent: ${colors.accent || "not set"}`);
				stateLines.push(`  - Background: ${colors.background || "not set"}`);
			}
			if (context.currentTheme.radius) {
				stateLines.push(`  - Radius: ${context.currentTheme.radius}`);
			}
			if (context.currentTheme.fonts) {
				const fonts = context.currentTheme.fonts;
				if (fonts.sans) stateLines.push(`  - Sans Font: ${fonts.sans}`);
				if (fonts.mono) stateLines.push(`  - Mono Font: ${fonts.mono}`);
			}
		}

		// Add pattern state if in pattern studio
		if (context.patternState && context.currentPage.includes("/studio/pattern")) {
			stateLines.push(`- **Pattern Settings**:`);
			stateLines.push(`  - Source: ${context.patternState.source || "geopattern"}`);
			stateLines.push(`  - Scale: ${context.patternState.scale || 100}px`);
			stateLines.push(`  - Opacity: ${context.patternState.opacity || 50}%`);
		}

		currentStateSection = `
## Current Application State
${stateLines.join("\n")}
`;
	}

	return `You are Swatchy, the friendly AI assistant for Theme Token - a platform for creating, owning, and trading ShadCN themes on the Bitcoin blockchain.

## Your Personality
- Enthusiastic about design, colors, and typography
- Action-oriented - you DO things, not just talk about them
- Concise but warm - brief responses, let your actions speak
- Knowledgeable about color theory, accessibility (WCAG), and modern UI design

## Your Capabilities
${capabilities.join("\n")}

## How to Behave
- **BE PROACTIVE**: When users ask to do something, DO IT immediately. Don't ask for confirmation on free actions.
- **CHAIN ACTIONS**: If someone says "go to theme studio and make me a cyberpunk theme", navigate FIRST, then generate the theme. Use multiple tools in sequence.
- **ONLY CONFIRM PAID ACTIONS**: The payment UI handles confirmations for paid tools. Just call the tool.
- **BRIEF RESPONSES**: Say what you're doing in a few words while doing it. "Taking you to the theme studio..." then navigate.
- **CONTEXT AWARE**: Use the current application state to provide relevant assistance. If user is in theme studio, you can modify colors directly.
- Use OKLCH color format (e.g., "oklch(0.7 0.15 250)")
${currentStateSection}
## Available Pages & Studios

**Main Pages:**
- Homepage (/)
- Themes Gallery (/themes) - Browse all published themes
- Marketplace (/market) - Buy/sell themes
- Specification (/spec) - Technical docs

**Creative Studios:** ${studiosList}

**User Pages:**
- My Themes (/market/my-themes)
- My Fonts (/market/my-fonts)
- Sell/List (/market/sell)

## Theme Token Knowledge Base

### What is Theme Token?
Theme Token is a platform for creating, publishing, and trading ShadCN-compatible themes as 1Sat Ordinals on the BSV blockchain. Themes are permanent, ownable, and installable via the standard ShadCN CLI.

### Installing Themes
\`\`\`bash
bunx shadcn@latest add https://themetoken.dev/r/themes/[origin]
\`\`\`
Replace [origin] with the ordinal origin ID (e.g., abc123_0).

### Theme Format
Themes are JSON files using OKLCH color format with light and dark modes. Required colors:
- background, foreground (base)
- card, popover (surfaces)
- primary, secondary, muted, accent (semantic)
- destructive (warnings)
- border, input, ring (UI elements)

Each color has a -foreground variant for text contrast.

### OKLCH Colors
Format: \`oklch(lightness chroma hue)\`
- Lightness: 0-1 (0=black, 1=white)
- Chroma: 0-0.4 (0=gray, higher=more saturated)
- Hue: 0-360 (color angle)

Examples:
- \`oklch(1 0 0)\` = white
- \`oklch(0.55 0.22 255)\` = vibrant blue
- \`oklch(0.65 0.19 142)\` = fresh green

### Minting/Inscribing
To publish a theme on-chain:
1. Create theme in Theme Studio
2. Connect Yours Wallet
3. Click "Inscribe" button
4. Pay inscription fee (~1000 sats)
5. Theme is permanently stored as 1Sat Ordinal
6. Get shareable registry URL

### Marketplace
- List themes for sale with OrdLock smart contracts
- Buy themes with BSV
- Themes transfer like any other ordinal

### SDK
\`bun add @theme-token/sdk\`
- validateThemeToken() - Validate theme JSON
- fetchThemeByOrigin() - Fetch from blockchain
- parseCss() - Convert CSS to ThemeToken
- applyTheme() - Apply at runtime

Be helpful, be fast, make beautiful things happen!`;
}

// Fee address for AI generation payments
export const FEE_ADDRESS = "15q8YQSqUa9uTh6gh4AVixxq29xkpBBP9z";
