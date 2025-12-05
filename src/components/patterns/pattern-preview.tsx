"use client";

import { usePatternContext } from "./pattern-context";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PatternPreview() {
	const { pattern, svgDataUrl, patternParams, uiState, setUIState } = usePatternContext();

	// If no pattern, don't show preview
	if (!pattern?.svg) return null;

	// Calculate a different scale for the preview to show detail vs global
	// The main background shows the pattern at 'scale'
	// The preview tile shows it zoomed out (smaller scale) or zoomed in?
	// Plan says: "Small pinned preview tile shows zoomed detail while page background shows global effect."
	// So maybe we just show the same thing but isolated.
    
    // Toggle full screen state is managed in Context UI state if needed, 
    // but the plan mentions "pinned preview tile". 
    
    // Let's make it a small tile in the bottom right or left.
    // Bottom right seems standard for "picture in picture" style.

	return (
		<div 
            className={cn(
                "fixed bottom-6 right-6 z-30 transition-all duration-300 ease-in-out shadow-2xl rounded-xl overflow-hidden border bg-background",
                uiState.isPreviewExpanded ? "w-96 h-96" : "w-32 h-32"
            )}
        >
			<div className="relative h-full w-full bg-white dark:bg-black">
                {/* Controls Overlay */}
                <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-6 w-6 rounded-full shadow-sm"
                        onClick={() => setUIState(prev => ({ ...prev, isPreviewExpanded: !prev.isPreviewExpanded }))}
                    >
                        {uiState.isPreviewExpanded ? (
                            <Minimize2 className="h-3 w-3" />
                        ) : (
                            <Maximize2 className="h-3 w-3" />
                        )}
                    </Button>
                </div>

                {/* The Pattern */}
				<div
					className="h-full w-full"
					style={{
						backgroundImage: `url("${svgDataUrl}")`,
						backgroundSize: `${patternParams.scale}px ${patternParams.scale}px`,
						backgroundRepeat: "repeat",
                        // In preview we might want full opacity to see details clearly? 
                        // Or match context. Let's match context.
						opacity: patternParams.opacity / 100, 
					}}
				/>
                
                {/* Info Label */}
                <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm px-2 py-1">
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                        {patternParams.scale}px tile · {patternParams.opacity}% op
                    </p>
                </div>
			</div>
		</div>
	);
}

