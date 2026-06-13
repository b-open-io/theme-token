"use client";

import { useWallet as useOneSatWallet } from "@1sat/react";
import { Utils } from "@bsv/sdk";
import { getOrdfsUrl } from "@theme-token/sdk";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FontFile } from "@/app/studio/font/font-mint-client";
import { Button } from "@/components/ui/button";
import { useYoursWallet } from "@/hooks/use-wallet";
import { buildFontMetadata } from "@/lib/asset-metadata";
import { generateFontPreviewFromData } from "@/lib/font-preview-generator";
import type { PackageFile } from "@/lib/package-builder";
import { publishPackage } from "@/lib/package-builder";
import type { CompiledFont } from "./ai-generate-tab";
import type { FontMetadata } from "./metadata-form";

interface TransactionTerminalProps {
	files: FontFile[];
	metadata: FontMetadata;
	compiledFont?: CompiledFont;
	onComplete: (result: { txid: string; ordfsUrl: string }) => void;
	onError: (error: string) => void;
	onCancel: () => void;
}

type LogEntry = {
	id: number;
	message: string;
	type: "info" | "success" | "error" | "waiting";
};

export function TransactionTerminal({
	files,
	metadata,
	compiledFont,
	onComplete,
	onError,
	onCancel,
}: TransactionTerminalProps) {
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [isProcessing, setIsProcessing] = useState(true);
	const { addresses } = useYoursWallet();
	const { wallet } = useOneSatWallet();
	const hasStarted = useRef(false);
	const logIdRef = useRef(0);

	const addLog = useCallback(
		(message: string, type: LogEntry["type"] = "info") => {
			const id = logIdRef.current++;
			setLogs((prev) => [...prev, { id, message, type }]);
		},
		[],
	);

	// Convert file to base64
	const fileToBase64 = useCallback((file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const result = reader.result as string;
				// Remove data URL prefix to get pure base64
				const base64 = result.split(",")[1];
				resolve(base64);
			};
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}, []);

	const executeInscription = useCallback(async () => {
		if (!addresses?.ordAddress || !wallet) {
			onError("Wallet not available");
			return;
		}

		try {
			addLog("PACKING_DATA...", "info");
			await new Promise((r) => setTimeout(r, 300));

			let fontBase64: string;
			let fontMimeType: string;
			let fontName: string;

			// If we have a compiled AI-generated font, use that
			if (compiledFont) {
				addLog("ENCODING_AI_GENERATED_WOFF2...", "info");
				await new Promise((r) => setTimeout(r, 200));

				fontBase64 = compiledFont.woff2Base64;
				fontMimeType = "font/woff2";
				fontName = compiledFont.familyName || metadata.name || "AI Font";
			} else if (files.length > 0) {
				// Use first uploaded font file
				const fontFile = files[0];
				addLog(`ENCODING_${fontFile.name.toUpperCase()}...`, "info");
				fontBase64 = await fileToBase64(fontFile.file);

				// Determine MIME type
				fontMimeType = "font/woff2";
				if (fontFile.name.endsWith(".woff")) {
					fontMimeType = "font/woff";
				} else if (fontFile.name.endsWith(".ttf")) {
					fontMimeType = "font/ttf";
				}

				fontName =
					metadata.name || fontFile.name.replace(/\.(woff2?|ttf)$/i, "");
			} else {
				throw new Error("No font data available");
			}

			// Build package files
			const packageFiles: PackageFile[] = [];

			// File 0: Font file
			const fontExt = fontMimeType.split("/")[1] || "woff2";
			packageFiles.push({
				path: `font.${fontExt}`,
				content: new Uint8Array(Utils.toArray(fontBase64, "base64")),
				contentType: fontMimeType,
			});

			// Generate preview image from the font
			addLog("GENERATING_PREVIEW_IMAGE...", "info");
			await new Promise((r) => setTimeout(r, 200));

			let previewResult: { base64: string; sizeBytes: number };
			try {
				previewResult = await generateFontPreviewFromData(
					fontBase64,
					fontName,
					fontMimeType,
				);
				addLog(
					`GENERATING_PREVIEW_IMAGE... ${(previewResult.sizeBytes / 1024).toFixed(1)}KB`,
					"success",
				);
			} catch (previewError) {
				console.warn(
					"[TransactionTerminal] Preview generation failed:",
					previewError,
				);
				addLog(
					"GENERATING_PREVIEW_IMAGE... SKIPPED (font loading error)",
					"info",
				);
				previewResult = { base64: "", sizeBytes: 0 };
			}

			// File 1: Preview image (if generated successfully)
			if (previewResult.base64.length > 0) {
				packageFiles.push({
					path: "preview.png",
					content: new Uint8Array(
						Utils.toArray(previewResult.base64, "base64"),
					),
					contentType: "image/png",
				});
			}

			addLog("PACKING_DATA... OK", "success");
			await new Promise((r) => setTimeout(r, 200));

			addLog("GENERATING_OP_RETURN...", "info");
			await new Promise((r) => setTimeout(r, 300));
			addLog("GENERATING_OP_RETURN... OK", "success");
			await new Promise((r) => setTimeout(r, 200));

			addLog("CALCULATING_TX_SIZE...", "info");
			const fontBytes = compiledFont
				? compiledFont.woff2Size
				: files.length > 0
					? files[0].size
					: 0;
			const totalBytes = fontBytes + previewResult.sizeBytes;
			await new Promise((r) => setTimeout(r, 200));
			addLog(
				`CALCULATING_TX_SIZE... ${(totalBytes / 1024).toFixed(1)}KB (${packageFiles.length + 1} outputs)`,
				"success",
			);
			await new Promise((r) => setTimeout(r, 200));

			addLog("SIGNING_TX (WAITING_FOR_WALLET)...", "waiting");

			// Build metadata for registry:font package
			const fontMapMetadata = buildFontMetadata({
				name: fontName,
				author: metadata.author || undefined,
				license: metadata.license,
				prompt: metadata.prompt,
				"font.family": fontName,
				"font.variable": `--font-${fontName.toLowerCase().replace(/\s+/g, "-")}`,
				"font.weight": "400",
			});

			const result = await publishPackage(
				wallet,
				packageFiles,
				fontMapMetadata,
			);

			addLog("[USER_SIGNATURE_RECEIVED]", "success");
			await new Promise((r) => setTimeout(r, 300));

			addLog("BROADCASTING_TO_NODES...", "info");
			await new Promise((r) => setTimeout(r, 500));

			addLog(
				`TXID: ${result.txid.slice(0, 12)}...${result.txid.slice(-8)}`,
				"success",
			);
			await new Promise((r) => setTimeout(r, 300));

			addLog("INDEXING_ORDFS...", "info");
			await new Promise((r) => setTimeout(r, 400));

			// The manifest is the package identity — use its origin for the ORDFS URL
			const ordfsUrl = getOrdfsUrl(`${result.txid}_${result.manifestVout}`);

			addLog("SUCCESS.", "success");
			setIsProcessing(false);

			// Wait a moment before completing
			await new Promise((r) => setTimeout(r, 500));
			onComplete({ txid: result.txid, ordfsUrl });
		} catch (err) {
			console.error("[TransactionTerminal] Error:", err);
			const errorMessage =
				err instanceof Error ? err.message : "Unknown error occurred";
			addLog(`ERROR: ${errorMessage}`, "error");
			setIsProcessing(false);

			// Wait before showing error
			await new Promise((r) => setTimeout(r, 500));
			onError(errorMessage);
		}
	}, [
		addresses,
		wallet,
		files,
		metadata,
		compiledFont,
		addLog,
		fileToBase64,
		onComplete,
		onError,
	]);

	useEffect(() => {
		if (hasStarted.current) return;
		hasStarted.current = true;
		executeInscription();
	}, [executeInscription]);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
			<div className="relative mx-4 w-full max-w-2xl rounded border border-border bg-background">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-border px-4 py-3">
					<span className="font-mono text-sm text-muted-foreground">
						{"// TRANSACTION_TERMINAL"}
					</span>
					{!isProcessing && (
						<button
							type="button"
							onClick={onCancel}
							className="text-muted-foreground hover:text-foreground"
						>
							<X className="h-4 w-4" />
						</button>
					)}
				</div>

				{/* Log Output */}
				<div className="h-[400px] overflow-y-auto bg-black p-4 font-mono text-xs">
					{logs.map((log) => (
						<div
							key={log.id}
							className={`mb-1 ${
								log.type === "success"
									? "text-primary"
									: log.type === "error"
										? "text-destructive"
										: log.type === "waiting"
											? "text-yellow-500"
											: "text-muted-foreground"
							}`}
						>
							<span className="text-muted-foreground/50">&gt; </span>
							{log.message}
							{log.type === "waiting" && (
								<span className="animate-pulse">_</span>
							)}
						</div>
					))}

					{isProcessing && logs.length > 0 && (
						<div className="mt-2 text-muted-foreground">
							<span className="animate-pulse">_</span>
						</div>
					)}
				</div>

				{/* Footer */}
				{!isProcessing && (
					<div className="border-t border-border p-4">
						<Button
							onClick={onCancel}
							variant="outline"
							className="w-full font-mono"
						>
							[ CLOSE ]
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
