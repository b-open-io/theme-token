"use client";

import { parseCss, validateThemeToken, type ThemeToken } from "@theme-token/sdk";
import { AlertCircle, Check, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

interface ImportModalProps {
	onImport: (theme: ThemeToken) => void;
	trigger?: React.ReactNode;
}

export function ImportModal({ onImport, trigger }: ImportModalProps) {
	const [open, setOpen] = useState(false);
	const [input, setInput] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [importedTheme, setImportedTheme] = useState<ThemeToken | null>(null);

	const handleInputChange = (value: string) => {
		setInput(value);
		setError(null);
		setSuccess(false);
		setImportedTheme(null);

		if (!value.trim()) return;

		// Try parsing as JSON first
		try {
			const parsed = JSON.parse(value);
			const result = validateThemeToken(parsed);
			if (result.valid) {
				setImportedTheme(result.theme);
				setSuccess(true);
				return;
			}
		} catch {
			// Not JSON, try CSS
		}

		// Try parsing as CSS
		const cssResult = parseCss(value, "Imported Theme");
		if (cssResult.valid) {
			setImportedTheme(cssResult.theme);
			setSuccess(true);
		} else {
			setError(cssResult.error);
		}
	};

	const handleImport = () => {
		if (importedTheme) {
			onImport(importedTheme);
			setOpen(false);
			setInput("");
			setError(null);
			setSuccess(false);
			setImportedTheme(null);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant="outline" size="sm" className="gap-2">
						<Upload className="h-4 w-4" />
						Import
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Import Theme</DialogTitle>
					<DialogDescription>
						Paste ShadCN theme CSS from{" "}
						<a
							href="https://tweakcn.com/editor/theme"
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary hover:underline"
						>
							tweakcn.com
						</a>{" "}
						or any ShadCN-compatible JSON.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<textarea
						value={input}
						onChange={(e) => handleInputChange(e.target.value)}
						placeholder={`:root {
  --primary: oklch(0.6 0.15 145);
  --background: oklch(0.98 0.01 240);
  /* ... */
}`}
						className="h-48 w-full rounded-lg border border-border bg-background p-3 font-mono text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
					/>

					{error && (
						<div className="flex items-center gap-2 text-xs text-destructive">
							<AlertCircle className="h-3 w-3" />
							{error}
						</div>
					)}

					{success && importedTheme && (
						<div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
							<div className="flex items-center gap-2 text-xs font-medium text-green-600">
								<Check className="h-3 w-3" />
								Theme parsed successfully
							</div>
							<div className="mt-2 flex items-center gap-2">
								<div className="flex h-5 overflow-hidden rounded-md border border-green-500/30">
									{[
										importedTheme.styles.light?.primary || importedTheme.styles.dark?.primary,
										importedTheme.styles.light?.secondary || importedTheme.styles.dark?.secondary,
										importedTheme.styles.light?.accent || importedTheme.styles.dark?.accent,
										importedTheme.styles.light?.muted || importedTheme.styles.dark?.muted,
										importedTheme.styles.light?.background || importedTheme.styles.dark?.background,
									].map((color, i) => (
										<div
											key={i}
											className="w-5"
											style={{ backgroundColor: color }}
										/>
									))}
								</div>
								<span className="text-xs text-muted-foreground">
									{importedTheme.name}
								</span>
							</div>
						</div>
					)}

					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleImport} disabled={!success}>
							<Upload className="mr-2 h-4 w-4" />
							Import Theme
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
