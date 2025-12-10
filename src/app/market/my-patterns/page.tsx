"use client";

import { motion } from "framer-motion";
import {
	Cloud,
	Download,
	Eye,
	Grid3X3,
	Loader2,
	PenLine,
	RefreshCw,
	Trash2,
	Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { usePatternDrafts, type PatternDraft } from "@/hooks/use-pattern-drafts";
import { toast } from "sonner";

export default function MyPatternsPage() {
	const { status, connect, inscribePattern, isInscribing } = useYoursWallet();
	const {
		drafts,
		loading,
		usage,
		isCloudEnabled,
		fetchDrafts,
		deleteDraft,
	} = usePatternDrafts();

	const [inscribingId, setInscribingId] = useState<string | null>(null);
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const isConnected = status === "connected";

	const handleInscribe = async (draft: PatternDraft) => {
		if (!isConnected) {
			await connect();
			return;
		}

		if (!draft.svg) {
			toast.error("Pattern has no SVG data");
			return;
		}

		setInscribingId(draft.id);
		try {
			const result = await inscribePattern(draft.svg, {
				prompt: draft.prompt || "Pattern",
				provider: "ai",
				model: "gemini",
			});
			if (result?.txid) {
				toast.success("Pattern inscribed!");
			}
		} catch (error) {
			console.error("Inscribe error:", error);
			toast.error("Failed to inscribe pattern");
		} finally {
			setInscribingId(null);
		}
	};

	const handleDownload = (draft: PatternDraft) => {
		if (!draft.svg) return;
		const blob = new Blob([draft.svg], { type: "image/svg+xml" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.download = `pattern-${draft.id}.svg`;
		link.href = url;
		link.click();
		URL.revokeObjectURL(url);
	};

	const handleDelete = async (id: string) => {
		const success = await deleteDraft(id);
		if (success && selectedId === id) {
			setSelectedId(null);
		}
	};

	// Generate pattern preview URL
	const getPatternPreviewStyle = (svg: string) => {
		const maskSvg = svg.replace(/currentColor/gi, "#ffffff");
		const encoded = encodeURIComponent(maskSvg);
		return {
			backgroundColor: "hsl(var(--primary))",
			opacity: 0.8,
			maskImage: `url("data:image/svg+xml,${encoded}")`,
			WebkitMaskImage: `url("data:image/svg+xml,${encoded}")`,
			maskSize: "32px 32px",
			WebkitMaskSize: "32px 32px",
			maskRepeat: "repeat",
			WebkitMaskRepeat: "repeat",
		};
	};

	const renderContent = () => {
		if (!isConnected) {
			return (
				<div className="rounded-xl border border-dashed border-border py-20 text-center">
					<Wallet className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
					<h3 className="mb-2 text-lg font-semibold">Connect Your Wallet</h3>
					<p className="mb-4 text-muted-foreground">
						Connect to see your saved patterns
					</p>
					<Button onClick={connect}>Connect Wallet</Button>
				</div>
			);
		}

		if (loading) {
			return (
				<div className="rounded-xl border border-dashed border-border py-20 text-center">
					<Loader2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground animate-spin" />
					<h3 className="mb-2 text-lg font-semibold">Loading patterns...</h3>
				</div>
			);
		}

		if (drafts.length === 0) {
			return (
				<div className="rounded-xl border border-dashed border-border py-20 text-center">
					<Grid3X3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
					<h3 className="mb-2 text-lg font-semibold">No patterns found</h3>
					<p className="mb-4 text-muted-foreground">
						Generate some patterns in the studio
					</p>
					<Link href="/studio/patterns">
						<Button>Create Pattern</Button>
					</Link>
				</div>
			);
		}

		return (
			<>
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h2 className="text-xl font-semibold">My Pattern Drafts</h2>
						<p className="text-sm text-muted-foreground">
							{usage
								? `${usage.count}/${usage.limit} drafts saved`
								: "Patterns saved to cloud (30-day retention)"}
						</p>
					</div>
					<div className="flex items-center gap-2">
						{isCloudEnabled && (
							<Badge variant="outline" className="gap-1">
								<Cloud className="h-3 w-3" />
								Cloud Sync
							</Badge>
						)}
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
							{/* Pattern Preview */}
							<button
								type="button"
								onClick={() => setSelectedId(draft.id)}
								className="relative aspect-square w-full overflow-hidden bg-muted"
							>
								<div className="absolute inset-0 bg-background" />
								{draft.svg && (
									<div
										className="absolute inset-0"
										style={getPatternPreviewStyle(draft.svg)}
									/>
								)}
								<div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
									<Eye className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100 drop-shadow-md" />
								</div>
							</button>

							{/* Info */}
							<div className="p-3">
								<p className="text-sm line-clamp-2 mb-2">
									{draft.name || draft.prompt || "Untitled Pattern"}
								</p>
								<p className="text-xs text-muted-foreground mb-3">
									{new Date(draft.createdAt).toLocaleDateString()}
								</p>

								{/* Actions */}
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										className="flex-1 h-8 text-xs"
										onClick={() => handleDownload(draft)}
										disabled={!draft.svg}
									>
										<Download className="mr-1 h-3 w-3" />
										SVG
									</Button>
									<Button
										variant="default"
										size="sm"
										className="flex-1 h-8 text-xs"
										onClick={() => handleInscribe(draft)}
										disabled={isInscribing || inscribingId === draft.id || !draft.svg}
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
										onClick={() => handleDelete(draft.id)}
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
				<h1 className="text-3xl font-bold tracking-tight">My Patterns</h1>
				<p className="text-muted-foreground">
					Manage your generated pattern drafts
				</p>
			</div>
			{renderContent()}
		</div>
	);
}
