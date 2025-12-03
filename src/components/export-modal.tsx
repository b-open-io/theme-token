"use client";

import {
	toCss,
	toJson,
	toTailwindConfig,
	toShadcnCliCommand,
	type ThemeToken,
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
					? toShadcnCliCommand(origin)
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
			<DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden">
				<DialogHeader>
					<DialogTitle>Export Theme: {theme.name}</DialogTitle>
					<DialogDescription>
						Choose a format to export your theme
					</DialogDescription>
				</DialogHeader>

				<Tabs
					value={activeTab}
					onValueChange={(v) => setActiveTab(v as ExportFormat)}
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
							<TabsContent key={format} value={format} className="mt-4">
								<div className="space-y-3">
									<p className="text-sm text-muted-foreground">
										{getDescription(format)}
									</p>
									<div className="relative">
										<pre className="max-h-[50vh] overflow-auto rounded-lg border bg-muted/50 p-4 font-mono text-xs">
											{getContent(format)}
										</pre>
										<Button
											size="sm"
											variant="secondary"
											className="absolute right-2 top-2 gap-1"
											onClick={() => handleCopy(format)}
										>
											{copied === format ? (
												<>
													<Check className="h-3 w-3" />
													Copied
												</>
											) : (
												<>
													<Copy className="h-3 w-3" />
													Copy
												</>
											)}
										</Button>
									</div>
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
								https://themetoken.dev/r/themes/{origin}
							</code>
						</p>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
