/**
 * Hook to fetch shadcn/create presets from the official registry
 *
 * Fetches from https://ui.shadcn.com/r/config.json to always have the latest presets
 */

import { useState, useEffect } from "react";

const SHADCN_REGISTRY_URL = "https://ui.shadcn.com/r/config.json";

/** shadcn/create preset definition from the registry */
export interface ShadcnPreset {
	name: string;
	title: string;
	description: string;
	base: "radix" | "base";
	style: string;
	baseColor: string;
	theme: string;
	iconLibrary: "lucide" | "hugeicons" | "tabler";
	font: string;
	item: string;
	menuAccent: "subtle" | "normal" | "bold";
	menuColor: "default" | "primary" | "accent";
	radius: string;
}

interface ShadcnConfig {
	presets: ShadcnPreset[];
}

interface UseShadcnPresetsResult {
	presets: ShadcnPreset[];
	isLoading: boolean;
	error: Error | null;
	/** Group presets by base (radix vs base) */
	presetsByBase: {
		radix: ShadcnPreset[];
		base: ShadcnPreset[];
	};
}

export function useShadcnPresets(): UseShadcnPresetsResult {
	const [presets, setPresets] = useState<ShadcnPreset[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function fetchPresets() {
			try {
				const response = await fetch(SHADCN_REGISTRY_URL);
				if (!response.ok) {
					throw new Error(`Failed to fetch presets: ${response.status}`);
				}
				const config: ShadcnConfig = await response.json();
				if (!cancelled) {
					setPresets(config.presets);
					setIsLoading(false);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err : new Error("Unknown error"));
					setIsLoading(false);
				}
			}
		}

		fetchPresets();

		return () => {
			cancelled = true;
		};
	}, []);

	const presetsByBase = {
		radix: presets.filter((p) => p.base === "radix"),
		base: presets.filter((p) => p.base === "base"),
	};

	return { presets, isLoading, error, presetsByBase };
}
