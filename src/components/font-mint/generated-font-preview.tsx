"use client";

import { Minus, Plus, X, Check, AlertCircle } from "lucide-react";
import { useState, useEffect, useId } from "react";
import type { GeneratedFont, CompiledFont } from "./ai-generate-tab";

interface GeneratedFontPreviewProps {
	font: GeneratedFont;
	compiledFont?: CompiledFont;
	onClear: () => void;
}

const PANGRAM = "The quick brown fox jumps over the lazy dog.";
const ALPHABET_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ALPHABET_LOWER = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";

export function GeneratedFontPreview({ font, compiledFont, onClear }: GeneratedFontPreviewProps) {
	const [fontSize, setFontSize] = useState(48);
	const [inverted, setInverted] = useState(false);
	const [sampleText, setSampleText] = useState(PANGRAM);
	const [fontLoaded, setFontLoaded] = useState(false);
	const [fontLoadError, setFontLoadError] = useState<string | null>(null);

	// Generate a unique font family name for this instance
	const uniqueId = useId();
	const fontFamilyName = `AI-Font-${uniqueId.replace(/:/g, "-")}`;

	const bgColor = inverted ? "#ffffff" : "#050505";
	const fgColor = inverted ? "#050505" : "#e5e5e5";

	// Load the compiled font via FontFace API
	useEffect(() => {
		// Reset and exit early if no compiled font
		if (!compiledFont) {
			return () => {
				// Cleanup any existing font face
				document.fonts.forEach((fontFace) => {
					if (fontFace.family === fontFamilyName) {
						document.fonts.delete(fontFace);
					}
				});
			};
		}

		let cancelled = false;

		const loadFont = async () => {
			try {
				// Create a data URL from the base64 WOFF2
				const dataUrl = `data:font/woff2;base64,${compiledFont.woff2Base64}`;

				// Create and load the font
				const fontFace = new FontFace(fontFamilyName, `url(${dataUrl})`);
				await fontFace.load();

				if (cancelled) return;

				// Add to document fonts
				document.fonts.add(fontFace);
				setFontLoaded(true);
				setFontLoadError(null);
			} catch (err) {
				if (cancelled) return;
				console.error("[GeneratedFontPreview] Font load error:", err);
				setFontLoadError(err instanceof Error ? err.message : "Failed to load font");
				setFontLoaded(false);
			}
		};

		// Reset state before loading
		setFontLoaded(false);
		setFontLoadError(null);
		loadFont();

		// Cleanup: remove font when component unmounts
		return () => {
			cancelled = true;
			document.fonts.forEach((fontFace) => {
				if (fontFace.family === fontFamilyName) {
					document.fonts.delete(fontFace);
				}
			});
		};
	}, [compiledFont, fontFamilyName]);

	// Create a map for quick glyph lookup
	const glyphMap = new Map(font.glyphs.map((g) => [g.char, g]));

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

				{/* Compiled Font Status */}
				{compiledFont && (
					<span className={`flex items-center gap-1 font-mono text-xs ${fontLoaded ? "text-primary" : fontLoadError ? "text-destructive" : "text-muted-foreground"}`}>
						{fontLoaded ? (
							<><Check className="h-3 w-3" /> WOFF2</>
						) : fontLoadError ? (
							<><AlertCircle className="h-3 w-3" /> Load Error</>
						) : (
							"Loading..."
						)}
					</span>
				)}

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
						{fontLoaded ? (
							<div
								style={{
									fontFamily: `"${fontFamilyName}", sans-serif`,
									fontSize: `${fontSize}px`,
									color: fgColor,
									lineHeight: 1.2,
									wordBreak: "break-word",
								}}
							>
								{sampleText}
							</div>
						) : (
							<svg
								viewBox={`0 0 ${Math.max(800, sampleText.length * fontSize * 0.6)} ${fontSize * 1.5}`}
								className="w-full"
								style={{ height: `${fontSize * 1.5}px` }}
							>
								{renderText(sampleText, 0, fontSize * 1.2, fontSize / 1000)}
							</svg>
						)}
					</div>

					{/* Alphabet Uppercase */}
					<div>
						<div
							className="mb-1 font-mono text-[10px] opacity-50"
							style={{ color: fgColor }}
						>
							UPPERCASE:
						</div>
						{fontLoaded ? (
							<div
								style={{
									fontFamily: `"${fontFamilyName}", sans-serif`,
									fontSize: "32px",
									color: fgColor,
									letterSpacing: "0.05em",
								}}
							>
								{ALPHABET_UPPER}
							</div>
						) : (
							<svg
								viewBox={`0 0 ${ALPHABET_UPPER.length * 45} 60`}
								className="w-full"
								style={{ height: "40px" }}
							>
								{renderText(ALPHABET_UPPER, 0, 50, 0.05)}
							</svg>
						)}
					</div>

					{/* Alphabet Lowercase */}
					<div>
						<div
							className="mb-1 font-mono text-[10px] opacity-50"
							style={{ color: fgColor }}
						>
							LOWERCASE:
						</div>
						{fontLoaded ? (
							<div
								style={{
									fontFamily: `"${fontFamilyName}", sans-serif`,
									fontSize: "32px",
									color: fgColor,
									letterSpacing: "0.05em",
								}}
							>
								{ALPHABET_LOWER}
							</div>
						) : (
							<svg
								viewBox={`0 0 ${ALPHABET_LOWER.length * 45} 60`}
								className="w-full"
								style={{ height: "40px" }}
							>
								{renderText(ALPHABET_LOWER, 0, 50, 0.05)}
							</svg>
						)}
					</div>

					{/* Numbers */}
					<div>
						<div
							className="mb-1 font-mono text-[10px] opacity-50"
							style={{ color: fgColor }}
						>
							NUMBERS:
						</div>
						{fontLoaded ? (
							<div
								style={{
									fontFamily: `"${fontFamilyName}", sans-serif`,
									fontSize: "32px",
									color: fgColor,
									letterSpacing: "0.05em",
								}}
							>
								{NUMBERS}
							</div>
						) : (
							<svg
								viewBox={`0 0 ${NUMBERS.length * 45} 60`}
								className="w-full"
								style={{ height: "40px" }}
							>
								{renderText(NUMBERS, 0, 50, 0.05)}
							</svg>
						)}
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
							{compiledFont && (
								<>
									<span>WOFF2 Size:</span>
									<span className="text-primary">{formatBytes(compiledFont.woff2Size)}</span>
									<span>OTF Size:</span>
									<span>{formatBytes(compiledFont.otfSize)}</span>
								</>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

// Helper to format bytes as human-readable
function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
