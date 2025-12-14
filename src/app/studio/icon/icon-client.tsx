"use client";

import { useMemo } from "react";
import { Image, Shapes } from "lucide-react";
import { StudioDashboard } from "@/components/studio/studio-dashboard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
	EmptyDescription,
} from "@/components/ui/empty";
import {
	useIconStudioStore,
	type IconStudioTab,
	type IconSetStyle,
	type FaviconBackground,
	type FaviconShape,
} from "@/lib/stores/icon-studio-store";

function SvgPreview({ svg }: { svg: string }) {
	return (
		<div
			className="h-10 w-10 text-foreground [&>svg]:h-10 [&>svg]:w-10"
			dangerouslySetInnerHTML={{ __html: svg }}
		/>
	);
}

export default function IconStudioPage() {
	const {
		activeTab,
		setActiveTab,
		iconSet,
		setIconSetPrompt,
		setIconSetNamesText,
		applyIconSetSlotPreset,
		setIconSetParams,
		favicon,
		setFaviconPrompt,
		setFaviconParams,
	} = useIconStudioStore();

	const iconNames = useMemo(() => {
		return iconSet.iconNamesText
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean);
	}, [iconSet.iconNamesText]);

	return (
		<StudioDashboard
			sidebar={
				<div className="flex w-80 shrink-0 flex-col border-r border-border bg-background/95 backdrop-blur">
					<ScrollArea className="flex-1">
						<div className="p-4 space-y-6">
							<div>
								<h3 className="text-sm font-medium text-foreground">Icon Studio</h3>
								<p className="text-xs text-muted-foreground">
									Build an icon set or generate a favicon. All settings can be controlled by Swatchy.
								</p>
							</div>

							<Tabs
								value={activeTab}
								onValueChange={(v) => {
									const tab = v as IconStudioTab;
									setActiveTab(tab);
								}}
							>
								<TabsList className="grid w-full grid-cols-2">
									<TabsTrigger value="icon-set" className="gap-1.5">
										<Shapes className="h-4 w-4" />
										Icon Set
									</TabsTrigger>
									<TabsTrigger value="favicon" className="gap-1.5">
										<Image className="h-4 w-4" />
										Favicon
									</TabsTrigger>
								</TabsList>

								<TabsContent value="icon-set" className="m-0 pt-6 space-y-5">
									<div className="space-y-2">
										<Label className="text-xs font-medium">Required Icon List</Label>
										<Select
											value={iconSet.slotPreset}
											onValueChange={(v) => {
												if (v === "custom") return;
												applyIconSetSlotPreset(v as "theme-token");
											}}
										>
											<SelectTrigger className="h-9">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="theme-token">Theme Token (used in app)</SelectItem>
												<SelectItem value="custom">Custom (edit list below)</SelectItem>
											</SelectContent>
										</Select>
										<p className="text-[11px] text-muted-foreground">
											Use a preset so the pack covers all required icon names.
										</p>
									</div>

									<div className="space-y-2">
										<Label className="text-xs font-medium">Prompt</Label>
										<Textarea
											value={iconSet.prompt}
											onChange={(e) => setIconSetPrompt(e.target.value)}
											placeholder="e.g. rounded, friendly outline icons for a modern dashboard"
											className="min-h-20"
										/>
									</div>

									<div className="space-y-2">
										<Label className="text-xs font-medium">Style</Label>
										<Select
											value={iconSet.params.style}
											onValueChange={(v) =>
												setIconSetParams({ style: v as IconSetStyle })
											}
										>
											<SelectTrigger className="h-9">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="outline">Outline</SelectItem>
												<SelectItem value="solid">Solid</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<Label className="text-xs font-medium">
											Stroke Width: {iconSet.params.strokeWidth}px
										</Label>
										<Slider
											value={[iconSet.params.strokeWidth]}
											onValueChange={([v]) =>
												setIconSetParams({ strokeWidth: v })
											}
											min={1}
											max={4}
											step={0.5}
										/>
									</div>

									<div className="space-y-2">
										<Label className="text-xs font-medium">
											Padding: {iconSet.params.padding}px
										</Label>
										<Slider
											value={[iconSet.params.padding]}
											onValueChange={([v]) => setIconSetParams({ padding: v })}
											min={0}
											max={6}
											step={1}
										/>
									</div>

									<div className="space-y-2">
										<Label className="text-xs font-medium">Icon Names</Label>
										<Textarea
											value={iconSet.iconNamesText}
											onChange={(e) => setIconSetNamesText(e.target.value)}
											className="min-h-40 font-mono text-xs"
											placeholder={"arrow-left\narrow-right\ncheck\nx"}
										/>
										<p className="text-[11px] text-muted-foreground">
											One name per line. The generator must fill this entire list.
										</p>
									</div>
								</TabsContent>

								<TabsContent value="favicon" className="m-0 pt-6 space-y-5">
									<div className="space-y-2">
										<Label className="text-xs font-medium">Prompt</Label>
										<Textarea
											value={favicon.prompt}
											onChange={(e) => setFaviconPrompt(e.target.value)}
											placeholder="e.g. a minimalist rocket icon with rounded corners"
											className="min-h-20"
										/>
									</div>

									<div className="space-y-2">
										<Label className="text-xs font-medium">Shape</Label>
										<Select
											value={favicon.params.shape}
											onValueChange={(v) =>
												setFaviconParams({ shape: v as FaviconShape })
											}
										>
											<SelectTrigger className="h-9">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="glyph">Glyph</SelectItem>
												<SelectItem value="badge">Badge</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<Label className="text-xs font-medium">Background</Label>
										<Select
											value={favicon.params.background}
											onValueChange={(v) =>
												setFaviconParams({ background: v as FaviconBackground })
											}
										>
											<SelectTrigger className="h-9">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="transparent">Transparent</SelectItem>
												<SelectItem value="theme">Theme</SelectItem>
												<SelectItem value="solid">Solid</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="grid grid-cols-2 gap-3">
										<div className="space-y-2">
											<Label className="text-xs font-medium">Foreground</Label>
											<Input
												value={favicon.params.foreground}
												onChange={(e) =>
													setFaviconParams({ foreground: e.target.value })
												}
												placeholder="currentColor"
												className="h-9"
											/>
										</div>
										<div className="space-y-2">
											<Label className="text-xs font-medium">Background Color</Label>
											<Input
												value={favicon.params.backgroundColor}
												onChange={(e) =>
													setFaviconParams({ backgroundColor: e.target.value })
												}
												placeholder="#000000"
												className="h-9"
											/>
										</div>
									</div>
								</TabsContent>
							</Tabs>
						</div>
					</ScrollArea>
				</div>
			}
			bottomLeft={
				<span className="text-xs text-muted-foreground">
					Use Swatchy to generate + iterate
				</span>
			}
			bottomRight={
				<Button size="lg" disabled className="gap-2" title="Generation is currently driven via Swatchy tools">
					<Shapes className="h-5 w-5" />
					Generate
				</Button>
			}
		>
			<div className="flex flex-1 flex-col">
				{activeTab === "icon-set" ? (
					<div className="flex-1 p-6">
						{Object.keys(iconSet.generated.iconsByName).length === 0 ? (
							<div className="flex h-full items-center justify-center">
								<Empty>
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<Shapes />
										</EmptyMedia>
										<EmptyTitle>Icon Set Studio</EmptyTitle>
										<EmptyDescription>
											Add icon names, then ask Swatchy to generate the full set using your current settings.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							</div>
						) : (
							<div className="space-y-4">
								<div className="flex items-end justify-between gap-4">
									<div>
										<h2 className="text-lg font-semibold">Generated Icons</h2>
										<p className="text-sm text-muted-foreground">
											{Object.keys(iconSet.generated.iconsByName).length} / {iconNames.length} icons
										</p>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
									{iconNames.map((name) => {
										const svg = iconSet.generated.iconsByName[name];
										const status = iconSet.generated.statusByName[name] ?? "missing";

										return (
											<div
												key={name}
												className="rounded-lg border border-border bg-card p-3"
											>
												<div className="flex items-center justify-between">
													<span className="truncate text-xs font-mono text-muted-foreground">
														{name}
													</span>
													<span className="text-[10px] text-muted-foreground">
														{status}
													</span>
												</div>
												<div className="mt-3 flex h-12 items-center justify-center rounded-md bg-muted/30">
													{svg ? (
														<SvgPreview svg={svg} />
													) : (
														<span className="text-xs text-muted-foreground">—</span>
													)}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="flex-1 p-6">
						{!favicon.generated.svg ? (
							<div className="flex h-full items-center justify-center">
								<Empty>
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<Image />
										</EmptyMedia>
										<EmptyTitle>Favicon Studio</EmptyTitle>
										<EmptyDescription>
											Ask Swatchy to generate a favicon using your current settings.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							</div>
						) : (
							<div className="space-y-4">
								<div>
									<h2 className="text-lg font-semibold">Generated Favicon</h2>
									<p className="text-sm text-muted-foreground">
										SVG + PNG renditions are stored in state for export/inscription flows.
									</p>
								</div>
								<div className="flex items-center gap-6">
									<div className="rounded-lg border border-border bg-card p-4">
										<div className="text-xs text-muted-foreground mb-2">SVG</div>
										<div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted/30">
											<SvgPreview svg={favicon.generated.svg} />
										</div>
									</div>
									<div className="flex flex-wrap gap-3">
										{Object.entries(favicon.generated.pngBySize).map(([size, b64]) => (
											<div
												key={size}
												className="rounded-lg border border-border bg-card p-3"
											>
												<div className="text-[10px] text-muted-foreground mb-2">
													{size}×{size}
												</div>
												<img
													alt={`favicon ${size}`}
													src={`data:image/png;base64,${b64}`}
													className="h-8 w-8"
												/>
											</div>
										))}
									</div>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</StudioDashboard>
	);
}
