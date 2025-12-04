"use client";

import { Filter, RotateCcw } from "lucide-react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import type { FontFilterState } from "@/lib/font-market";

interface FontFilterSidebarProps {
	filters: FontFilterState;
	onFiltersChange: (filters: FontFilterState) => void;
	maxPrice: number;
}

const CATEGORY_OPTIONS = [
	{ id: "sans-serif", label: "Sans-serif", className: "font-sans" },
	{ id: "serif", label: "Serif", className: "font-serif" },
	{ id: "mono", label: "Monospace", className: "font-mono" },
	{ id: "display", label: "Display", className: "font-sans font-bold" },
];

export function FontFilterSidebar({
	filters,
	onFiltersChange,
	maxPrice,
}: FontFilterSidebarProps) {
	const updateFilter = <K extends keyof FontFilterState>(
		key: K,
		value: FontFilterState[K]
	) => {
		onFiltersChange({ ...filters, [key]: value });
	};

	const handleCategoryToggle = (category: string) => {
		const current = filters.category;
		const updated = current.includes(category)
			? current.filter((c) => c !== category)
			: [...current, category];
		updateFilter("category", updated);
	};

	const clearFilters = () => {
		onFiltersChange({
			category: [],
			priceRange: [0, maxPrice],
			glyphCountMin: 0,
		});
	};

	const hasActiveFilters =
		filters.category.length > 0 ||
		filters.priceRange[0] > 0 ||
		filters.priceRange[1] < maxPrice ||
		filters.glyphCountMin > 0;

	return (
		<div className="space-y-6 text-sm">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 font-semibold">
					<Filter className="h-4 w-4" />
					Filters
				</div>
				<Button
					variant="ghost"
					size="sm"
					className={`h-7 px-2 text-xs ${hasActiveFilters ? "opacity-100" : "pointer-events-none opacity-0"}`}
					onClick={clearFilters}
				>
					<RotateCcw className="mr-1 h-3 w-3" />
					Clear
				</Button>
			</div>

			<Accordion
				type="multiple"
				defaultValue={["category", "price", "glyphs"]}
			>
				{/* Category Filter */}
				<AccordionItem value="category">
					<AccordionTrigger className="text-sm">Category</AccordionTrigger>
					<AccordionContent className="space-y-3">
						{CATEGORY_OPTIONS.map((option) => (
							<div key={option.id} className="flex items-center space-x-2">
								<Checkbox
									id={option.id}
									checked={filters.category.includes(option.id)}
									onCheckedChange={() => handleCategoryToggle(option.id)}
								/>
								<label
									htmlFor={option.id}
									className={`cursor-pointer text-sm ${option.className}`}
								>
									{option.label}
								</label>
							</div>
						))}
					</AccordionContent>
				</AccordionItem>

				{/* Price Filter */}
				<AccordionItem value="price">
					<AccordionTrigger className="text-sm">Price Range</AccordionTrigger>
					<AccordionContent>
						<Slider
							value={[filters.priceRange[1]]}
							onValueChange={([v]) => updateFilter("priceRange", [0, v])}
							max={maxPrice}
							step={0.01}
							className="mt-2"
						/>
						<div className="mt-2 flex justify-between text-xs text-muted-foreground">
							<span>Free</span>
							<span>{filters.priceRange[1].toFixed(2)} BSV</span>
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* Glyph Count Filter */}
				<AccordionItem value="glyphs">
					<AccordionTrigger className="text-sm">Min Glyphs</AccordionTrigger>
					<AccordionContent>
						<Slider
							value={[filters.glyphCountMin]}
							onValueChange={([v]) => updateFilter("glyphCountMin", v)}
							max={200}
							step={10}
							className="mt-2"
						/>
						<div className="mt-2 flex justify-between text-xs text-muted-foreground">
							<span>Any</span>
							<span>{filters.glyphCountMin}+ glyphs</span>
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}
