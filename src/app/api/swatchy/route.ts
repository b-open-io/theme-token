import { convertToModelMessages, streamText, stepCountIs, type UIMessage } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import {
	conversationModel,
	buildSwatchySystemPrompt,
	type SwatchyContext,
} from "@/lib/agent/config";
import { getPageAwareTools } from "@/lib/agent/tools";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { messages, context }: { messages: UIMessage[]; context?: SwatchyContext } = body;

		if (!messages || !Array.isArray(messages)) {
			return NextResponse.json(
				{ error: "Messages array is required" },
				{ status: 400 },
			);
		}

		// Build dynamic system prompt with context
		const systemPrompt = buildSwatchySystemPrompt(context);

		// Get tools filtered by current page context
		// This ensures studio-specific tools only appear when on that studio page
		const currentPage = context?.currentPage || "/";
		const availableTools = getPageAwareTools(currentPage);

		// Use streaming text generation with tools
		// The model string format "provider/model" is used by Vercel AI Gateway
		const result = streamText({
			model: conversationModel as Parameters<typeof streamText>[0]["model"],
			system: systemPrompt,
			messages: convertToModelMessages(messages),
			tools: availableTools,
			toolChoice: "auto",
			// Allow multi-step tool calling - Swatchy can chain actions (navigate then generate, etc)
			stopWhen: stepCountIs(5),
		});

		return result.toUIMessageStreamResponse();
	} catch (error) {
		console.error("[Swatchy API Error]", error);
		return NextResponse.json(
			{ error: "Failed to process chat request" },
			{ status: 500 },
		);
	}
}
