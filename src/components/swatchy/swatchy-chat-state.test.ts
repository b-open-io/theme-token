import { describe, expect, test } from "bun:test";
import type { DynamicToolUIPart, ToolUIPart, UIMessage } from "ai";
import {
	finalizeInterruptedToolCalls,
	getGeneratedThemeHandoff,
	getToolPresentationKind,
	isSupportedSwatchyPaidTool,
	shouldAutoContinueAfterTools,
	shouldShowThinking,
} from "./swatchy-chat-state";

describe("getGeneratedThemeHandoff", () => {
	test("applies once through the store when already in Theme Studio", () => {
		expect(getGeneratedThemeHandoff("/studio/theme")).toBe("in-place");
	});

	test("uses the persisted handoff when navigating into Theme Studio", () => {
		expect(getGeneratedThemeHandoff("/")).toBe("persisted");
		expect(getGeneratedThemeHandoff("/themes")).toBe("persisted");
	});
});

function toolPart(
	toolCallId: string,
	state: "input-available" | "output-available" = "input-available",
): ToolUIPart {
	return {
		type: "tool-generateTheme",
		toolCallId,
		state,
		input: { prompt: "A night theme" },
		...(state === "output-available" ? { output: { name: "Night" } } : {}),
	} as ToolUIPart;
}

describe("finalizeInterruptedToolCalls", () => {
	test("marks restored unfinished static and dynamic tool calls as errors", () => {
		const dynamicPart: DynamicToolUIPart = {
			type: "dynamic-tool",
			toolName: "customTool",
			toolCallId: "dynamic-call",
			state: "input-streaming",
			input: undefined,
		};
		const messages: UIMessage[] = [
			{
				id: "assistant-1",
				role: "assistant",
				parts: [toolPart("static-call"), dynamicPart],
			},
		];

		const [restored] = finalizeInterruptedToolCalls(messages);

		expect(restored.parts).toEqual([
			expect.objectContaining({
				toolCallId: "static-call",
				state: "output-error",
			}),
			expect.objectContaining({
				toolCallId: "dynamic-call",
				state: "output-error",
			}),
		]);
		expect(messages[0].parts[0]).toMatchObject({ state: "input-available" });
	});
});

describe("shouldShowThinking", () => {
	test("shows while submitted before assistant content arrives", () => {
		expect(
			shouldShowThinking(
				[{ id: "user-1", role: "user", parts: [{ type: "text", text: "Hi" }] }],
				"submitted",
			),
		).toBe(true);
	});

	test("hides once visible assistant text or a tool part arrives", () => {
		const textMessage: UIMessage = {
			id: "assistant-text",
			role: "assistant",
			parts: [{ type: "text", text: "Working on it" }],
		};
		const toolMessage: UIMessage = {
			id: "assistant-tool",
			role: "assistant",
			parts: [toolPart("call-1")],
		};

		expect(shouldShowThinking([textMessage], "streaming")).toBe(false);
		expect(shouldShowThinking([toolMessage], "streaming")).toBe(false);
	});
});

describe("getToolPresentationKind", () => {
	test("selects one matching payment, running, success, or error presentation", () => {
		const part = toolPart("active-call");

		expect(
			getToolPresentationKind(part, {
				paymentToolCallId: "active-call",
			}),
		).toBe("payment");
		expect(
			getToolPresentationKind(part, {
				generationToolCallId: "active-call",
				generationStatus: "generating",
			}),
		).toBe("generation-running");
		expect(
			getToolPresentationKind(part, {
				generationToolCallId: "active-call",
				generationStatus: "success",
			}),
		).toBe("generation-success");
		expect(
			getToolPresentationKind(part, {
				generationToolCallId: "active-call",
				generationStatus: "error",
			}),
		).toBe("generation-error");
	});

	test("does not apply active generation state to an older same-name call", () => {
		const historicalPart = toolPart("old-call", "output-available");

		expect(
			getToolPresentationKind(historicalPart, {
				generationToolCallId: "active-call",
				generationStatus: "generating",
			}),
		).toBe("tool-success");
	});
});

describe("shouldAutoContinueAfterTools", () => {
	test("continues completed tools except navigation that needs new page context", () => {
		const completed = (type: string): UIMessage[] => [
			{
				id: "assistant-tool",
				role: "assistant",
				parts: [
					{
						type,
						toolCallId: "call-1",
						state: "output-available",
						input: {},
						output: "done",
					} as ToolUIPart,
				],
			},
		];

		expect(
			shouldAutoContinueAfterTools({ messages: completed("tool-navigate") }),
		).toBe(false);
		expect(
			shouldAutoContinueAfterTools({
				messages: completed("tool-generateTheme"),
			}),
		).toBe(true);
	});
});

describe("isSupportedSwatchyPaidTool", () => {
	test("guards unfinished paid features before requesting payment", () => {
		expect(isSupportedSwatchyPaidTool("generateTheme")).toBe(true);
		expect(isSupportedSwatchyPaidTool("generateWallpaper")).toBe(false);
		expect(isSupportedSwatchyPaidTool("createProject")).toBe(false);
	});
});
