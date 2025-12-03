"use client";

import { motion } from "framer-motion";
import { Coins, RotateCcw } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const PRESETS = [
	{ label: "$0.05", value: 0.05 },
	{ label: "$0.25", value: 0.25 },
	{ label: "$0.50", value: 0.5 },
	{ label: "$1", value: 1 },
	{ label: "$5", value: 5 },
	{ label: "$10", value: 10 },
];

const SATS_PER_BSV = 100_000_000;

interface PriceInputProps {
	value: number;
	onChange: (usd: number, sats: number) => void;
	exchangeRate?: number; // USD per 1 BSV
	className?: string;
}

function toSats(usd: number, rate: number): number {
	if (!usd || !rate) return 0;
	const bsv = usd / rate;
	return Math.floor(bsv * SATS_PER_BSV);
}

function formatSats(sats: number): string {
	return new Intl.NumberFormat("en-US").format(sats);
}

function formatBsv(sats: number): string {
	const bsv = sats / SATS_PER_BSV;
	if (bsv < 0.001) return bsv.toFixed(8);
	if (bsv < 0.01) return bsv.toFixed(5);
	if (bsv < 1) return bsv.toFixed(4);
	return bsv.toFixed(2);
}

export function PriceInput({
	value,
	onChange,
	exchangeRate = 50,
	className,
}: PriceInputProps) {
	const [isAnimating, setIsAnimating] = useState(false);
	const [manualInput, setManualInput] = useState("");
	const [isEditing, setIsEditing] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const updatePrice = useCallback(
		(newPrice: number) => {
			const rounded = Math.round(newPrice * 100) / 100;
			const sats = toSats(rounded, exchangeRate);
			onChange(rounded, sats);

			// Trigger animation
			setIsAnimating(true);
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			timeoutRef.current = setTimeout(() => setIsAnimating(false), 150);
		},
		[exchangeRate, onChange],
	);

	const handleAdd = (amount: number) => {
		updatePrice(value + amount);
	};

	const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		if (/^\d*\.?\d{0,2}$/.test(val)) {
			setManualInput(val);
			const num = Number.parseFloat(val);
			if (!Number.isNaN(num)) {
				onChange(num, toSats(num, exchangeRate));
			} else {
				onChange(0, 0);
			}
		}
	};

	const handleReset = () => {
		updatePrice(0);
		setManualInput("");
	};

	const sats = toSats(value, exchangeRate);

	return (
		<div
			className={cn(
				"w-full rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden",
				className,
			)}
		>
			{/* Header / Price Display */}
			<div className="relative p-6 pb-4 text-center bg-gradient-to-b from-muted/30 to-transparent">
				<div className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
					Listing Price
				</div>

				{/* Main Price */}
				<div className="relative inline-flex items-baseline">
					<span className="mr-1 text-2xl text-muted-foreground/60">$</span>
					<input
						type="text"
						inputMode="decimal"
						value={isEditing ? manualInput : value.toFixed(2)}
						onChange={handleManualChange}
						onFocus={() => {
							setIsEditing(true);
							setManualInput(value === 0 ? "" : value.toString());
						}}
						onBlur={() => setIsEditing(false)}
						className={cn(
							"w-32 bg-transparent text-center text-5xl font-bold tracking-tight text-primary outline-none",
							"placeholder:text-muted-foreground/30",
							"transition-transform duration-100 ease-out",
							isAnimating ? "scale-110" : "scale-100",
						)}
						placeholder="0.00"
					/>
				</div>

				{/* BSV/Sats conversion */}
				<div className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
					<Coins className="h-3.5 w-3.5 text-yellow-500/80" />
					<span className="font-mono">{formatSats(sats)} sats</span>
					<span className="text-muted-foreground/50">
						({formatBsv(sats)} BSV)
					</span>
				</div>

				{/* Reset Button */}
				<button
					type="button"
					onClick={handleReset}
					disabled={value === 0}
					className={cn(
						"absolute right-3 top-3 p-1.5 rounded-full",
						"text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
						"transition-all duration-200",
						value === 0
							? "opacity-0 pointer-events-none scale-75"
							: "opacity-100 scale-100",
					)}
					aria-label="Reset price"
				>
					<RotateCcw className="h-4 w-4" />
				</button>
			</div>

			{/* Preset Buttons */}
			<div className="p-4 pt-2">
				<div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
					<span>Add value</span>
					<span className="opacity-60">Click to stack</span>
				</div>

				<div className="grid grid-cols-3 gap-2">
					{PRESETS.map((preset) => (
						<motion.button
							key={preset.value}
							type="button"
							onClick={() => handleAdd(preset.value)}
							whileTap={{ scale: 0.95 }}
							className={cn(
								"relative py-2.5 px-3 rounded-lg font-medium text-sm",
								"bg-muted/50 hover:bg-muted border border-transparent",
								"hover:border-primary/30 hover:text-primary",
								"transition-colors duration-150",
								"active:bg-primary/10",
							)}
						>
							<span className="relative z-10">{preset.label}</span>
						</motion.button>
					))}
				</div>

				{/* Quick tip */}
				<p className="mt-3 text-center text-[10px] text-muted-foreground/60">
					Rate: 1 BSV = ${exchangeRate} USD
				</p>
			</div>
		</div>
	);
}
