#!/usr/bin/env bun
/**
 * Apply a mask to an image to create a transparent PNG
 * Usage: bun scripts/apply-mask.ts <input-image> <mask-image> <output-png>
 *
 * The mask should be grayscale where:
 * - White (255) = fully opaque (keep)
 * - Black (0) = fully transparent (remove)
 */

import sharp from "sharp";

async function applyMask(
	inputPath: string,
	maskPath: string,
	outputPath: string,
	invert = false
) {
	// Load the input image
	const input = sharp(inputPath);
	const inputMeta = await input.metadata();

	// Load and resize mask to match input dimensions
	// Use nearest-neighbor for sharp edges (no anti-aliasing blur)
	let maskPipeline = sharp(maskPath)
		.resize(inputMeta.width, inputMeta.height, {
			fit: "fill",
			kernel: "nearest",
		})
		.grayscale();

	if (invert) {
		maskPipeline = maskPipeline.negate();
	}

	const mask = await maskPipeline.raw().toBuffer();

	// Get the input as raw RGBA
	const inputBuffer = await input
		.ensureAlpha()
		.raw()
		.toBuffer();

	// Apply mask as alpha channel
	const width = inputMeta.width!;
	const height = inputMeta.height!;
	const outputBuffer = Buffer.alloc(width * height * 4);

	for (let i = 0; i < width * height; i++) {
		// Copy RGB from input
		outputBuffer[i * 4] = inputBuffer[i * 4];     // R
		outputBuffer[i * 4 + 1] = inputBuffer[i * 4 + 1]; // G
		outputBuffer[i * 4 + 2] = inputBuffer[i * 4 + 2]; // B
		// Use mask value as alpha
		outputBuffer[i * 4 + 3] = mask[i];
	}

	// Save as PNG with transparency
	await sharp(outputBuffer, {
		raw: {
			width,
			height,
			channels: 4,
		},
	})
		.png()
		.toFile(outputPath);

	console.log(`Created transparent PNG: ${outputPath}`);
}

// CLI usage
const args = process.argv.slice(2);
const invertFlag = args.includes("--invert");
const paths = args.filter((a) => !a.startsWith("--"));
const [inputPath, maskPath, outputPath] = paths;

if (!inputPath || !maskPath || !outputPath) {
	console.error(
		"Usage: bun scripts/apply-mask.ts <input> <mask> <output.png> [--invert]"
	);
	process.exit(1);
}

applyMask(inputPath, maskPath, outputPath, invertFlag).catch((err) => {
	console.error("Error:", err);
	process.exit(1);
});
