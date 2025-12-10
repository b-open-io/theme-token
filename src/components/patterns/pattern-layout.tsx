"use client";

import { getOrdfsUrl } from "@theme-token/sdk";
import { Check, ExternalLink, Loader2, PenLine, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PatternSidebar } from "@/components/patterns/pattern-sidebar";
import { usePatternContext } from "@/components/patterns/pattern-context";
import { StudioDashboard } from "@/components/studio/studio-dashboard";
import { Button } from "@/components/ui/button";
import { useYoursWallet } from "@/hooks/use-yours-wallet";

export function PatternLayout() {
	const { result, svgDataUrl, params, randomize } = usePatternContext();
	const { status, connect, inscribePattern, isInscribing } = useYoursWallet();

	const [inscribedOrigin, setInscribedOrigin] = useState<string | null>(null);

	const handleInscribe = async () => {
		if (!result?.svg) return;

		try {
			const response = await inscribePattern(result.svg, {
				prompt:
					params.source === "ai"
						? params.aiPrompt || ""
						: `${params.source} pattern`,
				provider: result.source,
				model:
					params.source === "geopattern"
						? params.geoGenerator
						: params.heroPattern,
			});

			if (response?.txid) {
				setInscribedOrigin(`${response.txid}_0`);
				toast.success("Pattern inscribed!");
			}
		} catch (error) {
			console.error("Inscribe error:", error);
			toast.error("Failed to inscribe pattern");
		}
	};

	const isConnected = status === "connected";

	const patternInfo = result?.svg
		? params.source === "ai"
			? "AI Generated"
			: params.source === "geopattern"
				? `GeoPattern: ${params.geoGenerator}`
				: `Hero Pattern: ${params.heroPattern}`
		: null;

	return (
		<StudioDashboard
			sidebar={<PatternSidebar />}
			bottomLeft={
				patternInfo ? (
					<span className="text-xs text-muted-foreground">{patternInfo}</span>
				) : (
					<span className="text-xs text-muted-foreground">
						Select a pattern type from the sidebar
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
						disabled={isInscribing || !result?.svg}
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
								Inscribe Pattern
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
			{/* Background Color */}
			<div
				className="absolute inset-0 z-0 transition-colors duration-300"
				style={{ backgroundColor: params.backgroundColor }}
			/>

			{/* Pattern Layer - mask-image for theme reactivity */}
			{result?.svg && (
				<div
					className="absolute inset-0 z-0 transition-opacity duration-300"
					style={{
						backgroundColor: params.foregroundColor,
						opacity: params.opacity / 100,
						maskImage: `url("${svgDataUrl}")`,
						WebkitMaskImage: `url("${svgDataUrl}")`,
						maskSize: `${params.scale}px ${params.scale}px`,
						WebkitMaskSize: `${params.scale}px ${params.scale}px`,
						maskRepeat: "repeat",
						WebkitMaskRepeat: "repeat",
					}}
				/>
			)}

			{/* Empty State */}
			{!result?.svg && (
				<div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
					<div className="text-center">
						<h2 className="text-2xl font-bold tracking-tight text-foreground/20">
							Pattern Studio
						</h2>
						<p className="mt-2 text-sm text-muted-foreground/40">
							Select a pattern type from the sidebar
						</p>
					</div>
				</div>
			)}

			{/* Top Bar - View options only */}
			<div className="relative z-10 flex items-center justify-between p-4">
				<div className="flex items-center gap-2">
					<Button
						size="sm"
						variant="outline"
						className="bg-background/80 backdrop-blur"
						onClick={randomize}
						type="button"
					>
						<RefreshCw className="mr-2 h-3 w-3" />
						Randomize
					</Button>
				</div>
			</div>
		</StudioDashboard>
	);
}
