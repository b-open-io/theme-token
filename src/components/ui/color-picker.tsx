"use client";

import { HexColorPicker, HexColorInput } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
	// Extract hex from oklch or other formats, fallback to gray
	const hexValue = value.startsWith("#") ? value : "#808080";

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					className={cn(
						"h-6 w-6 shrink-0 cursor-pointer rounded border border-border",
						className
					)}
					style={{ backgroundColor: value }}
				/>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-3" align="start">
				<div className="flex flex-col gap-3">
					<HexColorPicker color={hexValue} onChange={onChange} />
					<HexColorInput
						color={hexValue}
						onChange={onChange}
						prefixed
						className="h-8 w-full rounded border border-border bg-background px-2 font-mono text-xs uppercase focus:border-primary focus:outline-none"
					/>
				</div>
			</PopoverContent>
		</Popover>
	);
}
