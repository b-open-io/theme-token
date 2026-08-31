import { describe, expect, it } from "bun:test";
import { bundleItemsToPackage } from "./package-builder";

describe("bundleItemsToPackage", () => {
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
