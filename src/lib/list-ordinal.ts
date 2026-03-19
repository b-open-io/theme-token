/**
 * List an ordinal for sale using @1sat/actions listOrdinal.
 * Replaces manual OrdLock transaction building with the action system.
 */

import type { WalletInterface } from "@bsv/sdk";
import {
	listOrdinal as listOrdinalAction,
	getOrdinals,
} from "@1sat/actions";
import { createWalletContext, getPaymentAddress } from "@/lib/wallet-actions";

export interface ListOrdinalParams {
	/** Outpoint of the ordinal to list (txid_vout format) */
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
 * and delegates to @1sat/actions listOrdinal which handles OrdLock
 * script building, signing, and broadcasting.
 */
export async function listOrdinal(
	wallet: WalletInterface,
	params: ListOrdinalParams,
): Promise<ListOrdinalResult> {
	const { outpoint, priceSatoshis } = params;

	const ctx = createWalletContext(wallet);

	// Look up the ordinal output from the wallet
	const { outputs } = await getOrdinals.execute(ctx, { limit: 100 });
	const ordinal = outputs.find((o) => o.outpoint === outpoint);

	if (!ordinal) {
		throw new Error(
			`Ordinal not found in wallet for outpoint: ${outpoint}`,
		);
	}

	// Derive the seller's payment address
	const payAddress = await getPaymentAddress(wallet);

	// Execute the listing via @1sat/actions
	const result = await listOrdinalAction.execute(ctx, {
		ordinal,
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
		rawtx: result.rawtx,
	};
}
