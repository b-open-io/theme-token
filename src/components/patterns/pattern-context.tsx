"use client";

import {
	createContext,
	useContext,
	useState,
	useCallback,
	useMemo,
	useRef,
	type ReactNode,
	useEffect,
} from "react";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { PATTERN_GENERATION_COST_SATS, FEE_ADDRESS } from "@/lib/yours-wallet";
import { toast } from "sonner";

/**
 * Resolve currentColor and CSS variables in SVG to actual hex colors.
 * This is needed because SVGs in background-images can't inherit CSS.
 */
function resolveColorsInSvg(svg: string, foregroundColor: string): string {
	// Replace currentColor with the resolved foreground color
	let resolved = svg.replace(/currentColor/gi, foregroundColor);
	
	// Replace hsl(var(--xxx)) patterns - these also don't work in background-image
	// For now, we replace common theme tokens with the foreground color
	// A more complete solution would resolve each variable
	resolved = resolved.replace(/hsl\(var\(--foreground\)\)/gi, foregroundColor);
	resolved = resolved.replace(/hsl\(var\(--primary\)\)/gi, foregroundColor);
	
	return resolved;
}

// Types
export type ColorMode = "currentColor" | "theme" | "grayscale";
export type GeneratorType = "ai" | "scatter" | "grid" | "waves" | "stripes" | "noise" | "topo" | "parallelogram";
export type ShapeType = "circle" | "square" | "triangle" | "star" | "hexagon" | "emoji" | "text";

export interface PatternParams {
    // Geometric
	scale: number; // Grid/Tile size
	strokeWidth: number;
	density: number;
	jitter: number;
	rotation: number;
	spacing: number;
	symmetry: "none" | "mirror" | "radial";
	seed: number;
    
    // Ranges (Advanced)
    sizeRange: [number, number]; // Min/Max element size
    opacityRange: [number, number]; // Min/Max opacity
    
    // Appearance
    opacity: number; // Global opacity
    strokeColor: string;
    backgroundColor: string;
    
    // Animation
    animateRotation: boolean;
    animateScale: boolean;
    animateOpacity: boolean;
    animatePosition: boolean; // Translation
    animationDuration: number;

    // Generator & Shape
    generatorType: GeneratorType;
    shape: ShapeType;
    customSymbol: string;
}

export interface PatternState {
	svg: string;
	prompt: string;
	colorMode: ColorMode;
	provider: string;
	model: string;
}

export interface PatternHistoryItem {
	id: string;
	timestamp: number;
	pattern: PatternState;
	params: PatternParams;
}

export interface UIState {
	isControlsOpen: boolean;
	isPresetsOpen: boolean;
	isHistoryOpen: boolean;
	isPreviewExpanded: boolean;
	activePopover: string | null;
}

interface PatternContextType {
	// State
	prompt: string;
	setPrompt: (prompt: string) => void;
	patternParams: PatternParams;
	setPatternParams: (params: PatternParams | ((prev: PatternParams) => PatternParams)) => void;
	pattern: PatternState | null;
	setPattern: (pattern: PatternState | null) => void;
	history: PatternHistoryItem[];
	isGenerating: boolean;
	uiState: UIState;
	setUIState: (state: UIState | ((prev: UIState) => UIState)) => void;
	
	// Payment & Wallet
	requirePayment: boolean;
	setRequirePayment: (required: boolean) => void;
	isPaying: boolean;
	paymentError: string | null;
	
	// Actions
	generatePattern: () => Promise<void>;
	applyPreset: (preset: { prompt: string; params?: Partial<PatternParams> }) => void;
	updateParam: <K extends keyof PatternParams>(key: K, value: PatternParams[K]) => void;
	randomizeParams: () => void;
	addToHistory: (pattern: PatternState) => void;
	loadFromHistory: (item: PatternHistoryItem) => void;
	
	// Derived
	svgDataUrl: string;
	cssSnippet: string;
	estimatedCost: number;
}

const DEFAULT_PARAMS: PatternParams = {
	scale: 24,
	strokeWidth: 1,
	density: 50,
	jitter: 0,
	rotation: 0,
	spacing: 10,
	symmetry: "none",
	seed: 12345,
    sizeRange: [1, 28],
    opacityRange: [30, 100],
    opacity: 100,
    strokeColor: "currentColor",
    backgroundColor: "transparent",
    animateRotation: false,
    animateScale: false,
    animateOpacity: false,
    animatePosition: false,
    animationDuration: 10,
    generatorType: "ai",
    shape: "circle",
    customSymbol: "",
};

const PatternContext = createContext<PatternContextType | undefined>(undefined);

export function PatternProvider({ children }: { children: ReactNode }) {
	// State
	const [prompt, setPrompt] = useState("");
	const [patternParams, setPatternParams] = useState<PatternParams>(DEFAULT_PARAMS);
	const [pattern, setPattern] = useState<PatternState | null>(null);
	const [history, setHistory] = useState<PatternHistoryItem[]>([]);
	const [isGenerating, setIsGenerating] = useState(false);
	const [uiState, setUIState] = useState<UIState>({
		isControlsOpen: true,
		isPresetsOpen: false,
		isHistoryOpen: false,
		isPreviewExpanded: false,
		activePopover: null,
	});

	// Payment State
	const [requirePayment, setRequirePayment] = useState(false);
	const [isPaying, setIsPaying] = useState(false);
	const [paymentError, setPaymentError] = useState<string | null>(null);

	// Wallet
	const { status, connect, balance, sendPayment } = useYoursWallet();
	const isConnected = status === "connected";

	// Actions
	const updateParam = useCallback(<K extends keyof PatternParams>(key: K, value: PatternParams[K]) => {
		setPatternParams((prev) => ({ ...prev, [key]: value }));
	}, []);

	const randomizeParams = useCallback(() => {
		setPatternParams((prev) => ({
			...prev,
			seed: Math.floor(Math.random() * 100000),
			density: Math.floor(Math.random() * 100),
			jitter: Math.floor(Math.random() * 50),
			rotation: Math.floor(Math.random() * 360),
            sizeRange: [Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 30) + 10],
            opacityRange: [Math.floor(Math.random() * 50), 100],
            animateRotation: Math.random() > 0.7,
            animateScale: Math.random() > 0.8,
		}));
	}, []);

	const addToHistory = useCallback((newPattern: PatternState) => {
		setHistory((prev) => [
			{
				id: Date.now().toString(),
				timestamp: Date.now(),
				pattern: newPattern,
				params: { ...patternParams }, // snapshot params
			},
			...prev.slice(0, 9), // Keep last 10
		]);
	}, [patternParams]);

	const loadFromHistory = useCallback((item: PatternHistoryItem) => {
		setPattern(item.pattern);
		setPatternParams(item.params);
		setPrompt(item.pattern.prompt);
	}, []);

	const applyPreset = useCallback((preset: { prompt: string; params?: Partial<PatternParams> }) => {
		setPrompt(preset.prompt);
		if (preset.params) {
			setPatternParams((prev) => ({ ...prev, ...preset.params }));
		}
	}, []);

	const generatePattern = useCallback(async () => {
		if (!prompt.trim()) return;

		// Check wallet connection and balance only if payment is required
		if (requirePayment) {
			if (!isConnected) {
				try {
					await connect();
				} catch {
					const error = "Please connect your wallet to generate patterns";
					setPaymentError(error);
					toast.error(error);
					return;
				}
				return;
			}

			const hasEnoughBalance = (balance?.satoshis ?? 0) >= PATTERN_GENERATION_COST_SATS;
			if (!hasEnoughBalance) {
				const error = `Insufficient balance. You need at least ${(PATTERN_GENERATION_COST_SATS / 100_000_000).toFixed(4)} BSV.`;
				setPaymentError(error);
				toast.error(error);
				return;
			}
		}

		setPaymentError(null);
		setIsGenerating(true);

		try {
			let paymentTxid = "free-tier";

			// Process payment only if required
			if (requirePayment) {
				setIsPaying(true);
				const paymentResult = await sendPayment(FEE_ADDRESS, PATTERN_GENERATION_COST_SATS);
				setIsPaying(false);

				if (!paymentResult) {
					throw new Error("Payment failed or was cancelled");
				}
				paymentTxid = paymentResult.txid;
			}

			// Generate pattern
			const response = await fetch("/api/generate-pattern", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: prompt.trim(),
					colorMode: "currentColor", // Always use currentColor
					paymentTxid,
					// Send params if API supports them
                    ...patternParams
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to generate pattern");
			}

			const data = await response.json();
			const newPattern = {
				svg: data.svg,
				prompt: prompt.trim(),
				colorMode: "currentColor" as ColorMode,
				provider: data.provider,
				model: data.model,
			};

			setPattern(newPattern);
			addToHistory(newPattern);
			toast.success("Pattern generated!");
		} catch (error) {
			console.error("Error generating pattern:", error);
			const errorMessage = error instanceof Error ? error.message : "Generation failed";
			setPaymentError(errorMessage);
			toast.error(errorMessage);
			setIsPaying(false);
		} finally {
			setIsGenerating(false);
		}
	}, [prompt, requirePayment, isConnected, connect, balance, sendPayment, addToHistory, patternParams]);

	// Track foreground color for SVG color resolution
	const [foregroundColor, setForegroundColor] = useState("#ffffff");
	
	useEffect(() => {
		// Get the computed foreground color from CSS variables
		const updateForegroundColor = () => {
			if (typeof document === "undefined") return;
			const style = getComputedStyle(document.documentElement);
			const fgHsl = style.getPropertyValue("--foreground").trim();
			if (fgHsl) {
				// The CSS variable contains HSL values like "0 0% 100%"
				setForegroundColor(`hsl(${fgHsl})`);
			}
		};
		
		updateForegroundColor();
		
		// Listen for theme changes
		const observer = new MutationObserver(updateForegroundColor);
		observer.observe(document.documentElement, { 
			attributes: true, 
			attributeFilter: ["class", "style"] 
		});
		
		return () => observer.disconnect();
	}, []);

	// Derived
	const svgDataUrl = useMemo(() => {
		if (!pattern?.svg) return "";
		// Resolve currentColor to actual foreground color so it shows in background-image
		// SVGs in data URLs can't inherit CSS colors from the document
		const resolvedSvg = resolveColorsInSvg(pattern.svg, foregroundColor);
		const encoded = encodeURIComponent(resolvedSvg);
		return `data:image/svg+xml,${encoded}`;
	}, [pattern?.svg, foregroundColor]);

	const cssSnippet = useMemo(() => {
		if (!pattern?.svg) return "";
		const encoded = encodeURIComponent(pattern.svg);
		return `.pattern-bg {
  background-color: ${patternParams.backgroundColor};
  color: ${patternParams.strokeColor};
  background-image: url("data:image/svg+xml,${encoded}");
  background-repeat: repeat;
  background-size: ${patternParams.scale}px ${patternParams.scale}px;
  opacity: ${patternParams.opacity / 100};
}`;
	}, [pattern?.svg, patternParams.scale, patternParams.opacity, patternParams.backgroundColor, patternParams.strokeColor]);

	const estimatedCost = pattern?.svg ? pattern.svg.length + 500 : 0;

	return (
		<PatternContext.Provider
			value={{
				prompt,
				setPrompt,
				patternParams,
				setPatternParams,
				pattern,
				setPattern,
				history,
				isGenerating,
				uiState,
				setUIState,
				requirePayment,
				setRequirePayment,
				isPaying,
				paymentError,
				generatePattern,
				applyPreset,
				updateParam,
				randomizeParams,
				addToHistory,
				loadFromHistory,
				svgDataUrl,
				cssSnippet,
				estimatedCost,
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
