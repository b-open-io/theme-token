import { describe, expect, test } from "bun:test";
import type { FeatureFlags } from "./feature-flags";
import { isRouteEnabled, routes } from "./routes";

const enabled: FeatureFlags = {
	theme: true,
	fonts: true,
	images: true,
	icons: true,
	wallpapers: true,
	components: true,
	project: true,
	componentPreview: true,
};

describe("isRouteEnabled", () => {
	test("gates registered feature routes without affecting other routes", () => {
		for (const route of routes) {
			expect(isRouteEnabled(route.path, enabled)).toBe(true);
			if (route.feature) {
				expect(
					isRouteEnabled(route.path, { ...enabled, [route.feature]: false }),
				).toBe(false);
			}
		}

		expect(isRouteEnabled("/not-registered", enabled)).toBe(true);
	});
});
