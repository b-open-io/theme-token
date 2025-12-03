"use client";

import { Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import type { FontFile } from "@/app/market/fonts/page";

interface DropZoneCLIProps {
	files: FontFile[];
	onFilesChange: (files: FontFile[]) => void;
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

	const handleFiles = useCallback(
		(newFiles: FileList | null) => {
			if (!newFiles) return;

			const validFiles: FontFile[] = [];
			for (let i = 0; i < newFiles.length; i++) {
				const file = newFiles[i];
				// Accept WOFF2, WOFF, and TTF
				if (
					file.name.endsWith(".woff2") ||
					file.name.endsWith(".woff") ||
					file.name.endsWith(".ttf")
				) {
					validFiles.push({
						file,
						name: file.name,
						size: file.size,
						weight: parseWeightFromName(file.name),
						style: parseStyleFromName(file.name),
					});
				}
			}

			if (validFiles.length > 0) {
				onFilesChange([...files, ...validFiles]);
			}
		},
		[files, onFilesChange],
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
						<div className="mb-2 grid grid-cols-[1fr_80px_60px_60px_24px] gap-2 text-muted-foreground">
							<span>FILE</span>
							<span className="text-right">SIZE</span>
							<span className="text-center">WEIGHT</span>
							<span className="text-center">STYLE</span>
							<span />
						</div>

						{/* File Rows */}
						{files.map((f, i) => (
							<div
								key={`${f.name}-${i}`}
								className="grid grid-cols-[1fr_80px_60px_60px_24px] items-center gap-2 py-1 text-foreground"
							>
								<span className="truncate" title={f.name}>
									{f.name}
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
						))}

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
