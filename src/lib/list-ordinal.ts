/**
 * List an ordinal for sale using OrdLock
 * Uses Yours Wallet's getSignatures and broadcast
 */

import { Transaction, P2PKH, Script, Utils } from "@bsv/sdk";
import { OrdLock } from "js-1sat-ord";
import type {
  YoursWallet,
  SignatureRequest,
  Ordinal,
} from "./yours-wallet";

const SATS_PER_KB = 1;

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

  // Get payment UTXOs for fees
  const paymentUtxos = await wallet.getPaymentUtxos();
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
  console.log("[listOrdinal] OrdLock script:", lockScript);

  // Select payment UTXO
  const payUtxo = paymentUtxos[0];

  // Estimate fee (P2PKH sig ~107 bytes, 2 inputs, 2 outputs)
  const estimatedSize = 10 + (2 * 148) + (2 * 34); // ~374 bytes
  const fee = Math.ceil(estimatedSize * SATS_PER_KB / 1000);
  const change = payUtxo.satoshis - fee;

  if (change < 0) {
    throw new Error("Insufficient funds for transaction fee");
  }

  // Create the transaction
  const tx = new Transaction();

  // Placeholder unlocking script for serialization (will be replaced after signing)
  const placeholderUnlock = new Script();

  // Parse source locking scripts from base64
  const ordinalLockingScript = Script.fromBinary(Utils.toArray(ordinal.script, "base64"));
  const payUtxoLockingScript = Script.fromBinary(Utils.toArray(payUtxo.script, "base64"));

  // Build fake source transactions with outputs at correct vout indexes
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
    unlockingScript: placeholderUnlock,
    sourceTransaction: { outputs: ordSourceOutputs } as unknown as Transaction,
  });

  // Add payment UTXO for fees (index 1)
  tx.addInput({
    sourceTXID: payUtxo.txid,
    sourceOutputIndex: payUtxo.vout,
    sequence: 0xffffffff,
    unlockingScript: placeholderUnlock,
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

  // Convert base64 scripts to hex for signature requests
  const ordinalScriptHex = Utils.toHex(Utils.toArray(ordinal.script, "base64"));
  const payUtxoScriptHex = Utils.toHex(Utils.toArray(payUtxo.script, "base64"));
  console.log("[listOrdinal] Ordinal script (hex):", ordinalScriptHex);
  console.log("[listOrdinal] PayUtxo script (hex):", payUtxoScriptHex);

  // Build signature requests
  const sigRequests: SignatureRequest[] = [
    {
      prevTxid: ordinal.txid,
      outputIndex: ordinal.vout,
      inputIndex: 0,
      satoshis: ordinal.satoshis,
      address: ordAddress,
      script: ordinalScriptHex,
    },
    {
      prevTxid: payUtxo.txid,
      outputIndex: payUtxo.vout,
      inputIndex: 1,
      satoshis: payUtxo.satoshis,
      address: bsvAddress,
      script: payUtxoScriptHex,
    },
  ];

  // Get the unsigned raw tx
  console.log("[listOrdinal] Building raw tx...");
  console.log("[listOrdinal] Tx inputs:", tx.inputs.length);
  console.log("[listOrdinal] Tx outputs:", tx.outputs.length);
  const rawtx = tx.toHex();
  console.log("[listOrdinal] Raw tx:", rawtx);

  // Get signatures from wallet - wallet returns signed tx
  console.log("[listOrdinal] Getting signatures from wallet...");
  console.log("[listOrdinal] Sig requests:", sigRequests);
  const signatures = await wallet.getSignatures({
    rawtx,
    sigRequests,
  });
  console.log("[listOrdinal] Signatures received:", signatures);

  // Apply signatures to transaction
  for (const sig of signatures) {
    const input = tx.inputs[sig.inputIndex];
    if (input) {
      console.log("[listOrdinal] Applying sig to input", sig.inputIndex, "sig:", sig.sig, "pubKey:", sig.pubKey);
      // P2PKH unlocking script: <sig> <pubkey>
      // Build script by pushing hex data properly
      const sigBytes = Utils.toArray(sig.sig, "hex");
      const pubKeyBytes = Utils.toArray(sig.pubKey, "hex");
      const unlockScript = new Script();
      unlockScript.writeBin(sigBytes);
      unlockScript.writeBin(pubKeyBytes);
      input.unlockingScript = unlockScript;
    }
  }

  // Broadcast the signed transaction
  const signedRawtx = tx.toHex();
  console.log("[listOrdinal] Signed raw tx:", signedRawtx);
  console.log("[listOrdinal] Input 0 unlocking script:", tx.inputs[0]?.unlockingScript?.toHex());
  console.log("[listOrdinal] Input 1 unlocking script:", tx.inputs[1]?.unlockingScript?.toHex());

  // Broadcast directly to GorillaPool API (wallet broadcast has verification issues)
  console.log("[listOrdinal] Broadcasting to GorillaPool...");
  const txBytes = new Uint8Array(Utils.toArray(signedRawtx, "hex"));
  const broadcastResponse = await fetch("https://ordinals.gorillapool.io/api/tx", {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: txBytes,
  });

  if (!broadcastResponse.ok) {
    const errorText = await broadcastResponse.text();
    console.error("[listOrdinal] Broadcast failed:", errorText);
    throw new Error(`Broadcast failed: ${errorText}`);
  }

  const txid = await broadcastResponse.text();
  console.log("[listOrdinal] Broadcast success, txid:", txid);

  return {
    txid,
    rawtx: signedRawtx,
  };
}
