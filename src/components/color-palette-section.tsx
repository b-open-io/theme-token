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
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
	fetchTintsPalette,
	getComplementaryColor,
	paletteToArray,
	type TintsPalette,
} from "@/lib/tints";

// Theme color keys that can be assigned
const THEME_COLOR_KEYS = [
	{ key: "background", label: "Background" },
	{ key: "foreground", label: "Foreground" },
	{ key: "card", label: "Card" },
	{ key: "card-foreground", label: "Card Foreground" },
	{ key: "primary", label: "Primary" },
	{ key: "primary-foreground", label: "Primary Foreground" },
	{ key: "secondary", label: "Secondary" },
	{ key: "secondary-foreground", label: "Secondary Foreground" },
	{ key: "muted", label: "Muted" },
	{ key: "muted-foreground", label: "Muted Foreground" },
	{ key: "accent", label: "Accent" },
	{ key: "accent-foreground", label: "Accent Foreground" },
	{ key: "destructive", label: "Destructive" },
	{ key: "border", label: "Border" },
	{ key: "input", label: "Input" },
	{ key: "ring", label: "Ring" },
] as const;

// Current theme swatches for compact display
const THEME_SWATCHES = [
	{ name: "BG", bgClass: "bg-background", cssVar: "background" },
	{ name: "Card", bgClass: "bg-card", cssVar: "card" },
	{ name: "Primary", bgClass: "bg-primary", cssVar: "primary" },
	{ name: "Secondary", bgClass: "bg-secondary", cssVar: "secondary" },
	{ name: "Muted", bgClass: "bg-muted", cssVar: "muted" },
	{ name: "Accent", bgClass: "bg-accent", cssVar: "accent" },
	{ name: "Destructive", bgClass: "bg-destructive", cssVar: "destructive" },
	{ name: "Border", bgClass: "bg-border", cssVar: "border" },
];

interface ColorPaletteSectionProps {
	onUpdateColor?: (key: string, value: string) => void;
	primaryColor?: string;
}

// Unified swatch component - used for both palette and theme swatches
function Swatch({
	color,
	label,
	bgClass,
	onApplyColor,
	showContextMenu = false,
}: {
	color?: string;
	label: string;
	bgClass?: string;
	onApplyColor?: (key: string, value: string) => void;
	showContextMenu?: boolean;
}) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		const value = color || `var(--${label.toLowerCase()})`;
		await navigator.clipboard.writeText(value);
		setCopied(true);
		toast.success("Copied", { description: value });
		setTimeout(() => setCopied(false), 1000);
	};

	const handleApply = (key: string) => {
		if (color) {
			onApplyColor?.(key, color);
			toast.success("Applied", { description: `Set ${key} to ${color}` });
		}
	};

	const buttonContent = (
		<button
			onClick={handleCopy}
			className={`${bgClass || ""} group relative flex h-7 flex-1 items-center justify-center rounded border border-border/30 text-[8px] font-medium transition-all hover:scale-105 hover:border-border hover:z-10`}
			style={color ? { backgroundColor: color } : undefined}
			title={color ? `${label}: ${color}` : `Copy var(--${label.toLowerCase()})`}
		>
			<span className="opacity-0 group-hover:opacity-100 transition-opacity text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
				{copied ? <Check className="h-2.5 w-2.5" /> : label}
			</span>
		</button>
	);

	if (!showContextMenu || !color) {
		return buttonContent;
	}

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
					<ContextMenuSubContent className="w-44 max-h-64 overflow-y-auto">
						{THEME_COLOR_KEYS.map(({ key, label: keyLabel }) => (
							<ContextMenuItem
								key={key}
								onClick={() => handleApply(key)}
								className="text-xs"
							>
								{keyLabel}
							</ContextMenuItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuSub>
			</ContextMenuContent>
		</ContextMenu>
	);
}

export function ColorPaletteSection({ onUpdateColor, primaryColor }: ColorPaletteSectionProps) {
	const [color, setColor] = useState(primaryColor || "#3B82F6");
	const [primaryPalette, setPrimaryPalette] = useState<TintsPalette | null>(null);
	const [accentPalette, setAccentPalette] = useState<TintsPalette | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [initialized, setInitialized] = useState(false);

	// Auto-generate on mount
	useEffect(() => {
		if (!initialized) {
			generatePalettes(color);
			setInitialized(true);
		}
	}, [initialized, color]);

	const generatePalettes = async (inputColor: string) => {
		const hex = inputColor.replace(/^#/, "");
		if (hex.length !== 6) return;

		setIsLoading(true);

		const primary = await fetchTintsPalette("primary", hex);
		const complementaryHex = getComplementaryColor(inputColor);
		const accent = await fetchTintsPalette("accent", complementaryHex.replace("#", ""));

		if (primary) setPrimaryPalette(primary);
		if (accent) setAccentPalette(accent);

		setIsLoading(false);
	};

	const handleGenerate = () => generatePalettes(color);

	const primaryArray = primaryPalette ? paletteToArray(primaryPalette) : [];
	const accentArray = accentPalette ? paletteToArray(accentPalette) : [];

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
				<CardContent className="space-y-2 px-3 pb-3 pt-0">
					{/* Primary Scale */}
					<div>
						<p className="mb-1 text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
							Primary
						</p>
						<div className="flex gap-0.5">
							{primaryArray.map(({ shade, color: c }) => (
								<Swatch
									key={shade}
									label={shade}
									color={c}
									onApplyColor={onUpdateColor}
									showContextMenu
								/>
							))}
						</div>
					</div>

					{/* Accent Scale (Complementary) */}
					<div>
						<p className="mb-1 text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
							Accent (Complementary)
						</p>
						<div className="flex gap-0.5">
							{accentArray.map(({ shade, color: c }) => (
								<Swatch
									key={shade}
									label={shade}
									color={c}
									onApplyColor={onUpdateColor}
									showContextMenu
								/>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Theme Colors - 1/3 width */}
			<Card>
				<CardHeader className="py-2 px-3">
					<CardTitle className="text-xs font-medium">Active Theme</CardTitle>
				</CardHeader>
				<CardContent className="px-3 pb-3 pt-0">
					<div className="space-y-2">
						<div className="flex gap-0.5">
							{THEME_SWATCHES.slice(0, 4).map((swatch) => (
								<Swatch
									key={swatch.name}
									label={swatch.name}
									bgClass={swatch.bgClass}
								/>
							))}
						</div>
						<div className="flex gap-0.5">
							{THEME_SWATCHES.slice(4).map((swatch) => (
								<Swatch
									key={swatch.name}
									label={swatch.name}
									bgClass={swatch.bgClass}
								/>
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
