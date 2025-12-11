/**
 * Centralized pricing configuration for Theme Token
 *
 * All prices in satoshis. Use getPriceWithDiscount() to get final price
 * after applying any applicable discounts (e.g., Prism Pass).
 */

/** Prism Pass collection ID - used to identify membership NFTs */
export const PRISM_PASS_COLLECTION_ID =
	"b21570b4d31da8875c79c9feeaf600204cad5f9819f23ae4c1eb12ba05dfc822_0";

/** Discount multiplier for Prism Pass holders (0.5 = 50% off) */
export const PRISM_PASS_DISCOUNT = 0.5;

/**
 * Base prices for AI generation tools (in satoshis)
 * These are the full prices before any discounts
 */
export const BASE_PRICES = {
	// AI Generation
	generateTheme: 1_000_000, // 1M sats (~$0.01 BSV)
	generateFont: 10_000_000, // 10M sats (~$0.10 BSV)
	generatePattern: 1_000_000, // 1M sats (~$0.01 BSV)
	generateWallpaper: 1_000_000, // 1M sats (~$0.01 BSV)
	generateBlock: 1_000_000, // 1M sats (~$0.01 BSV)
	generateComponent: 500_000, // 500K sats (~$0.005 BSV)

	// Inscription fees (approximate, actual may vary by size)
	inscriptionBase: 1_000, // Base inscription fee
	inscriptionPerByte: 1, // Per byte of data

	// Prism Pass mint cost (inscription fee only, no generation)
	prismPassMint: 1_000, // Minimal fee for the inscription
} as const;

export type PricingTool = keyof typeof BASE_PRICES;

/**
 * Tools that require payment before execution
 */
export const PAID_TOOLS = new Set<PricingTool>([
	"generateTheme",
	"generateFont",
	"generatePattern",
	"generateWallpaper",
	"generateBlock",
	"generateComponent",
]);

/**
 * Get the price for a tool, applying discounts if applicable
 *
 * @param tool - The tool/operation to get price for
 * @param hasPrismPass - Whether the user has a Prism Pass
 * @returns Price in satoshis after discounts
 */
export function getPrice(tool: PricingTool, hasPrismPass = false): number {
	const basePrice = BASE_PRICES[tool];

	// Only apply discount to generation tools (not fees)
	if (hasPrismPass && PAID_TOOLS.has(tool)) {
		return Math.floor(basePrice * PRISM_PASS_DISCOUNT);
	}

	return basePrice;
}

/**
 * Get all prices for display, with and without discount
 *
 * @param hasPrismPass - Whether to show discounted prices
 * @returns Object with tool prices
 */
export function getAllPrices(hasPrismPass = false): Record<PricingTool, number> {
	const prices = {} as Record<PricingTool, number>;

	for (const tool of Object.keys(BASE_PRICES) as PricingTool[]) {
		prices[tool] = getPrice(tool, hasPrismPass);
	}

	return prices;
}

/**
 * Format satoshis for display
 *
 * @param satoshis - Amount in satoshis
 * @returns Formatted string (e.g., "1M sats", "500K sats")
 */
export function formatSatoshis(satoshis: number): string {
	if (satoshis >= 1_000_000) {
		const millions = satoshis / 1_000_000;
		return `${millions % 1 === 0 ? millions : millions.toFixed(1)}M sats`;
	}
	if (satoshis >= 1_000) {
		const thousands = satoshis / 1_000;
		return `${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}K sats`;
	}
	return `${satoshis} sats`;
}

/**
 * Get approximate USD value for satoshis
 * Uses a rough estimate - for accurate values, use the exchange rate API
 *
 * @param satoshis - Amount in satoshis
 * @param bsvPriceUsd - Current BSV price in USD (default: ~$50)
 * @returns Approximate USD value
 */
export function satoshisToUsd(satoshis: number, bsvPriceUsd = 50): number {
	const bsv = satoshis / 100_000_000;
	return bsv * bsvPriceUsd;
}

/**
 * Format USD for display
 */
export function formatUsd(usd: number): string {
	if (usd < 0.01) {
		return `~$${usd.toFixed(4)}`;
	}
	if (usd < 1) {
		return `~$${usd.toFixed(2)}`;
	}
	return `~$${usd.toFixed(2)}`;
}

/**
 * Get price display string with both sats and USD
 */
export function getPriceDisplay(
	tool: PricingTool,
	hasPrismPass = false,
	bsvPriceUsd = 50,
): string {
	const satoshis = getPrice(tool, hasPrismPass);
	const usd = satoshisToUsd(satoshis, bsvPriceUsd);
	return `${formatSatoshis(satoshis)} (${formatUsd(usd)})`;
}

/**
 * Check if a tool requires payment
 */
export function requiresPayment(tool: string): boolean {
	return PAID_TOOLS.has(tool as PricingTool);
}
