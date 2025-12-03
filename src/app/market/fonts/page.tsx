"use client";

import { useState } from "react";
import { DropZoneCLI } from "@/components/font-mint/drop-zone-cli";
import { LiveTypeCanvas } from "@/components/font-mint/live-type-canvas";
import { MetadataForm, type FontMetadata } from "@/components/font-mint/metadata-form";
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

export default function FontMintPage() {
	const { status, connect } = useYoursWallet();
	const [fontFiles, setFontFiles] = useState<FontFile[]>([]);
	const [metadata, setMetadata] = useState<FontMetadata>({
		name: "",
		author: "",
		license: "SIL_OFL_1.1",
		website: "",
	});
	const [isMinting, setIsMinting] = useState(false);
	const [mintResult, setMintResult] = useState<{
		txid: string;
		ordfsUrl: string;
	} | null>(null);

	const isConnected = status === "connected";
	const totalBytes = fontFiles.reduce((acc, f) => acc + f.size, 0);
	const isValid = fontFiles.length > 0 && metadata.name.trim() !== "";

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
		setMetadata({ name: "", author: "", license: "SIL_OFL_1.1", website: "" });
		setMintResult(null);
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

			{/* Main Grid */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Left Column: Input Console */}
				<div className="space-y-6">
					<DropZoneCLI files={fontFiles} onFilesChange={setFontFiles} />
					<MetadataForm value={metadata} onChange={setMetadata} />
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
					<LiveTypeCanvas files={fontFiles} fontName={metadata.name} />
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
