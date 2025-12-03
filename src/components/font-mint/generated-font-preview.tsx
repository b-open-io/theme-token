"use client";

import { Minus, Plus, X } from "lucide-react";
import { useState } from "react";
import type { GeneratedFont } from "./ai-generate-tab";

interface GeneratedFontPreviewProps {
	font: GeneratedFont;
	onClear: () => void;
}

const PANGRAM = "The quick brown fox jumps over the lazy dog.";
const ALPHABET_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ALPHABET_LOWER = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";

export function GeneratedFontPreview({ font, onClear }: GeneratedFontPreviewProps) {
	const [fontSize, setFontSize] = useState(48);
	const [inverted, setInverted] = useState(false);
	const [sampleText, setSampleText] = useState(PANGRAM);

	const bgColor = inverted ? "#ffffff" : "#050505";
	const fgColor = inverted ? "#050505" : "#e5e5e5";

	// Create a map for quick glyph lookup
	const glyphMap = new Map(font.glyphs.map((g) => [g.char, g]));

	// Render a single character as SVG
	const renderChar = (char: string, index: number, scale: number) => {
		const glyph = glyphMap.get(char);
		if (!glyph) {
			// Space or unknown - return empty space
			return <g key={index} />;
		}

		return (
			<g key={index}>
				<path d={glyph.path} fill={fgColor} />
			</g>
		);
	};

	// Render text with proper positioning
	const renderText = (text: string, startX: number, baselineY: number, scale: number) => {
		let currentX = startX;
		const elements: React.ReactNode[] = [];

		for (let i = 0; i < text.length; i++) {
			const char = text[i];
			const glyph = glyphMap.get(char);
			const width = glyph?.width || 300;

			if (glyph) {
				elements.push(
					<g
						key={i}
						transform={`translate(${currentX}, ${baselineY}) scale(${scale}, -${scale})`}
					>
						<path d={glyph.path} fill={fgColor} />
					</g>
				);
			}

			currentX += width * scale;
		}

		return elements;
	};

	return (
		<div className="flex h-full flex-col rounded border border-border bg-background">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-border px-3 py-2">
				<span className="font-mono text-xs text-primary">
					// AI_GENERATED: {font.name}
				</span>
				<button
					type="button"
					onClick={onClear}
					className="text-muted-foreground hover:text-foreground"
					title="Clear and start over"
				>
					<X className="h-4 w-4" />
				</button>
			</div>

			{/* Controls */}
			<div className="flex flex-wrap items-center gap-4 border-b border-border px-3 py-2">
				{/* Size Control */}
				<div className="flex items-center gap-2 font-mono text-xs">
					<span className="text-muted-foreground">SIZE:</span>
					<button
						type="button"
						onClick={() => setFontSize((s) => Math.max(12, s - 8))}
						className="rounded border border-border p-1 hover:bg-muted"
					>
						<Minus className="h-3 w-3" />
					</button>
					<span className="w-10 text-center tabular-nums">{fontSize}px</span>
					<button
						type="button"
						onClick={() => setFontSize((s) => Math.min(120, s + 8))}
						className="rounded border border-border p-1 hover:bg-muted"
					>
						<Plus className="h-3 w-3" />
					</button>
				</div>

				{/* Glyph Count */}
				<span className="font-mono text-xs text-muted-foreground">
					{font.glyphs.length} glyphs
				</span>

				{/* Invert Toggle */}
				<button
					type="button"
					onClick={() => setInverted((v) => !v)}
					className={`ml-auto rounded border px-2 py-0.5 font-mono text-xs transition-colors ${
						inverted
							? "border-primary bg-primary/10 text-primary"
							: "border-border text-muted-foreground hover:bg-muted"
					}`}
				>
					[ {inverted ? "DARK_MODE" : "LIGHT_MODE"} ]
				</button>
			</div>

			{/* Preview Canvas */}
			<div
				className="relative flex-1 overflow-auto p-4"
				style={{ backgroundColor: bgColor }}
			>
				{/* Grid Background */}
				<div
					className="pointer-events-none absolute inset-0 opacity-10"
					style={{
						backgroundImage: `radial-gradient(${inverted ? "#333" : "#666"} 1px, transparent 1px)`,
						backgroundSize: "20px 20px",
					}}
				/>

				<div className="relative space-y-6">
					{/* Editable Sample Text */}
					<div>
						<input
							type="text"
							value={sampleText}
							onChange={(e) => setSampleText(e.target.value)}
							className="mb-2 w-full bg-transparent font-mono text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/30"
							placeholder="Type to preview..."
						/>
						<svg
							viewBox={`0 0 ${Math.max(800, sampleText.length * fontSize * 0.6)} ${fontSize * 1.5}`}
							className="w-full"
							style={{ height: `${fontSize * 1.5}px` }}
						>
							{renderText(sampleText, 0, fontSize * 1.2, fontSize / 1000)}
						</svg>
					</div>

					{/* Alphabet Uppercase */}
					<div>
						<div
							className="mb-1 font-mono text-[10px] opacity-50"
							style={{ color: fgColor }}
						>
							UPPERCASE:
						</div>
						<svg
							viewBox={`0 0 ${ALPHABET_UPPER.length * 45} 60`}
							className="w-full"
							style={{ height: "40px" }}
						>
							{renderText(ALPHABET_UPPER, 0, 50, 0.05)}
						</svg>
					</div>

					{/* Alphabet Lowercase */}
					<div>
						<div
							className="mb-1 font-mono text-[10px] opacity-50"
							style={{ color: fgColor }}
						>
							LOWERCASE:
						</div>
						<svg
							viewBox={`0 0 ${ALPHABET_LOWER.length * 45} 60`}
							className="w-full"
							style={{ height: "40px" }}
						>
							{renderText(ALPHABET_LOWER, 0, 50, 0.05)}
						</svg>
					</div>

					{/* Numbers */}
					<div>
						<div
							className="mb-1 font-mono text-[10px] opacity-50"
							style={{ color: fgColor }}
						>
							NUMBERS:
						</div>
						<svg
							viewBox={`0 0 ${NUMBERS.length * 45} 60`}
							className="w-full"
							style={{ height: "40px" }}
						>
							{renderText(NUMBERS, 0, 50, 0.05)}
						</svg>
					</div>

					{/* Glyph Grid */}
					<div>
						<div
							className="mb-2 font-mono text-[10px] opacity-50"
							style={{ color: fgColor }}
						>
							ALL_GLYPHS:
						</div>
						<div className="grid grid-cols-10 gap-1">
							{font.glyphs.map((glyph, i) => (
								<div
									key={i}
									className="aspect-square flex items-center justify-center rounded border"
									style={{
										borderColor: inverted ? "#ddd" : "#333",
									}}
									title={`${glyph.char} (U+${glyph.unicode.toString(16).toUpperCase().padStart(4, "0")})`}
								>
									<svg
										viewBox={`0 0 ${glyph.width} 1000`}
										className="h-6 w-6"
										style={{ transform: "scaleY(-1)" }}
									>
										<path d={glyph.path} fill={fgColor} />
									</svg>
								</div>
							))}
						</div>
					</div>

					{/* Font Metrics */}
					<div
						className="rounded border p-3 font-mono text-xs"
						style={{
							borderColor: inverted ? "#ddd" : "#333",
							color: fgColor,
						}}
					>
						<div className="grid grid-cols-2 gap-2 opacity-70">
							<span>Style:</span>
							<span>{font.style}</span>
							<span>Cap Height:</span>
							<span>{font.capHeight}</span>
							<span>x-Height:</span>
							<span>{font.xHeight}</span>
							<span>Ascender:</span>
							<span>{font.ascender}</span>
							<span>Descender:</span>
							<span>{font.descender}</span>
							<span>Generated:</span>
							<span>{font.generatedBy}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
