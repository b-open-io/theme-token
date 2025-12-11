/**
 * Server-side API for minting collection items with platform AIP signature
 *
 * This endpoint uses js-1sat-ord's createOrdinals with the signer option
 * to properly build the inscription with Sigma signature.
 */

import { PrivateKey, Utils } from "@bsv/sdk";
import {
	createOrdinals,
	type CreateOrdinalsCollectionItemConfig,
	type CollectionItemSubTypeData,
} from "js-1sat-ord";
import type { NextRequest } from "next/server";

interface MintCollectionItemRequest {
	/** Collection item configuration */
	config: {
		collectionId: string;
		name: string;
		mintNumber?: number;
		traits?: Array<{
			name: string;
			value: string;
			rarityLabel?: string;
			occurancePercentage?: string;
		}>;
		rarityLabel?: string;
	};
	/** User's ordinals address (destination for the NFT) */
	ordAddress: string;
	/** User's BSV address (for change) */
	changeAddress: string;
	/** Payment UTXOs from user's wallet (hex scripts) */
	paymentUtxos: Array<{
		txid: string;
		vout: number;
		satoshis: number;
		script: string; // hex format
	}>;
}

interface SignatureRequest {
	prevTxid: string;
	outputIndex: number;
	inputIndex: number;
	satoshis: number;
	address: string;
	script: string;
	sigHashType: number;
}

export async function POST(req: NextRequest) {
	try {
		const body: MintCollectionItemRequest = await req.json();
		const { config, ordAddress, changeAddress, paymentUtxos } = body;

		// Validate platform key is configured
		const platformKeyWif = process.env.SIGMA_MEMBER_PRIVATE_KEY;
		if (!platformKeyWif) {
			return Response.json(
				{ error: "Platform signing key not configured" },
				{ status: 500 },
			);
		}

		// Validate inputs
		if (!config?.collectionId || !config?.name) {
			return Response.json(
				{ error: "Missing required config fields: collectionId, name" },
				{ status: 400 },
			);
		}

		if (!ordAddress || !changeAddress) {
			return Response.json(
				{ error: "Missing ordAddress or changeAddress" },
				{ status: 400 },
			);
		}

		if (!paymentUtxos || paymentUtxos.length === 0) {
			return Response.json(
				{ error: "No payment UTXOs provided" },
				{ status: 400 },
			);
		}

		// Build subTypeData for collection item
		const subTypeData: CollectionItemSubTypeData = {
			collectionId: config.collectionId,
		};

		if (config.mintNumber !== undefined) {
			subTypeData.mintNumber = config.mintNumber;
		}

		if (config.traits && config.traits.length > 0) {
			subTypeData.traits = config.traits;
		}

		if (config.rarityLabel) {
			// rarityLabel in CollectionItemSubTypeData is RarityLabels type
			subTypeData.rarityLabel = [{ [config.rarityLabel]: config.rarityLabel }];
		}

		// Convert UTXOs to js-1sat-ord format (needs base64 scripts)
		const utxos = paymentUtxos.map((utxo) => ({
			txid: utxo.txid,
			vout: utxo.vout,
			satoshis: utxo.satoshis,
			script: Utils.toBase64(Utils.toArray(utxo.script, "hex")),
		}));

		// Build inscription content
		const itemJson = {
			collectionId: config.collectionId,
			name: config.name,
			mintNumber: config.mintNumber,
		};
		const inscriptionDataB64 = btoa(JSON.stringify(itemJson));

		// Platform private key for Sigma signing
		const platformPrivateKey = PrivateKey.fromWif(platformKeyWif);

		// Use createOrdinals with signer for proper Sigma integration
		// signInputs: false allows server to apply Sigma signature while client signs inputs
		const createConfig: CreateOrdinalsCollectionItemConfig = {
			utxos,
			destinations: [
				{
					address: ordAddress,
					inscription: {
						dataB64: inscriptionDataB64,
						contentType: "application/json",
					},
				},
			],
			changeAddress,
			satsPerKb: 10,
			metaData: {
				app: "themetoken.dev",
				type: "ord",
				name: config.name,
				subType: "collectionItem",
				subTypeData,
			},
			signer: {
				idKey: platformPrivateKey,
			},
			signInputs: false, // Server applies Sigma signature, client signs inputs
		};

		const result = await createOrdinals(createConfig);

		// The tx from createOrdinals has empty unlocking scripts
		// We need to return signature requests for the client to sign
		const SIGHASH_ALL_FORKID = 0x41;
		const sigRequests: SignatureRequest[] = paymentUtxos.map((utxo, index) => ({
			prevTxid: utxo.txid,
			outputIndex: utxo.vout,
			inputIndex: index,
			satoshis: utxo.satoshis,
			address: changeAddress,
			script: utxo.script,
			sigHashType: SIGHASH_ALL_FORKID,
		}));

		// Get platform address for verification
		const platformAddress = platformPrivateKey.toAddress().toString();

		return Response.json({
			rawtx: result.tx.toHex(),
			sigRequests,
			platformAddress,
		});
	} catch (error) {
		console.error("[mint-collection-item] Error:", error);
		return Response.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to build transaction",
			},
			{ status: 500 },
		);
	}
}
