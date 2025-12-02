/**
 * List an ordinal for sale using OrdLock
 * Uses Yours Wallet's getSignatures and broadcast
 */

import { Transaction, P2PKH, Script } from "@bsv/sdk";
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

  // Get wallet addresses
  const addresses = await wallet.getAddresses();
  const { ordAddress, bsvAddress } = addresses;

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
  const ordLock = new OrdLock();
  const lockScript = ordLock.lock(ordAddress, bsvAddress, priceSatoshis);

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

  // Add the ordinal as input (index 0)
  tx.addInput({
    sourceTXID: ordinal.txid,
    sourceOutputIndex: ordinal.vout,
    sequence: 0xffffffff,
  });

  // Add payment UTXO for fees (index 1)
  tx.addInput({
    sourceTXID: payUtxo.txid,
    sourceOutputIndex: payUtxo.vout,
    sequence: 0xffffffff,
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

  // Build signature requests
  const sigRequests: SignatureRequest[] = [
    {
      prevTxid: ordinal.txid,
      outputIndex: ordinal.vout,
      inputIndex: 0,
      satoshis: ordinal.satoshis,
      address: ordAddress,
      script: ordinal.script,
    },
    {
      prevTxid: payUtxo.txid,
      outputIndex: payUtxo.vout,
      inputIndex: 1,
      satoshis: payUtxo.satoshis,
      address: bsvAddress,
      script: payUtxo.script,
    },
  ];

  // Get the unsigned raw tx
  const rawtx = tx.toHex();

  // Get signatures from wallet - wallet returns signed tx
  const signatures = await wallet.getSignatures({
    rawtx,
    sigRequests,
  });

  // Apply signatures to transaction
  for (const sig of signatures) {
    const input = tx.inputs[sig.inputIndex];
    if (input) {
      // P2PKH unlocking script: <sig> <pubkey>
      input.unlockingScript = Script.fromASM(`${sig.sig} ${sig.pubKey}`);
    }
  }

  // Broadcast the signed transaction
  const signedRawtx = tx.toHex();
  const txid = await wallet.broadcast({ rawtx: signedRawtx });

  return {
    txid,
    rawtx: signedRawtx,
  };
}
