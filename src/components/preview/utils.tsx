"use client";

import { Check, Copy } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

// Section wrapper
export function DemoSection({
	title,
	description,
	children,
	className,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("space-y-4", className)}>
			<div className="space-y-1">
				<h3 className="text-lg font-semibold">{title}</h3>
				{description && (
					<p className="text-sm text-muted-foreground">{description}</p>
				)}
			</div>
			{children}
		</div>
	);
}

// Color swatch component
export function ColorSwatch({
	name,
	cssVar,
	className,
}: { name: string; cssVar: string; className?: string }) {
	const [copied, setCopied] = React.useState(false);

	const copyToClipboard = () => {
		navigator.clipboard.writeText(`var(--${cssVar})`);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<button
			type="button"
			onClick={copyToClipboard}
			className={cn(
				"group flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors hover:bg-muted/50",
				className,
			)}
		>
			<div
				className="h-10 w-10 shrink-0 rounded-md border shadow-sm"
				style={{ backgroundColor: `var(--${cssVar})` }}
			/>
			<div className="min-w-0 flex-1">
				<div className="flex items-center justify-between">
					<p className="truncate text-sm font-medium">{name}</p>
					{copied ? (
						<Check className="h-3 w-3 text-green-500" />
					) : (
						<Copy className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-50" />
					)}
				</div>
				<p className="truncate font-mono text-xs text-muted-foreground">
					--{cssVar}
				</p>
			</div>
		</button>
	);
}


