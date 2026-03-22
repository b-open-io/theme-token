import { PublicKey, Utils } from "@bsv/sdk";
import type { WalletInterface } from "@bsv/sdk";
import {
	createContext,
	sendBsv,
	type OneSatContext,
} from "@1sat/actions";
import {
	buildThemeMetadata,
	buildTileMetadata,
	type PackageMapMetadata,
} from "@/lib/asset-metadata";
import { publishPackage, type PublishPackageResult, type PackageFile } from "@/lib/package-builder";
import { fetchOrdinalsByAddress } from "@/lib/yours-wallet";
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
 * Inscribe a JSON theme on-chain as a registry:style package.
 * Produces 2 outputs: theme.json file + ord-fs/json manifest with MAP metadata.
 */
export async function inscribeTheme(
	wallet: WalletInterface,
	themeJson: string,
	themeName?: string,
): Promise<PublishPackageResult> {
	const files: PackageFile[] = [
		{
			path: "theme.json",
			content: new Uint8Array(Utils.toArray(themeJson, "utf8")),
			contentType: "application/json",
		},
	];

	const metadata = buildThemeMetadata({
		name: themeName || "theme",
	});

	return publishPackage(wallet, files, metadata);
}

/**
 * Inscribe an SVG pattern on-chain as a registry:file package.
 * Produces 2 outputs: the SVG file + ord-fs/json manifest with MAP metadata.
 */
export async function inscribePattern(
	wallet: WalletInterface,
	svg: string,
	patternMetadata?: {
		name?: string;
		author?: string;
		license?: string;
		prompt?: string;
		provider?: string;
		model?: string;
	},
): Promise<PublishPackageResult> {
	const name = patternMetadata?.name || "pattern";
	const files: PackageFile[] = [
		{
			path: `${name}.svg`,
			content: new Uint8Array(Utils.toArray(svg, "utf8")),
			contentType: "image/svg+xml",
		},
	];

	const metadata = buildTileMetadata({
		name,
		author: patternMetadata?.author,
		license: patternMetadata?.license,
		prompt: patternMetadata?.prompt,
		provider: patternMetadata?.provider,
		model: patternMetadata?.model,
	});

	return publishPackage(wallet, files, metadata);
}

/**
 * Inscribe an image on-chain as a registry:file package.
 * Produces 2 outputs: the image file + ord-fs/json manifest with MAP metadata.
 */
export async function inscribeImage(
	wallet: WalletInterface,
	base64Data: string,
	mimeType: string,
	imageMetadata?: {
		name?: string;
		aspectRatio?: string;
		style?: string;
		width?: number;
		height?: number;
		prompt?: string;
		provider?: string;
		model?: string;
	},
): Promise<PublishPackageResult> {
	const ext = mimeType.split("/")[1] || "bin";
	const name = imageMetadata?.name || "image";
	const files: PackageFile[] = [
		{
			path: `${name}.${ext}`,
			content: new Uint8Array(Utils.toArray(base64Data, "base64")),
			contentType: mimeType,
		},
	];

	const isWallpaper = !!(imageMetadata?.aspectRatio || imageMetadata?.style);
	const metadata: PackageMapMetadata = {
		app: "theme-token",
		type: "registry:file",
		name,
		version: "1.0.0",
		description: name,
		categories: isWallpaper
			? JSON.stringify(["wallpaper", "image"])
			: JSON.stringify(["image"]),
		license: "CC0",
		...(imageMetadata?.prompt && { prompt: imageMetadata.prompt }),
		...(imageMetadata?.provider && { provider: imageMetadata.provider }),
		...(imageMetadata?.model && { model: imageMetadata.model }),
		...(imageMetadata?.aspectRatio && { aspectRatio: imageMetadata.aspectRatio }),
		...(imageMetadata?.style && { style: imageMetadata.style }),
		...(imageMetadata?.width && { width: imageMetadata.width.toString() }),
		...(imageMetadata?.height && { height: imageMetadata.height.toString() }),
	};

	return publishPackage(wallet, files, metadata);
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
