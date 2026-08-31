import { describe, expect, test } from "bun:test";
import type { ThemeStyleProps, ThemeToken } from "@theme-token/sdk";
import { buildProjectBundle, getProjectDependencies } from "./project-builder";
import {
	BASE_COLORS,
	createProjectManifest,
	ICON_LIBRARIES,
	ICON_LIBRARY_PACKAGES,
	MENU_ACCENTS,
	MENU_COLORS,
	PROJECT_BASES,
	PROJECT_FONTS,
	PROJECT_RADII,
	PROJECT_RADIUS_VALUES,
} from "./project-types";

const mode = (dark = false): ThemeStyleProps => ({
	background: dark ? "black" : "white",
	foreground: dark ? "white" : "black",
	card: dark ? "gray" : "white",
	"card-foreground": dark ? "white" : "black",
	popover: dark ? "gray" : "white",
	"popover-foreground": dark ? "white" : "black",
	primary: "blue",
	"primary-foreground": "white",
	secondary: "gray",
	"secondary-foreground": "black",
	muted: "gray",
	"muted-foreground": "gray",
	accent: "cyan",
	"accent-foreground": "black",
	destructive: "red",
	"destructive-foreground": "white",
	border: "gray",
	input: "gray",
	ring: "blue",
	radius: "1rem",
	"chart-1": dark ? "dark-chart" : "light-chart",
});

const theme: ThemeToken = {
	$schema: "https://themetoken.dev/v1/schema.json",
	name: "Test Theme",
	styles: { light: mode(), dark: mode(true) },
};

const config = {
	base: "base",
	style: "sera",
	tailwind: { baseColor: "taupe" },
	iconLibrary: "phosphor",
	font: "noto-sans",
	fontHeading: "playfair-display",
	radius: "large",
	menuColor: "inverted-translucent",
	menuAccent: "bold",
} as const;

describe("project preset compiler", () => {
	test("compiles authoring choices into a current registry:base manifest", () => {
		const manifest = createProjectManifest(theme, config);

		expect(manifest.name).toBe("Test Theme");
		expect(manifest.cssVars.light.primary).toBe("blue");
		expect(manifest.config).toEqual({
			style: "base-sera",
			tailwind: { baseColor: "taupe" },
			iconLibrary: "phosphor",
			rtl: false,
			menuColor: "inverted-translucent",
			menuAccent: "bold",
		});
		expect(manifest.dependencies).toContain("@base-ui/react");
		expect(manifest.dependencies).toContain("@phosphor-icons/react");
		expect(manifest.dependencies).not.toContain("radix-ui");
		expect(manifest.registryDependencies).toEqual([
			"utils",
			"font-noto-sans",
			"font-heading-playfair-display",
		]);
		expect(manifest.cssVars.light.radius).toBe("0.875rem");
		expect(manifest.cssVars.light["chart-1"]).toBe("light-chart");
		expect(manifest.css["@layer base"]).toEqual({
			"*": { "@apply border-border outline-ring/50": {} },
			body: { "@apply bg-background text-foreground": {} },
		});
	});

	test("serializes UI base and font choices and keeps relative bundled fonts", () => {
		const { manifest } = buildProjectBundle({
			theme,
			config,
			assets: [
				{
					type: "font",
					slot: "sans",
					base64Data: "Zm9udA==",
					mimeType: "font/woff2",
				},
			],
		});

		expect(manifest.config.style).toBe("base-sera");
		expect(manifest.registryDependencies).toEqual([
			"utils",
			"font-heading-playfair-display",
			"_0",
		]);
		expect(getProjectDependencies(config)).toContain("@base-ui/react");
	});

	test("every exposed preset option reaches the generated payload", () => {
		for (const base of PROJECT_BASES) {
			const manifest = createProjectManifest(theme, { base, style: "nova" });
			expect(manifest.config.style).toBe(`${base}-nova`);
		}

		for (const iconLibrary of ICON_LIBRARIES) {
			const manifest = createProjectManifest(theme, { iconLibrary });
			expect(manifest.config.iconLibrary).toBe(iconLibrary);
			for (const dependency of ICON_LIBRARY_PACKAGES[iconLibrary]) {
				expect(manifest.dependencies).toContain(dependency);
			}
		}

		for (const baseColor of BASE_COLORS) {
			const manifest = createProjectManifest(theme, {
				tailwind: { baseColor },
			});
			expect(manifest.config.tailwind.baseColor).toBe(baseColor);
		}

		for (const menuColor of MENU_COLORS) {
			expect(createProjectManifest(theme, { menuColor }).config.menuColor).toBe(
				menuColor,
			);
		}
		for (const menuAccent of MENU_ACCENTS) {
			expect(
				createProjectManifest(theme, { menuAccent }).config.menuAccent,
			).toBe(menuAccent);
		}

		for (const radius of PROJECT_RADII) {
			expect(
				createProjectManifest(theme, { radius }).cssVars.light.radius,
			).toBe(PROJECT_RADIUS_VALUES[radius]);
		}

		for (const font of PROJECT_FONTS) {
			const manifest = createProjectManifest(theme, {
				font,
				fontHeading: font,
			});
			expect(manifest.registryDependencies).toContain(`font-${font}`);
			expect(manifest.registryDependencies).toContain(`font-heading-${font}`);
		}
	});
});
