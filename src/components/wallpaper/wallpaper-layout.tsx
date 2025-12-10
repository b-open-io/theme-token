"use client";

import { getOrdfsUrl } from "@theme-token/sdk";
import { Check, Download, ExternalLink, Loader2, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { downloadWallpaper } from "@/lib/wallpaper-engine";
import { useWallpaperContext } from "./wallpaper-context";
import { WallpaperGallery } from "./wallpaper-gallery";
import { WallpaperPreview } from "./wallpaper-preview";
import { WallpaperSidebar } from "./wallpaper-sidebar";

export function WallpaperLayout() {
	const { selectedWallpaper } = useWallpaperContext();
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

	return (
		<div className="relative flex h-[calc(100vh-6.375rem)] w-full overflow-hidden bg-background">
			{/* Sidebar */}
			<WallpaperSidebar />

			{/* Main Canvas */}
			<div className="relative flex-1 flex flex-col overflow-hidden">
				{/* Top Bar */}
				<div className="relative z-10 flex items-center justify-between p-4">
					<div className="flex items-center gap-2">
						{/* Download button */}
						{selectedWallpaper && (
							<Button
								size="sm"
								variant="outline"
								className="bg-background/80 backdrop-blur"
								onClick={handleDownload}
							>
								<Download className="mr-2 h-3 w-3" />
								Download
							</Button>
						)}
					</div>

					<div className="flex items-center gap-2">
						{inscribedOrigin ? (
							<div className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 backdrop-blur border shadow-sm">
								<Check className="h-3 w-3 text-green-500" />
								<a
									href={getOrdfsUrl(inscribedOrigin)}
									target="_blank"
									rel="noopener noreferrer"
									className="text-xs hover:underline flex items-center gap-1"
								>
									Inscribed <ExternalLink className="h-3 w-3" />
								</a>
							</div>
						) : selectedWallpaper ? (
							<Button
								size="sm"
								variant={status === "connected" ? "secondary" : "outline"}
								className="shadow-sm bg-background/80 backdrop-blur hover:bg-background/90"
								onClick={status === "connected" ? handleInscribe : connect}
								disabled={isInscribing}
							>
								{isInscribing ? (
									<>
										<Loader2 className="mr-2 h-3 w-3 animate-spin" />
										Inscribing...
									</>
								) : (
									<>
										<Wallet className="mr-2 h-3 w-3" />
										{status === "connected" ? "Inscribe" : "Connect"}
									</>
								)}
							</Button>
						) : null}
					</div>
				</div>

				{/* Preview Area */}
				<WallpaperPreview />

				{/* Floating Gallery */}
				<WallpaperGallery />
			</div>
		</div>
	);
}
