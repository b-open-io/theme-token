"use client";

import { motion } from "framer-motion";
import {
	Cloud,
	Download,
	Eye,
	ImageIcon,
	Loader2,
	MessageCircle,
	PenLine,
	RefreshCw,
	Trash2,
	Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSwatchyStore } from "@/components/swatchy/swatchy-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { toast } from "sonner";
import type { DraftMetadata } from "@/lib/storage/types";

interface WallpaperDraft {
	id: string;
	name: string;
	prompt?: string;
	style?: string;
	aspectRatio?: string;
	mimeType: string;
	imageBase64?: string;
	createdAt: number;
	expiresAt?: number;
}

export default function MyWallpapersPage() {
	const { status, connect, addresses, inscribeImage, isInscribing } = useYoursWallet();
	const { openChat, setPendingMessage } = useSwatchyStore();
	const ordAddress = addresses?.ordAddress;
	const isConnected = status === "connected";

	const handleCreateWithSwatchy = useCallback(() => {
		setPendingMessage("I want to create a wallpaper. Can you help me generate something?");
		openChat();
	}, [openChat, setPendingMessage]);

	const [drafts, setDrafts] = useState<WallpaperDraft[]>([]);
	const [loading, setLoading] = useState(false);
	const [usage, setUsage] = useState<{ count: number; limit: number } | null>(null);
	const [inscribingId, setInscribingId] = useState<string | null>(null);
	const [selectedId, setSelectedId] = useState<string | null>(null);

	// Fetch drafts from cloud
	const fetchDrafts = useCallback(async () => {
		if (!ordAddress) return;

		setLoading(true);
		try {
			const params = new URLSearchParams({
				userId: ordAddress,
				type: "wallpaper",
			});

			const response = await fetch(`/api/drafts?${params}`);
			if (!response.ok) throw new Error("Failed to fetch drafts");

			const data = await response.json();
			setUsage(data.usage);

			if (data.drafts && data.drafts.length > 0) {
				const wallpaperDrafts: WallpaperDraft[] = await Promise.all(
					data.drafts.map(async (draft: DraftMetadata) => {
						let imageBase64 = "";
						if (draft.blobUrl) {
							try {
								const imgResponse = await fetch(draft.blobUrl);
								if (imgResponse.ok) {
									const blob = await imgResponse.blob();
									const reader = new FileReader();
									imageBase64 = await new Promise<string>((resolve) => {
										reader.onload = () => {
											const result = reader.result as string;
											resolve(result.split(",")[1] || "");
										};
										reader.readAsDataURL(blob);
									});
								}
							} catch (e) {
								console.warn("Failed to fetch image:", e);
							}
						}

						return {
							id: draft.id,
							name: draft.name,
							prompt: draft.prompt,
							style: draft.style,
							aspectRatio: draft.aspectRatio,
							mimeType: draft.mimeType,
							imageBase64,
							createdAt: draft.createdAt,
							expiresAt: draft.expiresAt,
						};
					}),
				);

				setDrafts(wallpaperDrafts);
			} else {
				setDrafts([]);
			}
		} catch (error) {
			console.error("Failed to fetch wallpaper drafts:", error);
		} finally {
			setLoading(false);
		}
	}, [ordAddress]);

	// Fetch on connect
	useEffect(() => {
		if (isConnected && ordAddress) {
			fetchDrafts();
		}
	}, [isConnected, ordAddress, fetchDrafts]);

	// Delete draft
	const deleteDraft = async (id: string) => {
		if (!ordAddress) return;

		try {
			const params = new URLSearchParams({
				userId: ordAddress,
				type: "wallpaper",
			});

			const response = await fetch(`/api/drafts/${id}?${params}`, {
				method: "DELETE",
			});

			if (response.ok) {
				setDrafts((prev) => prev.filter((d) => d.id !== id));
				if (selectedId === id) setSelectedId(null);
				toast.success("Wallpaper deleted");
			} else {
				toast.error("Failed to delete wallpaper");
			}
		} catch (error) {
			console.error("Delete error:", error);
			toast.error("Failed to delete wallpaper");
		}
	};

	const handleInscribe = async (draft: WallpaperDraft) => {
		if (!isConnected) {
			await connect();
			return;
		}

		if (!draft.imageBase64) {
			toast.error("No image data available");
			return;
		}

		setInscribingId(draft.id);
		try {
			const result = await inscribeImage(
				draft.imageBase64,
				draft.mimeType,
				{
					prompt: draft.prompt || "",
					style: draft.style,
					aspectRatio: draft.aspectRatio,
				},
			);
			if (result?.txid) {
				toast.success("Wallpaper inscribed!");
			}
		} catch (error) {
			console.error("Inscribe error:", error);
			toast.error("Failed to inscribe wallpaper");
		} finally {
			setInscribingId(null);
		}
	};

	const handleDownload = (draft: WallpaperDraft) => {
		if (!draft.imageBase64) return;
		const link = document.createElement("a");
		link.download = `wallpaper-${draft.id}.${draft.mimeType.split("/")[1] || "png"}`;
		link.href = `data:${draft.mimeType};base64,${draft.imageBase64}`;
		link.click();
	};

	const renderContent = () => {
		if (!isConnected) {
			return (
				<div className="rounded-xl border border-dashed border-border py-20 text-center">
					<Wallet className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
					<h3 className="mb-2 text-lg font-semibold">Connect Your Wallet</h3>
					<p className="mb-4 text-muted-foreground">
						Connect to see your saved wallpapers
					</p>
					<Button onClick={connect}>Connect Wallet</Button>
				</div>
			);
		}

		if (loading) {
			return (
				<div className="rounded-xl border border-dashed border-border py-20 text-center">
					<Loader2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground animate-spin" />
					<h3 className="mb-2 text-lg font-semibold">Loading wallpapers...</h3>
				</div>
			);
		}

		if (drafts.length === 0) {
			return (
				<div className="rounded-xl border border-dashed border-border py-20 text-center">
					<ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
					<h3 className="mb-2 text-lg font-semibold">No wallpapers found</h3>
					<p className="mb-4 text-muted-foreground">
						Generate some wallpapers in the studio
					</p>
					<Button onClick={handleCreateWithSwatchy}>
					<MessageCircle className="mr-2 h-4 w-4" />
					Create Wallpaper
				</Button>
				</div>
			);
		}

		return (
			<>
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h2 className="text-xl font-semibold">My Wallpaper Drafts</h2>
						<p className="text-sm text-muted-foreground">
							{usage
								? `${usage.count}/${usage.limit} drafts saved`
								: "Wallpapers saved to cloud (30-day retention)"}
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Badge variant="outline" className="gap-1">
							<Cloud className="h-3 w-3" />
							Cloud Sync
						</Badge>
						<Button variant="ghost" size="sm" onClick={fetchDrafts}>
							<RefreshCw className="h-4 w-4" />
						</Button>
					</div>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{drafts.map((draft, i) => (
						<motion.div
							key={draft.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: i * 0.05 }}
							className={`group relative rounded-xl border bg-card overflow-hidden ${
								selectedId === draft.id
									? "border-primary ring-2 ring-primary/20"
									: "border-border"
							}`}
						>
							{/* Thumbnail */}
							<button
								type="button"
								onClick={() => setSelectedId(draft.id)}
								className="relative aspect-video w-full overflow-hidden bg-muted"
							>
								{draft.imageBase64 ? (
									<img
										src={`data:${draft.mimeType};base64,${draft.imageBase64}`}
										alt={draft.prompt || draft.name}
										className="h-full w-full object-cover transition-transform group-hover:scale-105"
									/>
								) : (
									<div className="flex h-full items-center justify-center">
										<ImageIcon className="h-8 w-8 text-muted-foreground" />
									</div>
								)}
								<div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
									<Eye className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100 drop-shadow-md" />
								</div>
							</button>

							{/* Info */}
							<div className="p-3">
								<p className="text-sm line-clamp-2 mb-2">
									{draft.prompt || draft.name || "Untitled Wallpaper"}
								</p>
								<div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
									{draft.aspectRatio && (
										<Badge variant="secondary" className="text-[10px]">
											{draft.aspectRatio}
										</Badge>
									)}
									{draft.style && (
										<Badge variant="outline" className="text-[10px]">
											{draft.style}
										</Badge>
									)}
								</div>

								{/* Actions */}
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										className="flex-1 h-8 text-xs"
										onClick={() => handleDownload(draft)}
										disabled={!draft.imageBase64}
									>
										<Download className="mr-1 h-3 w-3" />
										Save
									</Button>
									<Button
										variant="default"
										size="sm"
										className="flex-1 h-8 text-xs"
										onClick={() => handleInscribe(draft)}
										disabled={isInscribing || inscribingId === draft.id || !draft.imageBase64}
									>
										{inscribingId === draft.id ? (
											<>
												<Loader2 className="mr-1 h-3 w-3 animate-spin" />
												Inscribing
											</>
										) : (
											<>
												<PenLine className="mr-1 h-3 w-3" />
												Inscribe
											</>
										)}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="h-8 w-8 p-0 text-destructive hover:text-destructive"
										onClick={() => deleteDraft(draft.id)}
									>
										<Trash2 className="h-3 w-3" />
									</Button>
								</div>
							</div>
						</motion.div>
					))}
				</div>
			</>
		);
	};

	return (
		<div className="container max-w-7xl py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight">My Wallpapers</h1>
				<p className="text-muted-foreground">
					Manage your generated wallpaper drafts
				</p>
			</div>
			{renderContent()}
		</div>
	);
}
