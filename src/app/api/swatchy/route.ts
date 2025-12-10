import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import {
	conversationModel,
	SWATCHY_SYSTEM_PROMPT,
} from "@/lib/agent/config";
import { allTools } from "@/lib/agent/tools";

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

		// Use streaming text generation with tools
		// The model string format "provider/model" is used by Vercel AI Gateway
		const result = streamText({
			model: conversationModel as Parameters<typeof streamText>[0]["model"],
			system: SWATCHY_SYSTEM_PROMPT,
			messages: convertToModelMessages(messages),
			tools: allTools,
			toolChoice: "auto",
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
