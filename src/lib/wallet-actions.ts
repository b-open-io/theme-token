import {
	createContext,
	deriveDepositAddresses,
	getProfile,
	listOrdinals,
	type OneSatContext,
	sendBsv,
} from "@1sat/actions";
import type { WalletInterface, WalletOutput } from "@bsv/sdk";
import { Utils } from "@bsv/sdk";
import {
	buildImageMetadata,
	buildThemeMetadata,
	buildTileMetadata,
} from "@/lib/asset-metadata";
import {
	type PackageFile,
	type PublishPackageResult,
	publishPackage,
} from "@/lib/package-builder";

/**
 * Create an action context for @1sat/actions from a CWI wallet.
 */
export function createWalletContext(wallet: WalletInterface): OneSatContext {
	return createContext(wallet, { chain: "main" });
}

/**
 * Derive the wallet's canonical default deposit address under P1SAT.
 *
 * In the 1Sat paradigm there is a single deposit address (keyID "1sat 0",
 * derived from the identity key under P1SAT_PROTOCOL) used for both ordinals
 * and payments — not separate ord/bsv addresses. Any conforming wallet
 * (yours-wallet, wallet-desktop, CLI, MCP) derives the SAME address from the
 * same identity, so this matches what the user sees in their wallet. We use
 * the package's own action rather than re-deriving with a custom protocol.
 */
export async function getDepositAddress(
	wallet: WalletInterface,
): Promise<string> {
	const ctx = createWalletContext(wallet);
	const { derivations } = await deriveDepositAddresses.execute(ctx, {});
	const address = derivations[0]?.address;
	if (!address) {
		throw new Error("Wallet returned no deposit address derivation");
	}
	return address;
}

/**
 * Get the identity public key from the wallet.
 */
export async function getIdentityKey(wallet: WalletInterface): Promise<string> {
	const { publicKey } = await wallet.getPublicKey({ identityKey: true });
	return publicKey;
}

/**
 * Read the wallet's published BAP profile (display name + avatar), if any.
 * Returns empty fields when the identity hasn't published a profile — never
 * throws, so callers can use it inside Promise.all without breaking other data.
 */
export async function getSocialProfile(
	wallet: WalletInterface,
): Promise<{ displayName?: string; avatar?: string }> {
	try {
		const ctx = createWalletContext(wallet);
		const result = await getProfile.execute(ctx, {});
		const profile = result?.profile as Record<string, unknown> | undefined;
		if (!profile) return {};
		// BAP profiles use schema.org Person shape: { "@type": "Person", name, image }
		const displayName =
			typeof profile.name === "string"
				? profile.name
				: typeof profile.alternateName === "string"
					? profile.alternateName
					: undefined;
		const avatar =
			typeof profile.image === "string" ? profile.image : undefined;
		return { displayName, avatar };
	} catch {
		return {};
	}
}

/**
 * Get the ordinals the wallet actually holds, read from the provider's
 * ordinals basket via @1sat/actions listOrdinals (BRC-100 listOutputs).
 *
 * This is the canonical ownership source: it returns everything the wallet
 * tracks — including self-inscribed packages locked to per-mint derived
 * addresses, which a GorillaPool-by-address lookup would miss. The returned
 * outpoints are then categorized by their on-chain MAP `type` (read from the
 * index), not the wallet-local basket tags — see `categorizeOrdinals`.
 */
export async function getOwnedOrdinals(
	wallet: WalletInterface,
	limit = 1000,
): Promise<WalletOutput[]> {
	const ctx = createWalletContext(wallet);
	const { outputs } = await listOrdinals.execute(ctx, { limit });
	return outputs;
}

/**
 * Inscribe a JSON theme on-chain as a registry:theme package.
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
 * Inscribe an SVG pattern on-chain as a Theme Token asset package.
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
 * Inscribe an image on-chain as a Theme Token asset package.
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
	const metadata = buildImageMetadata({
		...imageMetadata,
		name,
		mediaType: mimeType,
		kind: isWallpaper ? "wallpaper" : "image",
	});

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

	// @1sat/actions now returns the raw tx as a byte array (`tx`); expose hex.
	return {
		txid: result.txid,
		rawtx: result.tx ? Utils.toHex(result.tx) : undefined,
	};
}
