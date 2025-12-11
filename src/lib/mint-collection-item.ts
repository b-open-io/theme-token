/**
 * Client-side helper for minting collection items with platform signature
 *
 * This module orchestrates:
 * 1. Getting payment UTXOs from user's wallet
 * 2. Calling server API to build Sigma-signed transaction
 * 3. Getting user signatures for payment inputs
 * 4. Applying signatures and broadcasting
 */

import { Script, UnlockingScript, Utils } from "@bsv/sdk";
import type { SignatureRequest, Utxo, YoursWallet } from "./yours-wallet";

export interface MintCollectionItemConfig {
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
}

export interface MintResult {
	txid: string;
	rawtx: string;
	platformAddress: string;
}

interface ServerResponse {
	rawtx: string;
	sigRequests: SignatureRequest[];
	platformAddress: string;
	error?: string;
}

/**
 * Mint a collection item with platform AIP signature
 */
export async function mintCollectionItemWithPlatformSig(
	wallet: YoursWallet,
	config: MintCollectionItemConfig,
	ordAddress: string,
): Promise<MintResult> {
	// 1. Get wallet addresses and payment UTXOs
	const addresses = await wallet.getAddresses();
	const paymentUtxos = await wallet.getPaymentUtxos();

	if (!paymentUtxos || paymentUtxos.length === 0) {
		throw new Error("No payment UTXOs available");
	}

	// Convert UTXOs to server format (scripts are hex from getPaymentUtxos)
	const utxosForServer = paymentUtxos.map((utxo: Utxo) => ({
		txid: utxo.txid,
		vout: utxo.vout,
		satoshis: utxo.satoshis,
		script: utxo.script, // Already hex format from wallet
	}));

	// 2. Call server to build and Sigma-sign the transaction
	const response = await fetch("/api/mint-collection-item", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			config,
			ordAddress,
			changeAddress: addresses.bsvAddress,
			paymentUtxos: utxosForServer,
		}),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || `Server error: ${response.status}`);
	}

	const serverResponse: ServerResponse = await response.json();

	if (serverResponse.error) {
		throw new Error(serverResponse.error);
	}

	// 3. Get user signatures for payment inputs
	const signatures = await wallet.getSignatures({
		rawtx: serverResponse.rawtx,
		sigRequests: serverResponse.sigRequests,
	});

	// 4. Apply signatures to transaction
	const signedRawtx = applySignaturesToTx(
		serverResponse.rawtx,
		signatures,
		serverResponse.sigRequests.length,
	);

	// 5. Broadcast
	const txid = await wallet.broadcast({ rawtx: signedRawtx });

	return {
		txid,
		rawtx: signedRawtx,
		platformAddress: serverResponse.platformAddress,
	};
}

/**
 * Apply wallet signatures to transaction inputs
 * Based on the pattern from list-ordinal.ts
 */
function applySignaturesToTx(
	rawtx: string,
	signatures: Array<{
		inputIndex: number;
		sig: string;
		pubKey: string;
		sigHashType: number;
	}>,
	numInputs: number,
): string {
	// Parse the transaction to get structure
	const txBytes = Utils.toArray(rawtx, "hex");

	// Build unlocking scripts from signatures
	const unlockingScripts: UnlockingScript[] = [];
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
	for (let i = 0; i < numInputs; i++) {
		if (!unlockingScripts[i]) {
			throw new Error(
				`Missing signature for input ${i}. Wallet may not have key for this UTXO.`,
			);
		}
	}

	// Re-serialize transaction with unlocking scripts
	// Parse the transaction structure manually
	let offset = 0;

	// Version (4 bytes)
	const version =
		txBytes[offset] |
		(txBytes[offset + 1] << 8) |
		(txBytes[offset + 2] << 16) |
		(txBytes[offset + 3] << 24);
	offset += 4;

	// Input count (varint)
	const { value: inputCount, bytesRead: inputCountBytes } = readVarint(
		txBytes,
		offset,
	);
	offset += inputCountBytes;

	// Parse inputs (skip their empty unlocking scripts)
	const inputs: Array<{
		txid: number[];
		vout: number;
		sequence: number;
	}> = [];

	for (let i = 0; i < inputCount; i++) {
		// Previous txid (32 bytes)
		const txid = txBytes.slice(offset, offset + 32);
		offset += 32;

		// Previous output index (4 bytes)
		const vout =
			txBytes[offset] |
			(txBytes[offset + 1] << 8) |
			(txBytes[offset + 2] << 16) |
			(txBytes[offset + 3] << 24);
		offset += 4;

		// Script length (varint)
		const { value: scriptLen, bytesRead: scriptLenBytes } = readVarint(
			txBytes,
			offset,
		);
		offset += scriptLenBytes;

		// Skip the empty unlocking script
		offset += scriptLen;

		// Sequence (4 bytes)
		const sequence =
			txBytes[offset] |
			(txBytes[offset + 1] << 8) |
			(txBytes[offset + 2] << 16) |
			(txBytes[offset + 3] << 24);
		offset += 4;

		inputs.push({ txid, vout, sequence });
	}

	// Output count (varint)
	const { value: outputCount, bytesRead: outputCountBytes } = readVarint(
		txBytes,
		offset,
	);
	offset += outputCountBytes;

	// Parse outputs
	const outputs: Array<{
		satoshis: number;
		script: number[];
	}> = [];

	for (let i = 0; i < outputCount; i++) {
		// Value (8 bytes, little-endian)
		const satoshis =
			txBytes[offset] |
			(txBytes[offset + 1] << 8) |
			(txBytes[offset + 2] << 16) |
			(txBytes[offset + 3] << 24);
		// Skip high 4 bytes (we don't need them for small values)
		offset += 8;

		// Script length (varint)
		const { value: scriptLen, bytesRead: scriptLenBytes } = readVarint(
			txBytes,
			offset,
		);
		offset += scriptLenBytes;

		// Script
		const script = txBytes.slice(offset, offset + scriptLen);
		offset += scriptLen;

		outputs.push({ satoshis, script });
	}

	// Locktime (4 bytes)
	const locktime =
		txBytes[offset] |
		(txBytes[offset + 1] << 8) |
		(txBytes[offset + 2] << 16) |
		(txBytes[offset + 3] << 24);

	// Now rebuild the transaction with unlocking scripts
	const result: number[] = [];

	// Version
	result.push(version & 0xff);
	result.push((version >> 8) & 0xff);
	result.push((version >> 16) & 0xff);
	result.push((version >> 24) & 0xff);

	// Input count
	result.push(inputCount);

	// Inputs with unlocking scripts
	for (let i = 0; i < inputs.length; i++) {
		const input = inputs[i];
		const unlockScript = unlockingScripts[i];

		// Previous txid (already reversed in parsed form)
		result.push(...input.txid);

		// Previous output index
		result.push(input.vout & 0xff);
		result.push((input.vout >> 8) & 0xff);
		result.push((input.vout >> 16) & 0xff);
		result.push((input.vout >> 24) & 0xff);

		// Unlocking script length + script
		const scriptBytes = unlockScript.toBinary();
		writeVarint(result, scriptBytes.length);
		result.push(...scriptBytes);

		// Sequence
		result.push(input.sequence & 0xff);
		result.push((input.sequence >> 8) & 0xff);
		result.push((input.sequence >> 16) & 0xff);
		result.push((input.sequence >> 24) & 0xff);
	}

	// Output count
	result.push(outputCount);

	// Outputs (unchanged)
	for (const output of outputs) {
		// Value (8 bytes)
		result.push(output.satoshis & 0xff);
		result.push((output.satoshis >> 8) & 0xff);
		result.push((output.satoshis >> 16) & 0xff);
		result.push((output.satoshis >> 24) & 0xff);
		result.push(0, 0, 0, 0); // High 4 bytes

		// Script length + script
		writeVarint(result, output.script.length);
		result.push(...output.script);
	}

	// Locktime
	result.push(locktime & 0xff);
	result.push((locktime >> 8) & 0xff);
	result.push((locktime >> 16) & 0xff);
	result.push((locktime >> 24) & 0xff);

	return Utils.toHex(result);
}

/**
 * Read a Bitcoin varint from a byte array
 */
function readVarint(
	bytes: number[],
	offset: number,
): { value: number; bytesRead: number } {
	const first = bytes[offset];
	if (first < 0xfd) {
		return { value: first, bytesRead: 1 };
	}
	if (first === 0xfd) {
		return {
			value: bytes[offset + 1] | (bytes[offset + 2] << 8),
			bytesRead: 3,
		};
	}
	if (first === 0xfe) {
		return {
			value:
				bytes[offset + 1] |
				(bytes[offset + 2] << 8) |
				(bytes[offset + 3] << 16) |
				(bytes[offset + 4] << 24),
			bytesRead: 5,
		};
	}
	// 0xff - 8 byte varint (unlikely for our use case)
	throw new Error("Varint too large");
}

/**
 * Write a Bitcoin varint to a byte array
 */
function writeVarint(arr: number[], value: number): void {
	if (value < 0xfd) {
		arr.push(value);
	} else if (value < 0x10000) {
		arr.push(0xfd);
		arr.push(value & 0xff);
		arr.push((value >> 8) & 0xff);
	} else {
		arr.push(0xfe);
		arr.push(value & 0xff);
		arr.push((value >> 8) & 0xff);
		arr.push((value >> 16) & 0xff);
		arr.push((value >> 24) & 0xff);
	}
}
