"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2, Pipette } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorPicker } from "@/components/ui/color-picker";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
	fetchTintsPalette,
	getComplementaryColor,
	getTriadicColor,
	paletteToArray,
	type TintsPalette,
} from "@/lib/tints";
import { oklchToHex, parseOklch } from "@/lib/color-utils";

// Helper to convert any color format to hex
function toHex(color: string): string {
	if (color.startsWith("#")) return color;
	if (color.startsWith("oklch")) {
		const parsed = parseOklch(color);
		if (parsed) return oklchToHex(parsed);
	}
	// For other formats, return as-is (will fail hex validation and use default)
	return color;
}

// Theme color keys that can be assigned - organized by category
const THEME_COLOR_KEYS = [
	// Primary colors
	{ key: "primary", label: "Primary", category: "Primary" },
	{ key: "primary-foreground", label: "Primary Foreground", category: "Primary" },
	// Secondary colors
	{ key: "secondary", label: "Secondary", category: "Secondary" },
	{ key: "secondary-foreground", label: "Secondary Foreground", category: "Secondary" },
	// Background & Foreground
	{ key: "background", label: "Background", category: "Background" },
	{ key: "foreground", label: "Foreground", category: "Background" },
	// Card & Popover
	{ key: "card", label: "Card", category: "Card & Popover" },
	{ key: "card-foreground", label: "Card Foreground", category: "Card & Popover" },
	{ key: "popover", label: "Popover", category: "Card & Popover" },
	{ key: "popover-foreground", label: "Popover Foreground", category: "Card & Popover" },
	// Accent & Muted
	{ key: "accent", label: "Accent", category: "Accent & Muted" },
	{ key: "accent-foreground", label: "Accent Foreground", category: "Accent & Muted" },
	{ key: "muted", label: "Muted", category: "Accent & Muted" },
	{ key: "muted-foreground", label: "Muted Foreground", category: "Accent & Muted" },
	// Borders & Input
	{ key: "border", label: "Border", category: "Borders & Input" },
	{ key: "input", label: "Input", category: "Borders & Input" },
	{ key: "ring", label: "Ring", category: "Borders & Input" },
	// Destructive
	{ key: "destructive", label: "Destructive", category: "Destructive" },
	{ key: "destructive-foreground", label: "Destructive Foreground", category: "Destructive" },
	// Chart colors
	{ key: "chart-1", label: "Chart 1", category: "Chart" },
	{ key: "chart-2", label: "Chart 2", category: "Chart" },
	{ key: "chart-3", label: "Chart 3", category: "Chart" },
	{ key: "chart-4", label: "Chart 4", category: "Chart" },
	{ key: "chart-5", label: "Chart 5", category: "Chart" },
	// Sidebar colors
	{ key: "sidebar", label: "Sidebar", category: "Sidebar" },
	{ key: "sidebar-foreground", label: "Sidebar Foreground", category: "Sidebar" },
	{ key: "sidebar-primary", label: "Sidebar Primary", category: "Sidebar" },
	{ key: "sidebar-primary-foreground", label: "Sidebar Primary FG", category: "Sidebar" },
	{ key: "sidebar-accent", label: "Sidebar Accent", category: "Sidebar" },
	{ key: "sidebar-accent-foreground", label: "Sidebar Accent FG", category: "Sidebar" },
	{ key: "sidebar-border", label: "Sidebar Border", category: "Sidebar" },
	{ key: "sidebar-ring", label: "Sidebar Ring", category: "Sidebar" },
] as const;

// Theme swatches - 11 items per row to match palette generator
// Row 1: Backgrounds & surfaces
const THEME_SWATCHES_ROW1 = [
	{ name: "BG", cssVar: "background" },
	{ name: "FG", cssVar: "foreground" },
	{ name: "Card", cssVar: "card" },
	{ name: "Popover", cssVar: "popover" },
	{ name: "Muted", cssVar: "muted" },
	{ name: "Border", cssVar: "border" },
	{ name: "Input", cssVar: "input" },
	{ name: "Ring", cssVar: "ring" },
	{ name: "C1", cssVar: "chart-1" },
	{ name: "C2", cssVar: "chart-2" },
	{ name: "C3", cssVar: "chart-3" },
];

// Row 2: Primary & semantic colors
const THEME_SWATCHES_ROW2 = [
	{ name: "Primary", cssVar: "primary" },
	{ name: "PriFG", cssVar: "primary-foreground" },
	{ name: "Secondary", cssVar: "secondary" },
	{ name: "SecFG", cssVar: "secondary-foreground" },
	{ name: "Accent", cssVar: "accent" },
	{ name: "AccFG", cssVar: "accent-foreground" },
	{ name: "Destruct", cssVar: "destructive" },
	{ name: "DesFG", cssVar: "destructive-foreground" },
	{ name: "C4", cssVar: "chart-4" },
	{ name: "C5", cssVar: "chart-5" },
	{ name: "MutedFG", cssVar: "muted-foreground" },
];

// Row 3: Foreground variants & additional
const THEME_SWATCHES_ROW3 = [
	{ name: "CardFG", cssVar: "card-foreground" },
	{ name: "PopFG", cssVar: "popover-foreground" },
	{ name: "MutedFG", cssVar: "muted-foreground" },
	{ name: "C4", cssVar: "chart-4" },
	{ name: "C5", cssVar: "chart-5" },
	{ name: "Sidebar", cssVar: "sidebar" },
	{ name: "SideFG", cssVar: "sidebar-foreground" },
	{ name: "SidePri", cssVar: "sidebar-primary" },
	{ name: "SideAcc", cssVar: "sidebar-accent" },
	{ name: "SideBdr", cssVar: "sidebar-border" },
	{ name: "SideRng", cssVar: "sidebar-ring" },
];

interface ThemeColors {
	[key: string]: string | undefined;
}

interface ColorPaletteSectionProps {
	onUpdateColor?: (key: string, value: string) => void;
	primaryColor?: string;
	themeColors?: ThemeColors;
}

// Palette swatch - for palette generator (can apply to theme keys)
function PaletteSwatch({
	color,
	label,
	onApplyColor,
}: {
	color: string;
	label: string;
	onApplyColor?: (key: string, value: string) => void;
}) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(color);
		setCopied(true);
		toast.success("Copied", { description: color });
		setTimeout(() => setCopied(false), 1000);
	};

	const handleApply = (key: string) => {
		onApplyColor?.(key, color);
		toast.success("Applied", { description: `Set ${key} to ${color}` });
	};

	const buttonContent = (
		<button
			onClick={handleCopy}
			className="group relative flex h-7 flex-1 items-center justify-center rounded border border-border/30 text-[8px] font-medium transition-all hover:scale-105 hover:border-border hover:z-10"
			style={{ backgroundColor: color }}
			title={`${label}: ${color}`}
		>
			<span className="opacity-0 group-hover:opacity-100 transition-opacity text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
				{copied ? <Check className="h-2.5 w-2.5" /> : label}
			</span>
		</button>
	);

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{buttonContent}</ContextMenuTrigger>
			<ContextMenuContent className="w-44">
				<ContextMenuItem onClick={handleCopy}>
					<Copy className="mr-2 h-3 w-3" />
					<span className="text-xs">Copy {color}</span>
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<Pipette className="mr-2 h-3 w-3" />
						<span className="text-xs">Apply as...</span>
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48 max-h-80 overflow-y-auto">
						{Array.from(new Set(THEME_COLOR_KEYS.map(k => k.category))).map((category, idx) => (
							<div key={category}>
								{idx > 0 && <ContextMenuSeparator />}
								<ContextMenuLabel className="text-[10px] text-muted-foreground">
									{category}
								</ContextMenuLabel>
								{THEME_COLOR_KEYS.filter(k => k.category === category).map(({ key, label: keyLabel }) => (
									<ContextMenuItem
										key={key}
										onClick={() => handleApply(key)}
										className="text-xs"
									>
										{keyLabel}
									</ContextMenuItem>
								))}
							</div>
						))}
					</ContextMenuSubContent>
				</ContextMenuSub>
			</ContextMenuContent>
		</ContextMenu>
	);
}

// Theme swatch - for active theme display (can pick from palette colors)
function ThemeSwatch({
	color,
	label,
	cssVar,
	paletteColors,
	onApplyFromPalette,
}: {
	color?: string;
	label: string;
	cssVar: string;
	paletteColors: string[];
	onApplyFromPalette?: (key: string, value: string) => void;
}) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		const value = color || `var(--${cssVar})`;
		await navigator.clipboard.writeText(value);
		setCopied(true);
		toast.success("Copied", { description: value });
		setTimeout(() => setCopied(false), 1000);
	};

	const handleApplyFromPalette = (paletteColor: string) => {
		onApplyFromPalette?.(cssVar, paletteColor);
		toast.success("Applied", { description: `Set ${cssVar} to ${paletteColor}` });
	};

	const buttonContent = (
		<button
			onClick={handleCopy}
			className="group relative flex h-7 flex-1 items-center justify-center rounded border border-border/30 text-[8px] font-medium transition-all hover:scale-105 hover:border-border hover:z-10"
			style={color ? { backgroundColor: color } : undefined}
			title={color ? `${label}: ${color}` : `Copy var(--${cssVar})`}
		>
			<span className="opacity-0 group-hover:opacity-100 transition-opacity text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
				{copied ? <Check className="h-2.5 w-2.5" /> : label}
			</span>
		</button>
	);

	// No context menu if no palette colors or no update handler
	if (paletteColors.length === 0 || !onApplyFromPalette) {
		return buttonContent;
	}

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{buttonContent}</ContextMenuTrigger>
			<ContextMenuContent className="w-auto">
				<ContextMenuItem onClick={handleCopy}>
					<Copy className="mr-2 h-3 w-3" />
					<span className="text-xs">Copy {color || `var(--${cssVar})`}</span>
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuLabel className="text-[10px] text-muted-foreground px-2">
					Apply from palette
				</ContextMenuLabel>
				{/* Color grid - 11 colors per row to match palette */}
				<div className="px-2 pb-2 pt-1">
					<div className="grid grid-cols-11 gap-0.5">
						{paletteColors.map((paletteColor, idx) => (
							<button
								key={idx}
								onClick={() => handleApplyFromPalette(paletteColor)}
								className="h-5 w-5 rounded border border-border/50 transition-all hover:scale-110 hover:border-border hover:z-10"
								style={{ backgroundColor: paletteColor }}
								title={paletteColor}
							/>
						))}
					</div>
				</div>
			</ContextMenuContent>
		</ContextMenu>
	);
}

export function ColorPaletteSection({ onUpdateColor, primaryColor, themeColors }: ColorPaletteSectionProps) {
	const [color, setColor] = useState(primaryColor || "#3B82F6");
	const [primaryPalette, setPrimaryPalette] = useState<TintsPalette | null>(null);
	const [complementaryPalette, setComplementaryPalette] = useState<TintsPalette | null>(null);
	const [triadicPalette, setTriadicPalette] = useState<TintsPalette | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Auto-generate on mount and when primaryColor changes
	useEffect(() => {
		const generate = async (inputColor: string) => {
			const hex = inputColor.replace(/^#/, "");
			if (hex.length !== 6) return;

			setIsLoading(true);

			const primary = await fetchTintsPalette("primary", hex);
			const complementaryHex = getComplementaryColor(inputColor);
			const complementary = await fetchTintsPalette("complementary", complementaryHex.replace("#", ""));
			const triadicHex = getTriadicColor(inputColor);
			const triadic = await fetchTintsPalette("triadic", triadicHex.replace("#", ""));

			if (primary) setPrimaryPalette(primary);
			if (complementary) setComplementaryPalette(complementary);
			if (triadic) setTriadicPalette(triadic);

			setIsLoading(false);
		};

		const rawColor = primaryColor || "#3B82F6";
		const hexColor = toHex(rawColor);
		setColor(hexColor);
		generate(hexColor);
	}, [primaryColor]);

	const handleGenerate = async () => {
		const hex = color.replace(/^#/, "");
		if (hex.length !== 6) return;

		setIsLoading(true);

		const primary = await fetchTintsPalette("primary", hex);
		const complementaryHex = getComplementaryColor(color);
		const complementary = await fetchTintsPalette("complementary", complementaryHex.replace("#", ""));
		const triadicHex = getTriadicColor(color);
		const triadic = await fetchTintsPalette("triadic", triadicHex.replace("#", ""));

		if (primary) setPrimaryPalette(primary);
		if (complementary) setComplementaryPalette(complementary);
		if (triadic) setTriadicPalette(triadic);

		setIsLoading(false);
	};

	const primaryArray = primaryPalette ? paletteToArray(primaryPalette) : [];
	const complementaryArray = complementaryPalette ? paletteToArray(complementaryPalette) : [];
	const triadicArray = triadicPalette ? paletteToArray(triadicPalette) : [];

	// All palette colors combined for theme swatch picker (3 rows x 11 colors = 33 total)
	const allPaletteColors = [
		...primaryArray.map(p => p.color),
		...triadicArray.map(p => p.color),
		...complementaryArray.map(p => p.color),
	];

	return (
		<div className="grid gap-3 @2xl:grid-cols-3">
			{/* Palette Generator - 2/3 width */}
			<Card className="@2xl:col-span-2">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3">
					<CardTitle className="text-xs font-medium">Palette Generator</CardTitle>
					<div className="flex items-center gap-1.5">
						<ColorPicker
							value={color}
							onChange={setColor}
							className="h-6 w-6 rounded"
						/>
						<input
							type="text"
							value={color}
							onChange={(e) => setColor(e.target.value)}
							className="h-6 w-20 rounded border border-border bg-background px-1.5 font-mono text-[10px] uppercase focus:border-primary focus:outline-none"
						/>
						<button
							onClick={handleGenerate}
							disabled={isLoading}
							className="flex h-6 items-center gap-1 rounded bg-primary px-2 text-[10px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
						>
							{isLoading ? (
								<Loader2 className="h-2.5 w-2.5 animate-spin" />
							) : (
								<Pipette className="h-2.5 w-2.5" />
							)}
							Generate
						</button>
					</div>
				</CardHeader>
				<CardContent className="grid gap-1.5 px-3 pt-0">
					{/* Primary Scale (0°) */}
					<div className="flex gap-0.5">
						{primaryArray.map(({ shade, color: c }) => (
							<PaletteSwatch
								key={shade}
								label={shade}
								color={c}
								onApplyColor={onUpdateColor}
							/>
						))}
					</div>

					{/* Triadic Scale (+120°) */}
					<div className="flex gap-0.5">
						{triadicArray.map(({ shade, color: c }) => (
							<PaletteSwatch
								key={shade}
								label={shade}
								color={c}
								onApplyColor={onUpdateColor}
							/>
						))}
					</div>

					{/* Complementary Scale (+180°) */}
					<div className="flex gap-0.5">
						{complementaryArray.map(({ shade, color: c }) => (
							<PaletteSwatch
								key={shade}
								label={shade}
								color={c}
								onApplyColor={onUpdateColor}
							/>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Theme Colors - 1/3 width */}
			<Card>
				<CardHeader className="py-2 px-3">
					<CardTitle className="text-xs font-medium">Active Theme</CardTitle>
				</CardHeader>
				<CardContent className="px-3 pt-0">
					<div className="grid gap-1.5">
						<div className="flex gap-0.5">
							{THEME_SWATCHES_ROW1.map((swatch) => (
								<ThemeSwatch
									key={swatch.name}
									label={swatch.name}
									cssVar={swatch.cssVar}
									color={themeColors?.[swatch.cssVar]}
									paletteColors={allPaletteColors}
									onApplyFromPalette={onUpdateColor}
								/>
							))}
						</div>
						<div className="flex gap-0.5">
							{THEME_SWATCHES_ROW2.map((swatch) => (
								<ThemeSwatch
									key={swatch.name}
									label={swatch.name}
									cssVar={swatch.cssVar}
									color={themeColors?.[swatch.cssVar]}
									paletteColors={allPaletteColors}
									onApplyFromPalette={onUpdateColor}
								/>
							))}
						</div>
						<div className="flex gap-0.5">
							{THEME_SWATCHES_ROW3.map((swatch) => (
								<ThemeSwatch
									key={swatch.name}
									label={swatch.name}
									cssVar={swatch.cssVar}
									color={themeColors?.[swatch.cssVar]}
									paletteColors={allPaletteColors}
									onApplyFromPalette={onUpdateColor}
								/>
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
