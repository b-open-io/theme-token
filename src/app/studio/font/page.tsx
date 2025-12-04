"use client";

import { motion } from "framer-motion";
import { Loader2, RotateCcw, Upload, Wallet, Wand2 } from "lucide-react";
import { useState, useCallback } from "react";
import { AIGenerateTab, type GeneratedFont, type CompiledFont } from "@/components/font-mint/ai-generate-tab";
import { DropZoneCLI, type FontFileWithValidation } from "@/components/font-mint/drop-zone-cli";
import type { ZipFontMetadata } from "@/lib/zip-font-loader";
import { LiveTypeCanvas } from "@/components/font-mint/live-type-canvas";
import { GeneratedFontPreview } from "@/components/font-mint/generated-font-preview";
import {
	MetadataForm,
	type FontMetadata,
	type FontAttestations,
	areAttestationsComplete,
	getDefaultAttestations,
} from "@/components/font-mint/metadata-form";
import { CostMatrix } from "@/components/font-mint/cost-matrix";
import { TransactionTerminal } from "@/components/font-mint/transaction-terminal";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { Button } from "@/components/ui/button";

export interface FontFile {
	file: File;
	name: string;
	size: number;
	weight?: number;
	style?: "normal" | "italic";
}

// Re-export for backwards compatibility
export type { FontFileWithValidation };

type InputMode = "upload" | "ai";

// Format satoshis for display
function formatSats(sats: number): string {
	if (sats < 1000) return `${sats} sats`;
	if (sats < 100000) return `${(sats / 1000).toFixed(1)}k sats`;
	return `${(sats / 100000000).toFixed(4)} BSV`;
}

export default function FontMintPage() {
	const { status, connect, balance, addresses } = useYoursWallet();
	const [inputMode, setInputMode] = useState<InputMode>("upload");
	const [fontFiles, setFontFiles] = useState<FontFileWithValidation[]>([]);
	const [generatedFont, setGeneratedFont] = useState<GeneratedFont | null>(null);
	const [compiledFont, setCompiledFont] = useState<CompiledFont | null>(null);
	const [metadata, setMetadata] = useState<FontMetadata>({
		name: "",
		author: "",
		license: "CC0_1.0",
		website: "",
	});
	const [attestations, setAttestations] = useState<FontAttestations>(getDefaultAttestations());
	const [isMinting, setIsMinting] = useState(false);
	const [mintResult, setMintResult] = useState<{
		txid: string;
		ordfsUrl: string;
	} | null>(null);

	const isConnected = status === "connected";

	// Calculate bytes - for uploaded files or compiled WOFF2
	const totalBytes = compiledFont
		? compiledFont.woff2Size
		: generatedFont
			? JSON.stringify(generatedFont).length
			: fontFiles.reduce((acc, f) => acc + f.size, 0);

	// Estimate cost (1 sat per byte + base fee)
	const estimatedCost = totalBytes + 500;

	const isAIGenerated = generatedFont !== null;
	const attestationsComplete = areAttestationsComplete(attestations, metadata.license, isAIGenerated);

	// Check if any uploaded fonts have validation errors
	const hasValidationErrors = fontFiles.some(
		(f) => f.validation?.errors?.length || f.validationError,
	);
	const isStillValidating = fontFiles.some((f) => f.isValidating);

	const isValid =
		(fontFiles.length > 0 || generatedFont !== null) &&
		metadata.name.trim() !== "" &&
		attestationsComplete &&
		!hasValidationErrors &&
		!isStillValidating;

	const handleMint = async () => {
		if (!isValid || !isConnected) return;
		setIsMinting(true);
		// Minting logic will be wired up in TransactionTerminal
	};

	const handleMintComplete = (result: { txid: string; ordfsUrl: string }) => {
		setMintResult(result);
		setIsMinting(false);
	};

	const handleMintError = (error: string) => {
		console.error("[FontMint] Error:", error);
		setIsMinting(false);
	};

	const handleReset = () => {
		setFontFiles([]);
		setGeneratedFont(null);
		setCompiledFont(null);
		setMetadata({ name: "", author: "", license: "CC0_1.0", website: "" });
		setAttestations(getDefaultAttestations());
		setMintResult(null);
	};

	const handleAIFontGenerated = useCallback((font: GeneratedFont, compiled?: CompiledFont) => {
		setGeneratedFont(font);
		setCompiledFont(compiled ?? null);
		setMetadata((prev) => ({
			...prev,
			name: font.name,
			author: `AI Generated (${font.generatedBy})`,
			isAIGenerated: true,
			prompt: font.prompt,
		}));
	}, []);

	// Memoized callback to prevent unnecessary re-renders in DropZoneCLI
	const handleFilesChange = useCallback((files: FontFileWithValidation[]) => {
		setFontFiles(files);
	}, []);

	// Handle metadata detected from zip file
	const handleZipMetadataDetected = useCallback((zipMeta: ZipFontMetadata) => {
		// Map common license names to our dropdown values
		const licenseMap: Record<string, FontMetadata["license"]> = {
			OFL: "SIL_OFL_1.1",
			"Apache-2.0": "APACHE_2.0",
			MIT: "MIT",
			CC0: "CC0_1.0",
			"Public Domain": "CC0_1.0",
			CC: "CC_BY_4.0",
		};

		setMetadata((prev) => {
			const updates: Partial<FontMetadata> = {};

			// Set name if detected
			if (zipMeta.name) {
				updates.name = zipMeta.name;
			}

			// Set author(s) if detected
			if (zipMeta.authors && zipMeta.authors.length > 0) {
				updates.author = zipMeta.authors.join(", ");
			}

			// Set license if detected and mappable
			if (zipMeta.license) {
				const mappedLicense = licenseMap[zipMeta.license];
				if (mappedLicense) {
					updates.license = mappedLicense;
				}
			}

			// Set website if detected
			if (zipMeta.website) {
				updates.website = zipMeta.website;
			}

			return { ...prev, ...updates };
		});
	}, []);

	// Check if there's content to clear
	const hasContent = fontFiles.length > 0 || generatedFont !== null || metadata.name.trim() !== "";

	if (mintResult) {
		return (
			<div className="flex h-full flex-col overflow-hidden bg-background">
				<div className="flex flex-1 items-center justify-center overflow-y-auto p-4">
					<div className="text-center">
						<pre className="mb-6 font-mono text-4xl text-primary">
							{`
  ██████╗ ██╗  ██╗
 ██╔═══██╗██║ ██╔╝
 ██║   ██║█████╔╝
 ██║   ██║██╔═██╗
 ╚██████╔╝██║  ██╗
  ╚═════╝ ╚═╝  ╚═╝
							`.trim()}
						</pre>
						<h2 className="mb-2 font-mono text-xl font-semibold text-foreground">
							INSCRIPTION_COMPLETE
						</h2>
						<p className="mb-6 font-mono text-sm text-muted-foreground">
							Your font has been permanently inscribed to the blockchain.
						</p>

						<div className="mb-6 w-full max-w-lg rounded border border-border bg-muted/30 p-4 text-left font-mono text-xs">
							<div className="mb-2">
								<span className="text-muted-foreground">TXID: </span>
								<span className="text-foreground">{mintResult.txid}</span>
							</div>
							<div>
								<span className="text-muted-foreground">ORDFS: </span>
								<a
									href={mintResult.ordfsUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline"
								>
									{mintResult.ordfsUrl}
								</a>
							</div>
						</div>

						<div className="flex justify-center gap-3">
							<Button
								variant="outline"
								onClick={() => navigator.clipboard.writeText(mintResult.ordfsUrl)}
								className="font-mono"
							>
								[ CP_TO_CLIPBOARD ]
							</Button>
							<Button onClick={handleReset} className="font-mono">
								[ MINT_ANOTHER ]
							</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col overflow-hidden bg-background">
			{/* Scrollable Content */}
			<div className="flex-1 overflow-y-auto">
				<div className="p-4 md:p-6 lg:p-8">
					{/* Mode Tabs */}
					<div className="mb-6 flex gap-1 rounded border border-border bg-muted/30 p-1">
						{[
							{ id: "upload" as const, label: "UPLOAD_FILE", icon: Upload },
							{ id: "ai" as const, label: "GENERATE_AI", icon: Wand2 },
						].map((tab) => {
							const Icon = tab.icon;
							const isActive = inputMode === tab.id;
							return (
								<button
									key={tab.id}
									type="button"
									onClick={() => setInputMode(tab.id)}
									className={`relative flex flex-1 items-center justify-center gap-2 rounded px-4 py-2 font-mono text-xs transition-colors ${
										isActive
											? "text-foreground"
											: "text-muted-foreground hover:text-foreground/80"
									}`}
								>
									{isActive && (
										<motion.div
											layoutId="font-input-mode"
											className="absolute inset-0 rounded bg-background shadow-sm"
											transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
										/>
									)}
									<Icon className="relative z-10 h-4 w-4" />
									<span className="relative z-10">{tab.label}</span>
								</button>
							);
						})}
					</div>

					{/* Main Grid */}
					<div className="grid gap-6 lg:grid-cols-2">
						{/* Left Column: Input Console */}
						<div className="space-y-6">
							{inputMode === "upload" ? (
								<DropZoneCLI
									files={fontFiles}
									onFilesChange={handleFilesChange}
									onZipMetadataDetected={handleZipMetadataDetected}
								/>
							) : (
								<AIGenerateTab onFontGenerated={handleAIFontGenerated} />
							)}
							<MetadataForm
								value={metadata}
								onChange={setMetadata}
								attestations={attestations}
								onAttestationsChange={setAttestations}
								isAIGenerated={isAIGenerated}
							/>
							<CostMatrix
								totalBytes={totalBytes}
								metadataBytes={JSON.stringify(metadata).length}
							/>
						</div>

						{/* Right Column: Preview */}
						<div className="min-h-[400px] lg:sticky lg:top-4">
							{generatedFont ? (
								<GeneratedFontPreview
									font={generatedFont}
									compiledFont={compiledFont ?? undefined}
									onClear={() => {
										setGeneratedFont(null);
										setCompiledFont(null);
									}}
								/>
							) : (
								<LiveTypeCanvas files={fontFiles} fontName={metadata.name} />
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Fixed Footer */}
			<footer className="shrink-0 border-t border-border bg-muted/30 px-4 py-3">
				<div className="flex items-center justify-between gap-4">
					{/* Left: Font info + Clear */}
					<div className="flex items-center gap-3">
						{metadata.name ? (
							<span className="font-mono text-xs text-foreground">
								{metadata.name}
							</span>
						) : (
							<span className="font-mono text-xs text-muted-foreground">
								No font selected
							</span>
						)}
						{totalBytes > 0 && (
							<span className="font-mono text-[10px] text-muted-foreground">
								~{formatSats(estimatedCost)}
							</span>
						)}
						{hasContent && (
							<Button
								variant="ghost"
								size="sm"
								onClick={handleReset}
								className="h-7 gap-1 px-2 font-mono text-xs text-muted-foreground hover:text-foreground"
							>
								<RotateCcw className="h-3 w-3" />
								Clear
							</Button>
						)}
					</div>

					{/* Right: Wallet + Action */}
					<div className="flex items-center gap-3">
						{isConnected && (
							<div className="hidden items-center gap-2 font-mono text-[10px] text-muted-foreground sm:flex">
								<Wallet className="h-3 w-3" />
								<span className="max-w-[100px] truncate">{addresses?.ordAddress}</span>
								{balance?.satoshis !== undefined && (
									<span className="text-foreground">{formatSats(balance.satoshis)}</span>
								)}
							</div>
						)}
						{isConnected ? (
							<Button
								onClick={handleMint}
								disabled={!isValid || isMinting}
								className="gap-2 font-mono text-xs"
							>
								{isMinting ? (
									<>
										<Loader2 className="h-3 w-3 animate-spin" />
										INSCRIBING...
									</>
								) : (
									"[ INSCRIBE ]"
								)}
							</Button>
						) : (
							<Button onClick={connect} className="gap-2 font-mono text-xs">
								<Wallet className="h-3 w-3" />
								Connect Wallet
							</Button>
						)}
					</div>
				</div>
			</footer>

			{/* Transaction Modal */}
			{isMinting && (
				<TransactionTerminal
					files={fontFiles}
					metadata={metadata}
					compiledFont={compiledFont ?? undefined}
					onComplete={handleMintComplete}
					onError={handleMintError}
					onCancel={() => setIsMinting(false)}
				/>
			)}
		</div>
	);
}
