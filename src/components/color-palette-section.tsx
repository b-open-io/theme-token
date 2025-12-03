"use client";

import { useState } from "react";
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
}

// Palette swatch with context menu for applying to theme
function PaletteSwatch({
	color,
	shade,
	onApplyColor,
}: {
	color: string;
	shade: string;
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
		toast.success("Applied", {
			description: `Set ${key} to ${color}`,
		});
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<button
					onClick={handleCopy}
					className="group relative h-full min-h-[60px] flex-1 cursor-pointer transition-all hover:scale-y-105 hover:z-10"
					style={{ backgroundColor: color }}
					title={`${shade}: ${color} (right-click to apply)`}
				>
					{/* Shade label on hover */}
					<div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/60 py-1 opacity-0 transition-opacity group-hover:opacity-100">
						<span className="text-[9px] font-medium text-white">
							{copied ? <Check className="h-3 w-3" /> : shade}
						</span>
					</div>
				</button>
			</ContextMenuTrigger>
			<ContextMenuContent className="w-48">
				<ContextMenuItem onClick={handleCopy}>
					<Copy className="mr-2 h-4 w-4" />
					Copy {color}
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<Pipette className="mr-2 h-4 w-4" />
						Apply as...
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						{THEME_COLOR_KEYS.map(({ key, label }) => (
							<ContextMenuItem key={key} onClick={() => handleApply(key)}>
								{label}
							</ContextMenuItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuSub>
			</ContextMenuContent>
		</ContextMenu>
	);
}

// Theme color swatch for the compact display
function ThemeSwatch({ name, bgClass, cssVar }: { name: string; bgClass: string; cssVar: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(`var(--${cssVar})`);
		setCopied(true);
		setTimeout(() => setCopied(false), 1000);
	};

	return (
		<button
			onClick={handleCopy}
			className={`${bgClass} group relative flex h-8 flex-1 items-center justify-center rounded border border-border/50 text-[9px] font-medium transition-all hover:scale-105`}
			title={`Copy var(--${cssVar})`}
		>
			{copied ? <Check className="h-3 w-3 text-primary-foreground" /> : name}
		</button>
	);
}

export function ColorPaletteSection({ onUpdateColor }: ColorPaletteSectionProps) {
	const [color, setColor] = useState("#3B82F6");
	const [primaryPalette, setPrimaryPalette] = useState<TintsPalette | null>(null);
	const [accentPalette, setAccentPalette] = useState<TintsPalette | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleGenerate = async () => {
		const hex = color.replace(/^#/, "");
		if (hex.length !== 6) return;

		setIsLoading(true);

		// Generate primary palette
		const primary = await fetchTintsPalette("primary", hex);

		// Generate complementary (accent) palette
		const complementaryHex = getComplementaryColor(color);
		const accent = await fetchTintsPalette("accent", complementaryHex.replace("#", ""));

		if (primary) setPrimaryPalette(primary);
		if (accent) setAccentPalette(accent);

		setIsLoading(false);
	};

	const primaryArray = primaryPalette ? paletteToArray(primaryPalette) : [];
	const accentArray = accentPalette ? paletteToArray(accentPalette) : [];

	// Show empty placeholders for fixed height
	const emptySlots = Array(11).fill(null);

	return (
		<div className="grid gap-4 @2xl:grid-cols-3">
			{/* Palette Generator - 2/3 width */}
			<Card className="@2xl:col-span-2">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm">Palette Generator</CardTitle>
					{/* Inline input controls */}
					<div className="flex items-center gap-2">
						<ColorPicker
							value={color}
							onChange={setColor}
							className="h-8 w-8 rounded border-2"
						/>
						<input
							type="text"
							value={color}
							onChange={(e) => setColor(e.target.value)}
							className="h-8 w-24 rounded border border-border bg-background px-2 font-mono text-xs uppercase focus:border-primary focus:outline-none"
						/>
						<button
							onClick={handleGenerate}
							disabled={isLoading}
							className="flex h-8 items-center gap-1.5 rounded bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
						>
							{isLoading ? (
								<Loader2 className="h-3 w-3 animate-spin" />
							) : (
								<Pipette className="h-3 w-3" />
							)}
							Generate
						</button>
					</div>
				</CardHeader>
				<CardContent className="space-y-3 pb-3">
					{/* Primary Scale */}
					<div>
						<p className="mb-1 text-[10px] font-medium text-muted-foreground">
							PRIMARY SCALE
						</p>
						<div className="flex h-[60px] overflow-hidden rounded-lg border border-border">
							{primaryArray.length > 0
								? primaryArray.map(({ shade, color: c }) => (
										<PaletteSwatch
											key={shade}
											shade={shade}
											color={c}
											onApplyColor={onUpdateColor}
										/>
									))
								: emptySlots.map((_, i) => (
										<div
											key={i}
											className="flex-1 bg-muted/30"
											style={{ opacity: 0.3 + (i * 0.05) }}
										/>
									))}
						</div>
					</div>

					{/* Accent Scale (Complementary) */}
					<div>
						<p className="mb-1 text-[10px] font-medium text-muted-foreground">
							ACCENT SCALE (COMPLEMENTARY)
						</p>
						<div className="flex h-[60px] overflow-hidden rounded-lg border border-border">
							{accentArray.length > 0
								? accentArray.map(({ shade, color: c }) => (
										<PaletteSwatch
											key={shade}
											shade={shade}
											color={c}
											onApplyColor={onUpdateColor}
										/>
									))
								: emptySlots.map((_, i) => (
										<div
											key={i}
											className="flex-1 bg-muted/30"
											style={{ opacity: 0.3 + (i * 0.05) }}
										/>
									))}
						</div>
					</div>

					<p className="text-center text-[9px] text-muted-foreground">
						Click to copy • Right-click to apply to theme
					</p>
				</CardContent>
			</Card>

			{/* Theme Colors - 1/3 width */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm">Active Theme</CardTitle>
				</CardHeader>
				<CardContent className="pb-3">
					<div className="grid grid-cols-4 gap-1">
						{THEME_SWATCHES.map((swatch) => (
							<ThemeSwatch key={swatch.name} {...swatch} />
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
