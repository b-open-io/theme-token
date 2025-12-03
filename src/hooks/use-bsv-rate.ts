"use client";

import { useEffect, useState } from "react";

interface UseBsvRateResult {
	rate: number | null;
	isLoading: boolean;
	error: string | null;
	refresh: () => Promise<void>;
}

export function useBsvRate(): UseBsvRateResult {
	const [rate, setRate] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchRate = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/exchange-rate");
			if (!response.ok) {
				throw new Error(`Failed to fetch rate: ${response.status}`);
			}
			const data = await response.json();
			setRate(data.rate);
		} catch (err) {
			console.error("[useBsvRate] Error fetching exchange rate:", err);
			setError(err instanceof Error ? err.message : "Failed to fetch rate");
			setRate(null);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchRate();
	}, []);

	return {
		rate,
		isLoading,
		error,
		refresh: fetchRate,
	};
}
