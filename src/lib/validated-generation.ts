/**
 * Validated Code Generation
 *
 * Wrapper for AI code generation that validates output and retries
 * with error feedback if validation fails.
 */

import { generateText, Output } from "ai";
import type { z } from "zod";
import { AI_MODELS } from "./ai-models";
import {
	type CodeValidationResult,
	validateCode,
	validateMultipleFiles,
} from "./code-validation";

/** Configuration for validated generation */
export interface ValidatedGenerationConfig<T> {
	/** Zod schema for the generated object */
	schema: z.ZodSchema<T>;
	/** System prompt for the AI model */
	systemPrompt: string;
	/** User prompt describing what to generate */
	userPrompt: string;
	/** Function to extract code string(s) from the generated object */
	codeExtractor: (
		result: T,
	) => string | Array<{ content: string; filename?: string }>;
	/** Maximum retry attempts (default: 3) */
	maxRetries?: number;
	/** Model ID to use */
	model?: string;
}

/** Result from validated generation */
export interface ValidatedGenerationResult<T> {
	/** Whether generation succeeded with valid code */
	success: boolean;
	/** The generated object (if successful) */
	data?: T;
	/** Validation result from the last attempt */
	validation: CodeValidationResult;
	/** Number of attempts made */
	attempts: number;
	/** Last error message (if failed) */
	lastError?: string;
}

/**
 * Generate code with validation and automatic retry
 *
 * 1. Calls generateText with a schema-validated object output
 * 2. Extracts code and validates it
 * 3. If invalid, retries with error feedback in the prompt
 * 4. Returns after success or max retries
 */
export async function generateWithValidation<T>(
	config: ValidatedGenerationConfig<T>,
): Promise<ValidatedGenerationResult<T>> {
	const {
		schema,
		systemPrompt,
		userPrompt,
		codeExtractor,
		maxRetries = 3,
		model = AI_MODELS.code,
	} = config;

	let attempts = 0;
	let lastValidation: CodeValidationResult = {
		valid: false,
		errors: [],
		warnings: [],
	};
	let lastError: string | undefined;

	while (attempts < maxRetries) {
		attempts++;

		// Build prompt - include previous errors on retry
		let enhancedPrompt = userPrompt;
		if (attempts > 1 && lastValidation.errors.length > 0) {
			const errorList = lastValidation.errors
				.map((e, i) => `${i + 1}. ${e}`)
				.join("\n");

			enhancedPrompt = `${userPrompt}

IMPORTANT - YOUR PREVIOUS ATTEMPT HAD SYNTAX ERRORS. YOU MUST FIX THESE:
${errorList}

Please regenerate the code with these errors fixed. Pay careful attention to:
- Import syntax: Use "import * as X from" NOT "import * from"
- Proper JSX syntax
- Valid TypeScript syntax`;
		}

		try {
			console.log(
				`[ValidatedGen] Attempt ${attempts}/${maxRetries}${attempts > 1 ? " (retry)" : ""}`,
			);

			const { output: object } = await generateText({
				model,
				reasoning: "high",
				output: Output.object({ schema }),
				system: systemPrompt,
				prompt: enhancedPrompt,
			});

			// Extract code from the result
			const extracted = codeExtractor(object);

			// Validate - handle both single string and array of files
			if (typeof extracted === "string") {
				lastValidation = validateCode(extracted);
			} else {
				lastValidation = validateMultipleFiles(extracted);
			}

			if (lastValidation.valid) {
				console.log(
					`[ValidatedGen] Success after ${attempts} attempt(s)`,
					lastValidation.warnings.length > 0
						? `with ${lastValidation.warnings.length} warning(s)`
						: "",
				);
				return {
					success: true,
					data: object,
					validation: lastValidation,
					attempts,
				};
			}

			// Validation failed - will retry if attempts remain
			console.log(
				`[ValidatedGen] Attempt ${attempts} failed validation:`,
				lastValidation.errors,
			);
		} catch (error) {
			lastError = error instanceof Error ? error.message : "Unknown error";
			console.error(`[ValidatedGen] Attempt ${attempts} threw:`, lastError);

			// On generation error, set validation to reflect the error
			lastValidation = {
				valid: false,
				errors: [`Generation error: ${lastError}`],
				warnings: [],
			};
		}
	}

	// All retries exhausted
	console.error(
		`[ValidatedGen] Failed after ${attempts} attempts:`,
		lastValidation.errors,
	);
	return {
		success: false,
		validation: lastValidation,
		attempts,
		lastError,
	};
}
