import { describe, expect, test } from "bun:test";
import { fitImageDimensions } from "./image-inspiration";

describe("fitImageDimensions", () => {
	test("keeps an image that already fits", () => {
		expect(fitImageDimensions(1200, 800)).toEqual({
			width: 1200,
			height: 800,
		});
	});

	test("scales landscape and portrait images proportionally", () => {
		expect(fitImageDimensions(4000, 3000)).toEqual({
			width: 1600,
			height: 1200,
		});
		expect(fitImageDimensions(3000, 4000)).toEqual({
			width: 1200,
			height: 1600,
		});
	});

	test("supports a custom maximum and rejects invalid dimensions", () => {
		expect(fitImageDimensions(1000, 500, 500)).toEqual({
			width: 500,
			height: 250,
		});
		expect(() => fitImageDimensions(0, 500)).toThrow();
	});
});
