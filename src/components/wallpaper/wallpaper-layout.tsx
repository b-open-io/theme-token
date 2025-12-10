"use client";

import { getOrdfsUrl } from "@theme-token/sdk";
import { Check, Download, ExternalLink, Loader2, PenLine, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StudioDashboard } from "@/components/studio/studio-dashboard";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { downloadWallpaper } from "@/lib/wallpaper-engine";
import { useWallpaperContext } from "./wallpaper-context";
import { WallpaperGallery } from "./wallpaper-gallery";
import { WallpaperPreview } from "./wallpaper-preview";
import { WallpaperSidebar } from "./wallpaper-sidebar";

export function WallpaperLayout() {
	const { selectedWallpaper, removeWallpaper, setSourceWallpaper } = useWallpaperContext();
	const { status, connect, inscribeImage, isInscribing } = useYoursWallet();

	const [inscribedOrigin, setInscribedOrigin] = useState<string | null>(null);

	const handleInscribe = async () => {
		if (!selectedWallpaper) return;

		try {
			const response = await inscribeImage(
				selectedWallpaper.imageBase64,
				selectedWallpaper.mimeType,
				{
					prompt: selectedWallpaper.prompt,
					aspectRatio: selectedWallpaper.aspectRatio,
					style: selectedWallpaper.style,
					dimensions: selectedWallpaper.dimensions,
				},
			);

			if (response?.txid) {
				setInscribedOrigin(`${response.txid}_0`);
				toast.success("Wallpaper inscribed!");
			}
		} catch (error) {
			console.error("Inscribe error:", error);
			toast.error("Failed to inscribe wallpaper");
		}
	};

	const handleDownload = () => {
		if (selectedWallpaper) {
			downloadWallpaper(
				selectedWallpaper.imageBase64,
				selectedWallpaper.mimeType,
				`wallpaper-${selectedWallpaper.aspectRatio}-${Date.now()}`,
			);
		}
	};

	const isConnected = status === "connected";

	return (
		<StudioDashboard
			sidebar={<WallpaperSidebar />}
			bottomLeft={
				selectedWallpaper ? (
					<span className="text-xs text-muted-foreground">
						{selectedWallpaper.aspectRatio} &middot; {selectedWallpaper.style}
					</span>
				) : (
					<span className="text-xs text-muted-foreground">
						Generate a wallpaper to inscribe
					</span>
				)
			}
			bottomRight={
				inscribedOrigin ? (
					<div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5 border border-green-500/20">
						<Check className="h-3 w-3 text-green-500" />
						<a
							href={getOrdfsUrl(inscribedOrigin)}
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs text-green-600 hover:underline flex items-center gap-1"
						>
							Inscribed <ExternalLink className="h-3 w-3" />
						</a>
					</div>
				) : (
					<Button
						size="lg"
						disabled={isInscribing || !selectedWallpaper}
						onClick={isConnected ? handleInscribe : connect}
						className="gap-2"
					>
						{isInscribing ? (
							<>
								<Loader2 className="h-5 w-5 animate-spin" />
								Inscribing...
							</>
						) : isConnected ? (
							<>
								<PenLine className="h-5 w-5" />
								Inscribe Wallpaper
							</>
						) : status === "connecting" ? (
							<>
								<Loader2 className="h-5 w-5 animate-spin" />
								Connecting...
							</>
						) : (
							<>
								<PenLine className="h-5 w-5" />
								Connect to Inscribe
							</>
						)}
					</Button>
				)
			}
		>
			{/* Top Bar - View options only */}
			<div className="relative z-10 flex items-center justify-between p-4">
				<div className="flex items-center gap-2">
					{selectedWallpaper && (
						<ButtonGroup className="bg-background/80 backdrop-blur rounded-md">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										size="icon"
										variant="outline"
										onClick={handleDownload}
										type="button"
										className="h-8 w-8"
									>
										<Download className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Download</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										size="icon"
										variant="outline"
										onClick={() => {
											setSourceWallpaper(selectedWallpaper);
											toast.success("Set as remix source");
										}}
										type="button"
										className="h-8 w-8"
									>
										<RefreshCw className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Use as remix source</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										size="icon"
										variant="outline"
										onClick={() => {
											removeWallpaper(selectedWallpaper.id);
											toast.success("Wallpaper deleted");
										}}
										type="button"
										className="h-8 w-8 text-destructive hover:text-destructive"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Delete</TooltipContent>
							</Tooltip>
						</ButtonGroup>
					)}
				</div>
			</div>

			{/* Preview Area */}
			<WallpaperPreview />

			{/* Floating Gallery */}
			<WallpaperGallery />
		</StudioDashboard>
	);
}
