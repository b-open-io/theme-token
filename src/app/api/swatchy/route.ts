import {
	convertToModelMessages,
	stepCountIs,
	streamText,
	type UIMessage,
} from "ai";
import { type NextRequest, NextResponse } from "next/server";
import {
	buildSwatchySystemPrompt,
	conversationModel,
	type SwatchyContext,
} from "@/lib/agent/config";
import { getPageAwareTools } from "@/lib/agent/tools";
import { getFeatureFlags } from "@/lib/flags";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			messages,
			context,
		}: { messages: UIMessage[]; context?: SwatchyContext } = body;

		if (!messages || !Array.isArray(messages)) {
			return NextResponse.json(
				{ error: "Messages array is required" },
				{ status: 400 },
			);
		}

		// Resolve feature flags (Vercel platform) for this request
		const flags = await getFeatureFlags();

		// Build dynamic system prompt with context
		const systemPrompt = buildSwatchySystemPrompt(flags, context);

		// Get tools filtered by current page context
		// This ensures studio-specific tools only appear when on that studio page
		const currentPage = context?.currentPage || "/";
		const availableTools = getPageAwareTools(currentPage, flags);

		// Use streaming text generation with tools
		// The model string format "provider/model" is used by Vercel AI Gateway
		const result = streamText({
			model: conversationModel as Parameters<typeof streamText>[0]["model"],
			system: systemPrompt,
			messages: await convertToModelMessages(messages),
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
