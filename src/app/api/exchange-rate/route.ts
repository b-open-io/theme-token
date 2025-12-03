import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

const CACHE_KEY = "bsv:usd:rate";
const CACHE_TTL_SECONDS = 5;

interface ExchangeRateResponse {
	rate: number;
	time: number;
	currency: string;
}

interface CachedRate {
	rate: number;
	timestamp: number;
}

export async function GET() {
	try {
		// Check KV cache first
		const cached = await kv.get<CachedRate>(CACHE_KEY);
		if (cached) {
			return NextResponse.json({
				rate: cached.rate,
				cached: true,
				timestamp: cached.timestamp,
			});
		}

		// Fetch from WhatsOnChain
		const response = await fetch(
			"https://api.whatsonchain.com/v1/bsv/main/exchangerate",
			{ next: { revalidate: 0 } },
		);

		if (!response.ok) {
			throw new Error(`WhatsOnChain API error: ${response.status}`);
		}

		const data: ExchangeRateResponse = await response.json();

		// Cache in KV with 5 second TTL
		const cacheData: CachedRate = {
			rate: data.rate,
			timestamp: Date.now(),
		};
		await kv.set(CACHE_KEY, cacheData, { ex: CACHE_TTL_SECONDS });

		return NextResponse.json({
			rate: data.rate,
			cached: false,
			timestamp: cacheData.timestamp,
		});
	} catch (error) {
		console.error("[Exchange Rate] Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch exchange rate" },
			{ status: 500 },
		);
	}
}
