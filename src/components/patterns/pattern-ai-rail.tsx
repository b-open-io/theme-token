"use client";

import { usePatternContext } from "./pattern-context";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ai-elements/loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { History, X } from "lucide-react";

export function PatternAIRail() {
	const { history, uiState, setUIState, loadFromHistory, isGenerating } = usePatternContext();

	// If closed, show nothing (or a toggle if we wanted a permanent rail)
	if (!uiState.isHistoryOpen) return null;

	return (
		<div className="fixed right-0 top-[6.375rem] z-30 h-[calc(100vh-6.375rem)] w-80 border-l bg-background/95 backdrop-blur-md shadow-xl transition-transform duration-300 ease-in-out animate-in slide-in-from-right overflow-hidden">
			<div className="flex h-full flex-col">
				<div className="flex items-center justify-between border-b p-4">
					<div className="flex items-center gap-2">
						<History className="h-4 w-4 text-muted-foreground" />
						<h3 className="font-medium text-sm">History</h3>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={() => setUIState((prev) => ({ ...prev, isHistoryOpen: false }))}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>

				<ScrollArea className="flex-1 p-4">
					<div className="space-y-4">
						{isGenerating && (
							<div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
								<Loader />
								<span className="text-xs text-muted-foreground">Generating pattern...</span>
							</div>
						)}

						{history.length === 0 && !isGenerating && (
							<div className="py-8 text-center text-xs text-muted-foreground">
								No history yet. Generate a pattern to start.
							</div>
						)}

						{history.map((item) => (
							<button
								key={item.id}
								onClick={() => loadFromHistory(item)}
								className="group flex w-full flex-col gap-2 rounded-lg border bg-card p-3 text-left transition-all hover:border-primary/50 hover:bg-muted/50"
							>
								<div className="flex w-full items-start justify-between gap-2">
									<p className="line-clamp-2 text-xs font-medium leading-relaxed">
										{item.pattern.prompt}
									</p>
									<span className="shrink-0 text-[10px] text-muted-foreground">
										{new Date(item.timestamp).toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</span>
								</div>
								
								{/* Mini Preview */}
								<div className="h-12 w-full overflow-hidden rounded bg-muted/50">
									<div
										className="h-full w-full"
										style={{
											backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(item.pattern.svg)}")`,
											backgroundSize: `${item.params.scale}px ${item.params.scale}px`,
											backgroundRepeat: "repeat",
											opacity: item.params.opacity / 100,
										}}
									/>
								</div>
								
								<div className="flex flex-wrap gap-1">
									<span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
										{item.params.scale}px
									</span>
									<span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
										{item.params.density}%
									</span>
								</div>
							</button>
						))}
					</div>
				</ScrollArea>
			</div>
		</div>
	);
}

