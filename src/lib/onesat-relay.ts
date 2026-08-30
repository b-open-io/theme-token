import { Transaction } from "@bsv/sdk";

export const ONESAT_RELAY_URL = "https://api.1sat.app/1sat/tx";

interface RelayResponse {
	txid?: unknown;
	txStatus?: unknown;
}

export interface OneSatRelayResult {
	state: "accepted" | "pending";
	txStatus: string;
}

const TX_STATUSES = new Set([
	"UNKNOWN",
	"RECEIVED",
	"SENT_TO_NETWORK",
	"ACCEPTED_BY_NETWORK",
	"SEEN_ON_NETWORK",
	"SEEN_MULTIPLE_NODES",
	"PENDING_RETRY",
	"STUMP_PROCESSING",
	"REJECTED",
	"DOUBLE_SPEND_ATTEMPTED",
	"MINED",
	"IMMUTABLE",
]);

/**
 * Capture wallet-returned BRC-95 Atomic BEEF in 1sat-stack and submit its leaf
 * transaction through Arcade. Relay failure never changes the wallet's own
 * broadcast result; callers decide how to report the best-effort propagation.
 */
export async function relayAtomicBeef(
	beef: Uint8Array,
	expectedTxid: string,
): Promise<OneSatRelayResult> {
	let beefTxid: string;
	try {
		beefTxid = Transaction.fromAtomicBEEF(beef).id("hex");
	} catch (error) {
		throw new Error(
			`The wallet returned invalid Atomic BEEF: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	if (beefTxid.toLowerCase() !== expectedTxid.toLowerCase()) {
		throw new Error(
			`The wallet's Atomic BEEF contains txid ${beefTxid}, expected ${expectedTxid}.`,
		);
	}

	let response: Response;
	try {
		response = await fetch(ONESAT_RELAY_URL, {
			method: "POST",
			headers: { "content-type": "application/octet-stream" },
			body: Uint8Array.from(beef).buffer,
			signal: AbortSignal.timeout(45_000),
		});
	} catch (error) {
		throw new Error(
			`1Sat relay request failed: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	const text = await response.text();
	if (response.status !== 200 && response.status !== 202) {
		throw new Error(
			`1Sat relay returned HTTP ${response.status}${text ? `: ${text}` : ""}`,
		);
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new Error("1Sat relay returned invalid JSON.");
	}
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error("1Sat relay returned an invalid response.");
	}

	const result = parsed as RelayResponse;
	if (typeof result.txid !== "string") {
		throw new Error("1Sat relay response did not include a txid.");
	}
	if (result.txid.toLowerCase() !== expectedTxid.toLowerCase()) {
		throw new Error(
			`1Sat relay returned txid ${result.txid}, expected ${expectedTxid}.`,
		);
	}
	if (
		typeof result.txStatus !== "string" ||
		!TX_STATUSES.has(result.txStatus)
	) {
		throw new Error("1Sat relay returned an unknown transaction status.");
	}
	if (["REJECTED", "DOUBLE_SPEND_ATTEMPTED"].includes(result.txStatus)) {
		throw new Error(`1Sat relay reported ${result.txStatus}.`);
	}

	return {
		state: response.status === 200 ? "accepted" : "pending",
		txStatus: result.txStatus,
	};
}
