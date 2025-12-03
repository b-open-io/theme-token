"use client";

import { AlertTriangle, CheckCircle, Loader2, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import type { FontFile } from "@/app/market/fonts/page";
import type { FontValidationResult } from "@/lib/font-validation";

export interface FontFileWithValidation extends FontFile {
	validation?: FontValidationResult;
	isValidating?: boolean;
	validationError?: string;
}

interface DropZoneCLIProps {
	files: FontFileWithValidation[];
	onFilesChange: (files: FontFileWithValidation[]) => void;
}

// Parse font weight from filename (e.g., "Inter-Bold.woff2" -> 700)
function parseWeightFromName(filename: string): number {
	const name = filename.toLowerCase();
	if (name.includes("thin") || name.includes("100")) return 100;
	if (name.includes("extralight") || name.includes("200")) return 200;
	if (name.includes("light") || name.includes("300")) return 300;
	if (name.includes("regular") || name.includes("400") || name.includes("normal")) return 400;
	if (name.includes("medium") || name.includes("500")) return 500;
	if (name.includes("semibold") || name.includes("600")) return 600;
	if (name.includes("bold") || name.includes("700")) return 700;
	if (name.includes("extrabold") || name.includes("800")) return 800;
	if (name.includes("black") || name.includes("900")) return 900;
	return 400; // Default
}

// Parse style from filename
function parseStyleFromName(filename: string): "normal" | "italic" {
	return filename.toLowerCase().includes("italic") ? "italic" : "normal";
}

export function DropZoneCLI({ files, onFilesChange }: DropZoneCLIProps) {
	const [isDragging, setIsDragging] = useState(false);

	// Validate a single font file via API
	const validateFont = useCallback(
		async (fontFile: FontFileWithValidation, index: number) => {
			const formData = new FormData();
			formData.append("font", fontFile.file);

			try {
				const response = await fetch("/api/validate-font", {
					method: "POST",
					body: formData,
				});

				const result = await response.json();

				if (!response.ok) {
					// Update file with error
					onFilesChange(
						files.map((f, i) =>
							i === index
								? { ...f, isValidating: false, validationError: result.error }
								: f,
						),
					);
					return;
				}

				// Update file with validation result
				onFilesChange(
					files.map((f, i) =>
						i === index
							? { ...f, isValidating: false, validation: result }
							: f,
					),
				);
			} catch (error) {
				onFilesChange(
					files.map((f, i) =>
						i === index
							? {
									...f,
									isValidating: false,
									validationError:
										error instanceof Error
											? error.message
											: "Validation failed",
								}
							: f,
					),
				);
			}
		},
		[files, onFilesChange],
	);

	const handleFiles = useCallback(
		async (newFiles: FileList | null) => {
			if (!newFiles) return;

			const validFiles: FontFileWithValidation[] = [];
			for (let i = 0; i < newFiles.length; i++) {
				const file = newFiles[i];
				// Accept WOFF2, WOFF, and TTF
				if (
					file.name.endsWith(".woff2") ||
					file.name.endsWith(".woff") ||
					file.name.endsWith(".ttf") ||
					file.name.endsWith(".otf")
				) {
					validFiles.push({
						file,
						name: file.name,
						size: file.size,
						weight: parseWeightFromName(file.name),
						style: parseStyleFromName(file.name),
						isValidating: true,
					});
				}
			}

			if (validFiles.length > 0) {
				const newFilesList = [...files, ...validFiles];
				onFilesChange(newFilesList);

				// Validate each new file
				const startIndex = files.length;
				for (let i = 0; i < validFiles.length; i++) {
					validateFont(validFiles[i], startIndex + i);
				}
			}
		},
		[files, onFilesChange, validateFont],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			handleFiles(e.dataTransfer.files);
		},
		[handleFiles],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const removeFile = useCallback(
		(index: number) => {
			onFilesChange(files.filter((_, i) => i !== index));
		},
		[files, onFilesChange],
	);

	const formatSize = (bytes: number): string => {
		if (bytes < 1024) return `${bytes}b`;
		return `${(bytes / 1024).toFixed(1)}kb`;
	};

	return (
		<div className="rounded border border-border bg-background">
			{/* Header */}
			<div className="border-b border-border px-3 py-2">
				<span className="font-mono text-xs text-muted-foreground">
					// DROP_ZONE
				</span>
			</div>

			{/* Drop Area */}
			<div
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				className={`relative min-h-[120px] p-4 transition-colors ${
					isDragging ? "bg-primary/5" : ""
				}`}
			>
				{files.length === 0 ? (
					<label className="flex cursor-pointer flex-col items-center justify-center gap-3 py-4">
						<Upload
							className={`h-8 w-8 transition-colors ${
								isDragging ? "text-primary" : "text-muted-foreground"
							}`}
						/>
						<div className="text-center font-mono text-xs">
							<p className="text-muted-foreground">DRAG WOFF2 OR</p>
							<p className="text-primary hover:underline">CLICK TO BROWSE</p>
						</div>
						<input
							type="file"
							className="hidden"
							accept=".woff2,.woff,.ttf"
							multiple
							onChange={(e) => handleFiles(e.target.files)}
						/>
					</label>
				) : (
					<div className="font-mono text-xs">
						{/* File List Header */}
						<div className="mb-2 grid grid-cols-[24px_1fr_80px_60px_60px_24px] gap-2 text-muted-foreground">
							<span />
							<span>FILE</span>
							<span className="text-right">SIZE</span>
							<span className="text-center">WEIGHT</span>
							<span className="text-center">STYLE</span>
							<span />
						</div>

						{/* File Rows */}
						{files.map((f, i) => {
							const hasError = f.validation?.errors?.length || f.validationError;
							const hasWarning = f.validation?.warnings?.length && !hasError;
							const isValid = f.validation && !hasError;

							return (
								<div key={`${f.name}-${i}`}>
									<div
										className={`grid grid-cols-[24px_1fr_80px_60px_60px_24px] items-center gap-2 py-1 ${
											hasError
												? "text-destructive"
												: hasWarning
													? "text-yellow-600 dark:text-yellow-400"
													: "text-foreground"
										}`}
									>
										{/* Status Icon */}
										<span className="flex items-center justify-center">
											{f.isValidating ? (
												<Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
											) : hasError ? (
												<X className="h-3.5 w-3.5 text-destructive" />
											) : hasWarning ? (
												<AlertTriangle className="h-3.5 w-3.5" />
											) : isValid ? (
												<CheckCircle className="h-3.5 w-3.5 text-green-500" />
											) : null}
										</span>

										<span className="truncate" title={f.name}>
											{f.validation?.metadata?.familyName || f.name}
										</span>
										<span className="text-right tabular-nums text-muted-foreground">
											{formatSize(f.size)}
										</span>
										<span className="text-center tabular-nums">{f.weight}</span>
										<span className="text-center text-muted-foreground">
											{f.style}
										</span>
										<button
											type="button"
											onClick={() => removeFile(i)}
											className="flex items-center justify-center text-muted-foreground hover:text-destructive"
										>
											<X className="h-3.5 w-3.5" />
										</button>
									</div>

									{/* Validation Messages */}
									{(f.validationError || f.validation?.errors?.length) ? (
										<div className="mb-2 ml-6 rounded border border-destructive/50 bg-destructive/10 px-2 py-1.5 text-[10px] text-destructive">
											{f.validationError || f.validation?.errors?.join(" ")}
										</div>
									) : null}

									{f.validation?.warnings?.length ? (
										<div className="mb-2 ml-6 rounded border border-yellow-500/50 bg-yellow-500/10 px-2 py-1.5 text-[10px] text-yellow-600 dark:text-yellow-400">
											{f.validation.warnings.join(" ")}
										</div>
									) : null}

									{/* License info if available */}
									{f.validation?.checks?.isGoogleFont && (
										<div className="mb-2 ml-6 rounded border border-green-500/50 bg-green-500/10 px-2 py-1.5 text-[10px] text-green-600 dark:text-green-400">
											Google Font (Open Source)
										</div>
									)}
								</div>
							);
						})}

						{/* Add More */}
						<label className="mt-3 block cursor-pointer border-t border-dashed border-border pt-3 text-center text-muted-foreground hover:text-primary">
							+ ADD_MORE_FILES
							<input
								type="file"
								className="hidden"
								accept=".woff2,.woff,.ttf"
								multiple
								onChange={(e) => handleFiles(e.target.files)}
							/>
						</label>
					</div>
				)}
			</div>
		</div>
	);
}
