"use client";

import {
	type ThemeToken,
	toCss,
	toJson,
	toTailwindConfig,
} from "@theme-token/sdk";
import { Check, Copy, Download, Terminal } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ExportModalProps {
	theme: ThemeToken;
	origin?: string; // Only set for inscribed themes
	trigger?: React.ReactNode;
}

type ExportFormat = "css" | "tailwind" | "cli" | "json";

export function ExportModal({ theme, origin, trigger }: ExportModalProps) {
	const [copied, setCopied] = useState<ExportFormat | null>(null);
	const [activeTab, setActiveTab] = useState<ExportFormat>("css");

	const getContent = (format: ExportFormat): string => {
		switch (format) {
			case "css":
				return toCss(theme);
			case "tailwind":
				return toTailwindConfig(theme);
			case "cli":
				return origin
					? `bunx shadcn@latest add https://themetoken.dev/r/themes/${origin}.json`
					: "// Theme must be inscribed first to use CLI";
			case "json":
				return toJson(theme);
		}
	};

	const handleCopy = async (format: ExportFormat) => {
		const content = getContent(format);
		await navigator.clipboard.writeText(content);
		setCopied(format);
		setTimeout(() => setCopied(null), 2000);
	};

	const getDescription = (format: ExportFormat): string => {
		switch (format) {
			case "css":
				return "Add to your globals.css or app.css";
			case "tailwind":
				return "Tailwind v4 config with @theme directive";
			case "cli":
				return origin
					? "Run this command in your project"
					: "Inscribe the theme first to get CLI command";
			case "json":
				return "Full ThemeToken JSON for programmatic use";
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant="outline" size="sm" className="gap-2">
						<Download className="h-4 w-4" />
						Export
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden">
				<DialogHeader>
					<DialogTitle>Export Theme: {theme.name}</DialogTitle>
					<DialogDescription>
						Choose a format to export your theme
					</DialogDescription>
				</DialogHeader>

				<Tabs
					value={activeTab}
					onValueChange={(v) => setActiveTab(v as ExportFormat)}
					className="flex min-h-0 min-w-0 flex-1 flex-col"
				>
					<TabsList className="w-full">
						<TabsTrigger value="css" className="flex-1">
							CSS
						</TabsTrigger>
						<TabsTrigger value="tailwind" className="flex-1">
							Tailwind v4
						</TabsTrigger>
						<TabsTrigger value="cli" className="flex-1" disabled={!origin}>
							<Terminal className="mr-1 h-3 w-3" />
							ShadCN CLI
						</TabsTrigger>
						<TabsTrigger value="json" className="flex-1">
							JSON
						</TabsTrigger>
					</TabsList>

					{(["css", "tailwind", "cli", "json"] as ExportFormat[]).map(
						(format) => (
							<TabsContent
								key={format}
								value={format}
								className="mt-4 min-h-0 min-w-0 flex-1"
							>
								<div className="min-w-0 space-y-2">
									{/* Toolbar: description + always-visible copy button */}
									<div className="flex items-center justify-between gap-3">
										<p className="min-w-0 truncate text-sm text-muted-foreground">
											{getDescription(format)}
										</p>
										<Button
											size="sm"
											variant="default"
											className="h-8 shrink-0 gap-1.5"
											onClick={() => handleCopy(format)}
										>
											{copied === format ? (
												<>
													<Check className="h-3.5 w-3.5" />
													Copied
												</>
											) : (
												<>
													<Copy className="h-3.5 w-3.5" />
													Copy
												</>
											)}
										</Button>
									</div>
									<pre className="max-h-[50vh] w-full overflow-auto rounded-lg border bg-muted/50 p-4 font-mono text-xs whitespace-pre">
										{getContent(format)}
									</pre>
								</div>
							</TabsContent>
						),
					)}
				</Tabs>

				{origin && (
					<div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
						<p className="text-xs text-muted-foreground">
							<span className="font-medium text-primary">Registry URL:</span>{" "}
							<code className="rounded bg-muted px-1">
								https://themetoken.dev/r/themes/{origin}.json
							</code>
						</p>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
