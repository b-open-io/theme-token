/**
 * List an ordinal for sale using @1sat/actions sellOrdinal.
 * Replaces manual OrdLock transaction building with the action system.
 */

import {
	buildOrdinalCustomInstructions,
	buildOrdLockScript,
	deriveCancelAddressInternal,
	executeTrackedAction,
	listOrdinals,
	ONESAT_PROTOCOL,
	ORDINALS_BASKET,
	ordinalSeedTags,
	sellOrdinal,
} from "@1sat/actions";
import { Utils, type WalletInterface, type WalletOutput } from "@bsv/sdk";
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

function ordinalName(ordinal: WalletOutput): string | undefined {
	if (!ordinal.customInstructions) return undefined;
	try {
		const name = (JSON.parse(ordinal.customInstructions) as { name?: unknown })
			.name;
		return typeof name === "string" ? name : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Outputs minted before managed `id:` tags still need a path to their first
 * tracked spend. The listing output itself is managed and receives a fresh id.
 */
async function sellUntrackedOrdinal(
	wallet: WalletInterface,
	ordinal: WalletOutput,
	inputBEEF: number[] | undefined,
	price: number,
	payAddress: string,
): Promise<{ txid?: string; tx?: number[]; error?: string }> {
	if (!inputBEEF?.length) return { error: "missing-input-beef" };
	if (!ordinal.customInstructions)
		return { error: "missing-custom-instructions" };

	const ctx = createWalletContext(wallet);
	const cancelAddress = await deriveCancelAddressInternal(
		ctx,
		ordinal.outpoint,
	);
	const lockingScript = buildOrdLockScript(cancelAddress, payAddress, price);
	const tags = [...ordinalSeedTags(ordinal), "ordlock", `price:${price}`];

	return executeTrackedAction(
		wallet,
		{
			description: `List ordinal for ${price} sats`,
			inputBEEF,
			inputs: [
				{
					outpoint: ordinal.outpoint,
					inputDescription: "Ordinal to list",
					unlockingScriptLength: 108,
				},
			],
			outputs: [
				{
					lockingScript: lockingScript.toHex(),
					satoshis: 1,
					outputDescription: `List ordinal for ${price} sats`,
					basket: ORDINALS_BASKET,
					tags,
					customInstructions: buildOrdinalCustomInstructions({
						protocolID: ONESAT_PROTOCOL,
						keyID: ordinal.outpoint,
						tags,
						name: ordinalName(ordinal),
					}),
				},
			],
			options: { randomizeOutputs: false },
		},
		undefined,
		inputBEEF,
		undefined,
		{
			spends: [
				{
					outpoint: ordinal.outpoint,
					customInstructions: ordinal.customInstructions,
				},
			],
		},
	);
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
	const { outputs } = await listOrdinals.execute(ctx, { limit: 1000 });
	const ordinal = outputs.find((o) => sameOutpoint(o.outpoint, outpoint));

	if (!ordinal) {
		throw new Error(`Ordinal not found in wallet for outpoint: ${outpoint}`);
	}
	const id = ordinal.tags
		?.find((tag) => tag.startsWith("id:"))
		?.slice("id:".length);

	// Sale proceeds go to the wallet's canonical deposit address
	const payAddress = await getDepositAddress(wallet);

	let result: { txid?: string; tx?: number[]; error?: string };
	if (id) {
		result = await sellOrdinal.execute(ctx, {
			id,
			price: priceSatoshis,
			payAddress,
		});
	} else {
		const legacyInventory = await listOrdinals.execute(ctx, {
			include: "entire transactions",
			limit: 1000,
		});
		const legacyOrdinal = legacyInventory.outputs.find((output) =>
			sameOutpoint(output.outpoint, outpoint),
		);
		if (!legacyOrdinal) {
			throw new Error(`Ordinal not found in wallet for outpoint: ${outpoint}`);
		}
		result = await sellUntrackedOrdinal(
			wallet,
			legacyOrdinal,
			legacyInventory.BEEF ? Array.from(legacyInventory.BEEF) : undefined,
			priceSatoshis,
			payAddress,
		);
	}

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
