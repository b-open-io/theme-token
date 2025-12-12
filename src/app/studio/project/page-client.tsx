"use client";

import { useState } from "react";
import { StudioDashboard } from "@/components/studio/studio-dashboard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Copy,
	ExternalLink,
	FolderKanban,
	Palette,
	Type,
	Shapes,
	Image,
	Check,
	Loader2,
	PenLine,
	Sparkles,
} from "lucide-react";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { useShadcnPresets, type ShadcnPreset } from "@/hooks/use-shadcn-presets";
import { useStudioThemes, getThemePreviewColors } from "@/hooks/use-studio-themes";
import type { CachedTheme } from "@/lib/themes-cache";
import type { IconLibrary, BaseColor, MenuColor, MenuAccent } from "@/lib/project-types";
import { ICON_LIBRARY_PACKAGES } from "@/lib/project-types";
import { cn } from "@/lib/utils";

interface ProjectConfig {
	name: string;
	base: "radix" | "base";
	style: string;
	iconLibrary: IconLibrary;
	font: string;
	baseColor: BaseColor;
	menuColor: MenuColor;
	menuAccent: MenuAccent;
}

export function ProjectStudioPageClient() {
	const { status, connect, isInscribing } = useYoursWallet();
	const { presets, presetsByBase, isLoading: presetsLoading } = useShadcnPresets();
	const { themes, mode, isLoading: themesLoading } = useStudioThemes();
	const [copied, setCopied] = useState(false);
	const [selectedPreset, setSelectedPreset] = useState<ShadcnPreset | null>(null);

	const [config, setConfig] = useState<ProjectConfig>({
		name: "my-project",
		base: "radix",
		style: "vega",
		iconLibrary: "lucide",
		font: "geist",
		baseColor: "neutral",
		menuColor: "default",
		menuAccent: "subtle",
	});

	// Selected on-chain theme for the project
	const [selectedTheme, setSelectedTheme] = useState<CachedTheme | null>(null);
	const [selectedWallpaper, setSelectedWallpaper] = useState<string | null>(null);

	// Get preview colors for the selected theme
	const themeColors = selectedTheme
		? getThemePreviewColors(selectedTheme.theme, mode)
		: null;

	// Get unique styles for the selected base
	const availablePresets = config.base === "radix" ? presetsByBase.radix : presetsByBase.base;

	// Apply a preset
	const applyPreset = (preset: ShadcnPreset) => {
		setSelectedPreset(preset);
		setConfig({
			...config,
			base: preset.base,
			style: preset.style,
			iconLibrary: preset.iconLibrary as IconLibrary,
			font: preset.font,
			baseColor: preset.baseColor as BaseColor,
			menuColor: preset.menuColor as MenuColor,
			menuAccent: preset.menuAccent as MenuAccent,
		});
	};

	// Generate the CLI command preview
	const presetUrl = `https://themetoken.dev/init?project={origin}`;
	const cliCommand = `bunx shadcn@latest create --preset "${presetUrl}" --template next`;

	const handleCopyCommand = () => {
		navigator.clipboard.writeText(cliCommand);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const isConnected = status === "connected";
	const canInscribe = isConnected && !isInscribing && selectedTheme !== null;

	// Estimate bundle size (placeholder)
	const estimatedSize = "~50 KB";
	const estimatedCost = "~1,000 sats";

	// Get icon library dependencies for display
	const iconDeps = ICON_LIBRARY_PACKAGES[config.iconLibrary];

	return (
		<StudioDashboard
			sidebar={
				<div className="flex h-full min-h-0 w-80 shrink-0 flex-col border-r border-border bg-background/95 backdrop-blur">
					<ScrollArea className="h-full w-full">
						<div className="p-4 space-y-6">
							{/* Header */}
							<div>
								<div className="flex items-center gap-2 mb-2">
									<FolderKanban className="h-5 w-5 text-primary" />
									<h3 className="text-sm font-medium text-foreground">
										Project Studio
									</h3>
								</div>
								<p className="text-xs text-muted-foreground">
									Compose themes, fonts, and icons into complete shadcn/create presets.
								</p>
							</div>

							{/* Project Name */}
							<div className="space-y-2">
								<Label className="text-xs font-medium">Project Name</Label>
								<Input
									value={config.name}
									onChange={(e) => setConfig({ ...config, name: e.target.value })}
									placeholder="my-project"
									className="h-9"
								/>
							</div>

							{/* Preset Selection */}
							<div className="space-y-3 pt-2 border-t border-border">
								<div className="flex items-center gap-2">
									<Sparkles className="h-4 w-4 text-primary" />
									<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
										Start from Preset
									</h4>
								</div>

								{/* Base Toggle */}
								<div className="flex rounded-lg border border-border p-1 bg-muted/30">
									<button
										type="button"
										onClick={() => setConfig({ ...config, base: "radix" })}
										className={cn(
											"flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
											config.base === "radix"
												? "bg-background text-foreground shadow-sm"
												: "text-muted-foreground hover:text-foreground"
										)}
									>
										Radix
									</button>
									<button
										type="button"
										onClick={() => setConfig({ ...config, base: "base" })}
										className={cn(
											"flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
											config.base === "base"
												? "bg-background text-foreground shadow-sm"
												: "text-muted-foreground hover:text-foreground"
										)}
									>
										Base UI
									</button>
								</div>

								{/* Style Cards */}
								<div className="grid grid-cols-2 gap-2">
									{presetsLoading ? (
										<div className="col-span-2 flex items-center justify-center py-4 text-xs text-muted-foreground">
											<Loader2 className="h-4 w-4 animate-spin mr-2" />
											Loading presets...
										</div>
									) : (
										availablePresets.map((preset) => (
											<button
												key={preset.name}
												type="button"
												onClick={() => applyPreset(preset)}
												className={cn(
													"flex flex-col items-start p-2.5 rounded-lg border text-left transition-colors",
													selectedPreset?.name === preset.name
														? "border-primary bg-primary/5"
														: "border-border hover:border-primary/50 hover:bg-muted/50"
												)}
											>
												<span className="text-xs font-medium">{preset.title}</span>
												<span className="text-[10px] text-muted-foreground truncate w-full">
													{preset.description}
												</span>
											</button>
										))
									)}
								</div>
							</div>

							{/* Theme Selection */}
							<div className="space-y-2 pt-2 border-t border-border">
								<div className="flex items-center gap-2">
									<Palette className="h-4 w-4 text-primary" />
									<Label className="text-xs font-medium">Theme</Label>
								</div>
								<div className="flex gap-2">
									<Select
										value={selectedTheme?.origin ?? ""}
										onValueChange={(origin) => {
											const theme = themes.find((t) => t.origin === origin);
											setSelectedTheme(theme ?? null);
										}}
									>
										<SelectTrigger className="flex-1 h-9">
											<SelectValue placeholder={themesLoading ? "Loading..." : "Select theme..."} />
										</SelectTrigger>
										<SelectContent>
											{themesLoading ? (
												<SelectItem value="" disabled>
													<span className="flex items-center gap-2">
														<Loader2 className="h-3 w-3 animate-spin" />
														Loading themes...
													</span>
												</SelectItem>
											) : themes.length === 0 ? (
												<SelectItem value="" disabled>
													No themes available
												</SelectItem>
											) : (
												themes.map((cached) => {
													const colors = getThemePreviewColors(cached.theme, mode);
													return (
														<SelectItem key={cached.origin} value={cached.origin}>
															<span className="flex items-center gap-2">
																<span
																	className="h-3 w-3 rounded-full border border-border"
																	style={{ backgroundColor: colors.primary }}
																/>
																{cached.theme.name}
															</span>
														</SelectItem>
													);
												})
											)}
										</SelectContent>
									</Select>
									<Button variant="outline" size="icon" className="h-9 w-9 shrink-0" asChild>
										<a href="/studio/theme">
											<ExternalLink className="h-4 w-4" />
										</a>
									</Button>
								</div>
							</div>

							{/* Font Selection */}
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Type className="h-4 w-4 text-primary" />
									<Label className="text-xs font-medium">Font</Label>
								</div>
								<div className="flex gap-2">
									<Select value={config.font} onValueChange={(v) => setConfig({ ...config, font: v })}>
										<SelectTrigger className="flex-1 h-9">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="geist">Geist Sans</SelectItem>
											<SelectItem value="inter">Inter</SelectItem>
											<SelectItem value="figtree">Figtree</SelectItem>
											<SelectItem value="jetbrains-mono">JetBrains Mono</SelectItem>
										</SelectContent>
									</Select>
									<Button variant="outline" size="icon" className="h-9 w-9 shrink-0" asChild>
										<a href="/studio/font">
											<ExternalLink className="h-4 w-4" />
										</a>
									</Button>
								</div>
							</div>

							{/* Icon Library */}
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Shapes className="h-4 w-4 text-primary" />
									<Label className="text-xs font-medium">Icon Library</Label>
								</div>
								<Select
									value={config.iconLibrary}
									onValueChange={(v) => setConfig({ ...config, iconLibrary: v as IconLibrary })}
								>
									<SelectTrigger className="h-9">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="lucide">Lucide Icons</SelectItem>
										<SelectItem value="hugeicons">Hugeicons</SelectItem>
										<SelectItem value="tabler">Tabler Icons</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground">
									Adds: {iconDeps.join(", ")}
								</p>
							</div>

							{/* Wallpaper (optional) */}
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Image className="h-4 w-4 text-primary" />
									<Label className="text-xs font-medium">Wallpaper</Label>
									<Badge variant="secondary" className="text-[10px] px-1.5 py-0">
										Optional
									</Badge>
								</div>
								<div className="flex gap-2">
									<Select value={selectedWallpaper ?? ""} onValueChange={setSelectedWallpaper}>
										<SelectTrigger className="flex-1 h-9">
											<SelectValue placeholder="No wallpaper" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">No wallpaper</SelectItem>
											<SelectItem value="generate">Generate New...</SelectItem>
										</SelectContent>
									</Select>
									<Button variant="outline" size="icon" className="h-9 w-9 shrink-0" asChild>
										<a href="/studio/wallpaper">
											<ExternalLink className="h-4 w-4" />
										</a>
									</Button>
								</div>
							</div>

							{/* Style Configuration */}
							<div className="space-y-3 pt-2 border-t border-border">
								<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Style Options
								</h4>

								<div className="space-y-2">
									<Label className="text-xs">Base Color</Label>
									<Select
										value={config.baseColor}
										onValueChange={(v) => setConfig({ ...config, baseColor: v as BaseColor })}
									>
										<SelectTrigger className="h-9">
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
									<Label className="text-xs">Menu Color</Label>
									<Select
										value={config.menuColor}
										onValueChange={(v) => setConfig({ ...config, menuColor: v as MenuColor })}
									>
										<SelectTrigger className="h-9">
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
									<Label className="text-xs">Menu Accent</Label>
									<Select
										value={config.menuAccent}
										onValueChange={(v) => setConfig({ ...config, menuAccent: v as MenuAccent })}
									>
										<SelectTrigger className="h-9">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="subtle">Subtle</SelectItem>
											<SelectItem value="normal">Normal</SelectItem>
											<SelectItem value="bold">Bold</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
					</ScrollArea>
				</div>
			}
			bottomLeft={
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span>Bundle:</span>
						<span className="font-mono text-foreground">{estimatedSize}</span>
					</div>
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span>Cost:</span>
						<span className="font-mono text-foreground">{estimatedCost}</span>
					</div>
				</div>
			}
			bottomRight={
				<Button
					size="lg"
					disabled={!canInscribe}
					onClick={isConnected ? () => {} : connect}
					className="gap-2"
				>
					{isConnected ? (
						<>
							<PenLine className="h-5 w-5" />
							Inscribe Project
						</>
					) : status === "connecting" ? (
						<>
							<Loader2 className="h-5 w-5 animate-spin" />
							Connecting...
						</>
					) : (
						<>
							<PenLine className="h-5 w-5" />
							Connect to Inscribe
						</>
					)}
				</Button>
			}
		>
			{/* Main Canvas - Preview Area */}
			<div className="flex flex-1 flex-col overflow-y-auto">
				<div className="flex-1 p-8">
					<div className="mx-auto max-w-2xl space-y-8">
						{/* Project Preview Header */}
						<div className="text-center space-y-2">
							<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
								<FolderKanban className="h-4 w-4" />
								Project Preview
							</div>
							<h2 className="text-2xl font-bold">{config.name || "my-project"}</h2>
							<p className="text-muted-foreground">
								A complete shadcn/create preset with your custom configuration
							</p>
						</div>

						{/* Bundle Contents */}
						<div className="grid gap-4 sm:grid-cols-2">
							{/* Theme Card */}
							<div className="rounded-lg border border-border bg-card p-4">
								<div className="flex items-center gap-3 mb-3">
									<div className="p-2 rounded-md bg-primary/10">
										<Palette className="h-5 w-5 text-primary" />
									</div>
									<div>
										<h3 className="font-medium text-sm">Theme</h3>
										<p className="text-xs text-muted-foreground">
											{selectedTheme ? selectedTheme.theme.name : "Not selected"}
										</p>
									</div>
								</div>
								{selectedTheme && themeColors ? (
									<div className="flex h-8 rounded-md overflow-hidden border border-border">
										<div
											className="flex-1"
											style={{ backgroundColor: themeColors.primary }}
										/>
										<div
											className="flex-1"
											style={{ backgroundColor: themeColors.secondary }}
										/>
										<div
											className="flex-1"
											style={{ backgroundColor: themeColors.accent }}
										/>
									</div>
								) : (
									<div className="flex items-center justify-center h-8 rounded-md border border-dashed border-border text-xs text-muted-foreground">
										Select a theme
									</div>
								)}
							</div>

							{/* Font Card */}
							<div className="rounded-lg border border-border bg-card p-4">
								<div className="flex items-center gap-3 mb-3">
									<div className="p-2 rounded-md bg-primary/10">
										<Type className="h-5 w-5 text-primary" />
									</div>
									<div>
										<h3 className="font-medium text-sm">Typography</h3>
										<p className="text-xs text-muted-foreground capitalize">
											{config.font.replace("-", " ")}
										</p>
									</div>
								</div>
								<div className="text-lg font-medium truncate">
									The quick brown fox
								</div>
							</div>

							{/* Icons Card */}
							<div className="rounded-lg border border-border bg-card p-4">
								<div className="flex items-center gap-3 mb-3">
									<div className="p-2 rounded-md bg-primary/10">
										<Shapes className="h-5 w-5 text-primary" />
									</div>
									<div>
										<h3 className="font-medium text-sm">Icons</h3>
										<p className="text-xs text-muted-foreground capitalize">
											{config.iconLibrary}
										</p>
									</div>
								</div>
								<div className="flex gap-2 text-muted-foreground">
									<Palette className="h-5 w-5" />
									<Type className="h-5 w-5" />
									<Shapes className="h-5 w-5" />
									<Image className="h-5 w-5" />
									<FolderKanban className="h-5 w-5" />
								</div>
							</div>

							{/* Wallpaper Card */}
							<div className="rounded-lg border border-border bg-card p-4">
								<div className="flex items-center gap-3 mb-3">
									<div className="p-2 rounded-md bg-primary/10">
										<Image className="h-5 w-5 text-primary" />
									</div>
									<div>
										<h3 className="font-medium text-sm">Wallpaper</h3>
										<p className="text-xs text-muted-foreground">
											{selectedWallpaper && selectedWallpaper !== "none" ? "Selected" : "None"}
										</p>
									</div>
								</div>
								<div className="flex items-center justify-center h-8 rounded-md border border-dashed border-border text-xs text-muted-foreground">
									{selectedWallpaper && selectedWallpaper !== "none" ? "Preview" : "Optional"}
								</div>
							</div>
						</div>

						{/* CLI Command */}
						<div className="rounded-lg border border-border bg-muted/50 p-4">
							<div className="flex items-center gap-2 mb-3">
								<div className="p-1.5 rounded-md bg-foreground/10">
									<Copy className="h-4 w-4" />
								</div>
								<h3 className="font-medium text-sm">CLI Command</h3>
								<Badge variant="secondary" className="text-[10px]">After inscription</Badge>
							</div>
							<div className="relative">
								<pre className="p-3 bg-background rounded-md text-xs overflow-x-auto font-mono border border-border">
									{cliCommand}
								</pre>
								<Button
									variant="ghost"
									size="sm"
									className="absolute top-1.5 right-1.5 h-7 px-2"
									onClick={handleCopyCommand}
								>
									{copied ? (
										<Check className="h-3.5 w-3.5 text-green-500" />
									) : (
										<Copy className="h-3.5 w-3.5" />
									)}
								</Button>
							</div>
							<p className="text-xs text-muted-foreground mt-2">
								Replace <code className="px-1 py-0.5 rounded bg-muted font-mono">{"{origin}"}</code> with your inscription origin after publishing.
							</p>
						</div>

						{/* Style Summary */}
						<div className="rounded-lg border border-border bg-card p-4">
							<h3 className="font-medium text-sm mb-3">Configuration Summary</h3>
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
								<div>
									<p className="text-xs text-muted-foreground mb-1">Base</p>
									<p className="text-sm font-medium capitalize">{config.base === "radix" ? "Radix" : "Base UI"}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground mb-1">Style</p>
									<p className="text-sm font-medium capitalize">{config.style}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground mb-1">Base Color</p>
									<p className="text-sm font-medium capitalize">{config.baseColor}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground mb-1">Menu</p>
									<p className="text-sm font-medium capitalize">{config.menuColor} / {config.menuAccent}</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</StudioDashboard>
	);
}
