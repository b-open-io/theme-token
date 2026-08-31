import { describe, expect, test } from "bun:test";
import schema from "../../public/v2/schema.json";

describe("Theme Token v2 schema", () => {
	test("publishes the compiler contract at its canonical URL", () => {
		expect(schema.$id).toBe("https://themetoken.dev/v2/schema.json");
		expect(schema.required).toEqual(["$schema", "name", "styles", "assets"]);
		expect(schema.properties.bundle).toBe(false);
		expect(schema.$defs.asset.required).toEqual([
			"role",
			"kind",
			"source",
			"mediaType",
			"integrity",
		]);
	});
});
