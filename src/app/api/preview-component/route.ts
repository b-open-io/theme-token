import { NextResponse } from "next/server";
import {
	createInlinePreviewHtml,
	extractComponentName,
} from "@/lib/sandbox";

export const runtime = "edge";

interface PreviewRequest {
	/** Component source code */
	code: string;
	/** Optional component name (extracted from code if not provided) */
	componentName?: string;
}

function sanitizeCodeForPreview(code: string): string {
	// Strip ANSI escape sequences and other control chars that sometimes sneak into LLM output.
	// Keep \n \r \t for formatting.
	return code
		.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "")
		.replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, "");
}

function containsModuleSyntax(code: string): boolean {
	// Inline preview executes code via `new Function(...)` and cannot support ESM imports/exports.
	return /(^|\n)\s*import\s/m.test(code) || /(^|\n)\s*export\s/m.test(code);
}

/**
 * POST /api/preview-component
 *
 * Generate an inline HTML preview for a React component.
 * Returns HTML that can be rendered in an iframe.
 */
export async function POST(request: Request) {
	try {
		const body = (await request.json()) as PreviewRequest;
		const { code: rawCode, componentName: providedName } = body;

		if (!rawCode) {
			return NextResponse.json(
				{ error: "Missing component code" },
				{ status: 400 },
			);
		}

		const code = sanitizeCodeForPreview(rawCode);

		// Inline preview does not support module syntax; use the sandbox preview route instead.
		if (containsModuleSyntax(code)) {
			return NextResponse.json(
				{
					error:
						"Inline preview does not support ES module imports/exports. Use sandbox preview.",
				},
				{ status: 422 },
			);
		}

		// Extract or use provided component name
		const componentName = providedName || extractComponentName(code);

		if (!componentName) {
			return NextResponse.json(
				{ error: "Could not determine component name. Please provide componentName." },
				{ status: 400 },
			);
		}

		// Generate the preview HTML
		const html = createInlinePreviewHtml(code, componentName);

		return NextResponse.json({
			success: true,
			html,
			componentName,
		});
	} catch (error) {
		console.error("[preview-component] Error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to generate preview",
			},
			{ status: 500 },
		);
	}
}
