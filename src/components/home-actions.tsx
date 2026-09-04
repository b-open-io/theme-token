"use client";

import { Check, Copy, Wand2 } from "lucide-react";
import { useState } from "react";
import { useSwatchyStore } from "@/components/swatchy/swatchy-store";
import { Button } from "@/components/ui/button";

export function CreateThemeButton() {
	const { openChat, setPendingPrefill } = useSwatchyStore();

	const handleClick = () => {
		setPendingPrefill(
			"I want to create a new theme. Can you help me design something?",
		);
		openChat();
	};

	return (
		<Button
			size="lg"
			variant="outline"
			className="gap-2 border-primary/40 bg-primary/10 text-foreground shadow-sm hover:bg-primary/20 hover:text-foreground active:translate-y-px"
			onClick={handleClick}
			aria-haspopup="dialog"
			aria-controls="swatchy-chat"
		>
			<Wand2 data-icon="inline-start" className="h-5 w-5" />
			Create Theme
		</Button>
	);
}

export function CopyInstallCommandButton({ command }: { command: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(command);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<button
			type="button"
			onClick={handleCopy}
			className="shrink-0 rounded-md border border-border bg-background p-2 text-muted-foreground shadow-sm transition-colors hover:text-foreground"
			title="Copy command"
		>
			{copied ? (
				<Check className="h-4 w-4 text-green-500" />
			) : (
				<Copy className="h-4 w-4" />
			)}
		</button>
	);
}
