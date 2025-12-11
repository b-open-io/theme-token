/**
 * Code Validation for AI-Generated Components
 *
 * Validates TypeScript/JSX code using quick regex checks and the TypeScript compiler.
 * Used to catch syntax errors before returning generated code to users.
 */

import ts from "typescript";

export interface CodeValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

/** Pattern check with error message */
interface PatternCheck {
	pattern: RegExp;
	message: string;
	type: "error" | "warning";
}

/**
 * Quick regex checks for common AI mistakes
 * These run before the expensive TypeScript compilation
 */
const PATTERN_CHECKS: PatternCheck[] = [
	{
		// import * from "react" - missing "as" keyword
		pattern: /import\s+\*\s+from\s+['"]/,
		message:
			'Invalid import: "import * from" requires "as" keyword (e.g., import * as React from "react")',
		type: "error",
	},
	{
		// Hardcoded hex colors in className (warning only)
		pattern: /className="[^"]*#[0-9a-fA-F]{3,6}/,
		message:
			"Hardcoded hex color in className - should use CSS variables (bg-primary, text-foreground, etc.)",
		type: "warning",
	},
	{
		// Hardcoded rgb/hsl in className
		pattern: /className="[^"]*(?:rgb|hsl)\([^)]+\)/,
		message:
			"Hardcoded rgb/hsl color in className - should use CSS variables",
		type: "warning",
	},
];

/**
 * Run quick pattern checks on code
 */
function runPatternChecks(code: string): {
	errors: string[];
	warnings: string[];
} {
	const errors: string[] = [];
	const warnings: string[] = [];

	for (const check of PATTERN_CHECKS) {
		if (check.pattern.test(code)) {
			if (check.type === "error") {
				errors.push(check.message);
			} else {
				warnings.push(check.message);
			}
		}
	}

	return { errors, warnings };
}

/**
 * Validate code syntax using TypeScript compiler
 * Uses transpileModule for fast syntax-only checking (no type checking)
 */
function validateWithTypeScript(
	code: string,
	filename = "component.tsx",
): { valid: boolean; errors: string[] } {
	try {
		const result = ts.transpileModule(code, {
			compilerOptions: {
				module: ts.ModuleKind.ESNext,
				target: ts.ScriptTarget.ES2022,
				jsx: ts.JsxEmit.React,
				esModuleInterop: true,
				allowSyntheticDefaultImports: true,
				strict: false, // Don't fail on type errors, just syntax
				noEmit: false,
				skipLibCheck: true,
			},
			fileName: filename,
			reportDiagnostics: true,
		});

		// Filter to only syntax errors (category 1)
		const syntaxErrors =
			result.diagnostics
				?.filter((d) => d.category === ts.DiagnosticCategory.Error)
				.map((d) => {
					const message = ts.flattenDiagnosticMessageText(d.messageText, " ");
					if (d.start !== undefined && d.file) {
						const { line, character } = d.file.getLineAndCharacterOfPosition(
							d.start,
						);
						return `Line ${line + 1}:${character + 1}: ${message}`;
					}
					return message;
				}) || [];

		return {
			valid: syntaxErrors.length === 0,
			errors: syntaxErrors,
		};
	} catch (error) {
		// If TypeScript itself throws, report that
		return {
			valid: false,
			errors: [
				`TypeScript compilation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			],
		};
	}
}

/**
 * Validate code for syntax errors and common issues
 *
 * @param code - The TypeScript/JSX code to validate
 * @param filename - Optional filename for error messages (default: component.tsx)
 * @returns Validation result with errors and warnings
 */
export function validateCode(
	code: string,
	filename?: string,
): CodeValidationResult {
	// Run quick pattern checks first
	const patternResult = runPatternChecks(code);

	// If we already have pattern errors, still run TS validation to catch more
	const tsResult = validateWithTypeScript(code, filename);

	// Combine results
	const allErrors = [...patternResult.errors, ...tsResult.errors];

	return {
		valid: allErrors.length === 0,
		errors: allErrors,
		warnings: patternResult.warnings,
	};
}

/**
 * Validate multiple code files and merge results
 *
 * @param files - Array of { content, filename } objects
 * @returns Combined validation result
 */
export function validateMultipleFiles(
	files: Array<{ content: string; filename?: string }>,
): CodeValidationResult {
	const allErrors: string[] = [];
	const allWarnings: string[] = [];

	for (const file of files) {
		const result = validateCode(file.content, file.filename);
		// Prefix errors with filename if multiple files
		if (files.length > 1 && file.filename) {
			allErrors.push(
				...result.errors.map((e) => `[${file.filename}] ${e}`),
			);
			allWarnings.push(
				...result.warnings.map((w) => `[${file.filename}] ${w}`),
			);
		} else {
			allErrors.push(...result.errors);
			allWarnings.push(...result.warnings);
		}
	}

	return {
		valid: allErrors.length === 0,
		errors: allErrors,
		warnings: allWarnings,
	};
}
