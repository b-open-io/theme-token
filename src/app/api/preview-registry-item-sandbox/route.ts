import { NextResponse } from "next/server";
import { extractComponentName } from "@/lib/sandbox";
import { createSandboxPreview } from "@/lib/sandbox-preview";

export const runtime = "nodejs";
export const maxDuration = 60;

type PreviewFile = { path: string; content: string };

interface PreviewRequest {
	files: PreviewFile[];
	mainFilePath?: string;
	componentName?: string;
}

function pickMainFilePath(files: PreviewFile[], provided?: string): string {
	if (provided) return provided;
	const candidate =
		files.find((f) => f.path.endsWith(".tsx") || f.path.endsWith(".jsx")) ??
		files.find((f) => f.path.endsWith(".ts") || f.path.endsWith(".js")) ??
		files[0];
	if (!candidate) throw new Error("No files provided");
	return candidate.path;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as PreviewRequest;
		const files = Array.isArray(body.files) ? body.files : [];
		if (files.length === 0) {
			return NextResponse.json({ error: "Missing files" }, { status: 400 });
		}

		const mainFilePath = pickMainFilePath(files, body.mainFilePath);
		const mainFile = files.find((f) => f.path === mainFilePath);
		const componentName =
			body.componentName || (mainFile ? extractComponentName(mainFile.content) : null) || undefined;

		const result = await createSandboxPreview({
			files,
			mainFilePath,
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
			mainFilePath,
		});
	} catch (error) {
		console.error("[preview-registry-item-sandbox] Error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to generate sandbox preview" },
			{ status: 500 },
		);
	}
}

