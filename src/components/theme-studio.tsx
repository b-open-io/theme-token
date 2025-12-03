"use client";

import {
	applyTheme as applyThemeToDOM,
	fetchPublishedThemes,
	type PublishedTheme,
	parseCss,
	type ThemeToken,
	validateThemeToken,
} from "@theme-token/sdk";
import { motion } from "framer-motion";
import {
	AlertCircle,
	Check,
	ChevronDown,
	ChevronUp,
	Copy,
	ExternalLink,
	FolderOpen,
	Loader2,
	Moon,
	Pipette,
	Save,
	Settings2,
	Sparkles,
	Sun,
	Trash2,
	Type,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ExportModal } from "@/components/export-modal";
import {
	getAndClearRemixTheme,
	REMIX_THEME_EVENT,
	type StoredRemixTheme,
} from "@/components/theme-gallery";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ThemePreviewPanel } from "@/components/theme-preview-panel";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { exampleThemes } from "@/lib/example-themes";

const DRAFTS_STORAGE_KEY = "theme-token-drafts";

interface ThemeDraft {
	id: string;
	theme: ThemeToken;
	savedAt: number;
}

function loadDrafts(): ThemeDraft[] {
	if (typeof window === "undefined") return [];
	try {
		const saved = localStorage.getItem(DRAFTS_STORAGE_KEY);
		return saved ? JSON.parse(saved) : [];
	} catch {
		return [];
	}
}

function saveDrafts(drafts: ThemeDraft[]): void {
	localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
}

// Color control component for editing individual colors
interface ColorControlProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
}

function ColorControl({ label, value, onChange }: ColorControlProps) {
	return (
		<div className="flex items-center gap-2">
			<div
				className="h-6 w-6 shrink-0 cursor-pointer rounded border border-border"
				style={{ backgroundColor: value }}
			>
				<input
					type="color"
					value={value.startsWith("#") ? value : "#808080"}
					onChange={(e) => onChange(e.target.value)}
					className="h-full w-full cursor-pointer opacity-0"
				/>
			</div>
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="h-7 flex-1 rounded border border-border bg-background px-2 font-mono text-xs focus:border-primary focus:outline-none"
				placeholder={label}
			/>
			<span className="w-24 truncate text-[10px] text-muted-foreground">
				{label}
			</span>
		</div>
	);
}

// Collapsible section for grouping color controls
interface ColorSectionProps {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
}

function ColorSection({
	title,
	children,
	defaultOpen = false,
}: ColorSectionProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	return (
		<div className="border-b border-border pb-2">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex w-full items-center justify-between py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
			>
				{title}
				{isOpen ? (
					<ChevronUp className="h-3 w-3" />
				) : (
					<ChevronDown className="h-3 w-3" />
				)}
			</button>
			{isOpen && <div className="space-y-2 pb-2">{children}</div>}
		</div>
	);
}

export function ThemeStudio() {
	const searchParams = useSearchParams();
	const {
		status,
		connect,
		balance,
		profile,
		inscribeTheme,
		isInscribing,
		error: walletError,
	} = useYoursWallet();
	const { mode, toggleMode, activeTheme, applyThemeAnimated, availableThemes } =
		useTheme();

	// Use wallet's active theme as default if available, otherwise use first preset
	const [selectedTheme, setSelectedTheme] = useState<ThemeToken>(
		activeTheme || exampleThemes[0],
	);
	const [customInput, setCustomInput] = useState("");
	const [validationError, setValidationError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<"presets" | "paste" | "drafts">(
		"presets",
	);
	const [txid, setTxid] = useState<string | null>(null);
	const [customName, setCustomName] = useState("");
	const [drafts, setDrafts] = useState<ThemeDraft[]>([]);
	const [savedNotice, setSavedNotice] = useState(false);
	const [importSource, setImportSource] = useState<string | null>(null);
	const [onChainThemes, setOnChainThemes] = useState<PublishedTheme[]>([]);
	const [loadingThemes, setLoadingThemes] = useState(true);
	const [editorSubTab, setEditorSubTab] = useState<
		"colors" | "typography" | "other"
	>("colors");
	const isAnimatingRef = useRef(false);
	const [aiGenerationInfo, setAiGenerationInfo] = useState<{
		txid: string;
		themeName: string;
	} | null>(null);

	// Load drafts on mount
	useEffect(() => {
		setDrafts(loadDrafts());
	}, []);

	// Fetch on-chain themes
	useEffect(() => {
		fetchPublishedThemes()
			.then(setOnChainThemes)
			.finally(() => setLoadingThemes(false));
	}, []);

	// Sync with wallet's active theme when it changes externally
	useEffect(() => {
		if (activeTheme) {
			setSelectedTheme(activeTheme);
			setCustomName("");
		}
	}, [activeTheme]);

	// Handle deep link import from URL (?import=base64 or ?css=base64 or ?remix=origin)
	useEffect(() => {
		const importParam = searchParams.get("import") || searchParams.get("css");
		const remixParam = searchParams.get("remix");
		const nameParam = searchParams.get("name");
		const sourceParam = searchParams.get("source");

		// Handle remix by origin - fetch theme from blockchain
		if (remixParam) {
			fetch(`https://ordfs.network/${remixParam}`)
				.then((res) => res.json())
				.then((data) => {
					if (data.styles && (data.styles.light || data.styles.dark)) {
						const theme: ThemeToken = {
							$schema: data.$schema || "https://themetoken.dev/v1/schema.json",
							name: data.name || "Remixed Theme",
							author: data.author,
							styles: data.styles,
						};
						setSelectedTheme(theme);
						setCustomName(`${theme.name} (remix)`);
						setImportSource("blockchain");
					}
				})
				.catch(() => {
					setValidationError("Failed to fetch theme from blockchain");
				});
			return;
		}

		if (importParam) {
			try {
				// Decode base64 CSS
				const decodedCss = atob(importParam);

				// Parse the CSS
				const themeName = nameParam || "Imported Theme";
				const cssResult = parseCss(decodedCss, themeName);

				if (cssResult.valid) {
					setSelectedTheme(cssResult.theme);
					setCustomInput(decodedCss);
					setCustomName(themeName);
					setActiveTab("paste");
					setImportSource(sourceParam || null);
					setValidationError(null);
				} else {
					setValidationError(cssResult.error);
					setActiveTab("paste");
				}
			} catch {
				setValidationError("Invalid import data - could not decode");
				setActiveTab("paste");
			}
		}
	}, [searchParams]);

	// Check for remix theme from gallery navigation or AI generation
	useEffect(() => {
		const remixData = getAndClearRemixTheme();
		if (remixData) {
			setSelectedTheme(remixData.theme);
			setCustomName(remixData.theme.name);

			// If from AI generation, show success dialog and auto-save draft
			if (remixData.source === "ai-generate" && remixData.txid) {
				setAiGenerationInfo({
					txid: remixData.txid,
					themeName: remixData.theme.name,
				});

				// Auto-save as draft
				const draft: ThemeDraft = {
					id: Date.now().toString(),
					theme: remixData.theme,
					savedAt: Date.now(),
				};
				const currentDrafts = loadDrafts();
				const updated = [draft, ...currentDrafts];
				setDrafts(updated);
				saveDrafts(updated);
			}
		}
	}, []);

	const handleSaveDraft = () => {
		const draft: ThemeDraft = {
			id: Date.now().toString(),
			theme: {
				...selectedTheme,
				name: customName.trim() || selectedTheme.name,
			},
			savedAt: Date.now(),
		};
		const updated = [draft, ...drafts];
		setDrafts(updated);
		saveDrafts(updated);
		setSavedNotice(true);
		setTimeout(() => setSavedNotice(false), 2000);
	};

	const handleLoadDraft = (draft: ThemeDraft, e?: React.MouseEvent) => {
		setSelectedTheme(draft.theme);
		setCustomName(draft.theme.name);
		setActiveTab("presets");
		// Apply theme with animation
		applyThemeAnimated(draft.theme, e);
	};

	const handleDeleteDraft = (id: string) => {
		const updated = drafts.filter((d) => d.id !== id);
		setDrafts(updated);
		saveDrafts(updated);
	};

	const isConnected = status === "connected";
	const canMint = isConnected && !isInscribing && !validationError;

	// Apply theme to DOM directly for preview (skip during animated transitions)
	useEffect(() => {
		if (isAnimatingRef.current) return;
		applyThemeToDOM(selectedTheme.styles[mode]);
	}, [selectedTheme, mode]);

	// Listen for remix events from gallery
	useEffect(() => {
		const handleRemix = (e: Event) => {
			const theme = (e as CustomEvent<ThemeToken>).detail;
			setSelectedTheme(theme);
			setCustomName(""); // Clear custom name for remix
		};

		window.addEventListener(REMIX_THEME_EVENT, handleRemix);
		return () => window.removeEventListener(REMIX_THEME_EVENT, handleRemix);
	}, []);

	// Update theme name when customName changes
	useEffect(() => {
		if (customName.trim()) {
			setSelectedTheme((prev: ThemeToken) => ({
				...prev,
				name: customName.trim(),
			}));
		}
	}, [customName]);

	const handleInputChange = (value: string) => {
		setCustomInput(value);
		setValidationError(null);
		setImportSource(null); // Clear import source when user edits

		if (!value.trim()) return;

		// Try parsing as JSON first
		try {
			const parsed = JSON.parse(value);
			const result = validateThemeToken(parsed);
			if (result.valid) {
				setSelectedTheme(result.theme);
				return;
			}
		} catch {
			// Not JSON, try CSS
		}

		// Try parsing as CSS
		const cssResult = parseCss(value, customName || "Custom Theme");
		if (cssResult.valid) {
			setSelectedTheme(cssResult.theme);
			setValidationError(null);
		} else {
			setValidationError(cssResult.error);
		}
	};

	const handleMint = async () => {
		const themeToMint: ThemeToken = {
			...selectedTheme,
			name: customName.trim() || selectedTheme.name,
			// Add author from profile if available
			...(profile?.displayName && { author: profile.displayName }),
		};

		const result = await inscribeTheme(themeToMint);
		if (result) {
			setTxid(result.txid);
		}
	};

	// Update a single color in the current mode
	const updateColor = (key: string, value: string) => {
		setSelectedTheme((prev: ThemeToken) => ({
			...prev,
			styles: {
				...prev.styles,
				[mode]: {
					...prev.styles[mode],
					[key]: value,
				},
			},
		}));
	};

	// Success state
	if (txid) {
		const origin = `${txid}_0`;
		const installUrl = `https://themetoken.dev/r/themes/${origin}.json`;
		const installCommand = `bunx shadcn@latest add ${installUrl}`;

		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				className="rounded-xl border border-green-500/50 bg-green-500/10 p-8 text-center"
			>
				<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
					<Check className="h-8 w-8 text-green-500" />
				</div>
				<h3 className="mb-2 text-xl font-bold">Theme Token Inscribed!</h3>
				<p className="mb-4 text-muted-foreground">
					Your theme has been permanently inscribed on the BSV blockchain.
				</p>

				{/* Install Command */}
				<div className="mb-6 rounded-lg border border-primary/30 bg-card p-4 text-left">
					<p className="mb-2 text-xs font-medium text-primary">
						Install via CLI
					</p>
					<div className="flex items-center gap-2 rounded-md bg-muted p-2 font-mono text-xs">
						<code className="flex-1 overflow-x-auto">{installCommand}</code>
						<button
							onClick={() => {
								navigator.clipboard.writeText(installCommand);
							}}
							className="flex-shrink-0 rounded p-1 hover:bg-background"
							title="Copy"
						>
							<Copy className="h-3 w-3" />
						</button>
					</div>
				</div>

				<div className="mb-4 rounded-lg bg-muted/50 p-4">
					<p className="mb-1 text-xs text-muted-foreground">Origin ID</p>
					<p className="break-all font-mono text-sm">{origin}</p>
				</div>
				<div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
					<Button asChild variant="outline">
						<a
							href={`https://1sat.market/outpoint/${origin}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							View on Market
							<ExternalLink className="ml-2 h-4 w-4" />
						</a>
					</Button>
					<Button onClick={() => setTxid(null)}>Create Another</Button>
				</div>
			</motion.div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* AI Generation Success Dialog */}
			<Dialog
				open={aiGenerationInfo !== null}
				onOpenChange={(open) => !open && setAiGenerationInfo(null)}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Sparkles className="h-5 w-5 text-primary" />
							Theme Generated!
						</DialogTitle>
						<DialogDescription>
							Your AI-generated theme "{aiGenerationInfo?.themeName}" is ready.
							It has been saved as a draft.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						{/* Transaction Link */}
						<div className="rounded-lg border border-border bg-muted/50 p-3">
							<p className="mb-1 text-xs font-medium text-muted-foreground">
								Payment Transaction
							</p>
							<a
								href={`https://whatsonchain.com/tx/${aiGenerationInfo?.txid}`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 text-sm text-primary hover:underline"
							>
								<span className="truncate font-mono">
									{aiGenerationInfo?.txid?.slice(0, 20)}...
								</span>
								<ExternalLink className="h-3 w-3 shrink-0" />
							</a>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-3">
							<Button
								variant="outline"
								className="flex-1"
								onClick={() => setAiGenerationInfo(null)}
							>
								Edit First
							</Button>
							<Button
								className="flex-1"
								onClick={() => {
									setAiGenerationInfo(null);
									// Trigger inscription flow
									if (status === "connected") {
										handleMint();
									} else {
										connect();
									}
								}}
							>
								Publish Now
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Main content area */}
			<div className="flex flex-1 overflow-hidden">
				{/* Left Panel: Controls (fixed width, scrollable) */}
				<div className="flex w-full flex-col border-r border-border bg-muted/5 lg:w-[380px] lg:shrink-0">
					<div className="flex-1 overflow-y-auto p-4">
						{/* Tab switcher */}
						<div className="mb-4 flex gap-1 rounded-lg bg-muted p-1">
							<button
								onClick={() => setActiveTab("presets")}
								className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
									activeTab === "presets"
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								Editor
							</button>
							<button
								onClick={() => setActiveTab("paste")}
								className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
									activeTab === "paste"
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								Paste
							</button>
							<button
								onClick={() => setActiveTab("drafts")}
								className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
									activeTab === "drafts"
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								Drafts{drafts.length > 0 && ` (${drafts.length})`}
							</button>
						</div>

						{/* Editor Tab (was Presets) */}
						{activeTab === "presets" && (
							<div className="space-y-4">
								{/* Preset selector - Dropdown */}
								<div>
									<label className="mb-1.5 block text-xs font-medium text-muted-foreground">
										Select Theme
									</label>
									<Select
										value={selectedTheme.name}
										onValueChange={async (value) => {
											// Find theme from all sources
											const onChain = onChainThemes.find(
												(t) => t.theme.name === value,
											);
											const wallet = availableThemes.find(
												(t) => t.name === value,
											);
											const example = exampleThemes.find(
												(t) => t.name === value,
											);
											const theme = onChain?.theme || wallet || example;
											if (theme) {
												isAnimatingRef.current = true;
												setSelectedTheme(theme);
												setCustomName("");
												await applyThemeAnimated(theme);
												isAnimatingRef.current = false;
											}
										}}
									>
										<SelectTrigger className="w-full">
											<SelectValue>
												<div className="flex items-center gap-2">
													<div className="flex h-4 w-12 overflow-hidden rounded-sm border border-border">
														{[
															selectedTheme.styles[mode].primary,
															selectedTheme.styles[mode].secondary,
															selectedTheme.styles[mode].accent,
														].map((color, i) => (
															<div
																key={i}
																className="flex-1"
																style={{ backgroundColor: color }}
															/>
														))}
													</div>
													<span className="truncate">{selectedTheme.name}</span>
												</div>
											</SelectValue>
										</SelectTrigger>
										<SelectContent className="max-h-80">
											{/* On-Chain Themes */}
											{onChainThemes.length > 0 && (
												<SelectGroup>
													<SelectLabel className="text-xs text-primary">
														On-Chain Themes
													</SelectLabel>
													{onChainThemes.map((published) => (
														<SelectItem
															key={published.origin}
															value={published.theme.name}
														>
															<div className="flex items-center gap-2">
																<div className="flex h-3 w-9 overflow-hidden rounded-sm border border-border">
																	{[
																		published.theme.styles[mode].primary,
																		published.theme.styles[mode].secondary,
																		published.theme.styles[mode].accent,
																	].map((color, i) => (
																		<div
																			key={i}
																			className="flex-1"
																			style={{ backgroundColor: color }}
																		/>
																	))}
																</div>
																<span>{published.theme.name}</span>
															</div>
														</SelectItem>
													))}
												</SelectGroup>
											)}
											{loadingThemes && (
												<div className="flex items-center justify-center py-2 text-xs text-muted-foreground">
													<Loader2 className="mr-2 h-3 w-3 animate-spin" />
													Loading on-chain themes...
												</div>
											)}
											{/* Wallet Themes */}
											{availableThemes.length > 0 && (
												<SelectGroup>
													<SelectLabel className="text-xs text-muted-foreground">
														My Themes
													</SelectLabel>
													{availableThemes.map((theme) => (
														<SelectItem key={theme.name} value={theme.name}>
															<div className="flex items-center gap-2">
																<div className="flex h-3 w-9 overflow-hidden rounded-sm border border-border">
																	{[
																		theme.styles[mode].primary,
																		theme.styles[mode].secondary,
																		theme.styles[mode].accent,
																	].map((color, i) => (
																		<div
																			key={i}
																			className="flex-1"
																			style={{ backgroundColor: color }}
																		/>
																	))}
																</div>
																<span>{theme.name}</span>
															</div>
														</SelectItem>
													))}
												</SelectGroup>
											)}
											{/* Example Themes */}
											<SelectGroup>
												<SelectLabel className="text-xs text-muted-foreground">
													Examples
												</SelectLabel>
												{exampleThemes.map((theme) => (
													<SelectItem key={theme.name} value={theme.name}>
														<div className="flex items-center gap-2">
															<div className="flex h-3 w-9 overflow-hidden rounded-sm border border-border">
																{[
																	theme.styles[mode].primary,
																	theme.styles[mode].secondary,
																	theme.styles[mode].accent,
																].map((color, i) => (
																	<div
																		key={i}
																		className="flex-1"
																		style={{ backgroundColor: color }}
																	/>
																))}
															</div>
															<span>{theme.name}</span>
														</div>
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>

								{/* Sub-tabs for editor sections */}
								<div className="flex gap-1 rounded-lg bg-muted/50 p-1">
									<button
										onClick={() => setEditorSubTab("colors")}
										className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
											editorSubTab === "colors"
												? "bg-background text-foreground shadow-sm"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										<Pipette className="h-3 w-3" />
										Colors
									</button>
									<button
										onClick={() => setEditorSubTab("typography")}
										className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
											editorSubTab === "typography"
												? "bg-background text-foreground shadow-sm"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										<Type className="h-3 w-3" />
										Type
									</button>
									<button
										onClick={() => setEditorSubTab("other")}
										className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
											editorSubTab === "other"
												? "bg-background text-foreground shadow-sm"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										<Settings2 className="h-3 w-3" />
										Other
									</button>
								</div>

								{/* Colors Sub-tab */}
								{editorSubTab === "colors" && (
									<div className="space-y-1">
										<ColorSection title="Primary Colors" defaultOpen>
											<ColorControl
												label="primary"
												value={selectedTheme.styles[mode].primary}
												onChange={(v) => updateColor("primary", v)}
											/>
											<ColorControl
												label="primary-fg"
												value={selectedTheme.styles[mode]["primary-foreground"]}
												onChange={(v) => updateColor("primary-foreground", v)}
											/>
										</ColorSection>

										<ColorSection title="Secondary Colors">
											<ColorControl
												label="secondary"
												value={selectedTheme.styles[mode].secondary}
												onChange={(v) => updateColor("secondary", v)}
											/>
											<ColorControl
												label="secondary-fg"
												value={
													selectedTheme.styles[mode]["secondary-foreground"]
												}
												onChange={(v) => updateColor("secondary-foreground", v)}
											/>
										</ColorSection>

										<ColorSection title="Background & Foreground">
											<ColorControl
												label="background"
												value={selectedTheme.styles[mode].background}
												onChange={(v) => updateColor("background", v)}
											/>
											<ColorControl
												label="foreground"
												value={selectedTheme.styles[mode].foreground}
												onChange={(v) => updateColor("foreground", v)}
											/>
										</ColorSection>

										<ColorSection title="Card & Popover">
											<ColorControl
												label="card"
												value={selectedTheme.styles[mode].card}
												onChange={(v) => updateColor("card", v)}
											/>
											<ColorControl
												label="card-fg"
												value={selectedTheme.styles[mode]["card-foreground"]}
												onChange={(v) => updateColor("card-foreground", v)}
											/>
											<ColorControl
												label="popover"
												value={selectedTheme.styles[mode].popover}
												onChange={(v) => updateColor("popover", v)}
											/>
											<ColorControl
												label="popover-fg"
												value={selectedTheme.styles[mode]["popover-foreground"]}
												onChange={(v) => updateColor("popover-foreground", v)}
											/>
										</ColorSection>

										<ColorSection title="Accent & Muted">
											<ColorControl
												label="accent"
												value={selectedTheme.styles[mode].accent}
												onChange={(v) => updateColor("accent", v)}
											/>
											<ColorControl
												label="accent-fg"
												value={selectedTheme.styles[mode]["accent-foreground"]}
												onChange={(v) => updateColor("accent-foreground", v)}
											/>
											<ColorControl
												label="muted"
												value={selectedTheme.styles[mode].muted}
												onChange={(v) => updateColor("muted", v)}
											/>
											<ColorControl
												label="muted-fg"
												value={selectedTheme.styles[mode]["muted-foreground"]}
												onChange={(v) => updateColor("muted-foreground", v)}
											/>
										</ColorSection>

										<ColorSection title="Borders & Input">
											<ColorControl
												label="border"
												value={selectedTheme.styles[mode].border}
												onChange={(v) => updateColor("border", v)}
											/>
											<ColorControl
												label="input"
												value={selectedTheme.styles[mode].input}
												onChange={(v) => updateColor("input", v)}
											/>
											<ColorControl
												label="ring"
												value={selectedTheme.styles[mode].ring}
												onChange={(v) => updateColor("ring", v)}
											/>
										</ColorSection>

										<ColorSection title="Destructive">
											<ColorControl
												label="destructive"
												value={selectedTheme.styles[mode].destructive}
												onChange={(v) => updateColor("destructive", v)}
											/>
											<ColorControl
												label="destructive-fg"
												value={
													selectedTheme.styles[mode]["destructive-foreground"]
												}
												onChange={(v) =>
													updateColor("destructive-foreground", v)
												}
											/>
										</ColorSection>

										<ColorSection title="Chart Colors">
											<ColorControl
												label="chart-1"
												value={selectedTheme.styles[mode]["chart-1"] || "oklch(0.646 0.222 41.116)"}
												onChange={(v) => updateColor("chart-1", v)}
											/>
											<ColorControl
												label="chart-2"
												value={selectedTheme.styles[mode]["chart-2"] || "oklch(0.6 0.118 184.704)"}
												onChange={(v) => updateColor("chart-2", v)}
											/>
											<ColorControl
												label="chart-3"
												value={selectedTheme.styles[mode]["chart-3"] || "oklch(0.398 0.07 227.392)"}
												onChange={(v) => updateColor("chart-3", v)}
											/>
											<ColorControl
												label="chart-4"
												value={selectedTheme.styles[mode]["chart-4"] || "oklch(0.828 0.189 84.429)"}
												onChange={(v) => updateColor("chart-4", v)}
											/>
											<ColorControl
												label="chart-5"
												value={selectedTheme.styles[mode]["chart-5"] || "oklch(0.769 0.188 70.08)"}
												onChange={(v) => updateColor("chart-5", v)}
											/>
										</ColorSection>

										<ColorSection title="Sidebar Colors">
											<ColorControl
												label="sidebar"
												value={selectedTheme.styles[mode].sidebar || selectedTheme.styles[mode].background}
												onChange={(v) => updateColor("sidebar", v)}
											/>
											<ColorControl
												label="sidebar-fg"
												value={selectedTheme.styles[mode]["sidebar-foreground"] || selectedTheme.styles[mode].foreground}
												onChange={(v) => updateColor("sidebar-foreground", v)}
											/>
											<ColorControl
												label="sidebar-primary"
												value={selectedTheme.styles[mode]["sidebar-primary"] || selectedTheme.styles[mode].primary}
												onChange={(v) => updateColor("sidebar-primary", v)}
											/>
											<ColorControl
												label="sidebar-primary-fg"
												value={selectedTheme.styles[mode]["sidebar-primary-foreground"] || selectedTheme.styles[mode]["primary-foreground"]}
												onChange={(v) => updateColor("sidebar-primary-foreground", v)}
											/>
											<ColorControl
												label="sidebar-accent"
												value={selectedTheme.styles[mode]["sidebar-accent"] || selectedTheme.styles[mode].accent}
												onChange={(v) => updateColor("sidebar-accent", v)}
											/>
											<ColorControl
												label="sidebar-accent-fg"
												value={selectedTheme.styles[mode]["sidebar-accent-foreground"] || selectedTheme.styles[mode]["accent-foreground"]}
												onChange={(v) => updateColor("sidebar-accent-foreground", v)}
											/>
											<ColorControl
												label="sidebar-border"
												value={selectedTheme.styles[mode]["sidebar-border"] || selectedTheme.styles[mode].border}
												onChange={(v) => updateColor("sidebar-border", v)}
											/>
											<ColorControl
												label="sidebar-ring"
												value={selectedTheme.styles[mode]["sidebar-ring"] || selectedTheme.styles[mode].ring}
												onChange={(v) => updateColor("sidebar-ring", v)}
											/>
										</ColorSection>
									</div>
								)}

								{/* Typography Sub-tab */}
								{editorSubTab === "typography" && (
									<div className="space-y-4">
										{/* Font Families */}
										<div className="rounded-lg border border-border p-3">
											<div className="mb-3 text-xs font-medium">
												Font Families
											</div>
											<div className="space-y-3">
												<div>
													<label className="mb-1 block text-[10px] text-muted-foreground">
														Sans-Serif (--font-sans)
													</label>
													<input
														type="text"
														value={
															selectedTheme.styles[mode]["font-sans"] || ""
														}
														onChange={(e) =>
															updateColor("font-sans", e.target.value)
														}
														placeholder="Inter, system-ui, sans-serif"
														className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
													/>
												</div>
												<div>
													<label className="mb-1 block text-[10px] text-muted-foreground">
														Serif (--font-serif)
													</label>
													<input
														type="text"
														value={
															selectedTheme.styles[mode]["font-serif"] || ""
														}
														onChange={(e) =>
															updateColor("font-serif", e.target.value)
														}
														placeholder="Georgia, serif"
														className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
													/>
												</div>
												<div>
													<label className="mb-1 block text-[10px] text-muted-foreground">
														Monospace (--font-mono)
													</label>
													<input
														type="text"
														value={
															selectedTheme.styles[mode]["font-mono"] || ""
														}
														onChange={(e) =>
															updateColor("font-mono", e.target.value)
														}
														placeholder="JetBrains Mono, monospace"
														className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
													/>
												</div>
											</div>
										</div>

										{/* Letter Spacing */}
										<div className="rounded-lg border border-border p-3">
											<div className="mb-2 flex items-center justify-between">
												<span className="text-xs font-medium">
													Letter Spacing
												</span>
												<span className="font-mono text-xs text-muted-foreground">
													{selectedTheme.styles[mode]["letter-spacing"] ||
														"0em"}
												</span>
											</div>
											<Slider
												value={[
													parseFloat(
														selectedTheme.styles[mode][
															"letter-spacing"
														]?.replace("em", "") || "0",
													),
												]}
												min={-0.05}
												max={0.2}
												step={0.01}
												onValueChange={([v]) =>
													updateColor("letter-spacing", `${v}em`)
												}
											/>
										</div>

										{/* Spacing */}
										<div className="rounded-lg border border-border p-3">
											<div className="mb-2 flex items-center justify-between">
												<span className="text-xs font-medium">
													Base Spacing
												</span>
												<span className="font-mono text-xs text-muted-foreground">
													{selectedTheme.styles[mode].spacing || "0.25rem"}
												</span>
											</div>
											<Slider
												value={[
													parseFloat(
														selectedTheme.styles[mode].spacing?.replace(
															"rem",
															"",
														) || "0.25",
													),
												]}
												min={0.125}
												max={0.5}
												step={0.025}
												onValueChange={([v]) =>
													updateColor("spacing", `${v}rem`)
												}
											/>
										</div>

										<p className="text-[10px] text-muted-foreground">
											Tip: Font families must be installed/imported in your
											project to work.
										</p>
									</div>
								)}

								{/* Other Sub-tab */}
								{editorSubTab === "other" && (
									<div className="space-y-4">
										{/* Radius */}
										<div className="rounded-lg border border-border p-3">
											<div className="mb-2 flex items-center justify-between">
												<span className="text-xs font-medium">
													Border Radius
												</span>
												<span className="font-mono text-xs text-muted-foreground">
													{selectedTheme.styles[mode].radius}
												</span>
											</div>
											<Slider
												value={[
													parseFloat(selectedTheme.styles[mode].radius) || 0.5,
												]}
												min={0}
												max={2}
												step={0.125}
												onValueChange={([v]) =>
													updateColor("radius", `${v}rem`)
												}
											/>
										</div>

										{/* Shadow Controls */}
										<div className="rounded-lg border border-border p-3">
											<div className="mb-3 text-xs font-medium">Shadow</div>
											<div className="space-y-3">
												<ColorControl
													label="shadow-color"
													value={
														selectedTheme.styles[mode]["shadow-color"] ||
														"oklch(0 0 0)"
													}
													onChange={(v) => updateColor("shadow-color", v)}
												/>
												<div>
													<div className="mb-1.5 flex items-center justify-between">
														<span className="text-[10px] text-muted-foreground">
															Opacity
														</span>
														<span className="font-mono text-[10px] text-muted-foreground">
															{selectedTheme.styles[mode]["shadow-opacity"] ||
																"0.1"}
														</span>
													</div>
													<Slider
														value={[
															parseFloat(
																selectedTheme.styles[mode]["shadow-opacity"] ||
																	"0.1",
															),
														]}
														min={0}
														max={1}
														step={0.05}
														onValueChange={([v]) =>
															updateColor("shadow-opacity", v.toString())
														}
													/>
												</div>
												<div>
													<div className="mb-1.5 flex items-center justify-between">
														<span className="text-[10px] text-muted-foreground">
															Blur
														</span>
														<span className="font-mono text-[10px] text-muted-foreground">
															{selectedTheme.styles[mode]["shadow-blur"] ||
																"8px"}
														</span>
													</div>
													<Slider
														value={[
															parseFloat(
																selectedTheme.styles[mode][
																	"shadow-blur"
																]?.replace("px", "") || "8",
															),
														]}
														min={0}
														max={50}
														step={1}
														onValueChange={([v]) =>
															updateColor("shadow-blur", `${v}px`)
														}
													/>
												</div>
												<div>
													<div className="mb-1.5 flex items-center justify-between">
														<span className="text-[10px] text-muted-foreground">
															Spread
														</span>
														<span className="font-mono text-[10px] text-muted-foreground">
															{selectedTheme.styles[mode]["shadow-spread"] ||
																"0px"}
														</span>
													</div>
													<Slider
														value={[
															parseFloat(
																selectedTheme.styles[mode][
																	"shadow-spread"
																]?.replace("px", "") || "0",
															),
														]}
														min={-10}
														max={20}
														step={1}
														onValueChange={([v]) =>
															updateColor("shadow-spread", `${v}px`)
														}
													/>
												</div>
												<div className="grid grid-cols-2 gap-2">
													<div>
														<div className="mb-1.5 flex items-center justify-between">
															<span className="text-[10px] text-muted-foreground">
																Offset X
															</span>
															<span className="font-mono text-[10px] text-muted-foreground">
																{selectedTheme.styles[mode][
																	"shadow-offset-x"
																] || "0px"}
															</span>
														</div>
														<Slider
															value={[
																parseFloat(
																	selectedTheme.styles[mode][
																		"shadow-offset-x"
																	]?.replace("px", "") || "0",
																),
															]}
															min={-20}
															max={20}
															step={1}
															onValueChange={([v]) =>
																updateColor("shadow-offset-x", `${v}px`)
															}
														/>
													</div>
													<div>
														<div className="mb-1.5 flex items-center justify-between">
															<span className="text-[10px] text-muted-foreground">
																Offset Y
															</span>
															<span className="font-mono text-[10px] text-muted-foreground">
																{selectedTheme.styles[mode][
																	"shadow-offset-y"
																] || "4px"}
															</span>
														</div>
														<Slider
															value={[
																parseFloat(
																	selectedTheme.styles[mode][
																		"shadow-offset-y"
																	]?.replace("px", "") || "4",
																),
															]}
															min={-20}
															max={20}
															step={1}
															onValueChange={([v]) =>
																updateColor("shadow-offset-y", `${v}px`)
															}
														/>
													</div>
												</div>
											</div>
										</div>

										{/* Mode indicator */}
										<div className="rounded-lg border border-border p-3">
											<div className="flex items-center justify-between">
												<span className="text-xs font-medium">
													Editing Mode
												</span>
												<Badge variant="secondary" className="text-xs">
													{mode === "light" ? (
														<>
															<Sun className="mr-1 h-3 w-3" /> Light
														</>
													) : (
														<>
															<Moon className="mr-1 h-3 w-3" /> Dark
														</>
													)}
												</Badge>
											</div>
											<p className="mt-2 text-[10px] text-muted-foreground">
												Use the mode toggle in the preview panel to switch
												between light and dark modes.
											</p>
										</div>
									</div>
								)}
							</div>
						)}

						{/* Paste Tab */}
						{activeTab === "paste" && (
							<div className="space-y-3">
								<p className="text-xs text-muted-foreground">
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
								</p>
								<textarea
									value={customInput}
									onChange={(e) => handleInputChange(e.target.value)}
									placeholder={`:root {\n  --primary: oklch(0.6 0.15 145);\n  /* ... */\n}`}
									className="h-40 w-full rounded-lg border border-border bg-background p-3 font-mono text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
								/>
								{validationError && (
									<div className="flex items-center gap-2 text-xs text-destructive">
										<AlertCircle className="h-3 w-3" />
										{validationError}
									</div>
								)}
								{customInput && !validationError && (
									<div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
										<div className="flex items-center gap-2 text-xs font-medium text-green-600">
											<Check className="h-3 w-3" />
											Theme imported successfully
											{importSource && (
												<span className="text-muted-foreground">
													from {importSource}
												</span>
											)}
										</div>
										<div className="mt-2 flex items-center gap-2">
											<div className="flex h-5 overflow-hidden rounded-md border border-green-500/30">
												{[
													selectedTheme.styles[mode].primary,
													selectedTheme.styles[mode].secondary,
													selectedTheme.styles[mode].accent,
													selectedTheme.styles[mode].muted,
													selectedTheme.styles[mode].background,
												].map((color, i) => (
													<div
														key={i}
														className="w-5"
														style={{ backgroundColor: color }}
													/>
												))}
											</div>
											<span className="text-xs text-muted-foreground">
												{Object.keys(selectedTheme.styles[mode]).length}{" "}
												properties
											</span>
										</div>
									</div>
								)}
							</div>
						)}

						{/* Drafts Tab */}
						{activeTab === "drafts" && (
							<div className="space-y-2">
								{drafts.length === 0 ? (
									<div className="py-8 text-center text-sm text-muted-foreground">
										<FolderOpen className="mx-auto mb-2 h-8 w-8 opacity-50" />
										<p>No saved drafts</p>
										<p className="mt-1 text-xs">
											Save a theme to work on it later
										</p>
									</div>
								) : (
									drafts.map((draft) => (
										<div
											key={draft.id}
											className="flex items-center gap-2 rounded-lg border border-border p-3"
										>
											<button
												onClick={(e) => handleLoadDraft(draft, e)}
												className="flex flex-1 items-center gap-2 text-left hover:text-primary"
											>
												<div className="flex h-4 w-8 overflow-hidden rounded">
													{[
														draft.theme.styles[mode].primary,
														draft.theme.styles[mode].secondary,
													].map((color, i) => (
														<div
															key={i}
															className="flex-1"
															style={{ backgroundColor: color }}
														/>
													))}
												</div>
												<div className="flex-1 min-w-0">
													<p className="truncate text-sm font-medium">
														{draft.theme.name}
													</p>
													<p className="text-xs text-muted-foreground">
														{new Date(draft.savedAt).toLocaleDateString()}
													</p>
												</div>
											</button>
											<button
												onClick={() => handleDeleteDraft(draft.id)}
												className="p-1 text-muted-foreground hover:text-destructive"
												title="Delete draft"
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</div>
									))
								)}
							</div>
						)}

						{/* Theme name input */}
						<div className="mt-4">
							<label className="mb-1 block text-xs font-medium text-muted-foreground">
								Theme Name
							</label>
							<input
								type="text"
								value={customName}
								onChange={(e) => setCustomName(e.target.value)}
								placeholder={selectedTheme.name}
								className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							/>
						</div>
					</div>
					{/* Close scrollable area */}
				</div>
				{/* Close left panel */}

				{/* Right Panel: Preview (scrollable) */}
				<div className="hidden flex-1 flex-col overflow-hidden lg:flex">
					{/* Toolbar */}
					<div className="flex shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 py-2 backdrop-blur">
						<div className="flex items-center gap-2">
							<span className="text-sm font-medium">Preview</span>
							{/* Mode Toggle */}
							<button
								onClick={(e) => toggleMode(e)}
								className="flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs transition-colors hover:bg-muted"
							>
								{mode === "light" ? (
									<>
										<Sun className="h-3 w-3" />
										Light
									</>
								) : (
									<>
										<Moon className="h-3 w-3" />
										Dark
									</>
								)}
							</button>
						</div>
						{/* Export Button */}
						<ExportModal
							theme={selectedTheme}
							trigger={
								<button
									type="button"
									className="flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs transition-colors hover:bg-muted"
								>
									<Copy className="h-3 w-3" />
									Export
								</button>
							}
						/>
					</div>
					{/* Scrollable Preview Area */}
					<div className="flex-1 overflow-y-auto bg-background">
						<ThemePreviewPanel />
					</div>
				</div>
			</div>
			{/* Close main content area */}

			{/* Bottom Bar: Mint Action */}
			<div className="flex shrink-0 items-center justify-between border-t border-border bg-muted/30 px-4 py-3">
				<div className="flex items-center gap-3">
					{/* Save Draft Button */}
					<button
						onClick={handleSaveDraft}
						className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm transition-colors hover:bg-muted"
					>
						{savedNotice ? (
							<>
								<Check className="h-4 w-4 text-green-500" />
								Saved!
							</>
						) : (
							<>
								<Save className="h-4 w-4" />
								Save Draft
							</>
						)}
					</button>

					{/* Wallet info */}
					{isConnected && balance && (
						<div className="hidden sm:block">
							<p className="text-sm font-medium">
								{profile?.displayName && (
									<span className="text-primary">{profile.displayName}</span>
								)}
								{profile?.displayName && " · "}
								{balance.bsv.toFixed(8)} BSV
							</p>
							<p className="text-xs text-muted-foreground">
								Inscription cost: ~0.00001 BSV
							</p>
						</div>
					)}
				</div>

				{walletError && (
					<div className="flex items-center gap-2 text-sm text-destructive">
						<AlertCircle className="h-4 w-4" />
						{walletError}
					</div>
				)}

				<Button
					size="lg"
					disabled={!canMint}
					onClick={isConnected ? handleMint : connect}
					className="gap-2"
				>
					{isInscribing ? (
						<>
							<Loader2 className="h-5 w-5 animate-spin" />
							Inscribing...
						</>
					) : isConnected ? (
						<>
							<Sparkles className="h-5 w-5" />
							Inscribe Theme
						</>
					) : status === "connecting" ? (
						<>
							<Loader2 className="h-5 w-5 animate-spin" />
							Connecting...
						</>
					) : (
						<>
							<Sparkles className="h-5 w-5" />
							Connect to Inscribe
						</>
					)}
				</Button>
			</div>
		</div>
	);
}
