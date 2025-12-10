import { type NextRequest, NextResponse } from "next/server";

// Simple intent detection for now
// Future: Connect to AI SDK for real responses
export async function POST(request: NextRequest) {
	try {
		const { message } = await request.json();
		const lowercaseMsg = message.toLowerCase();

		// Navigation intents
		if (lowercaseMsg.includes("browse") || lowercaseMsg.includes("explore")) {
			return NextResponse.json({
				response:
					"Let me take you to our theme gallery! You'll find lots of beautiful themes to explore.",
				action: { type: "navigate", payload: "/themes" },
			});
		}

		if (lowercaseMsg.includes("studio") || lowercaseMsg.includes("editor")) {
			return NextResponse.json({
				response: "I'll open the Theme Studio for you. Let's create something beautiful!",
				action: { type: "navigate", payload: "/studio/theme" },
			});
		}

		if (
			lowercaseMsg.includes("create") ||
			lowercaseMsg.includes("make") ||
			lowercaseMsg.includes("generate")
		) {
			const prompt = message
				.replace(/create|make|generate|theme|a|me/gi, "")
				.trim();
			return NextResponse.json({
				response: `Great idea! I'll set up the Studio with your "${prompt || "custom"}" concept. Let's bring your vision to life!`,
				action: { type: "generate_theme", payload: prompt || "modern theme" },
			});
		}

		if (lowercaseMsg.includes("mint") || lowercaseMsg.includes("publish")) {
			return NextResponse.json({
				response:
					"To mint a theme, you'll need to: 1) Create your theme in the Studio, 2) Connect your Yours Wallet, 3) Click 'Mint' and pay the inscription fee. Your theme will then be permanently stored on the blockchain!",
			});
		}

		if (lowercaseMsg.includes("color") || lowercaseMsg.includes("palette")) {
			return NextResponse.json({
				response:
					"I'd love to help with colors! Think about the mood you want: warm tones (oranges, reds) feel energetic, cool tones (blues, greens) feel calm, and purples add creativity. What vibe are you going for?",
			});
		}

		if (lowercaseMsg.includes("help") || lowercaseMsg.includes("what can")) {
			return NextResponse.json({
				response:
					"I can help you: browse themes, create new themes, understand color theory, navigate the site, and explain how minting works. Just ask me anything!",
			});
		}

		// Default response
		return NextResponse.json({
			response:
				"That's interesting! I'm still learning, but I can help you browse themes, create new ones, or explain how Theme Token works. What would you like to do?",
		});
	} catch {
		return NextResponse.json(
			{ response: "Oops! Something went wrong. Let me try that again..." },
			{ status: 500 }
		);
	}
}
