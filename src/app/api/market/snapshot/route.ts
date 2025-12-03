import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

const ORDINALS_API = "https://ordinals.gorillapool.io/api";
const MAX_SNAPSHOTS = 168; // 7 days * 24 hours
const HISTORY_KEY = "market:history";

interface PriceSnapshot {
	origin: string;
	price: number;
	timestamp: number;
}

interface MarketSnapshot {
	timestamp: number;
	totalListings: number;
	floorPrice: number;
	listings: PriceSnapshot[];
}

interface MarketHistory {
	snapshots: MarketSnapshot[];
	lastUpdated: number;
}

interface MarketListingResponse {
	txid: string;
	vout: number;
	outpoint: string;
	owner: string;
	origin?: {
		outpoint: string;
		data?: {
			map?: Record<string, string>;
		};
	};
	data?: {
		list?: { price: number };
		map?: Record<string, string>;
	};
}

// Cron job endpoint - takes a market snapshot
export async function GET(request: Request) {
	// Verify cron secret in production
	const authHeader = request.headers.get("authorization");
	if (
		process.env.CRON_SECRET &&
		authHeader !== `Bearer ${process.env.CRON_SECRET}`
	) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		// Fetch current listings from GorillaPool
		const response = await fetch(
			`${ORDINALS_API}/market?limit=100&dir=DESC&type=application/json`,
		);

		if (!response.ok) {
			return NextResponse.json(
				{ error: "Failed to fetch market data" },
				{ status: 502 },
			);
		}

		const results: MarketListingResponse[] = await response.json();

		// Filter for ThemeToken listings
		const themeListings = results
			.filter((item) => {
				const mapData = item.origin?.data?.map || item.data?.map;
				return mapData?.app === "ThemeToken";
			})
			.map((item) => ({
				origin: item.origin?.outpoint || item.outpoint,
				price: item.data?.list?.price || 0,
			}));

		const now = Date.now();
		const prices = themeListings.map((l) => l.price);
		const floorPrice = prices.length > 0 ? Math.min(...prices) : 0;

		const snapshot: MarketSnapshot = {
			timestamp: now,
			totalListings: themeListings.length,
			floorPrice,
			listings: themeListings.map((l) => ({
				...l,
				timestamp: now,
			})),
		};

		// Get existing history
		const history: MarketHistory = (await kv.get(HISTORY_KEY)) || {
			snapshots: [],
			lastUpdated: 0,
		};

		// Add new snapshot and prune old ones
		const snapshots = [...history.snapshots, snapshot].slice(-MAX_SNAPSHOTS);

		const newHistory: MarketHistory = {
			snapshots,
			lastUpdated: now,
		};

		// Save to KV
		await kv.set(HISTORY_KEY, newHistory);

		return NextResponse.json({
			success: true,
			snapshot: {
				timestamp: now,
				totalListings: themeListings.length,
				floorPrice,
				snapshotsStored: snapshots.length,
			},
		});
	} catch (error) {
		console.error("[Market Snapshot] Error:", error);
		return NextResponse.json(
			{ error: "Failed to take snapshot" },
			{ status: 500 },
		);
	}
}
