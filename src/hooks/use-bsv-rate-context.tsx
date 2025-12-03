"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface BsvRateContextValue {
	rate: number | null;
	isLoading: boolean;
	error: string | null;
	formatUsd: (satoshis: number) => string | null;
}

const BsvRateContext = createContext<BsvRateContextValue | null>(null);

export function BsvRateProvider({ children }: { children: ReactNode }) {
	const [rate, setRate] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchRate() {
			try {
				const response = await fetch("/api/exchange-rate");
				if (!response.ok) {
					throw new Error(`Failed to fetch rate: ${response.status}`);
				}
				const data = await response.json();
				setRate(data.rate);
			} catch (err) {
				console.error("[BsvRateContext] Error fetching exchange rate:", err);
				setError(err instanceof Error ? err.message : "Failed to fetch rate");
			} finally {
				setIsLoading(false);
			}
		}
		fetchRate();
	}, []);

	// Convert satoshis to USD formatted string
	const formatUsd = (satoshis: number): string | null => {
		if (!rate) return null;
		const bsv = satoshis / 100_000_000;
		const usd = bsv * rate;
		if (usd < 0.01) return "<$0.01";
		if (usd < 1) return `$${usd.toFixed(2)}`;
		if (usd < 100) return `$${usd.toFixed(2)}`;
		return `$${usd.toFixed(0)}`;
	};

	return (
		<BsvRateContext.Provider value={{ rate, isLoading, error, formatUsd }}>
			{children}
		</BsvRateContext.Provider>
	);
}

export function useBsvRateContext(): BsvRateContextValue {
	const context = useContext(BsvRateContext);
	if (!context) {
		throw new Error("useBsvRateContext must be used within a BsvRateProvider");
	}
	return context;
}
