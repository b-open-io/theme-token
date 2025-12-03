import opentype from "opentype.js";

/**
 * SVG Path Parser for opentype.js
 *
 * Converts SVG path `d` attribute strings into opentype.js Path objects.
 * Handles coordinate system transformation (SVG is top-down, fonts are bottom-up).
 */

interface PathCommand {
	type: string;
	values: number[];
}

/**
 * Parse SVG path data string into individual commands
 */
function parsePathData(d: string): PathCommand[] {
	const commands: PathCommand[] = [];

	// Match command letter followed by numbers (with optional decimals and negatives)
	const regex = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(d)) !== null) {
		const type = match[1];
		const argsString = match[2].trim();

		// Parse numbers from the args string
		const values: number[] = [];
		if (argsString) {
			// Match numbers including negative and decimal
			const numRegex = /-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;
			let numMatch: RegExpExecArray | null;
			while ((numMatch = numRegex.exec(argsString)) !== null) {
				values.push(Number.parseFloat(numMatch[0]));
			}
		}

		commands.push({ type, values });
	}

	return commands;
}

/**
 * Convert SVG path data to opentype.js Path
 *
 * @param d - SVG path data string (d attribute)
 * @param ascender - Font ascender value for Y-axis flip (default 800)
 * @returns opentype.js Path object
 */
export function svgPathToOpentypePath(
	d: string,
	ascender = 800,
): opentype.Path {
	const path = new opentype.Path();
	const commands = parsePathData(d);

	let currentX = 0;
	let currentY = 0;
	let startX = 0;
	let startY = 0;

	// For smooth curve continuations
	let lastControlX = 0;
	let lastControlY = 0;
	let lastCommand = "";

	// Helper to flip Y coordinate (SVG top-down to font bottom-up)
	const flipY = (y: number) => ascender - y;

	for (const cmd of commands) {
		const { type, values } = cmd;
		const isRelative = type === type.toLowerCase();

		switch (type.toUpperCase()) {
			case "M": {
				// MoveTo
				let i = 0;
				while (i < values.length) {
					let x = values[i];
					let y = values[i + 1];

					if (isRelative && i > 0) {
						x += currentX;
						y += currentY;
					} else if (isRelative && i === 0) {
						x += currentX;
						y += currentY;
					}

					if (i === 0) {
						path.moveTo(x, flipY(y));
						startX = x;
						startY = y;
					} else {
						// Subsequent pairs are implicit LineTo
						path.lineTo(x, flipY(y));
					}

					currentX = x;
					currentY = y;
					i += 2;
				}
				break;
			}

			case "L": {
				// LineTo
				for (let i = 0; i < values.length; i += 2) {
					let x = values[i];
					let y = values[i + 1];

					if (isRelative) {
						x += currentX;
						y += currentY;
					}

					path.lineTo(x, flipY(y));
					currentX = x;
					currentY = y;
				}
				break;
			}

			case "H": {
				// Horizontal LineTo
				for (const val of values) {
					const x = isRelative ? currentX + val : val;
					path.lineTo(x, flipY(currentY));
					currentX = x;
				}
				break;
			}

			case "V": {
				// Vertical LineTo
				for (const val of values) {
					const y = isRelative ? currentY + val : val;
					path.lineTo(currentX, flipY(y));
					currentY = y;
				}
				break;
			}

			case "C": {
				// Cubic Bezier
				for (let i = 0; i < values.length; i += 6) {
					let x1 = values[i];
					let y1 = values[i + 1];
					let x2 = values[i + 2];
					let y2 = values[i + 3];
					let x = values[i + 4];
					let y = values[i + 5];

					if (isRelative) {
						x1 += currentX;
						y1 += currentY;
						x2 += currentX;
						y2 += currentY;
						x += currentX;
						y += currentY;
					}

					path.bezierCurveTo(x1, flipY(y1), x2, flipY(y2), x, flipY(y));

					lastControlX = x2;
					lastControlY = y2;
					currentX = x;
					currentY = y;
				}
				break;
			}

			case "S": {
				// Smooth Cubic Bezier
				for (let i = 0; i < values.length; i += 4) {
					// First control point is reflection of last control point
					let x1: number;
					let y1: number;

					if (lastCommand === "C" || lastCommand === "S") {
						x1 = 2 * currentX - lastControlX;
						y1 = 2 * currentY - lastControlY;
					} else {
						x1 = currentX;
						y1 = currentY;
					}

					let x2 = values[i];
					let y2 = values[i + 1];
					let x = values[i + 2];
					let y = values[i + 3];

					if (isRelative) {
						x2 += currentX;
						y2 += currentY;
						x += currentX;
						y += currentY;
					}

					path.bezierCurveTo(x1, flipY(y1), x2, flipY(y2), x, flipY(y));

					lastControlX = x2;
					lastControlY = y2;
					currentX = x;
					currentY = y;
				}
				break;
			}

			case "Q": {
				// Quadratic Bezier
				for (let i = 0; i < values.length; i += 4) {
					let x1 = values[i];
					let y1 = values[i + 1];
					let x = values[i + 2];
					let y = values[i + 3];

					if (isRelative) {
						x1 += currentX;
						y1 += currentY;
						x += currentX;
						y += currentY;
					}

					path.quadraticCurveTo(x1, flipY(y1), x, flipY(y));

					lastControlX = x1;
					lastControlY = y1;
					currentX = x;
					currentY = y;
				}
				break;
			}

			case "T": {
				// Smooth Quadratic Bezier
				for (let i = 0; i < values.length; i += 2) {
					// Control point is reflection of last control point
					let x1: number;
					let y1: number;

					if (lastCommand === "Q" || lastCommand === "T") {
						x1 = 2 * currentX - lastControlX;
						y1 = 2 * currentY - lastControlY;
					} else {
						x1 = currentX;
						y1 = currentY;
					}

					let x = values[i];
					let y = values[i + 1];

					if (isRelative) {
						x += currentX;
						y += currentY;
					}

					path.quadraticCurveTo(x1, flipY(y1), x, flipY(y));

					lastControlX = x1;
					lastControlY = y1;
					currentX = x;
					currentY = y;
				}
				break;
			}

			case "A": {
				// Arc - convert to cubic bezier approximation
				// This is complex, for now we'll approximate with line
				// TODO: Implement proper arc-to-bezier conversion
				for (let i = 0; i < values.length; i += 7) {
					let x = values[i + 5];
					let y = values[i + 6];

					if (isRelative) {
						x += currentX;
						y += currentY;
					}

					// Simplified: just draw a line to the endpoint
					path.lineTo(x, flipY(y));
					currentX = x;
					currentY = y;
				}
				break;
			}

			case "Z": {
				// ClosePath
				path.closePath();
				currentX = startX;
				currentY = startY;
				break;
			}
		}

		lastCommand = type.toUpperCase();
	}

	return path;
}

/**
 * Calculate bounding box of an SVG path
 */
export function getPathBounds(d: string): {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	width: number;
	height: number;
} {
	const commands = parsePathData(d);

	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;

	let currentX = 0;
	let currentY = 0;

	const updateBounds = (x: number, y: number) => {
		minX = Math.min(minX, x);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x);
		maxY = Math.max(maxY, y);
	};

	for (const cmd of commands) {
		const { type, values } = cmd;
		const isRelative = type === type.toLowerCase();

		switch (type.toUpperCase()) {
			case "M":
			case "L": {
				for (let i = 0; i < values.length; i += 2) {
					let x = values[i];
					let y = values[i + 1];
					if (isRelative) {
						x += currentX;
						y += currentY;
					}
					updateBounds(x, y);
					currentX = x;
					currentY = y;
				}
				break;
			}

			case "H": {
				for (const val of values) {
					const x = isRelative ? currentX + val : val;
					updateBounds(x, currentY);
					currentX = x;
				}
				break;
			}

			case "V": {
				for (const val of values) {
					const y = isRelative ? currentY + val : val;
					updateBounds(currentX, y);
					currentY = y;
				}
				break;
			}

			case "C": {
				for (let i = 0; i < values.length; i += 6) {
					let x1 = values[i];
					let y1 = values[i + 1];
					let x2 = values[i + 2];
					let y2 = values[i + 3];
					let x = values[i + 4];
					let y = values[i + 5];

					if (isRelative) {
						x1 += currentX;
						y1 += currentY;
						x2 += currentX;
						y2 += currentY;
						x += currentX;
						y += currentY;
					}

					updateBounds(x1, y1);
					updateBounds(x2, y2);
					updateBounds(x, y);
					currentX = x;
					currentY = y;
				}
				break;
			}

			case "Q": {
				for (let i = 0; i < values.length; i += 4) {
					let x1 = values[i];
					let y1 = values[i + 1];
					let x = values[i + 2];
					let y = values[i + 3];

					if (isRelative) {
						x1 += currentX;
						y1 += currentY;
						x += currentX;
						y += currentY;
					}

					updateBounds(x1, y1);
					updateBounds(x, y);
					currentX = x;
					currentY = y;
				}
				break;
			}

			case "S": {
				for (let i = 0; i < values.length; i += 4) {
					let x2 = values[i];
					let y2 = values[i + 1];
					let x = values[i + 2];
					let y = values[i + 3];

					if (isRelative) {
						x2 += currentX;
						y2 += currentY;
						x += currentX;
						y += currentY;
					}

					updateBounds(x2, y2);
					updateBounds(x, y);
					currentX = x;
					currentY = y;
				}
				break;
			}

			case "T": {
				for (let i = 0; i < values.length; i += 2) {
					let x = values[i];
					let y = values[i + 1];

					if (isRelative) {
						x += currentX;
						y += currentY;
					}

					updateBounds(x, y);
					currentX = x;
					currentY = y;
				}
				break;
			}

			case "A": {
				for (let i = 0; i < values.length; i += 7) {
					let x = values[i + 5];
					let y = values[i + 6];

					if (isRelative) {
						x += currentX;
						y += currentY;
					}

					updateBounds(x, y);
					currentX = x;
					currentY = y;
				}
				break;
			}
		}
	}

	return {
		minX: minX === Number.POSITIVE_INFINITY ? 0 : minX,
		minY: minY === Number.POSITIVE_INFINITY ? 0 : minY,
		maxX: maxX === Number.NEGATIVE_INFINITY ? 0 : maxX,
		maxY: maxY === Number.NEGATIVE_INFINITY ? 0 : maxY,
		width:
			maxX === Number.NEGATIVE_INFINITY ? 0 : maxX - (minX === Number.POSITIVE_INFINITY ? 0 : minX),
		height:
			maxY === Number.NEGATIVE_INFINITY ? 0 : maxY - (minY === Number.POSITIVE_INFINITY ? 0 : minY),
	};
}
