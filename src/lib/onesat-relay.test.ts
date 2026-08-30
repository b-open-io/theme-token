import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { LockingScript, Transaction } from "@bsv/sdk";
import { ONESAT_RELAY_URL, relayAtomicBeef } from "@/lib/onesat-relay";

function publishedTransaction() {
	const transaction = new Transaction(
		1,
		[],
		[
			{
				satoshis: 0,
				lockingScript: LockingScript.fromASM("OP_RETURN"),
			},
		],
		0,
	);
	return {
		beef: transaction.toAtomicBEEFUint8Array(),
		txid: transaction.id("hex"),
	};
}

afterEach(() => mock.restore());

describe("relayAtomicBeef", () => {
	test("validates and posts Atomic BEEF to 1sat-stack", async () => {
		const { beef, txid } = publishedTransaction();
		const fetchMock = spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify({ txid, txStatus: "SEEN_ON_NETWORK" }), {
				status: 200,
			}),
		);

		await expect(relayAtomicBeef(beef, txid)).resolves.toEqual({
			state: "accepted",
			txStatus: "SEEN_ON_NETWORK",
		});
		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0] ?? [];
		expect(url).toBe(ONESAT_RELAY_URL);
		expect(init?.method).toBe("POST");
		expect(init?.headers).toEqual({
			"content-type": "application/octet-stream",
		});
		expect(new Uint8Array(init?.body as ArrayBuffer)).toEqual(beef);
	});

	test("reports HTTP 202 as pending", async () => {
		const { beef, txid } = publishedTransaction();
		spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify({ txid, txStatus: "RECEIVED" }), {
				status: 202,
			}),
		);

		await expect(relayAtomicBeef(beef, txid)).resolves.toEqual({
			state: "pending",
			txStatus: "RECEIVED",
		});
	});

	test("does not submit BEEF whose subject txid does not match", async () => {
		const { beef } = publishedTransaction();
		const fetchMock = spyOn(globalThis, "fetch");

		await expect(relayAtomicBeef(beef, "f".repeat(64))).rejects.toThrow(
			"wallet's Atomic BEEF contains txid",
		);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	test("does not accept a rejected relay status", async () => {
		const { beef, txid } = publishedTransaction();
		spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify({ txid, txStatus: "REJECTED" }), {
				status: 200,
			}),
		);

		await expect(relayAtomicBeef(beef, txid)).rejects.toThrow(
			"1Sat relay reported REJECTED",
		);
	});
});
