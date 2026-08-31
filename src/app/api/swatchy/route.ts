import {
	convertToModelMessages,
	createUIMessageStreamResponse,
	stepCountIs,
	streamText,
	toUIMessageStream,
	type UIMessage,
	validateUIMessages,
} from "ai";
import { type NextRequest, NextResponse } from "next/server";
import {
	buildSwatchySystemPrompt,
	conversationModel,
	type SwatchyContext,
} from "@/lib/agent/config";
import { getPageAwareTools } from "@/lib/agent/tools";
import { getFeatureFlags } from "@/lib/get-feature-flags";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
	try {
		let body: unknown;
		try {
			body = await request.json();
		} catch {
			return NextResponse.json(
				{ error: "Request body must be valid JSON" },
				{ status: 400 },
			);
		}

		if (!body || typeof body !== "object" || Array.isArray(body)) {
			return NextResponse.json(
				{ error: "Request body must be an object" },
				{ status: 400 },
			);
		}

		const { messages, context } = body as {
			messages?: unknown;
			context?: SwatchyContext;
		};

		if (!Array.isArray(messages)) {
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
		let validatedMessages: UIMessage[];
		try {
			validatedMessages = await validateUIMessages({
				messages,
				tools: availableTools,
			});
		} catch {
			return NextResponse.json(
				{ error: "Messages contain invalid or stale chat history" },
				{ status: 400 },
			);
		}

		// Use streaming text generation with tools
		// The model string format "provider/model" is used by Vercel AI Gateway
		const result = streamText({
			model: conversationModel as Parameters<typeof streamText>[0]["model"],
			reasoning: "low",
			system: systemPrompt,
			messages: await convertToModelMessages(validatedMessages),
			tools: availableTools,
			toolChoice: "auto",
			abortSignal: request.signal,
			// Allow multi-step tool calling - Swatchy can chain actions (navigate then generate, etc)
			stopWhen: stepCountIs(5),
		});

		return createUIMessageStreamResponse({
			stream: toUIMessageStream({
				stream: result.stream,
				tools: availableTools,
				originalMessages: validatedMessages,
			}),
		});
	} catch (error) {
		console.error("[Swatchy API Error]", error);
		return NextResponse.json(
			{ error: "Failed to process chat request" },
			{ status: 500 },
		);
	}
}
