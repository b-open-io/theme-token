import { generateText } from "ai";
import { type NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // Allow up to 60 seconds for image generation

type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3" | "3:2";
type WallpaperStyle =
	| "photorealistic"
	| "artistic"
	| "abstract"
	| "minimal"
	| "3d-render";

interface WallpaperRequest {
	prompt: string;
	// Optional source image for remix/transformation (base64)
	sourceImage?: string;
	// Aspect ratio for output
	aspectRatio?: AspectRatio;
	// Style direction
	style?: WallpaperStyle;
	// Payment transaction ID (for verification)
	paymentTxid?: string;
}

interface GeneratedFile {
	base64?: string;
	uint8Array?: Uint8Array;
	mediaType?: string;
	mimeType?: string;
	url?: string;
}

// Aspect ratio to dimensions mapping
const ASPECT_DIMENSIONS: Record<
	AspectRatio,
	{ width: number; height: number }
> = {
	"16:9": { width: 1920, height: 1080 },
	"9:16": { width: 1080, height: 1920 },
	"1:1": { width: 1024, height: 1024 },
	"4:3": { width: 1600, height: 1200 },
	"3:2": { width: 1800, height: 1200 },
};

// Style to prompt enhancement mapping
const STYLE_PROMPTS: Record<WallpaperStyle, string> = {
	photorealistic:
		"photorealistic, highly detailed, professional photography, 8k resolution",
	artistic: "artistic interpretation, painterly style, creative composition",
	abstract: "abstract art, geometric shapes, modern design, flowing forms",
	minimal: "minimalist design, clean lines, simple composition, negative space",
	"3d-render":
		"3D rendered, volumetric lighting, cinema 4D style, octane render",
};

function buildWallpaperPrompt(
	prompt: string,
	aspectRatio: AspectRatio,
	style?: WallpaperStyle,
	hasSourceImage?: boolean,
): string {
	const dimensions = ASPECT_DIMENSIONS[aspectRatio];
	const styleHint = style ? STYLE_PROMPTS[style] : "";

	const baseInstructions = `Create a beautiful, high-quality wallpaper image.
Resolution: ${dimensions.width}x${dimensions.height} (${aspectRatio} aspect ratio)
${styleHint ? `Style: ${styleHint}` : ""}

Requirements:
- High resolution and crisp details
- Visually balanced composition suitable for a wallpaper
- No text, watermarks, or UI elements
- Professional quality suitable for desktop/mobile backgrounds`;

	if (hasSourceImage) {
		return `${baseInstructions}

Transform the provided source image based on this description:
${prompt}

Keep the overall composition but apply the requested transformation.`;
	}

	return `${baseInstructions}

Description: ${prompt}`;
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as WallpaperRequest;
		const { prompt, sourceImage, aspectRatio = "16:9", style } = body;

		if (!prompt?.trim()) {
			return NextResponse.json(
				{ error: "Prompt is required" },
				{ status: 400 },
			);
		}

		const fullPrompt = buildWallpaperPrompt(
			prompt.trim(),
			aspectRatio,
			style,
			!!sourceImage,
		);

		// Build messages for the API
		type MessageContent =
			| { type: "text"; text: string }
			| { type: "image"; image: string };
		const content: MessageContent[] = [];

		// If we have a source image, include it first
		if (sourceImage) {
			content.push({
				type: "image",
				image: sourceImage.startsWith("data:")
					? sourceImage
					: `data:image/png;base64,${sourceImage}`,
			});
		}

		content.push({
			type: "text",
			text: fullPrompt,
		});

		// Use Gemini 3 Pro Image via Vercel AI Gateway
		const result = await generateText({
			model: "google/gemini-3-pro-image" as Parameters<
				typeof generateText
			>[0]["model"],
			messages: [
				{
					role: "user",
					content,
				},
			],
		});

		// Extract generated image from result.files
		const files = (result as unknown as { files?: GeneratedFile[] }).files;
		if (!files || files.length === 0) {
			return NextResponse.json(
				{ error: "No image was generated" },
				{ status: 500 },
			);
		}

		const generatedImage = files[0];
		const imageBase64 =
			generatedImage.base64 ||
			(generatedImage.uint8Array
				? Buffer.from(generatedImage.uint8Array).toString("base64")
				: null);

		if (!imageBase64) {
			return NextResponse.json(
				{ error: "Failed to extract image data" },
				{ status: 500 },
			);
		}

		const mimeType =
			generatedImage.mediaType || generatedImage.mimeType || "image/png";

		return NextResponse.json({
			image: imageBase64,
			mimeType,
			prompt: prompt.trim(),
			aspectRatio,
			style: style || null,
			dimensions: ASPECT_DIMENSIONS[aspectRatio],
			provider: "google",
			model: "gemini-3-pro-image",
		});
	} catch (error) {
		console.error("Wallpaper generation error:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Failed to generate wallpaper",
			},
			{ status: 500 },
		);
	}
}
