import { describe, expect, test } from "bun:test";
import type { WalletInterface } from "@bsv/sdk";
import { getDepositAddress, getOwnedOrdinals } from "@/lib/wallet-actions";

const PUBLIC_KEY =
	"0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798";

describe("BSV Desktop wallet compatibility", () => {
	test("reads inventory from the plain BRC-147 1sat basket", async () => {
		let requestedBasket: string | undefined;
		const wallet = {
			listOutputs: async (args: { basket?: string }) => {
				requestedBasket = args.basket;
				return { outputs: [], totalOutputs: 0 };
			},
		} as unknown as WalletInterface;

		await getOwnedOrdinals(wallet);

		expect(requestedBasket).toBe("1sat");
	});

	test("derives the deposit address without a p 1sat module protocol", async () => {
		const protocolCalls: unknown[] = [];
		const wallet = {
			getPublicKey: async (args: { protocolID?: unknown }) => {
				if (args.protocolID) protocolCalls.push(args.protocolID);
				return { publicKey: PUBLIC_KEY };
			},
		} as unknown as WalletInterface;

		await getDepositAddress(wallet);

		expect(protocolCalls).toEqual([[0, "onesat"]]);
	});
});
