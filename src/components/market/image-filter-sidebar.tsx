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
import type { AssetType } from "@/lib/yours-wallet";

export interface ImageFilterState {
	assetTypes: AssetType[];
	priceRange: [number, number];
}

export const DEFAULT_IMAGE_FILTERS: ImageFilterState = {
	assetTypes: [],
	priceRange: [0, 10],
};

interface ImageFilterSidebarProps {
	filters: ImageFilterState;
	onFiltersChange: (filters: ImageFilterState) => void;
	maxPrice: number;
}

const ASSET_TYPE_OPTIONS: { id: AssetType; label: string; description: string }[] = [
	{ id: "tile", label: "Tiles", description: "Seamless repeating patterns" },
	{ id: "wallpaper", label: "Wallpapers", description: "Full-screen backgrounds" },
	{ id: "icon", label: "Icons", description: "Centered graphic elements" },
];

export function ImageFilterSidebar({
	filters,
	onFiltersChange,
	maxPrice,
}: ImageFilterSidebarProps) {
	const updateFilter = <K extends keyof ImageFilterState>(
		key: K,
		value: ImageFilterState[K]
	) => {
		onFiltersChange({ ...filters, [key]: value });
	};

	const handleAssetTypeToggle = (assetType: AssetType) => {
		const current = filters.assetTypes;
		const updated = current.includes(assetType)
			? current.filter((t) => t !== assetType)
			: [...current, assetType];
		updateFilter("assetTypes", updated);
	};

	const clearFilters = () => {
		onFiltersChange({
			assetTypes: [],
			priceRange: [0, maxPrice],
		});
	};

	const hasActiveFilters =
		filters.assetTypes.length > 0 ||
		filters.priceRange[0] > 0 ||
		filters.priceRange[1] < maxPrice;

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
				defaultValue={["type", "price"]}
			>
				{/* Asset Type Filter */}
				<AccordionItem value="type">
					<AccordionTrigger className="text-sm">Asset Type</AccordionTrigger>
					<AccordionContent className="space-y-3">
						{ASSET_TYPE_OPTIONS.map((option) => (
							<div key={option.id} className="flex items-start space-x-2">
								<Checkbox
									id={option.id}
									checked={filters.assetTypes.includes(option.id)}
									onCheckedChange={() => handleAssetTypeToggle(option.id)}
								/>
								<label
									htmlFor={option.id}
									className="cursor-pointer"
								>
									<span className="text-sm font-medium">{option.label}</span>
									<span className="block text-xs text-muted-foreground">
										{option.description}
									</span>
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
			</Accordion>
		</div>
	);
}
