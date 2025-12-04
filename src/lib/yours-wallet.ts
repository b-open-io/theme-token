/**
 * Yours Wallet Provider Types
 * https://yours-wallet.gitbook.io/provider-api
 */

export interface OrdinalData {
	types?: string[];
	insc?: {
		file?: {
			type?: string;
			size?: number;
			json?: unknown;
		};
	};
	map?: Record<string, unknown>;
}

export interface Origin {
	outpoint: string;
	nonce?: number;
	data?: OrdinalData;
	num?: string;
	map?: Record<string, unknown>;
}

export interface Ordinal {
	txid: string;
	vout: number;
	outpoint: string;
	satoshis: number;
	owner?: string;
	script?: string;
	spend?: string;
	origin?: Origin;
	height: number;
	idx: number;
	data: OrdinalData;
}

export interface PaginatedOrdinalsResponse {
	ordinals: Ordinal[];
	from?: string;
}

export interface GetOrdinalsOptions {
	from?: string;
	limit?: number;
	mimeType?: string;
}

export interface Addresses {
	bsvAddress: string;
	ordAddress: string;
	identityAddress: string;
}

export interface Balance {
	bsv: number;
	satoshis: number;
	usdInCents: number;
}

export interface InscribeRequest {
	address: string;
	base64Data: string;
	mimeType: string;
	map?: Record<string, string>;
	satoshis?: number;
}

export interface InscribeResponse {
	txid: string;
	rawtx: string;
}

export interface TransferOrdinalRequest {
	address: string;
	origin: string;
	outpoint: string;
}

export interface PurchaseOrdinalRequest {
	outpoint: string;
	marketplaceRate?: number;
	marketplaceAddress?: string;
}

export interface SocialProfile {
	displayName: string;
	avatar: string;
}

export interface Utxo {
	satoshis: number;
	script: string;
	txid: string;
	vout: number;
	owner?: string; // May be at derived address
}

export interface SignatureRequest {
	prevTxid: string;
	outputIndex: number;
	inputIndex: number;
	satoshis: number;
	address: string | string[];
	script?: string;
	sigHashType?: number;
}

export interface SignatureResponse {
	inputIndex: number;
	sig: string;
	pubKey: string;
	sigHashType: number;
}

export interface GetSignaturesRequest {
	rawtx: string;
	sigRequests: SignatureRequest[];
	format?: "tx" | "beef" | "ef";
}

export interface BroadcastRequest {
	rawtx: string;
	format?: "tx" | "beef" | "ef";
	fund?: boolean;
}

export type WalletEvent = "switchAccount" | "signedOut";

// Payment object for sendBsv - supports multiple recipients
export interface PaymentOutput {
	satoshis: number;
	address?: string;
	paymail?: string;
	data?: string[]; // hex string array
	script?: string; // hex string
}

export interface SendBsvResponse {
	txid: string;
	rawtx: string;
}

export interface YoursWallet {
	isConnected: () => Promise<boolean>;
	connect: () => Promise<string>; // returns identity pubkey
	disconnect: () => Promise<void>;
	getAddresses: () => Promise<Addresses>;
	getBalance: () => Promise<Balance>;
	getSocialProfile: () => Promise<SocialProfile>;
	getOrdinals: (
		opts?: GetOrdinalsOptions,
	) => Promise<PaginatedOrdinalsResponse>;
	getPaymentUtxos: () => Promise<Utxo[]>;
	inscribe: (inscriptions: InscribeRequest[]) => Promise<InscribeResponse>;
	transferOrdinal: (req: TransferOrdinalRequest) => Promise<string>; // returns txid
	purchaseOrdinal: (req: PurchaseOrdinalRequest) => Promise<string>; // returns txid
	sendBsv: (payments: PaymentOutput[]) => Promise<SendBsvResponse>; // built-in BSV send
	getSignatures: (req: GetSignaturesRequest) => Promise<SignatureResponse[]>;
	broadcast: (req: BroadcastRequest) => Promise<string>; // returns txid
	on: (event: WalletEvent, callback: () => void) => void;
	removeListener: (event: WalletEvent, callback: () => void) => void;
}

declare global {
	interface Window {
		yours?: YoursWallet;
	}
}

/**
 * Get the Yours Wallet provider from window
 */
export function getYoursWallet(): YoursWallet | null {
	if (typeof window === "undefined") return null;
	return window.yours ?? null;
}

/**
 * Check if Yours Wallet is installed
 */
export function isYoursWalletInstalled(): boolean {
	return typeof window !== "undefined" && !!window.yours;
}

/**
 * Fetch ordinal content from ordfs.network
 */
export async function fetchOrdinalContent<T = unknown>(
	outpoint: string,
): Promise<T | null> {
	try {
		const response = await fetch(`https://ordfs.network/content/${outpoint}`);
		if (!response.ok) return null;
		return await response.json();
	} catch {
		return null;
	}
}

export const YOURS_WALLET_URL = "https://yours.org";

// GorillaPool 1Sat Ordinals API
const ORDINALS_API = "https://ordinals.gorillapool.io/api";

export interface MarketListing {
	outpoint: string;
	origin: string;
	price: number; // satoshis
	owner: string;
	data?: {
		insc?: {
			file?: {
				type?: string;
			};
		};
		map?: Record<string, string>;
	};
}

export interface ThemeMarketListing extends MarketListing {
	theme: import("@theme-token/sdk").ThemeToken;
}

export interface FontMetadata {
	name: string;
	author?: string;
	license?: string;
	weight?: string;
	style?: string;
	prompt?: string;
	glyphCount?: number;
}

export interface FontMarketListing extends MarketListing {
	metadata: FontMetadata;
}

/**
 * Fetch all ordinal lock listings (marketplace)
 * Queries the GorillaPool market API for ordinal lock listings
 */
export async function fetchMarketListings(): Promise<MarketListing[]> {
	try {
		// Query the market API - limit to JSON types which theme tokens are
		const response = await fetch(
			`${ORDINALS_API}/market?limit=100&dir=DESC&type=application/json`,
		);

		if (!response.ok) {
			console.error("[Market] API error:", response.status);
			return [];
		}

		const results = await response.json();

		// Map the API response to our MarketListing interface
		return results.map(
			(item: {
				txid: string;
				vout: number;
				outpoint: string;
				owner: string;
				origin?: {
					outpoint: string;
					data?: {
						insc?: { file?: { type?: string } };
						map?: Record<string, string>;
					};
				};
				data?: {
					list?: { price: number };
					insc?: { file?: { type?: string } };
					map?: Record<string, string>;
				};
			}) => ({
				outpoint: item.outpoint,
				origin: item.origin?.outpoint || item.outpoint,
				price: item.data?.list?.price || 0,
				owner: item.owner,
				data: {
					insc: item.origin?.data?.insc || item.data?.insc,
					map: item.origin?.data?.map || item.data?.map,
				},
			}),
		);
	} catch (err) {
		console.error("[Market] Failed to fetch listings:", err);
		return [];
	}
}

/**
 * Fetch theme token listings from the marketplace
 * First filters by map.app="ThemeToken", then validates the JSON content
 */
export async function fetchThemeMarketListings(): Promise<
	ThemeMarketListing[]
> {
	const listings = await fetchMarketListings();
	const themeListings: ThemeMarketListing[] = [];

	// Filter for potential theme tokens first (by map metadata)
	const potentialThemes = listings.filter(
		(l) => l.data?.map?.app === "ThemeToken",
	);

	const { validateThemeToken } = await import("@theme-token/sdk");

	for (const listing of potentialThemes) {
		try {
			// Try to fetch the content from ordfs
			const content = await fetchOrdinalContent(listing.origin);
			if (content) {
				const result = validateThemeToken(content);
				if (result.valid) {
					themeListings.push({
						...listing,
						theme: result.theme,
					});
				}
			}
		} catch {
			// Skip invalid listings
		}
	}

	return themeListings;
}

/**
 * Fetch all font listings from the marketplace
 * Queries the GorillaPool market API for font inscriptions
 */
export async function fetchFontMarketListings(): Promise<FontMarketListing[]> {
	try {
		// Query the market API for font types (woff2, woff, ttf)
		const fontTypes = ["font/woff2", "font/woff", "font/ttf"];
		const allListings: FontMarketListing[] = [];

		for (const fontType of fontTypes) {
			const response = await fetch(
				`${ORDINALS_API}/market?limit=100&dir=DESC&type=${encodeURIComponent(fontType)}`,
			);

			if (!response.ok) {
				console.error("[Font Market] API error for", fontType, ":", response.status);
				continue;
			}

			const results = await response.json();

			// Filter for theme-token fonts and map to FontMarketListing
			const fontListings = results
				.filter(
					(item: {
						origin?: {
							data?: {
								map?: Record<string, string>;
							};
						};
						data?: {
							map?: Record<string, string>;
						};
					}) => {
						const mapData = item.origin?.data?.map || item.data?.map;
						return (
							mapData?.app === "theme-token" && mapData?.type === "font"
						);
					},
				)
				.map(
					(item: {
						txid: string;
						vout: number;
						outpoint: string;
						owner: string;
						origin?: {
							outpoint: string;
							data?: {
								insc?: { file?: { type?: string } };
								map?: Record<string, string>;
							};
						};
						data?: {
							list?: { price: number };
							insc?: { file?: { type?: string } };
							map?: Record<string, string>;
						};
					}) => {
						const mapData = item.origin?.data?.map || item.data?.map || {};
						return {
							outpoint: item.outpoint,
							origin: item.origin?.outpoint || item.outpoint,
							price: item.data?.list?.price || 0,
							owner: item.owner,
							data: {
								insc: item.origin?.data?.insc || item.data?.insc,
								map: mapData,
							},
							metadata: {
								name: mapData.name || "Unknown Font",
								author: mapData.author,
								license: mapData.license,
								weight: mapData.weight || "400",
								style: mapData.style || "normal",
								prompt: mapData.prompt,
								glyphCount: mapData.glyphCount
									? parseInt(mapData.glyphCount)
									: undefined,
							},
						};
					},
				);

			allListings.push(...fontListings);
		}

		// Dedupe by origin (same font might appear in multiple type queries)
		const seen = new Set<string>();
		return allListings.filter((listing) => {
			if (seen.has(listing.origin)) return false;
			seen.add(listing.origin);
			return true;
		});
	} catch (err) {
		console.error("[Font Market] Failed to fetch listings:", err);
		return [];
	}
}

/**
 * Fetch all inscribed fonts (not necessarily for sale)
 * Useful for browsing available fonts to use in themes
 */
export async function fetchAllInscribedFonts(): Promise<FontMarketListing[]> {
	try {
		// Query inscriptions API for fonts with theme-token app tag
		const response = await fetch(
			`${ORDINALS_API}/inscriptions?limit=100&dir=DESC&type=font`,
		);

		if (!response.ok) {
			console.error("[Fonts] API error:", response.status);
			return [];
		}

		const results = await response.json();

		// Filter for theme-token fonts and map to FontMarketListing
		return results
			.filter(
				(item: {
					origin?: {
						data?: {
							map?: Record<string, string>;
						};
					};
					data?: {
						map?: Record<string, string>;
					};
				}) => {
					const mapData = item.origin?.data?.map || item.data?.map;
					return mapData?.app === "theme-token" && mapData?.type === "font";
				},
			)
			.map(
				(item: {
					txid: string;
					vout: number;
					outpoint: string;
					owner: string;
					origin?: {
						outpoint: string;
						data?: {
							insc?: { file?: { type?: string } };
							map?: Record<string, string>;
						};
					};
					data?: {
						list?: { price: number };
						insc?: { file?: { type?: string } };
						map?: Record<string, string>;
					};
				}) => {
					const mapData = item.origin?.data?.map || item.data?.map || {};
					return {
						outpoint: item.outpoint,
						origin: item.origin?.outpoint || item.outpoint,
						price: item.data?.list?.price || 0,
						owner: item.owner,
						data: {
							insc: item.origin?.data?.insc || item.data?.insc,
							map: mapData,
						},
						metadata: {
							name: mapData.name || "Unknown Font",
							author: mapData.author,
							license: mapData.license,
							weight: mapData.weight || "400",
							style: mapData.style || "normal",
							prompt: mapData.prompt,
							glyphCount: mapData.glyphCount
								? parseInt(mapData.glyphCount)
								: undefined,
						},
					};
				},
			);
	} catch (err) {
		console.error("[Fonts] Failed to fetch inscribed fonts:", err);
		return [];
	}
}

/**
 * Fetch inscription details by origin/outpoint
 */
export async function fetchInscription(origin: string): Promise<unknown> {
	try {
		const response = await fetch(
			`${ORDINALS_API}/inscriptions/origin/${origin}`,
		);
		if (!response.ok) return null;
		return await response.json();
	} catch {
		return null;
	}
}

export type AssetType = "tile" | "wallpaper" | "icon";

export interface ImageMetadata {
	name?: string;
	contentType: string;
	size?: number;
	assetType: AssetType;
}

export interface ImageMarketListing extends MarketListing {
	metadata: ImageMetadata;
	previewUrl: string;
}

/**
 * Fetch curated theme-token image assets from the marketplace
 * Only returns assets with map.app === "theme-token" AND map.type in (tile, wallpaper, icon)
 */
export async function fetchImageMarketListings(): Promise<ImageMarketListing[]> {
	try {
		// Query the market API for image types
		const imageTypes = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];
		const allListings: ImageMarketListing[] = [];
		const validAssetTypes: AssetType[] = ["tile", "wallpaper", "icon"];

		for (const imageType of imageTypes) {
			const response = await fetch(
				`${ORDINALS_API}/market?limit=50&dir=DESC&type=${encodeURIComponent(imageType)}`,
			);

			if (!response.ok) {
				console.error("[Image Market] API error for", imageType, ":", response.status);
				continue;
			}

			const results = await response.json();

			// Filter for theme-token curated assets AND map to ImageMarketListing
			const imageListings = results
				.filter(
					(item: {
						origin?: {
							data?: {
								map?: Record<string, string>;
							};
						};
						data?: {
							map?: Record<string, string>;
						};
					}) => {
						const mapData = item.origin?.data?.map || item.data?.map;
						return (
							mapData?.app === "theme-token" &&
							validAssetTypes.includes(mapData?.type as AssetType)
						);
					},
				)
				.map(
					(item: {
						txid: string;
						vout: number;
						outpoint: string;
						owner: string;
						origin?: {
							outpoint: string;
							data?: {
								insc?: { file?: { type?: string; size?: number } };
								map?: Record<string, string>;
							};
						};
						data?: {
							list?: { price: number };
							insc?: { file?: { type?: string; size?: number } };
							map?: Record<string, string>;
						};
					}) => {
						const mapData = item.origin?.data?.map || item.data?.map || {};
						const inscData = item.origin?.data?.insc || item.data?.insc;
						const origin = item.origin?.outpoint || item.outpoint;
						const assetType = mapData.type as AssetType;
						return {
							outpoint: item.outpoint,
							origin,
							price: item.data?.list?.price || 0,
							owner: item.owner,
							data: {
								insc: inscData,
								map: mapData,
							},
							metadata: {
								name: mapData.name || `${assetType} ${origin.slice(0, 8)}`,
								contentType: inscData?.file?.type || imageType,
								size: inscData?.file?.size,
								assetType,
							},
							previewUrl: `https://ordfs.network/content/${origin}`,
						};
					},
				);

			allListings.push(...imageListings);
		}

		// Dedupe by origin
		const seen = new Set<string>();
		return allListings.filter((listing) => {
			if (seen.has(listing.origin)) return false;
			seen.add(listing.origin);
			return true;
		});
	} catch (err) {
		console.error("[Image Market] Failed to fetch listings:", err);
		return [];
	}
}

// Fee address for AI generation payments
export const FEE_ADDRESS = "15q8YQSqUa9uTh6gh4AVixxq29xkpBBP9z";

// AI generation cost: 0.01 BSV = 1,000,000 satoshis (for themes)
export const AI_GENERATION_COST_SATS = 1_000_000;

// Font generation/remix cost: 0.1 BSV = 10,000,000 satoshis (10x themes - more expensive to generate)
export const FONT_GENERATION_COST_SATS = 10_000_000;

// Pattern generation cost: 0.01 BSV = 1,000,000 satoshis (same as themes - uses Gemini SVG)
export const PATTERN_GENERATION_COST_SATS = 1_000_000;

export interface SendBsvResult {
	txid: string;
	rawtx: string;
}

/**
 * Send BSV to an address using Yours Wallet's built-in sendBsv method
 * Uses the wallet's native API - handles UTXO selection, signing, and broadcasting
 */
export async function sendBsv(
	wallet: YoursWallet,
	recipientAddress: string,
	amountSatoshis: number,
): Promise<SendBsvResult> {
	console.log("[sendBsv] Calling wallet.sendBsv with:", {
		address: recipientAddress,
		satoshis: amountSatoshis,
	});

	// Use wallet's built-in sendBsv method
	// Change is automatically returned to sender's wallet
	const result = await wallet.sendBsv([
		{
			satoshis: amountSatoshis,
			address: recipientAddress,
		},
	]);

	console.log("[sendBsv] Wallet returned:", result);

	return {
		txid: result.txid,
		rawtx: result.rawtx,
	};
}
