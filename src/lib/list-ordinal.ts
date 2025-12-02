/**
 * List an ordinal for sale using OrdLock
 * Uses Yours Wallet's getSignatures and broadcast
 */

import { Transaction, P2PKH, Script, UnlockingScript, Utils } from "@bsv/sdk";
import { OrdLock } from "js-1sat-ord";
import type {
  YoursWallet,
  SignatureRequest,
  Ordinal,
} from "./yours-wallet";

const SATS_PER_KB = 100;

export interface ListOrdinalParams {
  ordinal: Ordinal;
  priceSatoshis: number;
}

export interface ListOrdinalResult {
  txid: string;
  rawtx: string;
}

/**
 * Create a listing for an ordinal using the OrdLock script
 */
export async function listOrdinal(
  wallet: YoursWallet,
  params: ListOrdinalParams
): Promise<ListOrdinalResult> {
  const { ordinal, priceSatoshis } = params;
  console.log("[listOrdinal] Starting with ordinal:", ordinal, "price:", priceSatoshis);

  // Get wallet addresses
  const addresses = await wallet.getAddresses();
  const { ordAddress, bsvAddress } = addresses;
  console.log("[listOrdinal] Addresses:", { ordAddress, bsvAddress });

  // Get payment UTXOs (separate from ordinals per wallet API)
  const paymentUtxos = await wallet.getPaymentUtxos();
  console.log("[listOrdinal] Payment UTXOs:", paymentUtxos?.length);

  if (!paymentUtxos || paymentUtxos.length === 0) {
    throw new Error("No payment UTXOs available for fees");
  }

  // Validate ordinal has script
  if (!ordinal.script) {
    throw new Error("Ordinal script is required");
  }

  // Build the OrdLock script
  console.log("[listOrdinal] Building OrdLock script...");
  const ordLock = new OrdLock();
  const lockScript = ordLock.lock(ordAddress, bsvAddress, priceSatoshis);
  console.log("[listOrdinal] OrdLock script:", lockScript.toHex());

  // Log all payment UTXOs (scripts are hex format)
  for (const utxo of paymentUtxos) {
    console.log("[listOrdinal] Payment UTXO:", utxo.txid.slice(0, 8), "vout:", utxo.vout, "sats:", utxo.satoshis);
    console.log("[listOrdinal]   script (hex):", utxo.script);
    const scriptBytes = Utils.toArray(utxo.script, "hex");
    console.log("[listOrdinal]   script length:", scriptBytes.length, "bytes");
  }

  // Select payment UTXO
  const payUtxo = paymentUtxos[0];
  console.log("[listOrdinal] Selected payment UTXO:", JSON.stringify(payUtxo, null, 2));

  // Get actual script sizes for fee calculation
  const ordLockScriptSize = lockScript.toBinary().length;
  const p2pkhOutputSize = 25; // Standard P2PKH locking script

  // Estimate fee based on actual sizes
  // Overhead: 4 (version) + 1 (input count) + 1 (output count) + 4 (locktime) = 10 bytes
  // Input: 32 (txid) + 4 (vout) + 1 (script len) + ~107 (sig+pubkey) + 4 (sequence) = ~148 bytes each
  // Output: 8 (value) + 1-3 (script len varint) + script
  const inputsSize = 2 * 148;
  const output0Size = 8 + 3 + ordLockScriptSize; // OrdLock output (use 3 for varint since script is large)
  const output1Size = 8 + 1 + p2pkhOutputSize; // Change output
  const estimatedSize = 10 + inputsSize + output0Size + output1Size;

  console.log("[listOrdinal] Fee estimate - OrdLock script:", ordLockScriptSize, "bytes, total tx:", estimatedSize, "bytes");

  const fee = Math.ceil(estimatedSize * SATS_PER_KB / 1000);
  const change = payUtxo.satoshis - fee;

  if (change < 0) {
    throw new Error("Insufficient funds for transaction fee");
  }

  // Create the transaction
  const tx = new Transaction();

  // Parse source locking scripts
  // Ordinal scripts are base64, payment UTXO scripts are hex
  const ordinalLockingScript = Script.fromBinary(Utils.toArray(ordinal.script, "base64"));
  const payUtxoLockingScript = Script.fromBinary(Utils.toArray(payUtxo.script, "hex"));

  console.log("[listOrdinal] Ordinal locking script hex:", ordinalLockingScript.toHex());
  console.log("[listOrdinal] PayUtxo locking script hex:", payUtxoLockingScript.toHex());

  // Build source transaction structures
  const ordSourceOutputs: { lockingScript: Script; satoshis: number }[] = [];
  ordSourceOutputs[ordinal.vout] = {
    lockingScript: ordinalLockingScript,
    satoshis: ordinal.satoshis,
  };

  const paySourceOutputs: { lockingScript: Script; satoshis: number }[] = [];
  paySourceOutputs[payUtxo.vout] = {
    lockingScript: payUtxoLockingScript,
    satoshis: payUtxo.satoshis,
  };

  // Add the ordinal as input (index 0)
  tx.addInput({
    sourceTXID: ordinal.txid,
    sourceOutputIndex: ordinal.vout,
    sequence: 0xffffffff,
    unlockingScript: new Script(),
    sourceTransaction: { outputs: ordSourceOutputs } as unknown as Transaction,
  });

  // Add payment UTXO for fees (index 1)
  tx.addInput({
    sourceTXID: payUtxo.txid,
    sourceOutputIndex: payUtxo.vout,
    sequence: 0xffffffff,
    unlockingScript: new Script(),
    sourceTransaction: { outputs: paySourceOutputs } as unknown as Transaction,
  });

  // Output 0: The ordinal with OrdLock script
  tx.addOutput({
    lockingScript: lockScript,
    satoshis: 1,
  });

  // Output 1: Change back to payment address
  if (change > 0) {
    tx.addOutput({
      lockingScript: new P2PKH().lock(bsvAddress),
      satoshis: change,
    });
  }

  // Convert scripts to hex for signature requests
  // Ordinal scripts are base64, payment UTXO scripts are already hex
  const ordinalScriptHex = Utils.toHex(Utils.toArray(ordinal.script, "base64"));
  const payUtxoScriptHex = payUtxo.script; // Already hex

  // Use ordinal's owner address for signing
  const ordinalOwner = ordinal.owner || ordAddress;

  console.log("[listOrdinal] Ordinal owner:", ordinalOwner);
  console.log("[listOrdinal] PayUtxo will use bsvAddress:", bsvAddress);

  // SIGHASH_ALL | SIGHASH_ANYONECANPAY | SIGHASH_FORKID = 0xC1 (193)
  const SIGHASH_ALL_ANYONECANPAY_FORKID = 0xC1;

  // Build signature requests
  const sigRequests: SignatureRequest[] = [
    {
      prevTxid: ordinal.txid,
      outputIndex: ordinal.vout,
      inputIndex: 0,
      satoshis: ordinal.satoshis,
      address: ordinalOwner,
      script: ordinalScriptHex,
      sigHashType: SIGHASH_ALL_ANYONECANPAY_FORKID,
    },
    {
      prevTxid: payUtxo.txid,
      outputIndex: payUtxo.vout,
      inputIndex: 1,
      satoshis: payUtxo.satoshis,
      address: bsvAddress,
      script: payUtxoScriptHex,
      sigHashType: SIGHASH_ALL_ANYONECANPAY_FORKID,
    },
  ];

  // Get the unsigned raw tx
  const rawtx = tx.toHex();
  console.log("[listOrdinal] Unsigned raw tx:", rawtx);
  console.log("[listOrdinal] Tx inputs:", tx.inputs.length, "outputs:", tx.outputs.length);

  // Get signatures from wallet
  console.log("[listOrdinal] Getting signatures from wallet...");
  console.log("[listOrdinal] Sig requests:", sigRequests);
  const signatures = await wallet.getSignatures({
    rawtx,
    sigRequests,
  });
  console.log("[listOrdinal] Signatures received:", signatures);

  // Build unlocking scripts from signatures
  const unlockingScripts: UnlockingScript[] = [];
  for (const sig of signatures) {
    console.log("[listOrdinal] Building unlocking script for input", sig.inputIndex);
    const sigBytes = Utils.toArray(sig.sig, "hex");
    const pubKeyBytes = Utils.toArray(sig.pubKey, "hex");
    const unlockScript = new UnlockingScript([
      { op: sigBytes.length, data: sigBytes },
      { op: pubKeyBytes.length, data: pubKeyBytes }
    ]);
    unlockingScripts[sig.inputIndex] = unlockScript;
  }

  // Verify we have signatures for all inputs
  for (let i = 0; i < tx.inputs.length; i++) {
    if (!unlockingScripts[i]) {
      throw new Error(`Missing signature for input ${i}. Wallet may not have key for this UTXO.`);
    }
  }

  // Manually build the signed transaction
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
  console.log("[listOrdinal] Signed raw tx:", signedRawtx);

  // Broadcast through wallet
  console.log("[listOrdinal] Broadcasting...");
  const txid = await wallet.broadcast({ rawtx: signedRawtx });
  console.log("[listOrdinal] Broadcast success, txid:", txid);

  return {
    txid,
    rawtx: signedRawtx,
  };
}
