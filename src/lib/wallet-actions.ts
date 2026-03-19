import { PublicKey } from "@bsv/sdk";
import type { WalletInterface } from "@bsv/sdk";
import {
	createContext,
	inscribe,
	sendBsv,
	type OneSatContext,
} from "@1sat/actions";
import { buildThemeMetadata, buildTileMetadata } from "@/lib/asset-metadata";
import { fetchOrdinalsByAddress, submitToIndexer } from "@/lib/yours-wallet";
import type { Ordinal } from "@/lib/yours-wallet";

/**
 * Create an action context for @1sat/actions from a CWI wallet.
 */
export function createWalletContext(wallet: WalletInterface): OneSatContext {
	return createContext(wallet, { chain: "main" });
}

/**
 * Derive the ordinal (ord) address from the wallet.
 */
export async function getOrdinalAddress(
	wallet: WalletInterface,
): Promise<string> {
	const { publicKey } = await wallet.getPublicKey({
		protocolID: [2, "wallet"],
		keyID: "ord",
		counterparty: "self",
	});
	return PublicKey.fromString(publicKey).toAddress();
}

/**
 * Derive the payment (bsv) address from the wallet.
 */
export async function getPaymentAddress(
	wallet: WalletInterface,
): Promise<string> {
	const { publicKey } = await wallet.getPublicKey({
		protocolID: [2, "wallet"],
		keyID: "bsv",
		counterparty: "self",
	});
	return PublicKey.fromString(publicKey).toAddress();
}

/**
 * Get the identity public key from the wallet.
 */
export async function getIdentityKey(
	wallet: WalletInterface,
): Promise<string> {
	const { publicKey } = await wallet.getPublicKey({ identityKey: true });
	return publicKey;
}

/**
 * Get the wallet's spendable balance by summing outputs in the default basket.
 */
export async function getBalance(
	wallet: WalletInterface,
): Promise<{ satoshis: number; bsv: number }> {
	const { outputs } = await wallet.listOutputs({
		basket: "default",
		limit: 1000,
	});
	const spendable = outputs.filter((o) => o.spendable);
	const satoshis = spendable.reduce((sum, o) => sum + o.satoshis, 0);
	return {
		satoshis,
		bsv: satoshis / 1e8,
	};
}

/**
 * Get ordinals owned by the wallet via the GorillaPool indexer.
 * Derives the ord address from the wallet, then fetches from the API.
 */
export async function getOwnedOrdinals(
	wallet: WalletInterface,
	limit = 100,
): Promise<Ordinal[]> {
	const address = await getOrdinalAddress(wallet);
	return fetchOrdinalsByAddress(address, limit);
}

/**
 * Inscribe a JSON theme on-chain with MAP metadata.
 */
export async function inscribeTheme(
	wallet: WalletInterface,
	themeJson: string,
): Promise<{ txid: string; rawtx?: string }> {
	const ctx = createWalletContext(wallet);
	const map = buildThemeMetadata();
	const base64Content = btoa(themeJson);

	const result = await inscribe.execute(ctx, {
		base64Content,
		contentType: "application/json",
		map,
	});

	if (result.error) {
		throw new Error(`Inscription failed: ${result.error}`);
	}

	if (!result.txid) {
		throw new Error("Inscription succeeded but no txid was returned");
	}

	await submitToIndexer(result.txid);

	return { txid: result.txid, rawtx: result.rawtx };
}

/**
 * Inscribe an SVG pattern on-chain with tile MAP metadata.
 */
export async function inscribePattern(
	wallet: WalletInterface,
	svg: string,
	metadata?: {
		name?: string;
		author?: string;
		license?: string;
		prompt?: string;
		provider?: string;
		model?: string;
	},
): Promise<{ txid: string; rawtx?: string }> {
	const ctx = createWalletContext(wallet);
	const map = buildTileMetadata(metadata ?? {});
	const base64Content = btoa(svg);

	const result = await inscribe.execute(ctx, {
		base64Content,
		contentType: "image/svg+xml",
		map,
	});

	if (result.error) {
		throw new Error(`Pattern inscription failed: ${result.error}`);
	}

	if (!result.txid) {
		throw new Error(
			"Pattern inscription succeeded but no txid was returned",
		);
	}

	await submitToIndexer(result.txid);

	return { txid: result.txid, rawtx: result.rawtx };
}

/**
 * Inscribe an image (PNG, JPEG, WebP, etc.) on-chain with MAP metadata.
 */
export async function inscribeImage(
	wallet: WalletInterface,
	base64Data: string,
	mimeType: string,
	metadata?: {
		name?: string;
		aspectRatio?: string;
		style?: string;
		width?: number;
		height?: number;
		prompt?: string;
		provider?: string;
		model?: string;
	},
): Promise<{ txid: string; rawtx?: string }> {
	const ctx = createWalletContext(wallet);

	const map: Record<string, string> = {
		app: "theme-token",
		type: "image",
	};

	if (metadata?.name) map.name = metadata.name;
	if (metadata?.aspectRatio) map.aspectRatio = metadata.aspectRatio;
	if (metadata?.style) map.style = metadata.style;
	if (metadata?.width) map.width = metadata.width.toString();
	if (metadata?.height) map.height = metadata.height.toString();
	if (metadata?.prompt) map.prompt = metadata.prompt;
	if (metadata?.provider) map.provider = metadata.provider;
	if (metadata?.model) map.model = metadata.model;

	const result = await inscribe.execute(ctx, {
		base64Content: base64Data,
		contentType: mimeType,
		map,
	});

	if (result.error) {
		throw new Error(`Image inscription failed: ${result.error}`);
	}

	if (!result.txid) {
		throw new Error(
			"Image inscription succeeded but no txid was returned",
		);
	}

	await submitToIndexer(result.txid);

	return { txid: result.txid, rawtx: result.rawtx };
}

/**
 * Send BSV to a recipient address.
 */
export async function sendPayment(
	wallet: WalletInterface,
	recipientAddress: string,
	amountSatoshis: number,
): Promise<{ txid: string; rawtx?: string }> {
	const ctx = createWalletContext(wallet);

	const result = await sendBsv.execute(ctx, {
		requests: [{ address: recipientAddress, satoshis: amountSatoshis }],
	});

	if (result.error) {
		throw new Error(`Payment failed: ${result.error}`);
	}

	if (!result.txid) {
		throw new Error("Payment succeeded but no txid was returned");
	}

	return { txid: result.txid, rawtx: result.rawtx };
}
