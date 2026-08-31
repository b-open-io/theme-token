import { describe, expect, test } from "bun:test";
import { Utils } from "@bsv/sdk";
import { buildRegistryBundle } from "./bundle-builder";

const decode = (value: string) => Utils.toUTF8(Utils.toArray(value, "base64"));

describe("buildRegistryBundle", () => {
	test("places the manifest first and points it at the following files", () => {
		const result = buildRegistryBundle({
			author: "alice",
			manifest: {
				name: "hello",
				type: "registry:component",
				description: "A component",
				dependencies: [],
				registryDependencies: ["button"],
				files: [
					{
						path: "components/hello.tsx",
						type: "registry:component",
						content: "export const hello = '👋'",
					},
				],
			},
		});

		expect(result.manifestWithRefs.files).toEqual([
			{
				path: "components/hello.tsx",
				type: "registry:component",
				vout: 1,
			},
		]);
		expect(JSON.parse(decode(result.items[0].base64Data))).toEqual(
			result.manifestWithRefs,
		);
		expect(decode(result.items[1].base64Data)).toBe(
			"export const hello = '👋'",
		);
		expect(result.items.map(({ type }) => type)).toEqual(["component", "file"]);
	});
});
