import {
	type ChatStatus,
	type DynamicToolUIPart,
	isTextUIPart,
	isToolUIPart,
	lastAssistantMessageIsCompleteWithToolCalls,
	type ToolUIPart,
	type UIMessage,
} from "ai";
import type { ToolName } from "@/lib/agent/tools";

const supportedPaidTools = new Set<ToolName>([
	"generateTheme",
	"generateFont",
	"generatePattern",
	"generateIconSet",
	"generateFavicon",
	"generateBlock",
	"generateComponent",
]);

export function isSupportedSwatchyPaidTool(toolName: ToolName): boolean {
	return supportedPaidTools.has(toolName);
}

export function getGeneratedThemeHandoff(
	pathname: string,
): "in-place" | "persisted" {
	return pathname === "/studio/theme" ? "in-place" : "persisted";
}

export type GenerationPresentationStatus =
	| "idle"
	| "generating"
	| "success"
	| "error";

export type ToolPresentationKind =
	| "payment"
	| "generation-running"
	| "generation-success"
	| "generation-error"
	| "tool-running"
	| "tool-success"
	| "tool-error";

export interface ToolPresentationContext {
	paymentToolCallId?: string | null;
	generationToolCallId?: string | null;
	generationStatus?: GenerationPresentationStatus | null;
}

/**
 * Finalize tool calls that cannot resume after restoring a conversation.
 */
export function finalizeInterruptedToolCalls(
	messages: UIMessage[],
): UIMessage[] {
	return messages.map((message) => {
		if (!message.parts) return message;

		let changed = false;
		const parts = message.parts.map((part) => {
			if (
				isToolUIPart(part) &&
				(part.state === "input-available" || part.state === "input-streaming")
			) {
				changed = true;
				return {
					...part,
					state: "output-error" as const,
					errorText:
						"Interrupted — the page was reloaded before this finished.",
				} as unknown as UIMessage["parts"][number];
			}

			return part;
		});

		return changed ? { ...message, parts } : message;
	});
}

/**
 * Show the fallback only until the assistant has streamed visible content.
 */
export function shouldShowThinking(
	messages: UIMessage[],
	status: ChatStatus,
): boolean {
	if (status !== "submitted" && status !== "streaming") return false;

	const lastMessage = messages.at(-1);
	if (lastMessage?.role !== "assistant") return true;

	return !lastMessage.parts.some(
		(part) =>
			(isTextUIPart(part) && part.text.trim().length > 0) || isToolUIPart(part),
	);
}

/**
 * Resume normal client tools through the SDK loop. Navigation is the one
 * exception: its destination changes the page-aware tool registry, so the
 * existing arrival follow-up must run after the route context updates.
 */
export function shouldAutoContinueAfterTools({
	messages,
}: {
	messages: UIMessage[];
}): boolean {
	if (!lastAssistantMessageIsCompleteWithToolCalls({ messages })) return false;

	const lastMessage = messages.at(-1);
	return !lastMessage?.parts.some((part) => {
		if (!isToolUIPart(part)) return false;
		const toolName =
			part.type === "dynamic-tool"
				? part.toolName
				: part.type.replace(/^tool-/, "");
		return toolName === "navigate";
	});
}

/**
 * Select exactly one presentation for a tool call. Local payment/generation
 * state only overrides the matching call ID, never historical calls with the
 * same tool name.
 */
export function getToolPresentationKind(
	part: ToolUIPart | DynamicToolUIPart,
	context: ToolPresentationContext,
): ToolPresentationKind {
	if (
		context.paymentToolCallId === part.toolCallId &&
		(part.state === "input-streaming" || part.state === "input-available")
	) {
		return "payment";
	}

	if (context.generationToolCallId === part.toolCallId) {
		switch (context.generationStatus) {
			case "generating":
				return "generation-running";
			case "success":
				return "generation-success";
			case "error":
				return "generation-error";
		}
	}

	switch (part.state) {
		case "input-streaming":
		case "input-available":
		case "approval-requested":
		case "approval-responded":
			return "tool-running";
		case "output-available":
			return "tool-success";
		case "output-error":
		case "output-denied":
			return "tool-error";
	}
}
