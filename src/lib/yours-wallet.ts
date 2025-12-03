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

// Fee address for AI generation payments
export const FEE_ADDRESS = "15q8YQSqUa9uTh6gh4AVixxq29xkpBBP9z";

// AI generation cost: 0.00001 BSV = 1,000 satoshis (testing price)
export const AI_GENERATION_COST_SATS = 1_000;

const SATS_PER_KB = 100;

export interface SendBsvResult {
	txid: string;
	rawtx: string;
}

/**
 * Send BSV to an address using Yours Wallet
 * Follows the same pattern as list-ordinal.ts for transaction building
 */
export async function sendBsv(
	wallet: YoursWallet,
	recipientAddress: string,
	amountSatoshis: number,
): Promise<SendBsvResult> {
	// Dynamic imports to avoid issues with SSR
	const { P2PKH, Script, Transaction, UnlockingScript, Utils } = await import(
		"@bsv/sdk"
	);

	// Get wallet addresses
	const addresses = await wallet.getAddresses();
	const { bsvAddress } = addresses;

	// Get payment UTXOs
	const paymentUtxos = await wallet.getPaymentUtxos();

	if (!paymentUtxos || paymentUtxos.length === 0) {
		throw new Error("No payment UTXOs available");
	}

	// Simple UTXO selection - gather enough to cover amount + fee
	// For a simple P2PKH tx: ~10 (overhead) + 148 (input) + 34*2 (outputs) = ~226 bytes
	const estimatedSize = 226;
	const fee = Math.ceil((estimatedSize * SATS_PER_KB) / 1000);
	const totalNeeded = amountSatoshis + fee;

	let totalInput = 0;
	const selectedUtxos: Utxo[] = [];

	for (const utxo of paymentUtxos) {
		selectedUtxos.push(utxo);
		totalInput += utxo.satoshis;
		if (totalInput >= totalNeeded) break;
	}

	if (totalInput < totalNeeded) {
		throw new Error(
			`Insufficient funds. Have ${totalInput} sats, need ${totalNeeded} sats`,
		);
	}

	const change = totalInput - amountSatoshis - fee;

	// Create the transaction
	const tx = new Transaction();

	// Add inputs
	for (const utxo of selectedUtxos) {
		const lockingScript = Script.fromBinary(Utils.toArray(utxo.script, "hex"));

		const sourceOutputs: { lockingScript: typeof lockingScript; satoshis: number }[] = [];
		sourceOutputs[utxo.vout] = {
			lockingScript,
			satoshis: utxo.satoshis,
		};

		tx.addInput({
			sourceTXID: utxo.txid,
			sourceOutputIndex: utxo.vout,
			sequence: 0xffffffff,
			unlockingScript: new Script(),
			sourceTransaction: { outputs: sourceOutputs } as unknown as typeof tx,
		});
	}

	// Output 0: Payment to recipient
	tx.addOutput({
		lockingScript: new P2PKH().lock(recipientAddress),
		satoshis: amountSatoshis,
	});

	// Output 1: Change back to sender (if any)
	if (change > 0) {
		tx.addOutput({
			lockingScript: new P2PKH().lock(bsvAddress),
			satoshis: change,
		});
	}

	// Build signature requests
	const SIGHASH_ALL_FORKID = 0x41;
	const sigRequests: SignatureRequest[] = selectedUtxos.map((utxo, index) => ({
		prevTxid: utxo.txid,
		outputIndex: utxo.vout,
		inputIndex: index,
		satoshis: utxo.satoshis,
		address: utxo.owner || bsvAddress,
		script: utxo.script,
		sigHashType: SIGHASH_ALL_FORKID,
	}));

	// Get signatures from wallet
	const rawtx = tx.toHex();
	const signatures = await wallet.getSignatures({
		rawtx,
		sigRequests,
	});

	// Build unlocking scripts from signatures
	const unlockingScripts: InstanceType<typeof UnlockingScript>[] = [];
	for (const sig of signatures) {
		const sigBytes = Utils.toArray(sig.sig, "hex");
		const pubKeyBytes = Utils.toArray(sig.pubKey, "hex");
		const unlockScript = new UnlockingScript([
			{ op: sigBytes.length, data: sigBytes },
			{ op: pubKeyBytes.length, data: pubKeyBytes },
		]);
		unlockingScripts[sig.inputIndex] = unlockScript;
	}

	// Verify we have signatures for all inputs
	for (let i = 0; i < tx.inputs.length; i++) {
		if (!unlockingScripts[i]) {
			throw new Error(`Missing signature for input ${i}`);
		}
	}

	// Manually build the signed transaction (same pattern as list-ordinal.ts)
	const txBytes: number[] = [];

	// Version (4 bytes, little-endian)
	txBytes.push(tx.version & 0xff);
	txBytes.push((tx.version >> 8) & 0xff);
	txBytes.push((tx.version >> 16) & 0xff);
	txBytes.push((tx.version >> 24) & 0xff);

	// Input count (varint)
	txBytes.push(tx.inputs.length);

	// Inputs
	for (let i = 0; i < tx.inputs.length; i++) {
		const input = tx.inputs[i];
		const unlockScript = unlockingScripts[i];

		// Previous txid (32 bytes, reversed)
		const txidBytes = Utils.toArray(input.sourceTXID!, "hex").reverse();
		txBytes.push(...txidBytes);

		// Previous output index (4 bytes, little-endian)
		const vout = input.sourceOutputIndex!;
		txBytes.push(vout & 0xff);
		txBytes.push((vout >> 8) & 0xff);
		txBytes.push((vout >> 16) & 0xff);
		txBytes.push((vout >> 24) & 0xff);

		// Unlocking script length (varint) + script
		const scriptBytes = unlockScript.toBinary();
		if (scriptBytes.length < 0xfd) {
			txBytes.push(scriptBytes.length);
		} else {
			txBytes.push(0xfd);
			txBytes.push(scriptBytes.length & 0xff);
			txBytes.push((scriptBytes.length >> 8) & 0xff);
		}
		txBytes.push(...scriptBytes);

		// Sequence (4 bytes, little-endian)
		const seq = input.sequence!;
		txBytes.push(seq & 0xff);
		txBytes.push((seq >> 8) & 0xff);
		txBytes.push((seq >> 16) & 0xff);
		txBytes.push((seq >> 24) & 0xff);
	}

	// Output count (varint)
	txBytes.push(tx.outputs.length);

	// Outputs
	for (const output of tx.outputs) {
		// Value (8 bytes, little-endian)
		const sats = output.satoshis!;
		txBytes.push(sats & 0xff);
		txBytes.push((sats >> 8) & 0xff);
		txBytes.push((sats >> 16) & 0xff);
		txBytes.push((sats >> 24) & 0xff);
		txBytes.push(0, 0, 0, 0); // High 4 bytes

		// Locking script length (varint) + script
		const lockScriptBytes = output.lockingScript!.toBinary();
		if (lockScriptBytes.length < 0xfd) {
			txBytes.push(lockScriptBytes.length);
		} else if (lockScriptBytes.length < 0x10000) {
			txBytes.push(0xfd);
			txBytes.push(lockScriptBytes.length & 0xff);
			txBytes.push((lockScriptBytes.length >> 8) & 0xff);
		} else {
			txBytes.push(0xfe);
			txBytes.push(lockScriptBytes.length & 0xff);
			txBytes.push((lockScriptBytes.length >> 8) & 0xff);
			txBytes.push((lockScriptBytes.length >> 16) & 0xff);
			txBytes.push((lockScriptBytes.length >> 24) & 0xff);
		}
		txBytes.push(...lockScriptBytes);
	}

	// Locktime (4 bytes, little-endian)
	txBytes.push(tx.lockTime & 0xff);
	txBytes.push((tx.lockTime >> 8) & 0xff);
	txBytes.push((tx.lockTime >> 16) & 0xff);
	txBytes.push((tx.lockTime >> 24) & 0xff);

	const signedRawtx = Utils.toHex(txBytes);

	// Broadcast through wallet
	const txid = await wallet.broadcast({ rawtx: signedRawtx });

	return {
		txid,
		rawtx: signedRawtx,
	};
}
