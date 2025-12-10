"use client";

import { useBsvRateContext } from "@/hooks/use-bsv-rate-context";

interface CostMatrixProps {
	totalBytes: number;
	metadataBytes: number;
	previewBytes?: number;
}

// Approximate costs (these would be fetched from a fee API in production)
const SATS_PER_BYTE = 0.5; // Current BSV mining fee rate
const ORDFS_INDEX_FEE = 1000; // Satoshis for ORDFS indexing
const TX_OVERHEAD_BYTES = 250; // Base transaction overhead

export function CostMatrix({ totalBytes, metadataBytes, previewBytes = 0 }: CostMatrixProps) {
	const { formatUsd, rate } = useBsvRateContext();

	const hasPreview = previewBytes > 0;
	const outputCount = hasPreview ? 2 : 1;
	const payloadBytes = totalBytes + metadataBytes + previewBytes;
	const totalTxBytes = payloadBytes + TX_OVERHEAD_BYTES;
	const networkFee = Math.ceil(totalTxBytes * SATS_PER_BYTE);
	// ORDFS index fee per output
	const totalSats = networkFee + (ORDFS_INDEX_FEE * outputCount);
	const totalBsv = totalSats / 100_000_000;

	const formatBytes = (bytes: number): string => {
		if (bytes < 1024) return `${bytes} bytes`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
	};

	const usdTotal = rate ? formatUsd(totalSats) : null;

	return (
		<div className="rounded border border-border bg-background font-mono text-xs">
			{/* Header */}
			<div className="border-b border-border px-3 py-2">
				<span className="text-muted-foreground">// ESTIMATED_COST_BREAKDOWN</span>
			</div>

			{/* Cost Lines */}
			<div className="p-3 space-y-1.5">
				<div className="flex justify-between text-muted-foreground">
					<span>&gt; FONT_PAYLOAD:</span>
					<span className="tabular-nums">{formatBytes(totalBytes)}</span>
				</div>
				{hasPreview && (
					<div className="flex justify-between text-muted-foreground">
						<span>&gt; PREVIEW_IMAGE:</span>
						<span className="tabular-nums">{formatBytes(previewBytes)}</span>
					</div>
				)}
				<div className="flex justify-between text-muted-foreground">
					<span>&gt; METADATA_SIZE:</span>
					<span className="tabular-nums">{formatBytes(metadataBytes)}</span>
				</div>
				<div className="flex justify-between text-muted-foreground">
					<span>&gt; TX_OVERHEAD:</span>
					<span className="tabular-nums">{formatBytes(TX_OVERHEAD_BYTES)}</span>
				</div>

				<div className="my-2 border-t border-dashed border-border" />

				<div className="flex justify-between text-muted-foreground">
					<span>&gt; NETWORK_FEE:</span>
					<span className="tabular-nums">{networkFee.toLocaleString()} sats</span>
				</div>
				<div className="flex justify-between text-muted-foreground">
					<span>&gt; ORDFS_INDEX_FEE:</span>
					<span className="tabular-nums">
						{(ORDFS_INDEX_FEE * outputCount).toLocaleString()} sats
						{hasPreview && <span className="text-muted-foreground/60"> ({outputCount} outputs)</span>}
					</span>
				</div>

				<div className="my-2 border-t border-border" />

				<div className="flex justify-between text-foreground font-semibold">
					<span>TOTAL:</span>
					<span className="tabular-nums">
						{totalBsv.toFixed(8)} BSV
						{usdTotal && (
							<span className="ml-2 text-primary">({usdTotal})</span>
						)}
					</span>
				</div>
			</div>

			{/* Note */}
			{totalBytes === 0 && (
				<div className="border-t border-border px-3 py-2 text-muted-foreground/60">
					Upload font files to calculate cost
				</div>
			)}
		</div>
	);
}
