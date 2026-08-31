"use client";

import { SlidersHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface StudioDashboardProps {
	/** Sidebar content (controls, settings) */
	sidebar: ReactNode;
	/** Main canvas/preview area */
	children: ReactNode;
	/** Bottom action bar content - left side (status, info) */
	bottomLeft?: ReactNode;
	/** Bottom action bar content - right side (primary actions like Inscribe) */
	bottomRight?: ReactNode;
}

/**
 * Shared dashboard layout for all studio pages.
 *
 * Structure:
 * ┌────────────────────┬────────────────────────────────────────────┐
 * │                    │                                            │
 * │  Sidebar           │  Main Canvas (children)                    │
 * │  (scrolls)         │  (scrolls or absolute positioned content)  │
 * │                    │                                            │
 * ├────────────────────┴────────────────────────────────────────────┤
 * │ Bottom Bar: [bottomLeft]                      [bottomRight]     │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * - Total height: fills parent (studio layout sets viewport constraint)
 * - Bottom bar: shrink-0, always visible, never scrolls
 * - Sidebar & canvas scroll independently
 */
export function StudioDashboard({
	sidebar,
	children,
	bottomLeft,
	bottomRight,
}: StudioDashboardProps) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	return (
		<div className="flex h-full w-full flex-col overflow-hidden bg-background">
			{/* Main content area - sidebar + canvas */}
			<div className="relative flex min-h-0 flex-1 overflow-hidden">
				{isSidebarOpen ? (
					<button
						type="button"
						aria-label="Close studio controls"
						className="absolute inset-0 z-[60] bg-black/40 md:hidden"
						onClick={() => setIsSidebarOpen(false)}
					/>
				) : null}

				{/* Sidebar */}
				<div
					id="studio-controls"
					className={`absolute inset-y-0 left-0 z-[70] max-w-[calc(100vw-2rem)] shrink-0 overflow-hidden transition-transform md:static md:max-w-none md:translate-x-0 ${
						isSidebarOpen ? "translate-x-0" : "-translate-x-full"
					} [&>*]:max-w-full`}
				>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						aria-label="Close studio controls"
						className="absolute right-2 top-2 z-[80] md:hidden"
						onClick={() => setIsSidebarOpen(false)}
					>
						<X />
					</Button>
					{sidebar}
				</div>

				{/* Main Canvas */}
				<div className="relative flex-1 flex flex-col overflow-hidden">
					<div className="relative z-20 flex shrink-0 border-b border-border bg-background/90 p-2 backdrop-blur md:hidden">
						<Button
							type="button"
							variant="outline"
							size="sm"
							aria-controls="studio-controls"
							aria-expanded={isSidebarOpen}
							className="gap-2"
							onClick={() => setIsSidebarOpen(true)}
						>
							<SlidersHorizontal />
							Controls
						</Button>
					</div>
					{children}
				</div>
			</div>

			{/* Bottom Action Bar - always visible */}
			<div className="flex shrink-0 flex-col items-stretch gap-2 border-t border-border bg-muted/30 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
				<div className="flex min-w-0 items-center gap-2">{bottomLeft}</div>
				<div className="flex min-w-0 items-center justify-end gap-2">
					{bottomRight}
				</div>
			</div>
		</div>
	);
}
