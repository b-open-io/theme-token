import { describe, expect, test } from "bun:test";
import type { ProjectManifest } from "@/lib/project-types";
import { applyOverrides, parseParams } from "./route";

function manifest(): ProjectManifest {
	return {
		$schema: "https://ui.shadcn.com/schema/registry-item.json",
		name: "Legacy Project",
		type: "registry:base",
		extends: "none",
		dependencies: ["shadcn@latest", "lucide-react"],
		registryDependencies: ["utils", "font-inter"],
		cssVars: {
			light: { radius: "1rem" },
			dark: { radius: "1rem" },
		} as ProjectManifest["cssVars"],
		css: {},
		config: {
			style: "vega",
			tailwind: { baseColor: "neutral" },
			iconLibrary: "lucide",
			rtl: false,
			menuColor: "default",
			menuAccent: "subtle",
		},
	};
}

describe("project init overrides", () => {
	test("normalizes old unqualified manifests", () => {
		const legacy = manifest();
		(legacy.config as { menuColor: string }).menuColor = "primary";
		(legacy.config as { menuAccent: string }).menuAccent = "normal";

		const result = applyOverrides(legacy, parseParams(new URLSearchParams()));

		expect(result.config.style).toBe("radix-vega");
		expect(result.config.menuColor).toBe("default");
		expect(result.config.menuAccent).toBe("subtle");
		expect(result.dependencies).toContain("radix-ui");
	});

	test("applies current base, font, radius, menu, and icon overrides", () => {
		const params = parseParams(
			new URLSearchParams({
				base: "base",
				font: "noto-sans",
				fontHeading: "playfair-display",
				radius: "large",
				iconLibrary: "remixicon",
				menuColor: "inverted",
				menuAccent: "bold",
			}),
		);
		const result = applyOverrides(manifest(), params);

		expect(result.config.style).toBe("base-vega");
		expect(result.dependencies).toContain("@base-ui/react");
		expect(result.dependencies).toContain("@remixicon/react");
		expect(result.dependencies).not.toContain("radix-ui");
		expect(result.registryDependencies).toEqual([
			"utils",
			"font-noto-sans",
			"font-heading-playfair-display",
		]);
		expect(result.cssVars.light.radius).toBe("0.875rem");
		expect(result.config.menuColor).toBe("inverted");
		expect(result.config.menuAccent).toBe("bold");
	});
});
