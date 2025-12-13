import { NextResponse } from "next/server";
import { extractComponentName } from "@/lib/sandbox";
import { createSandboxPreview } from "@/lib/sandbox-preview";

export const runtime = "nodejs";
export const maxDuration = 60;

interface PreviewRequest {
	code: string;
	componentName?: string;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as PreviewRequest;
		const { code: rawCode, componentName: providedName } = body;

		if (!rawCode) {
			return NextResponse.json({ error: "Missing component code" }, { status: 400 });
		}

		const componentName = providedName || extractComponentName(rawCode) || undefined;

		const result = await createSandboxPreview({
			files: [{ path: "Component.tsx", content: rawCode }],
			mainFilePath: "Component.tsx",
			componentNameHint: componentName,
		});

		if (!result.success) {
			return NextResponse.json(
				{ error: result.error || "Failed to generate sandbox preview" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			url: result.url,
			componentName,
		});
	} catch (error) {
		console.error("[preview-component-sandbox] Error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to generate sandbox preview" },
			{ status: 500 },
		);
	}
}

