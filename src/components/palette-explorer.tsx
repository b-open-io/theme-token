"use client";

import { useState, type MouseEvent } from "react";
import { Pipette, Loader2 } from "lucide-react";
import {
	fetchTintsPalette,
	paletteToArray,
	type TintsPalette,
} from "@/lib/tints";

interface PaletteExplorerProps {
	initialColor?: string;
	onPaletteGenerated?: (palette: TintsPalette) => void;
}

// Calculate max radius for circular reveal animation
function getMaxRadius(x: number, y: number, element: HTMLElement): number {
	const rect = element.getBoundingClientRect();
	const right = rect.width - (x - rect.left);
	const bottom = rect.height - (y - rect.top);
	const left = x - rect.left;
	const top = y - rect.top;
	return Math.hypot(Math.max(left, right), Math.max(top, bottom));
}

export function PaletteExplorer({
	initialColor = "#3B82F6",
	onPaletteGenerated,
}: PaletteExplorerProps) {
	const [color, setColor] = useState(initialColor);
	const [palette, setPalette] = useState<TintsPalette | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isRevealed, setIsRevealed] = useState(false);
	const [animationOrigin, setAnimationOrigin] = useState({ x: 0, y: 0 });

	const handleColorPick = async (e: MouseEvent<HTMLButtonElement>) => {
		const hex = color.replace(/^#/, "");
		if (hex.length !== 6) return;

		// Store click position for animation
		const rect = e.currentTarget.getBoundingClientRect();
		setAnimationOrigin({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		});

		setIsLoading(true);
		setIsRevealed(false);

		const result = await fetchTintsPalette("primary", hex);

		if (result) {
			setPalette(result);
			onPaletteGenerated?.(result);
			// Trigger reveal animation after a brief delay
			requestAnimationFrame(() => {
				setIsRevealed(true);
			});
		}

		setIsLoading(false);
	};

	const paletteArray = palette ? paletteToArray(palette) : [];

	return (
		<div className="space-y-4">
			{/* Color Input */}
			<div className="flex items-center gap-3">
				<div className="relative">
					<input
						type="color"
						value={color}
						onChange={(e) => setColor(e.target.value)}
						className="h-10 w-10 cursor-pointer rounded-lg border-2 border-border bg-transparent"
					/>
				</div>
				<input
					type="text"
					value={color}
					onChange={(e) => setColor(e.target.value)}
					placeholder="#3B82F6"
					className="h-10 flex-1 rounded-lg border border-border bg-background px-3 font-mono text-sm uppercase focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
				/>
				<button
					onClick={handleColorPick}
					disabled={isLoading}
					className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
				>
					{isLoading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Pipette className="h-4 w-4" />
					)}
					Generate
				</button>
			</div>

			{/* Palette Display */}
			<div
				className="relative overflow-hidden rounded-xl border border-border"
				style={{ minHeight: palette ? "120px" : "80px" }}
			>
				{/* Base color background */}
				<div
					className="absolute inset-0 transition-opacity duration-300"
					style={{ backgroundColor: color, opacity: palette ? 0 : 1 }}
				/>

				{/* Animated palette reveal */}
				{palette && (
					<div
						className="absolute inset-0 flex transition-all duration-500 ease-out"
						style={{
							clipPath: isRevealed
								? "circle(150% at 50% 50%)"
								: `circle(0% at ${animationOrigin.x}px ${animationOrigin.y}px)`,
						}}
					>
						{paletteArray.map(({ shade, color: shadeColor }) => (
							<div
								key={shade}
								className="group relative flex-1 cursor-pointer transition-transform hover:scale-y-110"
								style={{ backgroundColor: shadeColor }}
								title={`${shade}: ${shadeColor}`}
							>
								{/* Shade label on hover */}
								<div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/50 py-1 opacity-0 transition-opacity group-hover:opacity-100">
									<span className="text-[10px] font-medium text-white">
										{shade}
									</span>
								</div>
							</div>
						))}
					</div>
				)}

				{/* Empty state */}
				{!palette && !isLoading && (
					<div className="relative z-10 flex h-20 items-center justify-center">
						<p className="text-sm text-white/80 drop-shadow">
							Pick a color to generate palette
						</p>
					</div>
				)}

				{/* Loading state */}
				{isLoading && (
					<div className="relative z-10 flex h-20 items-center justify-center">
						<Loader2 className="h-6 w-6 animate-spin text-white" />
					</div>
				)}
			</div>

			{/* Palette values */}
			{palette && isRevealed && (
				<div className="grid grid-cols-11 gap-1 text-center">
					{paletteArray.map(({ shade, color: shadeColor }) => (
						<div key={shade} className="space-y-1">
							<div
								className="mx-auto h-6 w-6 rounded border border-border"
								style={{ backgroundColor: shadeColor }}
							/>
							<p className="text-[9px] text-muted-foreground">{shade}</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
