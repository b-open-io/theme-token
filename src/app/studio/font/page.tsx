"use client";

import { Suspense } from "react";
import { Loader2, RotateCcw, Upload, Wallet, Wand2 } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

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

function FontMintPageContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
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
	
	// AI generation settings (lifted for URL sync)
	type AIModel = "gemini-3-pro" | "claude-opus-4.5";
	const [aiModel, setAiModel] = useState<AIModel>("gemini-3-pro");
	const [aiPrompt, setAiPrompt] = useState("");
	const [aiPreset, setAiPreset] = useState<string | null>(null);

	// URL sync refs
	const isInitialized = useRef(false);
	const urlSyncTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	const isConnected = status === "connected";

	// Initialize state from URL params on mount
	useEffect(() => {
		if (isInitialized.current) return;
		isInitialized.current = true;

		const modeParam = searchParams.get("mode");
		const nameParam = searchParams.get("name");
		const authorParam = searchParams.get("author");
		const licenseParam = searchParams.get("license");
		const websiteParam = searchParams.get("website");
		const modelParam = searchParams.get("model");
		const promptParam = searchParams.get("prompt");
		const presetParam = searchParams.get("preset");

		if (modeParam && ["upload", "ai"].includes(modeParam)) {
			setInputMode(modeParam as InputMode);
		}

		if (nameParam || authorParam || licenseParam || websiteParam) {
			setMetadata(prev => ({
				...prev,
				...(nameParam && { name: nameParam }),
				...(authorParam && { author: authorParam }),
				...(licenseParam && { license: licenseParam as FontMetadata["license"] }),
				...(websiteParam && { website: websiteParam }),
			}));
		}

		// AI settings
		if (modelParam && ["gemini-3-pro", "claude-opus-4.5"].includes(modelParam)) {
			setAiModel(modelParam as AIModel);
		}
		if (promptParam) setAiPrompt(promptParam);
		if (presetParam) setAiPreset(presetParam);
	}, [searchParams]);

	// Sync state to URL (debounced)
	const syncToUrl = useCallback(() => {
		if (!isInitialized.current) return;
		if (urlSyncTimeout.current) clearTimeout(urlSyncTimeout.current);
		
		urlSyncTimeout.current = setTimeout(() => {
			const params = new URLSearchParams();
			
			// Add mode if not default
			if (inputMode !== "upload") params.set("mode", inputMode);
			
			// Add metadata fields if set
			if (metadata.name.trim()) params.set("name", metadata.name.trim());
			if (metadata.author.trim()) params.set("author", metadata.author.trim());
			if (metadata.license !== "CC0_1.0") params.set("license", metadata.license);
			if (metadata.website?.trim()) params.set("website", metadata.website.trim());
			
			// AI settings (only when in AI mode)
			if (inputMode === "ai") {
				if (aiModel !== "gemini-3-pro") params.set("model", aiModel);
				if (aiPrompt.trim()) params.set("prompt", aiPrompt.trim());
				if (aiPreset) params.set("preset", aiPreset);
			}

			const queryString = params.toString();
			const url = queryString ? `${pathname}?${queryString}` : pathname;
			router.replace(url, { scroll: false });
		}, 500);
	}, [inputMode, metadata, aiModel, aiPrompt, aiPreset, pathname, router]);

	// Trigger URL sync when relevant state changes
	useEffect(() => {
		syncToUrl();
	}, [syncToUrl]);

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

	// Clear generated font (called from AIGenerateTab when regenerating)
	const handleClearGeneratedFont = useCallback(() => {
		setGeneratedFont(null);
		setCompiledFont(null);
		setMetadata((prev) => ({
			...prev,
			name: "",
			author: "",
			isAIGenerated: false,
			prompt: undefined,
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
			<div className="flex min-h-0 flex-1 items-center justify-center p-4">
				<div className="text-center">
					<pre className="mb-6 font-mono text-3xl text-primary sm:text-4xl">
						{`
  ██████╗ ██╗  ██╗
 ██╔═══██╗██║ ██╔╝
 ██║   ██║█████╔╝
 ██║   ██║██╔═██╗
 ╚██████╔╝██║  ██╗
  ╚═════╝ ╚═╝  ╚═╝
						`.trim()}
					</pre>
					<h2 className="mb-2 font-mono text-lg font-semibold text-foreground sm:text-xl">
						INSCRIPTION_COMPLETE
					</h2>
					<p className="mb-6 font-mono text-xs text-muted-foreground sm:text-sm">
						Your font has been permanently inscribed to the blockchain.
					</p>

					<div className="mx-auto mb-6 max-w-lg rounded border border-border bg-muted/30 p-4 text-left font-mono text-xs">
						<div className="mb-2">
							<span className="text-muted-foreground">TXID: </span>
							<span className="break-all text-foreground">{mintResult.txid}</span>
						</div>
						<div>
							<span className="text-muted-foreground">ORDFS: </span>
							<a
								href={mintResult.ordfsUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="break-all text-primary hover:underline"
							>
								{mintResult.ordfsUrl}
							</a>
						</div>
					</div>

					<div className="flex flex-wrap justify-center gap-3">
						<Button
							variant="outline"
							size="sm"
							onClick={() => navigator.clipboard.writeText(mintResult.ordfsUrl)}
							className="font-mono text-xs"
						>
							[ COPY_URL ]
						</Button>
						<Button onClick={handleReset} size="sm" className="font-mono text-xs">
							[ MINT_ANOTHER ]
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			{/* Main content area - resizable two panel layout */}
			<ResizablePanelGroup direction="horizontal" className="min-h-0 flex-1">
				{/* Left Panel: Controls (scrollable) */}
				<ResizablePanel defaultSize={35} minSize={25} maxSize={50} className="flex min-h-0 flex-col bg-muted/5">
					{/* Mode Tabs */}
					<div className="flex items-center border-b border-border px-4 py-2">
						<Tabs value={inputMode} onValueChange={(v) => setInputMode(v as InputMode)}>
							<TabsList>
								<TabsTrigger value="upload">
									<Upload className="h-3.5 w-3.5" />
									Upload
								</TabsTrigger>
								<TabsTrigger value="ai">
									<Wand2 className="h-3.5 w-3.5" />
									AI
								</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					{/* Scrollable content */}
					<div className="min-h-0 flex-1 overflow-y-auto p-4">
						<div className="space-y-4">
							{inputMode === "upload" ? (
								<DropZoneCLI
									files={fontFiles}
									onFilesChange={handleFilesChange}
									onZipMetadataDetected={handleZipMetadataDetected}
								/>
							) : (
								<AIGenerateTab
									onFontGenerated={handleAIFontGenerated}
									generatedFont={generatedFont}
									compiledFont={compiledFont}
									onClear={handleClearGeneratedFont}
									initialModel={aiModel}
									initialPrompt={aiPrompt}
									initialPreset={aiPreset ?? undefined}
									onModelChange={setAiModel}
									onPromptChange={setAiPrompt}
									onPresetChange={setAiPreset}
								/>
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
					</div>
				</ResizablePanel>

				<ResizableHandle withHandle />

				{/* Right Panel: Preview (fixed, no scroll) */}
				<ResizablePanel defaultSize={65} className="hidden min-h-0 flex-col overflow-hidden lg:flex">
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
				</ResizablePanel>
			</ResizablePanelGroup>

			{/* Full-width Footer */}
			<div className="flex shrink-0 items-center justify-between border-t border-border bg-muted/30 px-4 py-2">
				{/* Left: Font info */}
				<div className="flex items-center gap-3 overflow-hidden">
					{metadata.name ? (
						<span className="truncate font-mono text-sm text-foreground">
							{metadata.name}
						</span>
					) : (
						<span className="font-mono text-sm text-muted-foreground">
							No font selected
						</span>
					)}
					{totalBytes > 0 && (
						<span className="shrink-0 font-mono text-xs text-muted-foreground">
							~{formatSats(estimatedCost)}
						</span>
					)}
					{hasContent && (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleReset}
							className="h-7 gap-1.5 px-2 font-mono text-xs text-muted-foreground hover:text-foreground"
						>
							<RotateCcw className="h-3 w-3" />
							Clear
						</Button>
					)}
				</div>

				{/* Right: Wallet + Action */}
				<div className="flex shrink-0 items-center gap-3">
					{isConnected && balance?.satoshis !== undefined && (
						<span className="hidden font-mono text-xs text-muted-foreground sm:block">
							{formatSats(balance.satoshis)}
						</span>
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
								<>
									<Wallet className="h-3 w-3" />
									INSCRIBE
								</>
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

export default function FontMintPage() {
	return (
		<Suspense
			fallback={
				<div className="flex h-full items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<FontMintPageContent />
		</Suspense>
	);
}
