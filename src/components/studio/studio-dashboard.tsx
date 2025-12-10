"use client";

import { ReactNode } from "react";

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
	return (
		<div className="flex h-full w-full flex-col overflow-hidden bg-background">
			{/* Main content area - sidebar + canvas */}
			<div className="flex min-h-0 flex-1 overflow-hidden">
				{/* Sidebar */}
				{sidebar}

				{/* Main Canvas */}
				<div className="relative flex-1 flex flex-col overflow-hidden">
					{children}
				</div>
			</div>

			{/* Bottom Action Bar - always visible */}
			<div className="flex shrink-0 items-center justify-between border-t border-border bg-muted/30 px-4 py-2">
				<div className="flex items-center gap-2">
					{bottomLeft}
				</div>
				<div className="flex items-center gap-2">
					{bottomRight}
				</div>
			</div>
		</div>
	);
}
