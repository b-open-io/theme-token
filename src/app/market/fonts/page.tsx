"use client";

import { motion } from "framer-motion";
import { Upload, Wand2 } from "lucide-react";
import { useState } from "react";
import { AIGenerateTab, type GeneratedFont } from "@/components/font-mint/ai-generate-tab";
import { DropZoneCLI } from "@/components/font-mint/drop-zone-cli";
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

type InputMode = "upload" | "ai";

export default function FontMintPage() {
	const { status, connect } = useYoursWallet();
	const [inputMode, setInputMode] = useState<InputMode>("upload");
	const [fontFiles, setFontFiles] = useState<FontFile[]>([]);
	const [generatedFont, setGeneratedFont] = useState<GeneratedFont | null>(null);
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

	// Calculate bytes - for uploaded files or generated SVG data
	const totalBytes = generatedFont
		? JSON.stringify(generatedFont).length
		: fontFiles.reduce((acc, f) => acc + f.size, 0);

	const isAIGenerated = generatedFont !== null;
	const attestationsComplete = areAttestationsComplete(attestations, metadata.license, isAIGenerated);
	const isValid = (fontFiles.length > 0 || generatedFont !== null) && metadata.name.trim() !== "" && attestationsComplete;

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
		setMetadata({ name: "", author: "", license: "CC0_1.0", website: "" });
		setAttestations(getDefaultAttestations());
		setMintResult(null);
	};

	const handleAIFontGenerated = (font: GeneratedFont) => {
		setGeneratedFont(font);
		// Auto-fill metadata from the generated font
		setMetadata((prev) => ({
			...prev,
			name: font.name,
			author: `AI Generated (${font.generatedBy})`,
			isAIGenerated: true,
		}));
	};

	if (mintResult) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
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

				<div className="flex gap-3">
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
		);
	}

	return (
		<div className="relative">
			{/* Header */}
			<div className="mb-6">
				<h1 className="font-mono text-sm text-muted-foreground">
					<span className="text-primary">root</span>/mint/
					<span className="text-foreground">font</span>{" "}
					<span className="animate-pulse">_</span>
				</h1>
			</div>

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
						<DropZoneCLI files={fontFiles} onFilesChange={setFontFiles} />
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

					{/* Action Bar */}
					<div className="flex gap-3">
						<Button
							variant="outline"
							onClick={handleReset}
							className="font-mono text-xs"
							disabled={fontFiles.length === 0 && !metadata.name}
						>
							[ CLEAR_CACHE ]
						</Button>
						{isConnected ? (
							<Button
								onClick={handleMint}
								disabled={!isValid || isMinting}
								className="flex-1 font-mono text-xs"
							>
								[ INITIALIZE_INSCRIPTION ]
							</Button>
						) : (
							<Button onClick={connect} className="flex-1 font-mono text-xs">
								[ CONNECT_WALLET ]
							</Button>
						)}
					</div>
				</div>

				{/* Right Column: Preview */}
				<div className="min-h-[400px] lg:sticky lg:top-32">
					{generatedFont ? (
						<GeneratedFontPreview
							font={generatedFont}
							onClear={() => setGeneratedFont(null)}
						/>
					) : (
						<LiveTypeCanvas files={fontFiles} fontName={metadata.name} />
					)}
				</div>
			</div>

			{/* Transaction Modal */}
			{isMinting && (
				<TransactionTerminal
					files={fontFiles}
					metadata={metadata}
					onComplete={handleMintComplete}
					onError={handleMintError}
					onCancel={() => setIsMinting(false)}
				/>
			)}
		</div>
	);
}
