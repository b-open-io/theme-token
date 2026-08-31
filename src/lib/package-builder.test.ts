import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";
import { Inscription } from "@1sat/templates";
import { Script, type WalletInterface } from "@bsv/sdk";
import { bundleItemsToPackage, publishPackage } from "./package-builder";

const PUBLIC_KEY =
	"0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798";

afterEach(() => mock.restore());

describe("publishPackage", () => {
	it("gives Theme Token asset packages a resolvable default file", async () => {
		let outputs: Array<{ lockingScript: string }> = [];
		const wallet = {
			getPublicKey: async () => ({ publicKey: PUBLIC_KEY }),
			createAction: async (args: {
				outputs: Array<{ lockingScript: string }>;
			}) => {
				outputs = args.outputs;
				return { txid: "a".repeat(64) };
			},
		} as unknown as WalletInterface;
		spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));

		await publishPackage(
			wallet,
			[
				{
					path: "dots.svg",
					content: new TextEncoder().encode("<svg />"),
					contentType: "image/svg+xml",
				},
			],
			{
				app: "theme-token",
				type: "theme-token:asset",
				kind: "pattern",
				mediaType: "image/svg+xml",
				name: "dots",
				version: "1.0.0",
				description: "dots",
			},
		);

		const inscription = Inscription.decode(
			Script.fromHex(outputs.at(-1)?.lockingScript ?? ""),
		);
		const manifest = JSON.parse(
			new TextDecoder().decode(inscription?.getContent()),
		);
		expect(manifest).toEqual({ "dots.svg": "_0", ".": "_0" });

		outputs = [];
		await publishPackage(
			wallet,
			[
				{
					path: "theme.json",
					content: new TextEncoder().encode("{}"),
					contentType: "application/json",
				},
			],
			{
				app: "theme-token",
				type: "registry:style",
				name: "theme",
				version: "1.0.0",
				description: "theme",
			},
		);
		const themeManifest = Inscription.decode(
			Script.fromHex(outputs.at(-1)?.lockingScript ?? ""),
		);
		expect(
			JSON.parse(new TextDecoder().decode(themeManifest?.getContent())),
		).toEqual({ "theme.json": "_0" });
	});
});

describe("bundleItemsToPackage", () => {
	it("classifies a raw asset without claiming a ShadCN registry type", () => {
		const { metadata } = bundleItemsToPackage(
			[
				{
					type: "font",
					base64Data: "AA==",
					mimeType: "font/woff2",
					metadata: { registryType: "registry:font" },
				},
			],
			"Display",
			"A font",
		);

		expect(metadata).toMatchObject({
			type: "theme-token:asset",
			kind: "font",
			mediaType: "font/woff2",
		});
	});

	it("preserves registry:base project identity and project.json path", () => {
		const { files, metadata } = bundleItemsToPackage(
			[
				{
					type: "project",
					base64Data: btoa('{"type":"registry:base"}'),
					mimeType: "application/json",
					name: "project.json",
					metadata: {
						registryType: "registry:base",
						displayName: "My Project",
					},
				},
			],
			"My Project",
			"Bundle: My Project",
		);

		expect(files[0]?.path).toBe("project.json");
		expect(metadata.type).toBe("registry:base");
		expect(metadata.name).toBe("My Project");
		expect(metadata.registryType).toBeUndefined();
		expect(metadata.displayName).toBeUndefined();
	});
});
