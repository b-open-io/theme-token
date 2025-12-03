"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import type { FilterState } from "./filter-sidebar";

interface RemixCardProps {
	filters: FilterState;
}

export function RemixCard({ filters }: RemixCardProps) {
	// Build query params from active filters
	const buildStudioUrl = () => {
		const params = new URLSearchParams();

		if (filters.primaryColor) {
			// Convert OKLCH back to a string for the studio
			const { l, c, h } = filters.primaryColor;
			params.set("primaryColor", `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`);
		}

		if (filters.radius) {
			params.set("radius", filters.radius);
		}

		const queryString = params.toString();
		return `/studio${queryString ? `?${queryString}` : ""}`;
	};

	const hasFilters =
		filters.primaryColor !== null ||
		filters.radius !== null ||
		filters.fontTypes.length > 0;

	return (
		<Link href={buildStudioUrl()}>
			<div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-6 text-center transition-all hover:border-primary/50 hover:bg-muted/50 group cursor-pointer">
				<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border bg-background shadow-sm transition-transform group-hover:scale-110">
					<Sparkles className="h-6 w-6 text-primary" />
				</div>

				<h3 className="mb-2 text-lg font-semibold">
					Can&apos;t find the perfect fit?
				</h3>

				<p className="mb-4 max-w-[220px] text-sm text-muted-foreground">
					Create a custom theme using your preferences
				</p>

				{hasFilters && (
					<div className="mb-4 space-y-1">
						{filters.primaryColor && (
							<div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
								<div
									className="h-3 w-3 rounded-full"
									style={{
										backgroundColor: `oklch(${filters.primaryColor.l} ${filters.primaryColor.c} ${filters.primaryColor.h})`,
									}}
								/>
								<span>Custom primary color</span>
							</div>
						)}
						{filters.radius && (
							<p className="text-xs font-mono text-primary">
								{filters.radius} radius
							</p>
						)}
						{filters.fontTypes.length > 0 && (
							<p className="text-xs text-muted-foreground">
								{filters.fontTypes.join(", ")} fonts
							</p>
						)}
					</div>
				)}

				<span className="inline-flex items-center text-sm font-medium text-primary">
					Open in Studio
					<ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
				</span>
			</div>
		</Link>
	);
}
