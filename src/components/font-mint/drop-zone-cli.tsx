"use client";

import { AlertTriangle, Archive, CheckCircle, Loader2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState, useEffect } from "react";
import type { FontFile } from "@/app/studio/font/page";
import type { FontValidationResult } from "@/lib/font-validation";
import {
	isZipFile,
	loadFontZip,
	extractedFontToFile,
	type ZipFontPackage,
	type ExtractedFontFile,
	type ZipFontMetadata,
} from "@/lib/zip-font-loader";

export interface FontFileWithValidation extends FontFile {
	validation?: FontValidationResult;
	isValidating?: boolean;
	validationError?: string;
	zipMetadata?: ZipFontMetadata;
}

interface DropZoneCLIProps {
	files: FontFileWithValidation[];
	onFilesChange: (files: FontFileWithValidation[]) => void;
	onZipMetadataDetected?: (metadata: ZipFontMetadata) => void;
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

// Format file size
function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes}b`;
	return `${(bytes / 1024).toFixed(1)}kb`;
}

export function DropZoneCLI({ files, onFilesChange, onZipMetadataDetected }: DropZoneCLIProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [isLoadingZip, setIsLoadingZip] = useState(false);
	const [zipPackage, setZipPackage] = useState<ZipFontPackage | null>(null);

	// Use ref to always have current files without causing re-renders
	// This fixes stale closure issues in async callbacks
	const filesRef = useRef(files);
	useEffect(() => {
		filesRef.current = files;
	}, [files]);

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
					// Update file with error - use ref for current files
					onFilesChange(
						filesRef.current.map((f, i) =>
							i === index
								? { ...f, isValidating: false, validationError: result.error }
								: f,
						),
					);
					return;
				}

				// Update file with validation result - use ref for current files
				onFilesChange(
					filesRef.current.map((f, i) =>
						i === index
							? { ...f, isValidating: false, validation: result }
							: f,
					),
				);
			} catch (error) {
				onFilesChange(
					filesRef.current.map((f, i) =>
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
		[onFilesChange],
	);

	// Handle selecting a font from zip
	const handleSelectFromZip = useCallback(
		(font: ExtractedFontFile) => {
			const file = extractedFontToFile(font);
			const fontFile: FontFileWithValidation = {
				file,
				name: font.name,
				size: font.size,
				weight: parseWeightFromName(font.name),
				style: parseStyleFromName(font.name),
				isValidating: true,
				zipMetadata: zipPackage?.metadata,
			};

			// Metadata already sent when zip was loaded, no need to send again

			const currentFiles = filesRef.current;
			const newFilesList = [...currentFiles, fontFile];
			onFilesChange(newFilesList);

			// Validate the new file
			validateFont(fontFile, currentFiles.length);

			// Clear zip picker
			setZipPackage(null);
		},
		[onFilesChange, validateFont, zipPackage, onZipMetadataDetected],
	);

	const handleFiles = useCallback(
		async (newFiles: FileList | null) => {
			if (!newFiles) return;

			const validFiles: FontFileWithValidation[] = [];
			let zipFile: File | null = null;

			for (let i = 0; i < newFiles.length; i++) {
				const file = newFiles[i];

				// Check if it's a zip file
				if (isZipFile(file)) {
					zipFile = file;
					continue;
				}

				// Accept WOFF2, WOFF, TTF, OTF
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

			// Handle zip file - show picker
			if (zipFile) {
				setIsLoadingZip(true);
				try {
					const pkg = await loadFontZip(zipFile);
					if (pkg.fonts.length === 0) {
						// No fonts found in zip
						console.warn("[DropZone] No font files found in zip");
					} else {
						// Pre-fill form with metadata immediately
						if (onZipMetadataDetected && pkg.metadata) {
							onZipMetadataDetected(pkg.metadata);
						}

						if (pkg.fonts.length === 1) {
							// Only one font, select it automatically
							handleSelectFromZip(pkg.fonts[0]);
						} else {
							// Multiple fonts, show picker
							setZipPackage(pkg);
						}
					}
				} catch (error) {
					console.error("[DropZone] Error loading zip:", error);
				} finally {
					setIsLoadingZip(false);
				}
				return;
			}

			if (validFiles.length > 0) {
				// Use ref for current files to avoid stale closure
				const currentFiles = filesRef.current;
				const newFilesList = [...currentFiles, ...validFiles];
				onFilesChange(newFilesList);

				// Validate each new file
				const startIndex = currentFiles.length;
				for (let i = 0; i < validFiles.length; i++) {
					validateFont(validFiles[i], startIndex + i);
				}
			}
		},
		[onFilesChange, validateFont, handleSelectFromZip],
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
			onFilesChange(filesRef.current.filter((_, i) => i !== index));
		},
		[onFilesChange],
	);

	// Zip picker modal
	if (zipPackage) {
		const { metadata } = zipPackage;
		const hasMetadata = metadata.name || metadata.authors || metadata.license || metadata.website;

		return (
			<div className="rounded border border-border bg-background">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-border px-3 py-2">
					<span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
						<Archive className="h-3.5 w-3.5" />
						SELECT_FONT_FROM_ZIP
					</span>
					<button
						type="button"
						onClick={() => setZipPackage(null)}
						className="text-muted-foreground hover:text-foreground"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Detected metadata banner */}
				{hasMetadata && (
					<div className="space-y-1 border-b border-border bg-green-500/10 px-3 py-2 font-mono text-xs">
						{metadata.name && (
							<div className="text-green-600 dark:text-green-400">
								NAME: {metadata.name}
							</div>
						)}
						{metadata.authors && metadata.authors.length > 0 && (
							<div className="text-green-600 dark:text-green-400">
								AUTHOR: {metadata.authors.join(", ")}
							</div>
						)}
						{metadata.license && (
							<div className="text-green-600 dark:text-green-400">
								LICENSE: {metadata.license}
								{metadata.licenseSource && (
									<span className="text-muted-foreground">
										{" "}(from {metadata.licenseSource})
									</span>
								)}
							</div>
						)}
						{metadata.website && (
							<div className="text-green-600 dark:text-green-400">
								WEBSITE: <span className="text-muted-foreground">{metadata.website}</span>
							</div>
						)}
					</div>
				)}

				{/* Font list */}
				<div className="max-h-[300px] overflow-y-auto p-3">
					<div className="space-y-1 font-mono text-xs">
						{zipPackage.fonts.map((font) => (
							<button
								key={font.path}
								type="button"
								onClick={() => handleSelectFromZip(font)}
								className="flex w-full items-center justify-between rounded border border-transparent px-2 py-2 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
							>
								<span className="truncate text-foreground">{font.name}</span>
								<span className="ml-2 shrink-0 text-muted-foreground">
									{formatSize(font.size)}
								</span>
							</button>
						))}
						{zipPackage.otherFileCount > 0 && (
							<div className="flex w-full items-center justify-between px-2 py-2 text-muted-foreground/50 cursor-not-allowed">
								<span className="italic">and {zipPackage.otherFileCount} other {zipPackage.otherFileCount === 1 ? "item" : "items"}</span>
							</div>
						)}
					</div>
				</div>

				<div className="border-t border-border px-3 py-2">
					<p className="text-center font-mono text-[10px] text-muted-foreground">
						SELECT_ONE_FONT_TO_INSCRIBE
					</p>
				</div>
			</div>
		);
	}

	// Loading zip state
	if (isLoadingZip) {
		return (
			<div className="rounded border border-border bg-background">
				<div className="border-b border-border px-3 py-2">
					<span className="font-mono text-xs text-muted-foreground">
						// DROP_ZONE
					</span>
				</div>
				<div className="flex min-h-[120px] items-center justify-center p-4">
					<div className="flex flex-col items-center gap-2">
						<Loader2 className="h-6 w-6 animate-spin text-primary" />
						<span className="font-mono text-xs text-muted-foreground">
							EXTRACTING_ZIP...
						</span>
					</div>
				</div>
			</div>
		);
	}

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
							<p className="text-muted-foreground">DRAG FONT FILE OR ZIP</p>
							<p className="text-primary hover:underline">CLICK TO BROWSE</p>
						</div>
						<input
							type="file"
							className="hidden"
							accept=".woff2,.woff,.ttf,.otf,.zip"
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

									{/* Zip-detected metadata */}
									{f.zipMetadata?.license && !f.validation?.checks?.isGoogleFont && (
										<div className="mb-2 ml-6 rounded border border-green-500/50 bg-green-500/10 px-2 py-1.5 text-[10px] text-green-600 dark:text-green-400">
											License: {f.zipMetadata.license}
											{f.zipMetadata.licenseSource && (
												<span className="text-muted-foreground">
													{" "}(from {f.zipMetadata.licenseSource})
												</span>
											)}
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
								accept=".woff2,.woff,.ttf,.otf,.zip"
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
