"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { toast } from "sonner";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import {
	type AspectRatio,
	DEFAULT_WALLPAPER_PARAMS,
	extractDominantColors,
	type GeneratedWallpaper,
	generateWallpaperId,
	patternToImage,
	type SourceType,
	type WallpaperGenerationResponse,
	type WallpaperParams,
	type WallpaperStyle,
} from "@/lib/wallpaper-engine";
import {
	FEE_ADDRESS,
	WALLPAPER_GENERATION_COST_SATS,
} from "@/lib/yours-wallet";

const WALLPAPER_DRAFTS_KEY = "theme-token-wallpaper-drafts";
const MAX_DRAFTS = 20;

function loadWallpaperDrafts(): GeneratedWallpaper[] {
	if (typeof window === "undefined") return [];
	try {
		const saved = localStorage.getItem(WALLPAPER_DRAFTS_KEY);
		return saved ? JSON.parse(saved) : [];
	} catch {
		return [];
	}
}

function saveWallpaperDrafts(drafts: GeneratedWallpaper[]): void {
	try {
		localStorage.setItem(WALLPAPER_DRAFTS_KEY, JSON.stringify(drafts.slice(0, MAX_DRAFTS)));
	} catch (e) {
		// localStorage might be full - try to save without base64 data
		console.warn("Failed to save wallpaper drafts:", e);
	}
}

// Re-export types for convenience
export type {
	WallpaperParams,
	GeneratedWallpaper,
	AspectRatio,
	WallpaperStyle,
	SourceType,
};
export { DEFAULT_WALLPAPER_PARAMS };

interface WallpaperContextType {
	// State
	params: WallpaperParams;
	setParams: (
		params: WallpaperParams | ((prev: WallpaperParams) => WallpaperParams),
	) => void;
	generatedWallpapers: GeneratedWallpaper[];
	selectedWallpaper: GeneratedWallpaper | null;
	isGenerating: boolean;
	generationProgress: number; // 0-100 for loading animation
	ambientColors: string[]; // For ambient bleed effect

	// Payment
	requirePayment: boolean;
	setRequirePayment: (required: boolean) => void;
	isPaying: boolean;

	// UI State
	isGalleryCollapsed: boolean;
	setGalleryCollapsed: (collapsed: boolean) => void;

	// Actions
	generate: () => Promise<void>;
	selectWallpaper: (id: string) => void;
	removeWallpaper: (id: string) => void;
	clearGallery: () => void;
	updateParam: <K extends keyof WallpaperParams>(
		key: K,
		value: WallpaperParams[K],
	) => void;
	setSourcePattern: (svg: string) => void;
	setSourceWallpaper: (wallpaper: GeneratedWallpaper) => void;

	// Derived
	selectedImageDataUrl: string | null;
}

const WallpaperContext = createContext<WallpaperContextType | undefined>(
	undefined,
);

export function WallpaperProvider({ children }: { children: ReactNode }) {
	// Core state
	const [params, setParams] = useState<WallpaperParams>(
		DEFAULT_WALLPAPER_PARAMS,
	);
	const [generatedWallpapers, setGeneratedWallpapers] = useState<
		GeneratedWallpaper[]
	>([]);
	const [selectedWallpaperId, setSelectedWallpaperId] = useState<string | null>(
		null,
	);
	const [isGenerating, setIsGenerating] = useState(false);
	const [generationProgress, setGenerationProgress] = useState(0);
	const [ambientColors, setAmbientColors] = useState<string[]>([
		"#1a1a1a",
		"#333333",
		"#666666",
	]);
	const [hasLoadedDrafts, setHasLoadedDrafts] = useState(false);

	// Load drafts from localStorage on mount
	useEffect(() => {
		const drafts = loadWallpaperDrafts();
		if (drafts.length > 0) {
			setGeneratedWallpapers(drafts);
			// Select the most recent one
			setSelectedWallpaperId(drafts[0].id);
		}
		setHasLoadedDrafts(true);
	}, []);

	// Save drafts to localStorage when they change
	useEffect(() => {
		if (hasLoadedDrafts) {
			saveWallpaperDrafts(generatedWallpapers);
		}
	}, [generatedWallpapers, hasLoadedDrafts]);

	// Payment state
	const [requirePayment, setRequirePayment] = useState(true);
	const [isPaying, setIsPaying] = useState(false);

	// UI state
	const [isGalleryCollapsed, setGalleryCollapsed] = useState(false);

	// Wallet
	const { status, connect, balance, sendPayment } = useYoursWallet();
	const isConnected = status === "connected";

	// Derived: selected wallpaper
	const selectedWallpaper = useMemo(
		() => generatedWallpapers.find((w) => w.id === selectedWallpaperId) || null,
		[generatedWallpapers, selectedWallpaperId],
	);

	// Derived: image data URL for display
	const selectedImageDataUrl = useMemo(() => {
		if (!selectedWallpaper) return null;
		return `data:${selectedWallpaper.mimeType};base64,${selectedWallpaper.imageBase64}`;
	}, [selectedWallpaper]);

	// Update ambient colors when selected wallpaper changes
	const updateAmbientColors = useCallback(
		async (wallpaper: GeneratedWallpaper) => {
			try {
				const colors = await extractDominantColors(
					wallpaper.imageBase64,
					wallpaper.mimeType,
				);
				setAmbientColors(colors);
			} catch {
				// Keep default colors on error
			}
		},
		[],
	);

	// Select a wallpaper
	const selectWallpaper = useCallback(
		(id: string) => {
			setSelectedWallpaperId(id);
			const wallpaper = generatedWallpapers.find((w) => w.id === id);
			if (wallpaper) {
				updateAmbientColors(wallpaper);
			}
		},
		[generatedWallpapers, updateAmbientColors],
	);

	// Update a single param
	const updateParam = useCallback(
		<K extends keyof WallpaperParams>(key: K, value: WallpaperParams[K]) => {
			setParams((prev) => ({ ...prev, [key]: value }));
		},
		[],
	);

	// Set pattern as source
	const setSourcePattern = useCallback((svg: string) => {
		setParams((prev) => ({
			...prev,
			sourceType: "pattern",
			sourcePatternSvg: svg,
			sourceWallpaperId: undefined,
			sourceWallpaperBase64: undefined,
		}));
	}, []);

	// Set wallpaper as source for remix
	const setSourceWallpaper = useCallback((wallpaper: GeneratedWallpaper) => {
		setParams((prev) => ({
			...prev,
			sourceType: "wallpaper",
			sourceWallpaperId: wallpaper.id,
			sourceWallpaperBase64: wallpaper.imageBase64,
			sourcePatternSvg: undefined,
		}));
	}, []);

	// Remove a single wallpaper
	const removeWallpaper = useCallback((id: string) => {
		setGeneratedWallpapers((prev) => {
			const newWallpapers = prev.filter((w) => w.id !== id);
			// If we removed the selected one, select the next one (or none)
			if (selectedWallpaperId === id) {
				const removedIndex = prev.findIndex((w) => w.id === id);
				const nextWallpaper = newWallpapers[removedIndex] || newWallpapers[removedIndex - 1] || null;
				setSelectedWallpaperId(nextWallpaper?.id || null);
				if (nextWallpaper) {
					updateAmbientColors(nextWallpaper);
				} else {
					setAmbientColors(["#1a1a1a", "#333333", "#666666"]);
				}
			}
			return newWallpapers;
		});
	}, [selectedWallpaperId, updateAmbientColors]);

	// Clear gallery
	const clearGallery = useCallback(() => {
		setGeneratedWallpapers([]);
		setSelectedWallpaperId(null);
		setAmbientColors(["#1a1a1a", "#333333", "#666666"]);
	}, []);

	// Generate wallpaper
	const generate = useCallback(async () => {
		if (!params.prompt.trim()) {
			toast.error("Please enter a description");
			return;
		}

		// Check wallet if payment required
		if (requirePayment) {
			if (!isConnected) {
				try {
					await connect();
				} catch {
					toast.error("Please connect your wallet");
					return;
				}
				return;
			}

			const hasBalance =
				(balance?.satoshis ?? 0) >= WALLPAPER_GENERATION_COST_SATS;
			if (!hasBalance) {
				toast.error("Insufficient balance");
				return;
			}
		}

		setIsGenerating(true);
		setGenerationProgress(0);

		// Simulate progress for loading animation
		const progressInterval = setInterval(() => {
			setGenerationProgress((prev) => {
				if (prev >= 90) return prev;
				return prev + Math.random() * 10;
			});
		}, 1000);

		try {
			let paymentTxid = "free-tier";

			if (requirePayment) {
				setIsPaying(true);
				const paymentResult = await sendPayment(
					FEE_ADDRESS,
					WALLPAPER_GENERATION_COST_SATS,
				);
				setIsPaying(false);

				if (!paymentResult) {
					throw new Error("Payment failed");
				}
				paymentTxid = paymentResult.txid;
			}

			// Prepare source image if needed
			let sourceImage: string | undefined;

			if (params.sourceType === "pattern" && params.sourcePatternSvg) {
				sourceImage = await patternToImage(params.sourcePatternSvg);
			} else if (
				params.sourceType === "wallpaper" &&
				params.sourceWallpaperBase64
			) {
				sourceImage = params.sourceWallpaperBase64;
			}

			const response = await fetch("/api/generate-wallpaper", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: params.prompt.trim(),
					sourceImage,
					aspectRatio: params.aspectRatio,
					style: params.style,
					paymentTxid,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to generate wallpaper");
			}

			const data = (await response.json()) as WallpaperGenerationResponse;

			// Create wallpaper record
			const newWallpaper: GeneratedWallpaper = {
				id: generateWallpaperId(),
				timestamp: Date.now(),
				imageBase64: data.image,
				mimeType: data.mimeType,
				prompt: data.prompt,
				aspectRatio: data.aspectRatio,
				style: data.style || undefined,
				sourceType: params.sourceType,
				dimensions: data.dimensions,
			};

			// Add to gallery (newest first)
			setGeneratedWallpapers((prev) => [newWallpaper, ...prev.slice(0, 19)]);

			// Select the new wallpaper
			setSelectedWallpaperId(newWallpaper.id);
			updateAmbientColors(newWallpaper);

			setGenerationProgress(100);
			toast.success("Wallpaper generated!");
		} catch (error) {
			console.error("Wallpaper generation error:", error);
			toast.error(error instanceof Error ? error.message : "Generation failed");
		} finally {
			clearInterval(progressInterval);
			setIsGenerating(false);
			setIsPaying(false);
			setGenerationProgress(0);
		}
	}, [
		params,
		requirePayment,
		isConnected,
		connect,
		balance,
		sendPayment,
		updateAmbientColors,
	]);

	return (
		<WallpaperContext.Provider
			value={{
				params,
				setParams,
				generatedWallpapers,
				selectedWallpaper,
				isGenerating,
				generationProgress,
				ambientColors,
				requirePayment,
				setRequirePayment,
				isPaying,
				isGalleryCollapsed,
				setGalleryCollapsed,
				generate,
				selectWallpaper,
				removeWallpaper,
				clearGallery,
				updateParam,
				setSourcePattern,
				setSourceWallpaper,
				selectedImageDataUrl,
			}}
		>
			{children}
		</WallpaperContext.Provider>
	);
}

export function useWallpaperContext() {
	const context = useContext(WallpaperContext);
	if (context === undefined) {
		throw new Error(
			"useWallpaperContext must be used within a WallpaperProvider",
		);
	}
	return context;
}
