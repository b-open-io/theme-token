"use client";

import {
	FileText,
	Image,
	Loader2,
	Package,
	Palette,
	Sparkles,
	Type,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type {
	BundleAssetType,
	BundleInscribeResult,
	BundleItem,
} from "@/hooks/use-yours-wallet";

/** Cost per inscription item (1 sat per output) */
const INSCRIPTION_COST_SATS = 1;

/** Get icon for bundle asset type */
function getAssetIcon(type: BundleAssetType) {
	switch (type) {
		case "font":
			return Type;
		case "pattern":
		case "wallpaper":
			return Image;
		case "theme":
			return Palette;
		case "block":
		case "component":
			return Sparkles;
		case "hook":
		case "lib":
		case "file":
			return FileText;
		default:
			return Package;
	}
}

/** Get human-readable label for asset type */
function getAssetLabel(type: BundleAssetType): string {
	switch (type) {
		case "font":
			return "Font";
		case "pattern":
			return "Pattern";
		case "wallpaper":
			return "Wallpaper";
		case "theme":
			return "Theme";
		case "block":
			return "Block";
		case "component":
			return "Component";
		case "hook":
			return "Hook";
		case "lib":
			return "Library";
		case "file":
			return "File";
		default:
			return "Asset";
	}
}

/** Format file size in human-readable form */
function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Estimate base64 decoded size */
function estimateSize(base64: string): number {
	// Remove data URL prefix if present
	const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, "");
	// Base64 is ~4/3 the size of binary
	return Math.floor((cleanBase64.length * 3) / 4);
}

interface BundleItemPreview extends BundleItem {
	/** Preview URL for images (blob URL) */
	previewUrl?: string;
	/** Estimated size in bytes */
	estimatedSize: number;
}

interface InscribeBundleDialogProps {
	isOpen: boolean;
	onClose: () => void;
	items: BundleItem[];
	onConfirm: () => Promise<BundleInscribeResult | null>;
	isInscribing: boolean;
	/** Optional title override */
	title?: string;
	/** Optional description override */
	description?: string;
}

export function InscribeBundleDialog({
	isOpen,
	onClose,
	items,
	onConfirm,
	isInscribing,
	title = "Inscribe Bundle",
	description = "Review items before inscribing to the blockchain",
}: InscribeBundleDialogProps) {
	const [previews, setPreviews] = useState<BundleItemPreview[]>([]);

	// Create blob URLs for image previews and calculate sizes
	useEffect(() => {
		if (!isOpen) return;

		const itemPreviews: BundleItemPreview[] = items.map((item) => {
			const estimatedSize = estimateSize(item.base64Data);
			const preview: BundleItemPreview = { ...item, estimatedSize };

			// Create blob URL for image types
			if (
				item.mimeType.startsWith("image/") ||
				item.type === "pattern" ||
				item.type === "wallpaper"
			) {
				try {
					// Handle data URL or raw base64
					const dataUrl = item.base64Data.startsWith("data:")
						? item.base64Data
						: `data:${item.mimeType};base64,${item.base64Data}`;
					preview.previewUrl = dataUrl;
				} catch {
					// Skip preview on error
				}
			}

			return preview;
		});

		setPreviews(itemPreviews);

		// Cleanup - no blob URLs to revoke since we use data URLs
	}, [isOpen, items]);

	// Calculate totals
	const totalSize = useMemo(
		() => previews.reduce((sum, p) => sum + p.estimatedSize, 0),
		[previews],
	);

	const totalCost = useMemo(
		() => items.length * INSCRIPTION_COST_SATS,
		[items.length],
	);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[500px] font-mono">
				<DialogHeader>
					<DialogTitle className="tracking-tight flex items-center gap-2">
						<Package className="h-5 w-5" />
						{title}
					</DialogTitle>
					<DialogDescription className="text-xs uppercase tracking-wider">
						{description}
					</DialogDescription>
				</DialogHeader>

				{/* Bundle Items List */}
				<div className="max-h-[300px] overflow-y-auto space-y-2 py-2">
					{previews.map((item, index) => {
						const Icon = getAssetIcon(item.type);
						return (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: Bundle items don't have unique IDs and order is fixed
								key={index}
								className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
							>
								{/* Preview thumbnail or icon */}
								<div className="w-12 h-12 rounded-md bg-background flex items-center justify-center overflow-hidden border border-border/50 shrink-0">
									{item.previewUrl ? (
										// biome-ignore lint/performance/noImgElement: Data URLs don't work with Next.js Image
										<img
											src={item.previewUrl}
											alt={item.name || `Item ${index}`}
											className="w-full h-full object-cover"
										/>
									) : (
										<Icon className="h-5 w-5 text-muted-foreground" />
									)}
								</div>

								{/* Item details */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<span className="text-sm font-medium truncate">
											{item.name || `${getAssetLabel(item.type)} ${index + 1}`}
										</span>
										<span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
											vout {index}
										</span>
									</div>
									<div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
										<span>{getAssetLabel(item.type)}</span>
										<span className="text-border">•</span>
										<span>{formatFileSize(item.estimatedSize)}</span>
										<span className="text-border">•</span>
										<span className="truncate">{item.mimeType}</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>

				{/* Summary stats */}
				<div className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/30 border border-border text-sm">
					<div className="flex items-center gap-4">
						<div>
							<span className="text-muted-foreground">Items:</span>{" "}
							<span className="font-medium">{items.length}</span>
						</div>
						<div>
							<span className="text-muted-foreground">Size:</span>{" "}
							<span className="font-medium">{formatFileSize(totalSize)}</span>
						</div>
					</div>
					<div>
						<span className="text-muted-foreground">Cost:</span>{" "}
						<span className="font-medium">{totalCost} sats</span>
					</div>
				</div>

				<DialogFooter className="mt-2">
					<Button
						variant="ghost"
						onClick={onClose}
						disabled={isInscribing}
						className="text-muted-foreground hover:text-foreground"
					>
						Cancel
					</Button>
					<Button
						onClick={onConfirm}
						disabled={items.length === 0 || isInscribing}
						className="min-w-[120px]"
					>
						{isInscribing ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Inscribing...
							</>
						) : (
							<>
								<Package className="mr-2 h-4 w-4" />
								Inscribe ({items.length})
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
