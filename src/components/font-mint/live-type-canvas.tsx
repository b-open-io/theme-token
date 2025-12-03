"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FontFile } from "@/app/market/fonts/page";

interface LiveTypeCanvasProps {
	files: FontFile[];
	fontName: string;
}

type LoadStatus = "IDLE" | "LOADING" | "READY" | "ERROR";

const PANGRAM = "The quick brown fox jumps over the lazy dog. 0123456789";
const SAMPLE_CHARS = "AaBbCcDdEeFfGg 123!@#";

export function LiveTypeCanvas({ files, fontName }: LiveTypeCanvasProps) {
	const [fontSize, setFontSize] = useState(48);
	const [inverted, setInverted] = useState(false);
	const [status, setStatus] = useState<LoadStatus>("IDLE");
	const [selectedWeight, setSelectedWeight] = useState<number>(400);
	const fontUrlsRef = useRef<string[]>([]);

	// Available weights from uploaded files
	const availableWeights = [...new Set(files.map((f) => f.weight || 400))].sort(
		(a, b) => a - b,
	);

	// Derive status from files length for initial state
	const derivedStatus: LoadStatus = files.length === 0 ? "IDLE" : status;

	// Load fonts when files change
	useEffect(() => {
		// Cleanup previous font URLs
		fontUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
		fontUrlsRef.current = [];

		if (files.length === 0) {
			return;
		}

		setStatus("LOADING");

		const loadFonts = async () => {
			try {
				for (const fontFile of files) {
					const fontUrl = URL.createObjectURL(fontFile.file);
					fontUrlsRef.current.push(fontUrl);

					const fontFace = new FontFace(
						"PreviewFont",
						`url(${fontUrl})`,
						{
							weight: String(fontFile.weight || 400),
							style: fontFile.style || "normal",
						},
					);

					const loadedFont = await fontFace.load();
					document.fonts.add(loadedFont);
				}

				setStatus("READY");

				// Set selected weight to first available if current not available
				if (!availableWeights.includes(selectedWeight)) {
					setSelectedWeight(availableWeights[0] || 400);
				}
			} catch (err) {
				console.error("[LiveTypeCanvas] Font load failed:", err);
				setStatus("ERROR");
			}
		};

		loadFonts();

		return () => {
			fontUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
			fontUrlsRef.current = [];
		};
	}, [files]);

	const bgColor = inverted ? "#ffffff" : "#050505";
	const fgColor = inverted ? "#050505" : "#e5e5e5";

	return (
		<div className="flex h-full flex-col rounded border border-border bg-background">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-border px-3 py-2">
				<span className="font-mono text-xs text-muted-foreground">
					// PREVIEW_RENDER_TARGET
				</span>
				<span
					className={`font-mono text-xs ${
						derivedStatus === "READY"
							? "text-primary"
							: derivedStatus === "ERROR"
								? "text-destructive"
								: "text-muted-foreground"
					}`}
				>
					STATUS: {derivedStatus}
				</span>
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

				{/* Weight Selection */}
				{availableWeights.length > 1 && (
					<div className="flex items-center gap-2 font-mono text-xs">
						<span className="text-muted-foreground">WEIGHT:</span>
						<div className="flex gap-1">
							{availableWeights.map((w) => (
								<button
									key={w}
									type="button"
									onClick={() => setSelectedWeight(w)}
									className={`rounded border px-2 py-0.5 tabular-nums transition-colors ${
										selectedWeight === w
											? "border-primary bg-primary/10 text-primary"
											: "border-border text-muted-foreground hover:bg-muted"
									}`}
								>
									{w}
								</button>
							))}
						</div>
					</div>
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

			{/* Canvas */}
			<div
				className="relative flex-1 overflow-auto p-6"
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

				{files.length === 0 ? (
					<div className="flex h-full items-center justify-center font-mono text-sm text-muted-foreground">
						AWAITING_FONT_UPLOAD...
					</div>
				) : derivedStatus === "LOADING" ? (
					<div className="flex h-full items-center justify-center font-mono text-sm text-muted-foreground">
						LOADING_FONT_BINARY...
					</div>
				) : derivedStatus === "ERROR" ? (
					<div className="flex h-full items-center justify-center font-mono text-sm text-destructive">
						ERROR_PARSING_FONT
					</div>
				) : (
					<div className="relative space-y-6">
						{/* Font Name */}
						{fontName && (
							<div
								className="font-mono text-xs opacity-50"
								style={{ color: fgColor }}
							>
								FONT: {fontName.toUpperCase()}
							</div>
						)}

						{/* Main Preview */}
						<div
							contentEditable
							suppressContentEditableWarning
							className="break-words outline-none"
							style={{
								fontFamily: '"PreviewFont", monospace',
								fontSize: `${fontSize}px`,
								fontWeight: selectedWeight,
								color: fgColor,
								lineHeight: 1.2,
							}}
						>
							{PANGRAM}
						</div>

						{/* Character Sample */}
						<div
							className="break-words"
							style={{
								fontFamily: '"PreviewFont", monospace',
								fontSize: `${Math.max(24, fontSize * 0.5)}px`,
								fontWeight: selectedWeight,
								color: fgColor,
								opacity: 0.7,
								lineHeight: 1.4,
							}}
						>
							{SAMPLE_CHARS}
						</div>

						{/* Weight Samples */}
						{availableWeights.length > 1 && (
							<div className="space-y-2 pt-4">
								<div
									className="font-mono text-xs opacity-50"
									style={{ color: fgColor }}
								>
									WEIGHT_SAMPLES:
								</div>
								{availableWeights.map((w) => (
									<div
										key={w}
										className="flex items-baseline gap-3"
										style={{ color: fgColor }}
									>
										<span className="w-8 font-mono text-xs opacity-50">
											{w}
										</span>
										<span
											style={{
												fontFamily: '"PreviewFont", monospace',
												fontSize: "24px",
												fontWeight: w,
											}}
										>
											Sample Text
										</span>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
