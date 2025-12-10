"use client";

import {
	createContext,
	useContext,
	useState,
	useCallback,
	useMemo,
	type ReactNode,
	useEffect,
	useRef,
} from "react";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { usePatternDrafts, type PatternDraft } from "@/hooks/use-pattern-drafts";
import { PATTERN_GENERATION_COST_SATS, FEE_ADDRESS } from "@/lib/yours-wallet";
import { toast } from "sonner";
import {
	generatePattern,
	randomSeed,
	DEFAULT_PATTERN_PARAMS,
	type PatternParams,
	type PatternSource,
	type PatternResult,
	type GeoGeneratorType,
	type HeroPatternName,
	type AnimationOptions,
	DEFAULT_ANIMATION_OPTIONS,
} from "@/lib/pattern-engine";

// Re-export types for convenience
export type { PatternParams, PatternSource, GeoGeneratorType, HeroPatternName, AnimationOptions };
export type { PatternDraft };
export { DEFAULT_PATTERN_PARAMS, DEFAULT_ANIMATION_OPTIONS };

export interface PatternHistoryItem {
	id: string;
	timestamp: number;
	params: PatternParams;
	svg: string;
}

export interface UIState {
	isControlsOpen: boolean;
	isPresetsOpen: boolean;
	isHistoryOpen: boolean;
	activeTab: "geopattern" | "hero" | "ai";
}

interface PatternContextType {
	// State
	params: PatternParams;
	setParams: (params: PatternParams | ((prev: PatternParams) => PatternParams)) => void;
	result: PatternResult | null;
	history: PatternHistoryItem[];
	isGenerating: boolean;
	uiState: UIState;
	setUIState: (state: UIState | ((prev: UIState) => UIState)) => void;

	// Payment
	requirePayment: boolean;
	setRequirePayment: (required: boolean) => void;
	isPaying: boolean;

	// Cloud Storage
	cloudDrafts: PatternDraft[];
	isLoadingCloud: boolean;
	isCloudEnabled: boolean;
	cloudUsage: { count: number; limit: number } | null;
	saveDraft: (name?: string) => Promise<PatternDraft | null>;
	deleteDraft: (id: string) => Promise<boolean>;
	loadDraft: (draft: PatternDraft) => void;
	refreshCloudDrafts: () => Promise<void>;

	// Actions
	regenerate: () => void;
	updateParam: <K extends keyof PatternParams>(key: K, value: PatternParams[K]) => void;
	updateAnimation: <K extends keyof AnimationOptions>(key: K, value: AnimationOptions[K]) => void;
	setSource: (source: PatternSource) => void;
	setGeoGenerator: (gen: GeoGeneratorType) => void;
	setHeroPattern: (pattern: HeroPatternName) => void;
	randomize: () => void;
	loadFromHistory: (item: PatternHistoryItem) => void;
	generateAI: (prompt: string) => Promise<void>;

	// Derived
	svgDataUrl: string;
	cssSnippet: string;
}

const PatternContext = createContext<PatternContextType | undefined>(undefined);

export function PatternProvider({ children }: { children: ReactNode }) {
	// Core state
	const [params, setParams] = useState<PatternParams>(DEFAULT_PATTERN_PARAMS);
	const [result, setResult] = useState<PatternResult | null>(null);
	const [history, setHistory] = useState<PatternHistoryItem[]>([]);
	const [isGenerating, setIsGenerating] = useState(false);
	const [uiState, setUIState] = useState<UIState>({
		isControlsOpen: true,
		isPresetsOpen: false,
		isHistoryOpen: false,
		activeTab: "geopattern",
	});

	// Payment
	const [requirePayment, setRequirePayment] = useState(false);
	const [isPaying, setIsPaying] = useState(false);
	const { status, connect, balance, sendPayment } = useYoursWallet();
	const isConnected = status === "connected";

	// Cloud storage
	const {
		drafts: cloudDrafts,
		loading: isLoadingCloud,
		usage: cloudUsage,
		isCloudEnabled,
		fetchDrafts: fetchCloudDrafts,
		saveDraft: saveCloudDraft,
		deleteDraft: deleteCloudDraft,
	} = usePatternDrafts();

	// Generate pattern from current params
	const regenerate = useCallback(() => {
		try {
			const newResult = generatePattern(params);
			setResult(newResult);
			
			// Add to history
			setHistory((prev) => [
				{
					id: Date.now().toString(),
					timestamp: Date.now(),
					params: { ...params },
					svg: newResult.svg,
				},
				...prev.slice(0, 19), // Keep last 20
			]);
		} catch (error) {
			console.error("Pattern generation error:", error);
			toast.error("Failed to generate pattern");
		}
	}, [params]);

	// Auto-regenerate when params change (for non-AI sources)
	// Using JSON.stringify to detect actual param changes
	const paramsKey = JSON.stringify([
		params.source,
		params.geoSeed,
		params.geoGenerator,
		params.heroPattern,
		params.foregroundColor,
		params.opacity,
		params.scale,
	]);
	
	// Track if we're mounted (client-side)
	const [isMounted, setIsMounted] = useState(false);
	
	useEffect(() => {
		setIsMounted(true);
	}, []);
	
	useEffect(() => {
		// Only run on client-side after mount
		if (!isMounted) return;
		
		if (params.source !== "ai") {
			try {
				const newResult = generatePattern(params);
				setResult(newResult);
			} catch (error) {
				console.error("Pattern generation error:", error);
			}
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isMounted, paramsKey]);

	// Update a single param
	const updateParam = useCallback(<K extends keyof PatternParams>(key: K, value: PatternParams[K]) => {
		setParams((prev) => ({ ...prev, [key]: value }));
	}, []);

	// Update animation options
	const updateAnimation = useCallback(<K extends keyof AnimationOptions>(key: K, value: AnimationOptions[K]) => {
		setParams((prev) => ({
			...prev,
			animation: { ...prev.animation, [key]: value },
		}));
	}, []);

	// Source switching helpers
	const setSource = useCallback((source: PatternSource) => {
		setParams((prev) => ({ ...prev, source }));
		setUIState((prev) => ({ ...prev, activeTab: source }));
	}, []);

	const setGeoGenerator = useCallback((gen: GeoGeneratorType) => {
		setParams((prev) => ({
			...prev,
			source: "geopattern",
			geoGenerator: gen,
			geoSeed: randomSeed(), // New seed for variety
		}));
	}, []);

	const setHeroPattern = useCallback((pattern: HeroPatternName) => {
		setParams((prev) => ({
			...prev,
			source: "hero",
			heroPattern: pattern,
		}));
	}, []);

	// Randomize
	const randomize = useCallback(() => {
		setParams((prev) => ({
			...prev,
			geoSeed: randomSeed(),
			opacity: Math.floor(Math.random() * 60) + 20,
			scale: Math.floor(Math.random() * 150) + 50,
		}));
	}, []);

	// Load from history
	const loadFromHistory = useCallback((item: PatternHistoryItem) => {
		setParams(item.params);
	}, []);

	// Cloud storage functions
	const saveDraft = useCallback(
		async (name?: string): Promise<PatternDraft | null> => {
			if (!result?.svg) {
				toast.error("No pattern to save");
				return null;
			}

			const draftName =
				name ||
				(params.source === "ai"
					? params.aiPrompt?.slice(0, 50) || "AI Pattern"
					: `${params.source} pattern`);

			const draft = await saveCloudDraft(
				result.svg,
				draftName,
				params.source === "ai" ? params.aiPrompt : undefined,
			);

			if (draft) {
				toast.success("Pattern saved to cloud");
			} else {
				toast.error("Failed to save pattern");
			}

			return draft;
		},
		[result?.svg, params.source, params.aiPrompt, saveCloudDraft],
	);

	const deleteDraft = useCallback(
		async (id: string): Promise<boolean> => {
			const success = await deleteCloudDraft(id);
			if (success) {
				toast.success("Pattern deleted");
			} else {
				toast.error("Failed to delete pattern");
			}
			return success;
		},
		[deleteCloudDraft],
	);

	const loadDraft = useCallback((draft: PatternDraft) => {
		if (!draft.svg) {
			toast.error("Pattern has no SVG data");
			return;
		}

		// Load as AI-generated pattern with the saved SVG
		setParams((prev) => ({
			...prev,
			source: "ai",
			aiPrompt: draft.prompt || "",
			aiSvg: draft.svg,
		}));

		toast.success("Pattern loaded");
	}, []);

	const refreshCloudDrafts = useCallback(async () => {
		await fetchCloudDrafts();
	}, [fetchCloudDrafts]);

	// AI generation
	const generateAI = useCallback(async (prompt: string) => {
		if (!prompt.trim()) return;

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

			const hasBalance = (balance?.satoshis ?? 0) >= PATTERN_GENERATION_COST_SATS;
			if (!hasBalance) {
				toast.error("Insufficient balance");
				return;
			}
		}

		setIsGenerating(true);

		try {
			let paymentTxid = "free-tier";

			if (requirePayment) {
				setIsPaying(true);
				const paymentResult = await sendPayment(FEE_ADDRESS, PATTERN_GENERATION_COST_SATS);
				setIsPaying(false);

				if (!paymentResult) {
					throw new Error("Payment failed");
				}
				paymentTxid = paymentResult.txid;
			}

			const response = await fetch("/api/generate-pattern", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: prompt.trim(),
					colorMode: "currentColor",
					paymentTxid,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to generate pattern");
			}

			const data = await response.json();
			
			// Update params with AI result
			setParams((prev) => ({
				...prev,
				source: "ai",
				aiPrompt: prompt,
				aiSvg: data.svg,
			}));

			toast.success("Pattern generated!");
		} catch (error) {
			console.error("AI generation error:", error);
			toast.error(error instanceof Error ? error.message : "Generation failed");
		} finally {
			setIsGenerating(false);
			setIsPaying(false);
		}
	}, [requirePayment, isConnected, connect, balance, sendPayment]);

	// Derived values
	const svgDataUrl = useMemo(() => {
		if (!result?.svg) return "";
		// Replace currentColor with white for mask-image
		const maskSvg = result.svg.replace(/currentColor/gi, "#ffffff");
		return `data:image/svg+xml,${encodeURIComponent(maskSvg)}`;
	}, [result?.svg]);

	const cssSnippet = useMemo(() => {
		if (!result?.svg) return "";
		const encoded = encodeURIComponent(result.svg);
		return `.pattern-bg {
  background-color: ${params.backgroundColor};
  background-image: url("data:image/svg+xml,${encoded}");
  background-repeat: repeat;
  background-size: ${params.scale}px ${params.scale}px;
}`;
	}, [result?.svg, params.backgroundColor, params.scale]);

	return (
		<PatternContext.Provider
			value={{
				params,
				setParams,
				result,
				history,
				isGenerating,
				uiState,
				setUIState,
				requirePayment,
				setRequirePayment,
				isPaying,
				// Cloud storage
				cloudDrafts,
				isLoadingCloud,
				isCloudEnabled,
				cloudUsage,
				saveDraft,
				deleteDraft,
				loadDraft,
				refreshCloudDrafts,
				// Actions
				regenerate,
				updateParam,
				updateAnimation,
				setSource,
				setGeoGenerator,
				setHeroPattern,
				randomize,
				loadFromHistory,
				generateAI,
				svgDataUrl,
				cssSnippet,
			}}
		>
			{children}
		</PatternContext.Provider>
	);
}

export function usePatternContext() {
	const context = useContext(PatternContext);
	if (context === undefined) {
		throw new Error("usePatternContext must be used within a PatternProvider");
	}
	return context;
}
