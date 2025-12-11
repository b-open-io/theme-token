"use client";

import { Loader2, Wallet, AlertCircle, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import type { PaymentRequest as PaymentRequestType } from "./swatchy-store";
import { BASE_PRICES, type PricingTool } from "@/lib/pricing";

const TOOL_DISPLAY_NAMES: Record<string, string> = {
	generateTheme: "Theme Generation",
	generateFont: "Font Generation",
	generatePattern: "Pattern Generation",
};

const TOOL_DESCRIPTIONS: Record<string, string> = {
	generateTheme: "Create a unique AI-generated theme with colors, typography, and styling",
	generateFont: "Generate a custom display font with full character set",
	generatePattern: "Create a seamless SVG pattern for backgrounds",
};

interface PaymentRequestProps {
	payment: PaymentRequestType;
	onConfirm: () => void;
	onCancel: () => void;
	isProcessing?: boolean;
}

export function PaymentRequestCard({
	payment,
	onConfirm,
	onCancel,
	isProcessing = false,
}: PaymentRequestProps) {
	const { status, balance, connect, hasPrismPass } = useYoursWallet();

	const displayName = TOOL_DISPLAY_NAMES[payment.toolName] ?? payment.toolName;
	const description = TOOL_DESCRIPTIONS[payment.toolName] ?? "";
	const hasBalance = (balance?.satoshis ?? 0) >= payment.cost;
	const isConnected = status === "connected";

	// Check if discount was applied by comparing to base price
	const baseCost = BASE_PRICES[payment.toolName as PricingTool] ?? payment.cost;
	const hasDiscount = hasPrismPass && payment.cost < baseCost;

	// Format satoshis to BSV with proper decimals
	const formatBsv = (sats: number) => {
		const bsv = sats / 100_000_000;
		return bsv.toLocaleString(undefined, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 8,
		});
	};

	return (
		<div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
			<div className="mb-3 flex items-start gap-3">
				<div className="rounded-full bg-primary/10 p-2">
					<Sparkles className="h-5 w-5 text-primary" />
				</div>
				<div className="flex-1">
					<h4 className="font-medium text-sm">{displayName}</h4>
					{description && (
						<p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
					)}
				</div>
			</div>

			<div className="mb-4 rounded-md bg-background/50 px-3 py-2">
				{hasDiscount && (
					<div className="mb-2 flex items-center gap-1.5 text-xs text-green-500">
						<Zap className="h-3 w-3" />
						<span>Prism Pass: 50% off!</span>
					</div>
				)}
				<div className="flex items-center justify-between">
					<span className="text-xs text-muted-foreground">Cost</span>
					<div className="text-right">
						{hasDiscount && (
							<span className="mr-1.5 font-mono text-xs text-muted-foreground line-through">
								{baseCost.toLocaleString()}
							</span>
						)}
						<span className="font-mono text-sm font-medium">
							{payment.cost.toLocaleString()} sats
						</span>
						<span className="ml-1 text-xs text-muted-foreground">
							({formatBsv(payment.cost)} BSV)
						</span>
					</div>
				</div>
				{isConnected && (
					<div className="mt-1 flex items-center justify-between border-t border-border/50 pt-1">
						<span className="text-xs text-muted-foreground">Your Balance</span>
						<span className="font-mono text-xs">
							{(balance?.satoshis ?? 0).toLocaleString()} sats
						</span>
					</div>
				)}
			</div>

			{/* Connection state */}
			{!isConnected && (
				<div className="mb-3 flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
					<Wallet className="h-4 w-4" />
					<span>Connect your wallet to pay</span>
				</div>
			)}

			{/* Insufficient balance warning */}
			{isConnected && !hasBalance && (
				<div className="mb-3 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
					<AlertCircle className="h-4 w-4" />
					<span>Insufficient balance</span>
				</div>
			)}

			{/* Actions */}
			<div className="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={onCancel}
					className="flex-1"
				>
					Cancel
				</Button>

				{!isConnected ? (
					<Button
						size="sm"
						onClick={() => connect()}
						className="flex-1 gap-2"
					>
						<Wallet className="h-4 w-4" />
						Connect Wallet
					</Button>
				) : (
					<Button
						size="sm"
						onClick={onConfirm}
						disabled={!hasBalance || isProcessing}
						className="flex-1 gap-2"
					>
						{isProcessing ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Processing...
							</>
						) : (
							<>
								<Sparkles className="h-4 w-4" />
								Pay & Generate
							</>
						)}
					</Button>
				)}
			</div>
		</div>
	);
}
