"use client";

import { Check, Copy, Download, Code, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePatternContext } from "./pattern-context";
import { useState } from "react";
import { toast } from "sonner";

export function PatternExport() {
	const { pattern, svgDataUrl, cssSnippet, patternParams } = usePatternContext();
	const [copied, setCopied] = useState<string | null>(null);

	const copyToClipboard = async (text: string, type: string) => {
		await navigator.clipboard.writeText(text);
		setCopied(type);
        toast.success(`Copied ${type} to clipboard`);
		setTimeout(() => setCopied(null), 2000);
	};

	const downloadSvg = () => {
		if (!pattern?.svg) return;
		const blob = new Blob([pattern.svg], { type: "image/svg+xml" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `pattern-${Date.now()}.svg`;
		a.click();
		URL.revokeObjectURL(url);
        toast.success("Download started");
	};

    const downloadPng = () => {
		if (!pattern?.svg) return;
        
        toast.loading("Preparing PNG...");

		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		const img = new Image();
        
        // High resolution canvas
		canvas.width = 2048;
		canvas.height = 2048;

		img.onload = () => {
			if (ctx) {
                // 1. Draw Background Color
                if (patternParams.backgroundColor && patternParams.backgroundColor !== "transparent") {
                    ctx.fillStyle = patternParams.backgroundColor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                // 2. Create tiled pattern
                // We need to create a temporary canvas for the single tile 
                // because 'createPattern' uses the image's intrinsic size, 
                // but we want it scaled to 'patternParams.scale'.
                const tileCanvas = document.createElement("canvas");
                tileCanvas.width = patternParams.scale;
                tileCanvas.height = patternParams.scale;
                const tileCtx = tileCanvas.getContext("2d");
                
                if (tileCtx) {
                    // Draw the SVG into the tile canvas, scaled
                    tileCtx.drawImage(img, 0, 0, patternParams.scale, patternParams.scale);
                    
                    // Now create pattern from the tile
                    const pat = ctx.createPattern(tileCanvas, "repeat");
                    if (pat) {
                        ctx.fillStyle = pat;
                        // Apply opacity
                        ctx.globalAlpha = patternParams.opacity / 100;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        
                        // Download
                        const url = canvas.toDataURL("image/png");
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `pattern-${Date.now()}.png`;
                        a.click();
                        toast.dismiss();
                        toast.success("PNG Downloaded");
                    }
                }
			}
		};

        // We need to ensure the SVG string has the 'color' applied if it uses currentColor
        // Since 'img.src' acts like an isolated document, inherited CSS color won't work.
        // We must replace 'currentColor' with the actual hex color in the SVG string.
        let svgString = pattern.svg;
        if (patternParams.strokeColor && patternParams.strokeColor !== "currentColor") {
             svgString = svgString.replace(/currentColor/g, patternParams.strokeColor);
        }
        // Also ensure width/height are set or viewBox is present for correct scaling
        
        const encoded = encodeURIComponent(svgString);
		img.src = `data:image/svg+xml,${encoded}`;
	};

	if (!pattern?.svg) {
        return (
            <div className="p-4 text-center text-xs text-muted-foreground">
                Generate a pattern to see export options.
            </div>
        );
    }

	return (
		<div className="flex flex-col gap-2 p-2">
			<Button
				variant="ghost"
				size="sm"
				className="justify-start gap-2 text-xs"
				onClick={() => copyToClipboard(pattern.svg, "SVG")}
			>
				{copied === "SVG" ? (
					<Check className="h-3 w-3 text-green-500" />
				) : (
					<Code className="h-3 w-3" />
				)}
				Copy SVG Code
			</Button>

			<Button
				variant="ghost"
				size="sm"
				className="justify-start gap-2 text-xs"
				onClick={() => copyToClipboard(svgDataUrl, "Data URL")}
			>
				{copied === "Data URL" ? (
					<Check className="h-3 w-3 text-green-500" />
				) : (
					<Copy className="h-3 w-3" />
				)}
				Copy Data URL
			</Button>

			<Button
				variant="ghost"
				size="sm"
				className="justify-start gap-2 text-xs"
				onClick={() => copyToClipboard(cssSnippet, "CSS")}
			>
				{copied === "CSS" ? (
					<Check className="h-3 w-3 text-green-500" />
				) : (
					<Copy className="h-3 w-3" />
				)}
				Copy CSS Snippet
			</Button>

            <div className="h-px bg-border my-1" />

			<Button
				variant="ghost"
				size="sm"
				className="justify-start gap-2 text-xs"
				onClick={downloadSvg}
			>
				<Download className="h-3 w-3" />
				Download SVG
			</Button>
            
            <Button
				variant="ghost"
				size="sm"
				className="justify-start gap-2 text-xs"
				onClick={downloadPng}
			>
				<ImageIcon className="h-3 w-3" />
				Download PNG
			</Button>
		</div>
	);
}
