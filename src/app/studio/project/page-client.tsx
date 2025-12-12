"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, FolderKanban, Palette, Type, Shapes, Image, Terminal } from "lucide-react";
import type { IconLibrary, BaseColor, MenuColor, MenuAccent } from "@/lib/project-types";

interface ProjectConfig {
	name: string;
	iconLibrary: IconLibrary;
	baseColor: BaseColor;
	menuColor: MenuColor;
	menuAccent: MenuAccent;
}

export function ProjectStudioPageClient() {
	const [config, setConfig] = useState<ProjectConfig>({
		name: "my-project",
		iconLibrary: "lucide",
		baseColor: "zinc",
		menuColor: "default",
		menuAccent: "subtle",
	});

	// Placeholder states for asset selection
	const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
	const [selectedFont, setSelectedFont] = useState<string | null>(null);
	const [selectedIcons, setSelectedIcons] = useState<string[]>([]);
	const [selectedWallpaper, setSelectedWallpaper] = useState<string | null>(null);

	// Generate the CLI command preview
	const presetUrl = `https://themetoken.dev/init?project={origin}`;
	const cliCommand = `bunx shadcn@latest create --preset "${presetUrl}" --template next`;

	return (
		<div className="container py-8 max-w-6xl mx-auto">
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-2">
					<FolderKanban className="w-8 h-8 text-primary" />
					<h1 className="text-3xl font-bold">Project Studio</h1>
				</div>
				<p className="text-muted-foreground text-lg">
					Compose themes, fonts, icons, and wallpapers into complete shadcn/create presets
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Left column - Asset Selection */}
				<div className="space-y-6">
					{/* Project Name */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Project Name</CardTitle>
							<CardDescription>
								Name for your project bundle
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Input
								value={config.name}
								onChange={(e) => setConfig({ ...config, name: e.target.value })}
								placeholder="my-project"
							/>
						</CardContent>
					</Card>

					{/* Theme Selection */}
					<Card>
						<CardHeader>
							<div className="flex items-center gap-2">
								<Palette className="w-5 h-5 text-primary" />
								<CardTitle className="text-lg">Theme</CardTitle>
							</div>
							<CardDescription>
								Select a theme or create one in Theme Studio
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex gap-2">
								<Select value={selectedTheme ?? ""} onValueChange={setSelectedTheme}>
									<SelectTrigger className="flex-1">
										<SelectValue placeholder="Select theme..." />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="current">Current Theme</SelectItem>
										<SelectItem value="new">Create New...</SelectItem>
									</SelectContent>
								</Select>
								<Button variant="outline" size="icon" asChild>
									<a href="/studio/theme">
										<ExternalLink className="w-4 h-4" />
									</a>
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Font Selection */}
					<Card>
						<CardHeader>
							<div className="flex items-center gap-2">
								<Type className="w-5 h-5 text-primary" />
								<CardTitle className="text-lg">Font</CardTitle>
							</div>
							<CardDescription>
								Select a font or generate one in Font Studio
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex gap-2">
								<Select value={selectedFont ?? ""} onValueChange={setSelectedFont}>
									<SelectTrigger className="flex-1">
										<SelectValue placeholder="Select font..." />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="inter">Inter</SelectItem>
										<SelectItem value="geist">Geist</SelectItem>
										<SelectItem value="custom">Generate Custom...</SelectItem>
									</SelectContent>
								</Select>
								<Button variant="outline" size="icon" asChild>
									<a href="/studio/font">
										<ExternalLink className="w-4 h-4" />
									</a>
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Icon Library */}
					<Card>
						<CardHeader>
							<div className="flex items-center gap-2">
								<Shapes className="w-5 h-5 text-primary" />
								<CardTitle className="text-lg">Icon Library</CardTitle>
							</div>
							<CardDescription>
								Choose which icon library to include
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Select
								value={config.iconLibrary}
								onValueChange={(v) => setConfig({ ...config, iconLibrary: v as IconLibrary })}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="lucide">Lucide Icons</SelectItem>
									<SelectItem value="hugeicons">Hugeicons</SelectItem>
									<SelectItem value="tabler">Tabler Icons</SelectItem>
								</SelectContent>
							</Select>
						</CardContent>
					</Card>

					{/* Wallpaper (optional) */}
					<Card>
						<CardHeader>
							<div className="flex items-center gap-2">
								<Image className="w-5 h-5 text-primary" />
								<CardTitle className="text-lg">Wallpaper</CardTitle>
								<Badge variant="secondary">Optional</Badge>
							</div>
							<CardDescription>
								Add a theme-aware hero wallpaper
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex gap-2">
								<Select value={selectedWallpaper ?? ""} onValueChange={setSelectedWallpaper}>
									<SelectTrigger className="flex-1">
										<SelectValue placeholder="No wallpaper" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">No wallpaper</SelectItem>
										<SelectItem value="generate">Generate New...</SelectItem>
									</SelectContent>
								</Select>
								<Button variant="outline" size="icon" asChild>
									<a href="/studio/wallpaper">
										<ExternalLink className="w-4 h-4" />
									</a>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Right column - Configuration & Preview */}
				<div className="space-y-6">
					{/* Style Configuration */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Style Configuration</CardTitle>
							<CardDescription>
								Configure the project style settings
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label>Base Color</Label>
								<Select
									value={config.baseColor}
									onValueChange={(v) => setConfig({ ...config, baseColor: v as BaseColor })}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="neutral">Neutral</SelectItem>
										<SelectItem value="gray">Gray</SelectItem>
										<SelectItem value="zinc">Zinc</SelectItem>
										<SelectItem value="stone">Stone</SelectItem>
										<SelectItem value="slate">Slate</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Menu Color</Label>
								<Select
									value={config.menuColor}
									onValueChange={(v) => setConfig({ ...config, menuColor: v as MenuColor })}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="default">Default</SelectItem>
										<SelectItem value="primary">Primary</SelectItem>
										<SelectItem value="accent">Accent</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Menu Accent</Label>
								<Select
									value={config.menuAccent}
									onValueChange={(v) => setConfig({ ...config, menuAccent: v as MenuAccent })}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="subtle">Subtle</SelectItem>
										<SelectItem value="normal">Normal</SelectItem>
										<SelectItem value="bold">Bold</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardContent>
					</Card>

					{/* CLI Preview */}
					<Card>
						<CardHeader>
							<div className="flex items-center gap-2">
								<Terminal className="w-5 h-5 text-primary" />
								<CardTitle className="text-lg">CLI Command</CardTitle>
							</div>
							<CardDescription>
								After inscribing, use this command to create a project
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="relative">
								<pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto font-mono">
									{cliCommand}
								</pre>
								<Button
									variant="ghost"
									size="icon"
									className="absolute top-2 right-2"
									onClick={() => navigator.clipboard.writeText(cliCommand)}
								>
									<Copy className="w-4 h-4" />
								</Button>
							</div>
							<p className="text-xs text-muted-foreground mt-2">
								Replace {"{origin}"} with your inscription origin after publishing
							</p>
						</CardContent>
					</Card>

					{/* Actions */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Publish</CardTitle>
							<CardDescription>
								Bundle and inscribe your project on-chain
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Estimated Bundle Size</span>
								<span className="font-mono">~50 KB</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Inscription Cost</span>
								<span className="font-mono">~1,000 sats</span>
							</div>
							<Separator />
							<Button className="w-full" size="lg" disabled>
								Connect Wallet to Inscribe
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
