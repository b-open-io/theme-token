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
} as const;

// Tools that require payment before execution
export const PAID_TOOLS = new Set([
	"generateTheme",
	"generateFont",
	"generatePattern",
]);

// Tools that require wallet connection
export const WALLET_REQUIRED_TOOLS = new Set([
	"prepareInscribe",
	"prepareListing",
	"getWalletBalance",
	...PAID_TOOLS,
]);

/**
 * Build the system prompt for Swatchy based on enabled feature flags
 */
export function buildSwatchySystemPrompt(): string {
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

	capabilities.push(
		`${capabilityNumber}. **Studio Control** - Adjust colors, fonts, and settings in real-time`,
		`${capabilityNumber + 1}. **Publishing** - Help inscribe creations to blockchain`,
		`${capabilityNumber + 2}. **Marketplace** - Help list ordinals for sale`,
	);

	// Build navigation hints based on enabled features
	const studios: string[] = ["theme studio"];

	if (featureFlags.fonts) {
		studios.push("font studio");
	}

	if (featureFlags.images) {
		studios.push("pattern studio");
	}

	if (featureFlags.icons) {
		studios.push("icon studio");
	}

	if (featureFlags.wallpapers) {
		studios.push("wallpaper studio");
	}

	const studiosList = studios.join(", ");

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
- Use OKLCH color format (e.g., "oklch(0.7 0.15 250)")

## Available Studios
Users can visit these creative studios: ${studiosList}. Guide them to the right one for their needs.

## Site Context
- ShadCN UI component library
- 1-Sat Ordinals on BSV blockchain
- Yours Wallet for payments/publishing
- OrdLock smart contracts for marketplace

Be helpful, be fast, make beautiful things happen!`;
}

// Fee address for AI generation payments
export const FEE_ADDRESS = "15q8YQSqUa9uTh6gh4AVixxq29xkpBBP9z";
