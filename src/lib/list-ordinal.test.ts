import { beforeEach, describe, expect, mock, test } from "bun:test";
import * as actualActions from "@1sat/actions";
import type { WalletInterface } from "@bsv/sdk";

const OUTPOINT = `${"d".repeat(64)}.1`;
const listOrdinalsMock = mock(async () => ({
	outputs: [],
	BEEF: [1, 2, 3],
}));
const sellOrdinalMock = mock(async () => ({ txid: "tracked" }));
const executeTrackedActionMock = mock(async () => ({
	txid: "legacy",
	tx: [4, 5, 6],
}));

mock.module("@1sat/actions", () => ({
	...actualActions,
	buildOrdLockScript: () => ({ toHex: () => "51" }),
	buildOrdinalCustomInstructions: () => "{}",
	deriveCancelAddressInternal: async () => "cancel-address",
	executeTrackedAction: executeTrackedActionMock,
	listOrdinals: { execute: listOrdinalsMock },
	ordinalSeedTags: () => ["origin"],
	sellOrdinal: { execute: sellOrdinalMock },
}));

const { listOrdinal } = await import("./list-ordinal");

const wallet = {
	getPublicKey: async () => ({
		publicKey:
			"0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
	}),
} as unknown as WalletInterface;

describe("listOrdinal", () => {
	beforeEach(() => {
		listOrdinalsMock.mockClear();
		sellOrdinalMock.mockClear();
		executeTrackedActionMock.mockClear();
	});

	test("uses the tracked SDK sale for outputs with an id tag", async () => {
		listOrdinalsMock.mockResolvedValueOnce({
			outputs: [
				{
					outpoint: OUTPOINT,
					tags: ["id:asset_1"],
					customInstructions: "{}",
				},
			],
			BEEF: [1, 2, 3],
		});

		const result = await listOrdinal(wallet, {
			outpoint: OUTPOINT.replace(".", "_"),
			priceSatoshis: 500,
		});

		expect(result.txid).toBe("tracked");
		expect(sellOrdinalMock).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ id: "asset_1", price: 500 }),
		);
		expect(executeTrackedActionMock).not.toHaveBeenCalled();
	});

	test("lists an untracked wallet output once using its BEEF and instructions", async () => {
		const legacyInventory = {
			outputs: [
				{
					outpoint: OUTPOINT,
					tags: ["origin"],
					customInstructions: JSON.stringify({
						protocolID: [0, "onesat"],
						keyID: "legacy-key",
					}),
				},
			],
			BEEF: [1, 2, 3],
		};
		listOrdinalsMock
			.mockResolvedValueOnce({ ...legacyInventory, BEEF: undefined })
			.mockResolvedValueOnce(legacyInventory);

		const result = await listOrdinal(wallet, {
			outpoint: OUTPOINT,
			priceSatoshis: 750,
		});

		expect(result).toEqual({ txid: "legacy", rawtx: "040506" });
		expect(sellOrdinalMock).not.toHaveBeenCalled();
		expect(executeTrackedActionMock).toHaveBeenCalledTimes(1);
		const call = executeTrackedActionMock.mock.calls[0];
		expect(call?.[1]).toEqual(
			expect.objectContaining({
				inputBEEF: [1, 2, 3],
				inputs: [expect.objectContaining({ outpoint: OUTPOINT })],
			}),
		);
		expect(call?.[5]).toEqual({
			spends: [
				expect.objectContaining({
					outpoint: OUTPOINT,
					customInstructions: expect.any(String),
				}),
			],
		});
	});
});
