"use client";

import { useState, type MouseEvent } from "react";
import { Pipette, Loader2, Check } from "lucide-react";
import { ColorPicker } from "@/components/ui/color-picker";
import {
	fetchTintsPalette,
	paletteToArray,
	type TintsPalette,
} from "@/lib/tints";

interface PaletteExplorerProps {
	initialColor?: string;
	onPaletteGenerated?: (palette: TintsPalette) => void;
}

export function PaletteExplorer({
	initialColor = "#3B82F6",
	onPaletteGenerated,
}: PaletteExplorerProps) {
	const [color, setColor] = useState(initialColor);
	const [palette, setPalette] = useState<TintsPalette | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [copiedShade, setCopiedShade] = useState<string | null>(null);

	const handleColorPick = async (e: MouseEvent<HTMLButtonElement>) => {
		const hex = color.replace(/^#/, "");
		if (hex.length !== 6) return;

		setIsLoading(true);
		const result = await fetchTintsPalette("primary", hex);

		if (result) {
			setPalette(result);
			onPaletteGenerated?.(result);
		}

		setIsLoading(false);
	};

	const handleCopyColor = async (shade: string, colorValue: string) => {
		await navigator.clipboard.writeText(colorValue);
		setCopiedShade(shade);
		setTimeout(() => setCopiedShade(null), 1000);
	};

	const paletteArray = palette ? paletteToArray(palette) : [];

	return (
		<div className="space-y-2">
			{/* Compact Color Input */}
			<div className="flex items-center gap-1.5">
				<ColorPicker value={color} onChange={setColor} className="h-7 w-7" />
				<input
					type="text"
					value={color}
					onChange={(e) => setColor(e.target.value)}
					placeholder="#3B82F6"
					className="h-7 min-w-0 flex-1 rounded border border-border bg-background px-2 font-mono text-xs uppercase focus:border-primary focus:outline-none"
				/>
				<button
					onClick={handleColorPick}
					disabled={isLoading}
					className="flex h-7 shrink-0 items-center gap-1 rounded bg-primary px-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
				>
					{isLoading ? (
						<Loader2 className="h-3 w-3 animate-spin" />
					) : (
						<Pipette className="h-3 w-3" />
					)}
				</button>
			</div>

			{/* Compact Palette Display */}
			{palette ? (
				<div className="flex gap-0.5">
					{paletteArray.map(({ shade, color: shadeColor }) => (
						<button
							key={shade}
							onClick={() => handleCopyColor(shade, shadeColor)}
							className="group relative h-8 flex-1 rounded-sm transition-transform hover:scale-110 hover:z-10"
							style={{ backgroundColor: shadeColor }}
							title={`${shade}: ${shadeColor} (click to copy)`}
						>
							{copiedShade === shade && (
								<div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-sm">
									<Check className="h-3 w-3 text-white" />
								</div>
							)}
						</button>
					))}
				</div>
			) : (
				<div
					className="flex h-8 items-center justify-center rounded border border-dashed border-border text-[10px] text-muted-foreground"
					style={{ backgroundColor: `${color}20` }}
				>
					Click to generate
				</div>
			)}
		</div>
	);
}
