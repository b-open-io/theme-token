import { convertToModelMessages, streamText, stepCountIs, type UIMessage } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import {
	conversationModel,
	buildSwatchySystemPrompt,
} from "@/lib/agent/config";
import { getAvailableTools } from "@/lib/agent/tools";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { messages }: { messages: UIMessage[] } = body;

		if (!messages || !Array.isArray(messages)) {
			return NextResponse.json(
				{ error: "Messages array is required" },
				{ status: 400 },
			);
		}

		// Build dynamic system prompt and get available tools based on feature flags
		const systemPrompt = buildSwatchySystemPrompt();
		const availableTools = getAvailableTools();

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
