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

/**
 * POST /api/preview-component
 *
 * Generate an inline HTML preview for a React component.
 * Returns HTML that can be rendered in an iframe.
 */
export async function POST(request: Request) {
	try {
		const body = (await request.json()) as PreviewRequest;
		const { code, componentName: providedName } = body;

		if (!code) {
			return NextResponse.json(
				{ error: "Missing component code" },
				{ status: 400 },
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
