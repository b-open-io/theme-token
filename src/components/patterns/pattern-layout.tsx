"use client";

import { PatternToolbar } from "@/components/patterns/pattern-toolbar";
import { PatternPresets } from "@/components/patterns/pattern-presets";
import { PatternAIRail } from "@/components/patterns/pattern-ai-rail";
import { PatternPreview } from "@/components/patterns/pattern-preview";
import { PatternSidebar } from "@/components/patterns/pattern-sidebar";
import { usePatternContext } from "@/components/patterns/pattern-context";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { Button } from "@/components/ui/button";
import { Wallet, Loader2, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function PatternLayout() {
	const { pattern, svgDataUrl, patternParams } = usePatternContext();
	const { status, connect, inscribePattern, isInscribing, balance } = useYoursWallet();
	
	const [inscribedOrigin, setInscribedOrigin] = useState<string | null>(null);

	const handleInscribe = async () => {
		if (!pattern?.svg) return;

		try {
			const response = await inscribePattern(pattern.svg, {
				prompt: pattern.prompt,
				provider: pattern.provider,
				model: pattern.model,
			});

			if (response?.txid) {
				setInscribedOrigin(`${response.txid}_0`);
				toast.success("Pattern inscribed successfully!");
			}
		} catch (error) {
			console.error("Inscribe error:", error);
			toast.error("Failed to inscribe pattern");
		}
	};

	return (
		<div className="relative flex h-[calc(100vh-6.375rem)] w-full overflow-hidden bg-background">
            {/* Sidebar (Fixed) */}
            <PatternSidebar />
            
            {/* Main Canvas Area */}
            <div className="relative flex-1 flex flex-col overflow-hidden">
                {/* Background Pattern */}
                <div
                    className="absolute inset-0 z-0 transition-opacity duration-300"
                    style={{
                        backgroundImage: pattern?.svg ? `url("${svgDataUrl}")` : undefined,
                        backgroundSize: `${patternParams.scale}px ${patternParams.scale}px`,
                        backgroundRepeat: "repeat",
                        opacity: patternParams.opacity / 100,
                        backgroundColor: patternParams.backgroundColor,
                        color: patternParams.strokeColor,
                    }}
                />

                {/* Empty State / Welcome */}
                {!pattern?.svg && (
                    <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold tracking-tight text-foreground/20">
                                Pattern Studio
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground/40">
                                Describe a pattern or pick a preset to start
                            </p>
                        </div>
                    </div>
                )}

                {/* UI Layers */}
                <div className="relative z-10 flex flex-1 flex-col pointer-events-none">
                    {/* Top Bar (Wallet/Inscribe) - Only pointer-events-auto for buttons */}
                    <div className="flex items-center justify-end p-4">
                        <div className="pointer-events-auto flex items-center gap-2">
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
                            ) : pattern?.svg ? (
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
                                            {status === "connected" ? "Inscribe" : "Connect Wallet"}
                                        </>
                                    )}
                                </Button>
                            ) : null}
                        </div>
                    </div>
                    
                    {/* Main Content Area - Just spacer */}
                    <div className="flex-1" />

                    {/* Floating UI Components - Pointer events re-enabled inside them */}
                    <div className="pointer-events-auto">
                        <PatternToolbar />
                        <PatternPresets />
                        <PatternAIRail />
                        <PatternPreview />
                    </div>
                </div>
            </div>
		</div>
	);
}
