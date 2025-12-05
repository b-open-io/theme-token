"use client";

import { PatternSidebar } from "@/components/patterns/pattern-sidebar";
import { usePatternContext } from "@/components/patterns/pattern-context";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { Button } from "@/components/ui/button";
import { Wallet, Loader2, Check, ExternalLink, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function PatternLayout() {
	const { result, svgDataUrl, params, randomize } = usePatternContext();
	const { status, connect, inscribePattern, isInscribing } = useYoursWallet();
	
	
	const [inscribedOrigin, setInscribedOrigin] = useState<string | null>(null);

	const handleInscribe = async () => {
		if (!result?.svg) return;

		try {
			const response = await inscribePattern(result.svg, {
				prompt: params.source === "ai" ? params.aiPrompt || "" : `${params.source} pattern`,
				provider: result.source,
				model: params.source === "geopattern" ? params.geoGenerator : params.heroPattern,
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

	return (
		<div className="relative flex h-[calc(100vh-6.375rem)] w-full overflow-hidden bg-background">
			{/* Sidebar */}
			<PatternSidebar />
			
			{/* Main Canvas */}
			<div className="relative flex-1 flex flex-col overflow-hidden">
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

				{/* Top Bar */}
				<div className="relative z-10 flex items-center justify-between p-4">
					<div className="flex items-center gap-2">
						<Button
							size="sm"
							variant="outline"
							className="bg-background/80 backdrop-blur"
							onClick={randomize}
						>
							<RefreshCw className="mr-2 h-3 w-3" />
							Randomize
						</Button>
					</div>
					
					<div className="flex items-center gap-2">
						{inscribedOrigin ? (
							<div className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 backdrop-blur border shadow-sm">
								<Check className="h-3 w-3 text-green-500" />
								<a
									href={`https://ordfs.network/content/${inscribedOrigin}`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-xs hover:underline flex items-center gap-1"
								>
									Inscribed <ExternalLink className="h-3 w-3" />
								</a>
							</div>
						) : result?.svg ? (
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
			</div>
		</div>
	);
}
