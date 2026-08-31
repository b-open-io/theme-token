import { beforeEach, describe, expect, mock, test } from "bun:test";
import * as actualAI from "ai";
import { AI_MODELS } from "@/lib/ai-models";

const style = {
	background: "oklch(0.98 0.01 250)",
	foreground: "oklch(0.2 0.02 250)",
	card: "oklch(0.96 0.01 250)",
	"card-foreground": "oklch(0.2 0.02 250)",
	popover: "oklch(0.98 0.01 250)",
	"popover-foreground": "oklch(0.2 0.02 250)",
	primary: "oklch(0.6 0.2 250)",
	"primary-foreground": "oklch(0.98 0.01 250)",
	secondary: "oklch(0.9 0.05 250)",
	"secondary-foreground": "oklch(0.2 0.02 250)",
	muted: "oklch(0.92 0.02 250)",
	"muted-foreground": "oklch(0.5 0.03 250)",
	accent: "oklch(0.85 0.1 300)",
	"accent-foreground": "oklch(0.2 0.02 250)",
	destructive: "oklch(0.6 0.2 25)",
	"destructive-foreground": "oklch(0.98 0.01 25)",
	border: "oklch(0.88 0.02 250)",
	input: "oklch(0.88 0.02 250)",
	ring: "oklch(0.6 0.2 250)",
	radius: "0.5rem",
	"chart-1": "oklch(0.6 0.2 250)",
	"chart-2": "oklch(0.65 0.18 180)",
	"chart-3": "oklch(0.65 0.18 310)",
	"chart-4": "oklch(0.7 0.16 80)",
	"chart-5": "oklch(0.65 0.16 140)",
};

const generateTextMock = mock(async () => ({
	output: { name: "Night Ride", light: { ...style }, dark: { ...style } },
}));
const generateImageMock = mock(async () => ({
	image: {
		base64: "aGVsbG8=",
		mediaType: "image/png",
	},
}));

mock.module("ai", () => ({
	...actualAI,
	generateImage: generateImageMock,
	generateText: generateTextMock,
}));

const themeRoute = await import("./generate-theme/route");
const wallpaperRoute = await import("./generate-wallpaper/route");

describe("AI generation routes", () => {
	beforeEach(() => {
		generateTextMock.mockClear();
		generateImageMock.mockClear();
	});

	test("parses schema output from Luna for a theme", async () => {
		const response = await themeRoute.POST(
			new Request("http://localhost/api/generate-theme", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ prompt: "A neon night theme" }),
			}) as never,
		);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.theme).toMatchObject({
			name: "Night Ride",
			provider: "openai",
			model: AI_MODELS.theme,
		});

		const options = generateTextMock.mock.calls[0]?.[0] as {
			model: string;
			reasoning: string;
			output: { name: string };
		};
		expect(options.model).toBe(AI_MODELS.theme);
		expect(options.reasoning).toBe("medium");
		expect(options.output.name).toBe("object");
	});

	test("routes premium theme requests to Grok", async () => {
		await themeRoute.POST(
			new Request("http://localhost/api/generate-theme", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ prompt: "Editorial", model: "grok-4.6" }),
			}) as never,
		);

		const options = generateTextMock.mock.calls[0]?.[0] as {
			model: string;
			reasoning: string;
		};
		expect(options).toMatchObject({
			model: AI_MODELS.premium,
			reasoning: "low",
		});
	});

	test("uses the typed image result from GPT-Image-2", async () => {
		const response = await wallpaperRoute.POST(
			new Request("http://localhost/api/generate-wallpaper", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: "A quiet neon skyline",
					aspectRatio: "9:16",
					sourceImage: "aW1hZ2U=",
				}),
			}) as never,
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			image: "aGVsbG8=",
			mimeType: "image/png",
			provider: "openai",
			model: AI_MODELS.wallpaper,
		});

		const options = generateImageMock.mock.calls[0]?.[0] as {
			model: string;
			aspectRatio: string;
			prompt: { images: string[]; text: string };
		};
		expect(options.model).toBe("openai/gpt-image-2");
		expect(options.aspectRatio).toBe("9:16");
		expect(options.prompt.images[0]).toBe("data:image/png;base64,aW1hZ2U=");
	});
});
