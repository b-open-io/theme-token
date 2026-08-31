import { beforeEach, describe, expect, mock, test } from "bun:test";
import * as actualAI from "ai";

const streamTextMock = mock(() => ({
	stream: new ReadableStream({
		start(controller) {
			controller.close();
		},
	}),
}));

mock.module("ai", () => ({
	...actualAI,
	streamText: streamTextMock,
}));

mock.module("@/lib/get-feature-flags", () => ({
	getFeatureFlags: async () => ({
		theme: true,
		fonts: false,
		images: false,
		icons: false,
		wallpapers: false,
		components: false,
		project: false,
		componentPreview: false,
	}),
}));

const { POST } = await import("./route");

function request(body: unknown, signal?: AbortSignal) {
	return new Request("http://localhost/api/swatchy", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
		signal,
	});
}

describe("POST /api/swatchy", () => {
	beforeEach(() => {
		streamTextMock.mockClear();
	});

	test("returns 400 for invalid JSON", async () => {
		const response = await POST(
			new Request("http://localhost/api/swatchy", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "{",
			}) as never,
		);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: "Request body must be valid JSON",
		});
		expect(streamTextMock).not.toHaveBeenCalled();
	});

	test("returns 400 for malformed messages", async () => {
		const response = await POST(
			request({
				messages: [{ id: "user-1", role: "user" }],
			}) as never,
		);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: "Messages contain invalid or stale chat history",
		});
		expect(streamTextMock).not.toHaveBeenCalled();
	});

	test("returns 400 for an unfinished tool that is no longer available", async () => {
		const response = await POST(
			request({
				messages: [
					{
						id: "assistant-1",
						role: "assistant",
						parts: [
							{
								type: "tool-retiredTool",
								toolCallId: "call-1",
								state: "input-available",
								input: {},
							},
						],
					},
				],
			}) as never,
		);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: "Messages contain invalid or stale chat history",
		});
		expect(streamTextMock).not.toHaveBeenCalled();
	});

	test("validates and converts messages before starting a cancellable stream", async () => {
		const controller = new AbortController();
		const incomingRequest = request(
			{
				messages: [
					{
						id: "user-1",
						role: "user",
						parts: [{ type: "text", text: "Hello Swatchy" }],
					},
				],
				context: {
					currentPage: "/",
					themeMode: "light",
					walletConnected: false,
				},
			},
			controller.signal,
		);

		const response = await POST(incomingRequest as never);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/event-stream");
		expect(streamTextMock).toHaveBeenCalledTimes(1);

		const options = streamTextMock.mock.calls[0]?.[0] as {
			abortSignal?: AbortSignal;
			messages?: Array<{ role: string; content: unknown }>;
			tools?: Record<string, unknown>;
		};
		expect(options.abortSignal).toBe(incomingRequest.signal);
		expect(options.messages).toEqual([
			{
				role: "user",
				content: [{ type: "text", text: "Hello Swatchy" }],
			},
		]);
		expect(options.tools).toHaveProperty("navigate");
		expect(options.tools).not.toHaveProperty("generatePattern");
	});
});
