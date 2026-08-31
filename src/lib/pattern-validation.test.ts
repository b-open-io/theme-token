import { describe, expect, test } from "bun:test";
import { generateGrid } from "./pattern-generators";
import { generateGeoPattern } from "./pattern-sources/geopattern-adapter";
import { generateHeroPattern } from "./pattern-sources/heropattern-adapter";
import {
	extractPatternMeta,
	isValidPattern,
	sanitizeSvg,
	validatePatternSvg,
} from "./pattern-validation";

const SVG_START = '<svg xmlns="http://www.w3.org/2000/svg">';

describe("pattern SVG validation", () => {
	test("accepts every kind of SVG emitted by the dormant studio", () => {
		const generated = [
			generateGeoPattern({ seed: "validator-test" }).svg,
			generateHeroPattern({ pattern: "topography" }).svg,
			generateGrid({}).svg,
		];

		for (const svg of generated) {
			expect(validatePatternSvg(svg).errors).toEqual([]);
			expect(isValidPattern(svg)).toBe(true);
		}
	});

	test("rejects active content, remote references, and unsafe XML", () => {
		const unsafe = `${SVG_START}
			<script>alert(1)</script>
			<rect ev:onbegin="alert(1)" fill="url(https://evil.test/a.svg)"/>
		</svg>`;
		const xmlEntity = `<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
			${SVG_START}<text>&xxe;</text></svg>`;

		expect(validatePatternSvg(unsafe).errors).toEqual(
			expect.arrayContaining([
				"Unsafe element <script> detected",
				"Unsafe event handler attribute detected",
				"External URL references not allowed",
			]),
		);
		expect(validatePatternSvg(xmlEntity).errors).toEqual(
			expect.arrayContaining([
				"Unsafe XML declaration detected",
				"Unknown XML entity detected",
			]),
		);
		expect(() => sanitizeSvg(xmlEntity)).toThrow(/Unknown XML entity/);
	});

	test("sanitizes unsafe content, preserves local paint references, and revalidates", () => {
		const unsafe = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:s="http://www.w3.org/2000/svg">
			<defs><pattern id="p" width="10" height="10" patternUnits="userSpaceOnUse">
				<s:script>alert(1)</s:script>
				<image href="data:image/svg+xml,bad"/>
				<rect s:onbegin="alert(1)" fill="url(https://evil.test/a.svg)"/>
				<circle fill="url(#paint)"/>
			</pattern></defs>
		</svg>`;
		const cleaned = sanitizeSvg(unsafe);

		expect(validatePatternSvg(cleaned).valid).toBe(true);
		expect(cleaned).not.toMatch(/script|onbegin|href|evil\.test/i);
		expect(cleaned).toContain('fill="none"');
		expect(cleaned).toContain('fill="url(#paint)"');
		expect(() => sanitizeSvg("not an svg")).toThrow(/Sanitized SVG is invalid/);
	});

	test("measures the UTF-8 bytes used for inscription limits and metadata", () => {
		const svg = `${SVG_START}<text>${"😀".repeat(25_000)}</text></svg>`;
		const expectedBytes = new TextEncoder().encode(svg).byteLength;

		expect(svg.length).toBeLessThan(100_000);
		expect(expectedBytes).toBeGreaterThan(100_000);
		expect(validatePatternSvg(svg).errors).toContain(
			`SVG exceeds 100000 byte limit (${expectedBytes} bytes)`,
		);
		expect(extractPatternMeta(svg).byteSize).toBe(expectedBytes);
	});
});
