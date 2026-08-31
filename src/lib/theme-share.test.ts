import { describe, expect, test } from "bun:test";
import { buildThemeShareText } from "./theme-share";

describe("buildThemeShareText", () => {
	test("puts the preview page before the registry URL so X unfurls its image", () => {
		const previewUrl = "https://themetoken.dev/preview/theme_0";
		const registryUrl = "https://themetoken.dev/r/themes/theme_0.json";
		const text = buildThemeShareText(
			"Nightrider",
			previewUrl,
			`bunx shadcn@latest add ${registryUrl}`,
		);

		expect(text.indexOf(previewUrl)).toBeLessThan(text.indexOf(registryUrl));
		expect(text.match(/https:\/\//g)).toHaveLength(2);
	});
});
