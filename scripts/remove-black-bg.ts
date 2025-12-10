#!/usr/bin/env bun
/**
 * Remove black background from an image
 * Usage: bun scripts/remove-black-bg.ts <input-image> <output-png> [threshold]
 *
 * Pixels with RGB values all below threshold become transparent.
 * Default threshold is 15 (very dark colors only).
 */

import sharp from "sharp";

async function removeBlackBackground(
	inputPath: string,
	outputPath: string,
	threshold = 15
) {
	const input = sharp(inputPath);
	const meta = await input.metadata();
	const width = meta.width!;
	const height = meta.height!;

	// Get raw RGBA buffer
	const buffer = await input.ensureAlpha().raw().toBuffer();

	// Process pixels - make black/near-black pixels transparent
	for (let i = 0; i < width * height; i++) {
		const r = buffer[i * 4];
		const g = buffer[i * 4 + 1];
		const b = buffer[i * 4 + 2];

		// If all RGB values are below threshold, make transparent
		if (r <= threshold && g <= threshold && b <= threshold) {
			buffer[i * 4 + 3] = 0; // Set alpha to 0
		}
	}

	// Save as PNG
	await sharp(buffer, {
		raw: { width, height, channels: 4 },
	})
		.png()
		.toFile(outputPath);

	console.log(`Created transparent PNG: ${outputPath}`);
}

// CLI
const [inputPath, outputPath, thresholdStr] = process.argv.slice(2);
const threshold = thresholdStr ? Number.parseInt(thresholdStr, 10) : 15;

if (!inputPath || !outputPath) {
	console.error(
		"Usage: bun scripts/remove-black-bg.ts <input> <output.png> [threshold]"
	);
	process.exit(1);
}

removeBlackBackground(inputPath, outputPath, threshold).catch((err) => {
	console.error("Error:", err);
	process.exit(1);
});
