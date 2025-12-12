"use client";

import { type ThemeToken } from "@theme-token/sdk";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
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
import type { DraftMetadata } from "@/lib/storage/types";

const WALLPAPER_DRAFTS_KEY = "theme-token-wallpaper-drafts";
const MAX_LOCAL_DRAFTS = 20;

// localStorage helpers for anonymous users / offline cache
function loadLocalWallpaperDrafts(): GeneratedWallpaper[] {
	if (typeof window === "undefined") return [];
	try {
		const saved = localStorage.getItem(WALLPAPER_DRAFTS_KEY);
		return saved ? JSON.parse(saved) : [];
	} catch {
		return [];
	}
}

function saveLocalWallpaperDrafts(drafts: GeneratedWallpaper[]): void {
	try {
		localStorage.setItem(WALLPAPER_DRAFTS_KEY, JSON.stringify(drafts.slice(0, MAX_LOCAL_DRAFTS)));
	} catch (e) {
		console.warn("Failed to save wallpaper drafts to localStorage:", e);
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
	generationProgress: number;
	ambientColors: string[];

	// Theme context for generation
	useThemeContext: boolean;
	setUseThemeContext: (use: boolean) => void;
	selectedTheme: ThemeToken | null;
	setSelectedTheme: (theme: ThemeToken | null) => void;
	availableThemes: ThemeToken[];

	// Payment
	requirePayment: boolean;
	setRequirePayment: (required: boolean) => void;
	isPaying: boolean;

	// UI State
	isGalleryCollapsed: boolean;
	setGalleryCollapsed: (collapsed: boolean) => void;

	// Cloud storage state
	isCloudEnabled: boolean;
	isLoadingCloud: boolean;
	cloudUsage: { count: number; limit: number } | null;

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
	refreshFromCloud: () => Promise<void>;

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

	// Theme context state
	const { activeTheme, availableThemes, mode } = useTheme();
	const [useThemeContext, setUseThemeContext] = useState(false);
	const [selectedTheme, setSelectedTheme] = useState<ThemeToken | null>(null);

	// Sync selectedTheme with activeTheme when enabled and no selection made
	useEffect(() => {
		if (useThemeContext && !selectedTheme && activeTheme) {
			setSelectedTheme(activeTheme);
		}
	}, [useThemeContext, selectedTheme, activeTheme]);

	// Cloud storage state
	const [isLoadingCloud, setIsLoadingCloud] = useState(false);
	const [cloudUsage, setCloudUsage] = useState<{ count: number; limit: number } | null>(null);
	const hasFetchedCloud = useRef(false);

	// Payment state
	const [requirePayment, setRequirePayment] = useState(true);
	const [isPaying, setIsPaying] = useState(false);

	// UI state
	const [isGalleryCollapsed, setGalleryCollapsed] = useState(false);

	// Wallet
	const { status, connect, balance, sendPayment, addresses } = useYoursWallet();
	const isConnected = status === "connected";
	const ordAddress = addresses?.ordAddress;
	const isCloudEnabled = isConnected && !!ordAddress;

	// Load local drafts on mount (for anonymous users / offline cache)
	useEffect(() => {
		const drafts = loadLocalWallpaperDrafts();
		if (drafts.length > 0) {
			setGeneratedWallpapers(drafts);
			setSelectedWallpaperId(drafts[0].id);
		}
		setHasLoadedDrafts(true);
	}, []);

	// Fetch from cloud when wallet connects
	const fetchFromCloud = useCallback(async () => {
		if (!ordAddress) return;

		setIsLoadingCloud(true);
		try {
			const params = new URLSearchParams({
				userId: ordAddress,
				type: "wallpaper",
			});

			const response = await fetch(`/api/drafts?${params}`);
			if (!response.ok) {
				throw new Error("Failed to fetch cloud drafts");
			}

			const data = await response.json();
			setCloudUsage(data.usage);

			// Convert cloud drafts to GeneratedWallpaper format
			if (data.drafts && data.drafts.length > 0) {
				const cloudWallpapers: GeneratedWallpaper[] = await Promise.all(
					data.drafts.map(async (draft: DraftMetadata) => {
						// Fetch the actual image data from blob URL
						let imageBase64 = "";
						if (draft.blobUrl) {
							try {
								const imgResponse = await fetch(draft.blobUrl);
								const blob = await imgResponse.blob();
								const buffer = await blob.arrayBuffer();
								imageBase64 = btoa(
									new Uint8Array(buffer).reduce(
										(data, byte) => data + String.fromCharCode(byte),
										"",
									),
								);
							} catch (e) {
								console.warn("Failed to fetch blob for draft:", draft.id, e);
							}
						}

						return {
							id: draft.id,
							timestamp: draft.createdAt,
							imageBase64,
							mimeType: draft.mimeType,
							prompt: draft.prompt || "",
							aspectRatio: (draft.aspectRatio || "16:9") as AspectRatio,
							style: draft.style as WallpaperStyle | undefined,
							sourceType: "prompt" as SourceType, // Default for cloud-loaded drafts
							dimensions: { width: 1920, height: 1080 }, // Default, could store in metadata
						} satisfies GeneratedWallpaper;
					}),
				);

				// Merge with local drafts (cloud takes precedence)
				const localDrafts = loadLocalWallpaperDrafts();
				const cloudIds = new Set(cloudWallpapers.map((w) => w.id));
				const uniqueLocalDrafts = localDrafts.filter((d) => !cloudIds.has(d.id));

				const merged = [...cloudWallpapers, ...uniqueLocalDrafts];
				setGeneratedWallpapers(merged);

				if (merged.length > 0 && !selectedWallpaperId) {
					setSelectedWallpaperId(merged[0].id);
				}
			}
		} catch (error) {
			console.error("Failed to fetch cloud drafts:", error);
		} finally {
			setIsLoadingCloud(false);
		}
	}, [ordAddress, selectedWallpaperId]);

	// Reset fetch flag when wallet disconnects
	useEffect(() => {
		if (!isCloudEnabled) {
			hasFetchedCloud.current = false;
		}
	}, [isCloudEnabled]);

	// Fetch from cloud when wallet connects (once per session)
	useEffect(() => {
		if (isCloudEnabled && !hasFetchedCloud.current) {
			hasFetchedCloud.current = true;
			fetchFromCloud();
		}
	}, [isCloudEnabled, fetchFromCloud]);

	// Save to localStorage when drafts change (for offline cache)
	useEffect(() => {
		if (hasLoadedDrafts) {
			saveLocalWallpaperDrafts(generatedWallpapers);
		}
	}, [generatedWallpapers, hasLoadedDrafts]);

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

	// Save to cloud storage
	const saveToCloud = useCallback(async (wallpaper: GeneratedWallpaper): Promise<boolean> => {
		if (!ordAddress) return false;

		try {
			const response = await fetch("/api/drafts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: ordAddress,
					type: "wallpaper",
					name: wallpaper.prompt.slice(0, 50) || "Untitled Wallpaper",
					base64: wallpaper.imageBase64,
					mimeType: wallpaper.mimeType,
					metadata: {
						prompt: wallpaper.prompt,
						style: wallpaper.style,
						aspectRatio: wallpaper.aspectRatio,
						sourceType: "ai",
					},
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				console.warn("Failed to save to cloud:", data.error);
				return false;
			}

			const { draft } = await response.json();
			const oldId = wallpaper.id;
			const newId = draft.id;

			// Update the wallpaper with the cloud ID
			setGeneratedWallpapers((prev) =>
				prev.map((w) => (w.id === oldId ? { ...w, id: newId } : w)),
			);

			// Update selectedWallpaperId if it was pointing to the old ID
			setSelectedWallpaperId((prev) => (prev === oldId ? newId : prev));

			// Update usage
			if (cloudUsage) {
				setCloudUsage({ ...cloudUsage, count: cloudUsage.count + 1 });
			}

			return true;
		} catch (error) {
			console.error("Failed to save to cloud:", error);
			return false;
		}
	}, [ordAddress, cloudUsage]);

	// Remove a single wallpaper
	const removeWallpaper = useCallback(async (id: string) => {
		// Remove from cloud if connected
		if (ordAddress) {
			try {
				const params = new URLSearchParams({
					userId: ordAddress,
					type: "wallpaper",
				});
				await fetch(`/api/drafts/${id}?${params}`, { method: "DELETE" });

				// Update usage
				if (cloudUsage) {
					setCloudUsage({ ...cloudUsage, count: Math.max(0, cloudUsage.count - 1) });
				}
			} catch (error) {
				console.error("Failed to delete from cloud:", error);
			}
		}

		setGeneratedWallpapers((prev) => {
			const newWallpapers = prev.filter((w) => w.id !== id);
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
	}, [selectedWallpaperId, updateAmbientColors, ordAddress, cloudUsage]);

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

			// Prepare theme context if enabled
			const themeContext = useThemeContext && selectedTheme ? {
				name: selectedTheme.name,
				mode,
				colors: selectedTheme.styles[mode],
			} : undefined;

			const response = await fetch("/api/generate-wallpaper", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: params.prompt.trim(),
					sourceImage,
					aspectRatio: params.aspectRatio,
					style: params.style,
					paymentTxid,
					themeContext,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to generate wallpaper");
			}

			const data = (await response.json()) as WallpaperGenerationResponse;

			// Create wallpaper record with temporary ID
			const tempId = generateWallpaperId();
			const newWallpaper: GeneratedWallpaper = {
				id: tempId,
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
			setSelectedWallpaperId(tempId);
			updateAmbientColors(newWallpaper);

			// Save to cloud if connected (async, don't block)
			if (isCloudEnabled) {
				saveToCloud(newWallpaper).catch(console.error);
			}

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
		isCloudEnabled,
		saveToCloud,
		useThemeContext,
		selectedTheme,
		mode,
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
				useThemeContext,
				setUseThemeContext,
				selectedTheme,
				setSelectedTheme,
				availableThemes,
				requirePayment,
				setRequirePayment,
				isPaying,
				isGalleryCollapsed,
				setGalleryCollapsed,
				isCloudEnabled,
				isLoadingCloud,
				cloudUsage,
				generate,
				selectWallpaper,
				removeWallpaper,
				clearGallery,
				updateParam,
				setSourcePattern,
				setSourceWallpaper,
				refreshFromCloud: fetchFromCloud,
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
