import { generateImage } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { AI_MODELS } from "@/lib/ai-models";

export const maxDuration = 120;

type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3" | "3:2";
type WallpaperStyle =
	| "photorealistic"
	| "artistic"
	| "abstract"
	| "minimal"
	| "3d-render";

interface ThemeContext {
	name: string;
	mode: "light" | "dark";
	colors: Record<string, string>;
}

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
	// Optional theme context for color-aware generation
	themeContext?: ThemeContext;
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

function buildThemeColorContext(themeContext: ThemeContext): string {
	const { name, mode, colors } = themeContext;

	// Extract key colors for the prompt
	const colorPairs = [
		["primary", colors.primary],
		["secondary", colors.secondary],
		["accent", colors.accent],
		["background", colors.background],
		["foreground", colors.foreground],
		["muted", colors.muted],
		["card", colors.card],
	].filter(([, value]) => value);

	const colorList = colorPairs
		.map(([name, value]) => `  - ${name}: ${value}`)
		.join("\n");

	return `
Theme Color Palette (${mode} mode - "${name}"):
${colorList}

IMPORTANT: Use these exact colors or harmonious variations as the primary color palette for the wallpaper.
The wallpaper should feel cohesive with this theme when used as a background.`;
}

function buildWallpaperPrompt(
	prompt: string,
	aspectRatio: AspectRatio,
	style?: WallpaperStyle,
	hasSourceImage?: boolean,
	themeContext?: ThemeContext,
): string {
	const dimensions = ASPECT_DIMENSIONS[aspectRatio];
	const styleHint = style ? STYLE_PROMPTS[style] : "";
	const themeHint = themeContext ? buildThemeColorContext(themeContext) : "";

	const baseInstructions = `Create a beautiful, high-quality wallpaper image.
Resolution: ${dimensions.width}x${dimensions.height} (${aspectRatio} aspect ratio)
${styleHint ? `Style: ${styleHint}` : ""}
${themeHint}

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
		const {
			prompt,
			sourceImage,
			aspectRatio = "16:9",
			style,
			themeContext,
		} = body;

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
			themeContext,
		);

		const result = await generateImage({
			model: AI_MODELS.wallpaper,
			prompt: sourceImage
				? {
						images: [
							sourceImage.startsWith("data:")
								? sourceImage
								: `data:image/png;base64,${sourceImage}`,
						],
						text: fullPrompt,
					}
				: fullPrompt,
			aspectRatio,
			maxRetries: 1,
			abortSignal: AbortSignal.timeout(100_000),
		});

		const imageBase64 = result.image.base64;
		const mimeType = result.image.mediaType || "image/png";

		return NextResponse.json({
			image: imageBase64,
			mimeType,
			prompt: prompt.trim(),
			aspectRatio,
			style: style || null,
			dimensions: ASPECT_DIMENSIONS[aspectRatio],
			provider: "openai",
			model: AI_MODELS.wallpaper,
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
