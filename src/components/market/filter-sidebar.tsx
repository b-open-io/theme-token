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
import { ColorPicker } from "@/components/ui/color-picker";
import { Slider } from "@/components/ui/slider";
import {
	colorPresets,
	radiusPresets,
	hexToOklch,
	oklchToHex,
	type OklchColor,
} from "@/lib/color-utils";

export interface FilterState {
	primaryColor: OklchColor | null;
	radius: string | null;
	fontTypes: string[];
	priceRange: [number, number];
}

interface FilterSidebarProps {
	filters: FilterState;
	onFiltersChange: (filters: FilterState) => void;
	maxPrice: number;
}

export function FilterSidebar({
	filters,
	onFiltersChange,
	maxPrice,
}: FilterSidebarProps) {
	const updateFilter = <K extends keyof FilterState>(
		key: K,
		value: FilterState[K],
	) => {
		onFiltersChange({ ...filters, [key]: value });
	};

	const handleColorPreset = (hex: string) => {
		const oklch = hexToOklch(hex);
		updateFilter("primaryColor", oklch);
	};

	const handleCustomColor = (e: React.ChangeEvent<HTMLInputElement>) => {
		const oklch = hexToOklch(e.target.value);
		updateFilter("primaryColor", oklch);
	};

	const handleFontToggle = (font: string) => {
		const current = filters.fontTypes;
		const updated = current.includes(font)
			? current.filter((f) => f !== font)
			: [...current, font];
		updateFilter("fontTypes", updated);
	};

	const clearFilters = () => {
		onFiltersChange({
			primaryColor: null,
			radius: null,
			fontTypes: [],
			priceRange: [0, maxPrice],
		});
	};

	const hasActiveFilters =
		filters.primaryColor !== null ||
		filters.radius !== null ||
		filters.fontTypes.length > 0 ||
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

			{/* Color Strategy */}
			<div className="space-y-3">
				<h3 className="font-medium text-foreground">Primary Color</h3>
				{/* Quick Presets */}
				<div className="grid grid-cols-5 gap-2">
					{colorPresets.slice(0, 5).map((preset) => (
						<button
							key={preset.name}
							type="button"
							onClick={() => handleColorPreset(preset.hex)}
							className="h-7 w-7 rounded-full transition-all hover:scale-110 hover:ring-2 ring-offset-2 ring-offset-background ring-primary"
							style={{ backgroundColor: preset.hex }}
							title={preset.name}
						/>
					))}
				</div>
				<div className="grid grid-cols-4 gap-2">
					{colorPresets.slice(5).map((preset) => (
						<button
							key={preset.name}
							type="button"
							onClick={() => handleColorPreset(preset.hex)}
							className="h-7 w-full rounded-md transition-all hover:scale-105 hover:ring-2 ring-offset-2 ring-offset-background ring-primary"
							style={{ backgroundColor: preset.hex }}
							title={preset.name}
						/>
					))}
				</div>

				{/* Custom Color Picker */}
				<div className="flex items-center gap-2 pt-1">
					<ColorPicker
						value={filters.primaryColor ? oklchToHex(filters.primaryColor) : "#3b82f6"}
						onChange={(hex) => handleCustomColor({ target: { value: hex } } as React.ChangeEvent<HTMLInputElement>)}
						className="h-8 w-8"
					/>
					<span className="text-xs text-muted-foreground">
						{filters.primaryColor ? "Color filter active" : "Pick any color"}
					</span>
				</div>
			</div>

			<Accordion
				type="multiple"
				defaultValue={["radius", "typography", "price"]}
			>
				{/* Radius Filter */}
				<AccordionItem value="radius">
					<AccordionTrigger className="text-sm">Border Radius</AccordionTrigger>
					<AccordionContent>
						<div className="grid grid-cols-5 gap-1.5">
							{radiusPresets.map((preset) => (
								<button
									key={preset.value}
									type="button"
									onClick={() =>
										updateFilter(
											"radius",
											filters.radius === preset.value ? null : preset.value,
										)
									}
									className={`h-9 border transition-all ${preset.className} ${
										filters.radius === preset.value
											? "border-primary bg-primary/10"
											: "border-border hover:border-primary/50 hover:bg-muted"
									}`}
									title={preset.label}
								>
									<div
										className={`mx-auto h-4 w-4 border-2 border-current ${preset.className}`}
									/>
								</button>
							))}
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* Typography Filter */}
				<AccordionItem value="typography">
					<AccordionTrigger className="text-sm">Typography</AccordionTrigger>
					<AccordionContent className="space-y-3">
						<div className="flex items-center space-x-2">
							<Checkbox
								id="sans"
								checked={filters.fontTypes.includes("sans")}
								onCheckedChange={() => handleFontToggle("sans")}
							/>
							<label
								htmlFor="sans"
								className="cursor-pointer font-sans text-sm"
							>
								Sans-serif
							</label>
						</div>
						<div className="flex items-center space-x-2">
							<Checkbox
								id="serif"
								checked={filters.fontTypes.includes("serif")}
								onCheckedChange={() => handleFontToggle("serif")}
							/>
							<label
								htmlFor="serif"
								className="cursor-pointer font-serif text-sm"
							>
								Serif
							</label>
						</div>
						<div className="flex items-center space-x-2">
							<Checkbox
								id="mono"
								checked={filters.fontTypes.includes("mono")}
								onCheckedChange={() => handleFontToggle("mono")}
							/>
							<label
								htmlFor="mono"
								className="cursor-pointer font-mono text-sm"
							>
								Monospace
							</label>
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* Price Filter */}
				<AccordionItem value="price">
					<AccordionTrigger className="text-sm">Price Range</AccordionTrigger>
					<AccordionContent>
						<Slider
							value={[filters.priceRange[1]]}
							onValueChange={([v]) =>
								updateFilter("priceRange", [0, v])
							}
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
