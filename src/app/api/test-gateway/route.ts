import { NextResponse } from "next/server";

export async function GET() {
	const apiKey = process.env.AI_GATEWAY_API_KEY;
	const hasKey = !!apiKey;
	const keyPrefix = apiKey ? apiKey.substring(0, 10) + "..." : "NOT SET";

	// Test the credits endpoint
	let credits = null;
	let creditsError = null;

	if (apiKey) {
		try {
			const response = await fetch("https://ai-gateway.vercel.sh/v1/credits", {
				method: "GET",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
				},
			});
			credits = await response.json();
		} catch (err) {
			creditsError = err instanceof Error ? err.message : "Unknown error";
		}
	}

	return NextResponse.json({
		hasKey,
		keyPrefix,
		credits,
		creditsError,
		nodeEnv: process.env.NODE_ENV,
	});
}
