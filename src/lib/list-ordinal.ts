/**
 * List an ordinal for sale using @1sat/actions sellOrdinal.
 * Replaces manual OrdLock transaction building with the action system.
 */

import { listOrdinals, sellOrdinal } from "@1sat/actions";
import { Utils, type WalletInterface } from "@bsv/sdk";
import { sameOutpoint } from "@/lib/outpoint";
import { createWalletContext, getDepositAddress } from "@/lib/wallet-actions";

export interface ListOrdinalParams {
	/** Outpoint of the ordinal to list (any format; matched canonically) */
	outpoint: string;
	/** Price in satoshis */
	priceSatoshis: number;
}

export interface ListOrdinalResult {
	txid: string;
	rawtx?: string;
}

/**
 * List an ordinal for sale on the global orderbook.
 *
 * Looks up the WalletOutput by outpoint, derives the payment address,
 * and delegates to @1sat/actions sellOrdinal which handles OrdLock
 * script building, signing, and broadcasting.
 */
export async function listOrdinal(
	wallet: WalletInterface,
	params: ListOrdinalParams,
): Promise<ListOrdinalResult> {
	const { outpoint, priceSatoshis } = params;

	const ctx = createWalletContext(wallet);

	// Look up the ordinal output from the wallet. The wallet serializes
	// outpoints as `txid.vout` while ours are canonical `txid_vout`, so compare
	// by canonical form rather than raw string.
	const { outputs } = await listOrdinals.execute(ctx, { limit: 100 });
	const ordinal = outputs.find((o) => sameOutpoint(o.outpoint, outpoint));

	if (!ordinal) {
		throw new Error(`Ordinal not found in wallet for outpoint: ${outpoint}`);
	}
	const id = ordinal.tags
		?.find((tag) => tag.startsWith("id:"))
		?.slice("id:".length);
	if (!id) {
		throw new Error(`Ordinal is missing its wallet tracking id: ${outpoint}`);
	}

	// Sale proceeds go to the wallet's canonical deposit address
	const payAddress = await getDepositAddress(wallet);

	// Execute the listing via @1sat/actions
	const result = await sellOrdinal.execute(ctx, {
		id,
		price: priceSatoshis,
		payAddress,
	});

	if (result.error) {
		throw new Error(`Listing failed: ${result.error}`);
	}

	if (!result.txid) {
		throw new Error("Listing succeeded but no txid was returned");
	}

	return {
		txid: result.txid,
		// @1sat/actions now returns the raw tx as a byte array (`tx`); expose hex.
		rawtx: result.tx ? Utils.toHex(result.tx) : undefined,
	};
}
