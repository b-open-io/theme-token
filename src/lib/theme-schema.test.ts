import { describe, expect, test } from "bun:test";
import schema from "../../public/v1/schema.json";

describe("Theme Token schema", () => {
	test("keeps assets optional in the existing document format", () => {
		expect(schema.$id).toBe("https://themetoken.dev/v1/schema.json");
		expect(schema.required).toEqual(["$schema", "name", "styles"]);
		expect(schema.properties.assets.items.$ref).toBe("#/$defs/asset");
		expect(schema.properties.assets.maxItems).toBe(16);
		expect(schema.$defs.asset.required).toEqual([
			"role",
			"kind",
			"source",
			"mediaType",
			"integrity",
		]);
		expect(schema.$defs.asset.properties.kind.enum).toEqual([
			"font",
			"pattern",
			"wallpaper",
		]);
	});

	test("keeps asset paths aligned with runtime validation", () => {
		const path = new RegExp(schema.$defs.path.pattern);
		expect(path.test("fonts/display.woff2")).toBe(true);
		for (const invalid of [
			"/asset.svg",
			"../asset.svg",
			"%2e%2e/asset.svg",
			"a//b",
			"a\\b",
			"a?b",
			"a#b",
			"a\u0000b",
		]) {
			expect(path.test(invalid)).toBe(false);
		}
		expect(
			schema.$defs.asset.properties.source.oneOf[0].properties.vout.maximum,
		).toBe(Number.MAX_SAFE_INTEGER);
	});
});
