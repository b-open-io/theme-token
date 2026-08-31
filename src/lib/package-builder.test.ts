import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";
import { Inscription } from "@1sat/templates";
import { Script, type WalletInterface } from "@bsv/sdk";
import { buildRegistryBundle } from "./bundle-builder";
import { bundleItemsToPackage, publishPackage } from "./package-builder";

const PUBLIC_KEY =
	"0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798";

afterEach(() => mock.restore());

describe("publishPackage", () => {
	it("gives Theme Token asset packages a resolvable default file", async () => {
		let outputs: Array<{ lockingScript: string; tags?: string[] }> = [];
		const wallet = {
			getPublicKey: async () => ({ publicKey: PUBLIC_KEY }),
			createAction: async (args: {
				outputs: Array<{ lockingScript: string; tags?: string[] }>;
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
				type: "registry:asset",
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
		expect(outputs.at(-1)?.tags).toEqual(
			expect.arrayContaining(["origin", "type:ord-fs/json", "app:theme-token"]),
		);
		expect(
			outputs.at(-1)?.tags?.some((tag) => /^id:[0-9a-f]+_1$/.test(tag)),
		).toBe(true);

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
				type: "registry:theme",
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

	it("routes block and component package roots to their registry manifests", async () => {
		let outputs: Array<{ lockingScript: string }> = [];
		const wallet = {
			getPublicKey: async () => ({ publicKey: PUBLIC_KEY }),
			createAction: async (args: {
				outputs: Array<{ lockingScript: string }>;
			}) => {
				outputs = args.outputs;
				return { txid: "b".repeat(64) };
			},
		} as unknown as WalletInterface;
		spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));

		for (const type of ["registry:block", "registry:component"] as const) {
			outputs = [];
			const bundle = buildRegistryBundle({
				manifest: {
					name: "hello",
					type,
					description: "A registry item",
					dependencies: [],
					registryDependencies: [],
					files: [
						{
							path: "components/hello.tsx",
							type: "registry:component",
							content: "export const hello = true",
						},
					],
				},
			});
			const packageData = bundleItemsToPackage(
				bundle.items,
				"hello",
				"A registry item",
			);

			await publishPackage(wallet, packageData.files, packageData.metadata);

			const root = Inscription.decode(
				Script.fromHex(outputs.at(-1)?.lockingScript ?? ""),
			);
			const directory = JSON.parse(
				new TextDecoder().decode(root?.getContent()),
			) as Record<string, string>;
			expect(directory["."]).toBe("_0");

			const defaultVout = Number(directory["."].slice(1));
			const defaultFile = Inscription.decode(
				Script.fromHex(outputs[defaultVout]?.lockingScript ?? ""),
			);
			expect(
				JSON.parse(new TextDecoder().decode(defaultFile?.getContent())),
			).toEqual(bundle.manifestWithRefs);
		}
	});
});

describe("bundleItemsToPackage", () => {
	it("does not let bundle metadata republish legacy or unknown types", () => {
		expect(() =>
			bundleItemsToPackage(
				[
					{
						type: "file",
						base64Data: "AA==",
						mimeType: "application/octet-stream",
						metadata: { registryType: "theme-token:asset" },
					},
				],
				"Legacy",
				"Legacy type",
			),
		).toThrow("Unsupported registry package type: theme-token:asset");

		expect(() =>
			bundleItemsToPackage(
				[
					{
						type: "file",
						base64Data: "AA==",
						mimeType: "application/octet-stream",
						metadata: { registryType: "registry:style" },
					},
				],
				"Legacy theme",
				"Legacy theme type",
			),
		).toThrow("Unsupported registry package type: registry:style");

		expect(() =>
			bundleItemsToPackage(
				[
					{
						type: "file",
						base64Data: "AA==",
						mimeType: "application/octet-stream",
						metadata: { registryType: "registry:made-up" },
					},
				],
				"Unknown",
				"Unknown type",
			),
		).toThrow("Unsupported registry package type: registry:made-up");
	});

	it("keeps theme publishing canonical despite a legacy metadata hint", () => {
		const { metadata } = bundleItemsToPackage(
			[
				{
					type: "theme",
					base64Data: btoa("{}"),
					mimeType: "application/json",
					metadata: { registryType: "registry:style" },
				},
			],
			"Theme",
			"Canonical theme",
		);

		expect(metadata.type).toBe("registry:theme");
	});

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
			type: "registry:asset",
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
