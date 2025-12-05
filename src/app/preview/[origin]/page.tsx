"use client";

import {
	type ThemeStyleProps,
	type ThemeToken,
	validateThemeToken,
} from "@theme-token/sdk";
import { AnimatePresence, motion } from "framer-motion";
import {
	AlertCircle,
	ArrowLeft,
	AudioWaveform,
	Bot,
	Check,
	Copy,
	CreditCard,
	ExternalLink,
	Grid3X3,
	LayoutDashboard,
	Loader2,
	Moon,
	MousePointerClick,
	Music,
	Palette,
	Play,
	SkipBack,
	SkipForward,
	Sparkles,
	Sun,
	Type,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { AiDemo } from "@/components/preview/ai-demo";
import { AnimatedThemeStripes } from "@/components/preview/animated-theme-stripes";
import { AudioDemo } from "@/components/preview/audio-demo";
import { ButtonsDemo } from "@/components/preview/buttons-demo";
import { CardsDemo } from "@/components/preview/cards-demo";
import { ColorsDemo } from "@/components/preview/colors-demo";
import { FormsDemo } from "@/components/preview/forms-demo";
import { TypographyDemo } from "@/components/preview/typography-demo";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isOnChainFont, loadThemeFonts } from "@/lib/font-loader";
import { UnifiedRemixDialog } from "@/components/market/unified-remix-dialog";

interface Props {
	params: Promise<{ origin: string }>;
}

// Extract Google Font name from CSS font-family value
function extractGoogleFontName(fontFamily: string): string | null {
	// Get the first font in the stack (before the comma)
	const firstFont = fontFamily.split(",")[0].trim();
	// Skip generic families
	const genericFamilies = [
		"sans-serif",
		"serif",
		"monospace",
		"ui-sans-serif",
		"ui-serif",
		"ui-monospace",
		"system-ui",
	];
	if (genericFamilies.includes(firstFont.toLowerCase())) return null;
	return firstFont;
}

// Load Google Font dynamically
function loadGoogleFont(fontName: string): void {
	const linkId = `google-font-${fontName.replace(/\s+/g, "-").toLowerCase()}`;
	if (document.getElementById(linkId)) return; // Already loaded

	const link = document.createElement("link");
	link.id = linkId;
	link.rel = "stylesheet";
	link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700&display=swap`;
	document.head.appendChild(link);
}

// Apply theme styles to a container element
function applyStylesToElement(element: HTMLElement, styles: ThemeStyleProps) {
	Object.entries(styles).forEach(([key, value]) => {
		if (typeof value === "string") {
			element.style.setProperty(`--${key}`, value);
		}
	});

	// Apply font-family directly to the element for it to take effect
	if (styles["font-sans"]) {
		element.style.fontFamily = styles["font-sans"];
	}
}

// Calculate max radius for circular reveal animation
function getMaxRadius(x: number, y: number): number {
	const right = window.innerWidth - x;
	const bottom = window.innerHeight - y;
	return Math.hypot(Math.max(x, right), Math.max(y, bottom));
}

// Creative animations for view transitions
type AnimationConfig = {
	name: string;
	keyframes: { clipPath: string[] };
	options: { duration: number; easing: string };
};

function getCreativeAnimations(
	x: number,
	y: number,
	maxRadius: number,
): AnimationConfig[] {
	const createStarPolygon = (
		points: number,
		outerRadius: number,
		innerRadius: number = 0,
	): string => {
		const angleStep = (Math.PI * 2) / (points * 2);
		const path: string[] = [];
		for (let i = 0; i < points * 2; i++) {
			const radius = i % 2 === 0 ? outerRadius : innerRadius;
			const angle = i * angleStep - Math.PI / 2;
			path.push(
				`${x + radius * Math.cos(angle)}px ${y + radius * Math.sin(angle)}px`,
			);
		}
		return `polygon(${path.join(", ")})`;
	};

	return [
		{
			name: "Circle",
			keyframes: {
				clipPath: [
					`circle(0px at ${x}px ${y}px)`,
					`circle(${maxRadius}px at ${x}px ${y}px)`,
				],
			},
			options: { duration: 500, easing: "ease-in-out" },
		},
		{
			name: "Diamond",
			keyframes: {
				clipPath: [
					`polygon(${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px)`,
					`polygon(${x}px ${y - maxRadius}px, ${x + maxRadius}px ${y}px, ${x}px ${y + maxRadius}px, ${x - maxRadius}px ${y}px)`,
				],
			},
			options: { duration: 600, easing: "cubic-bezier(0.25, 1, 0.5, 1)" },
		},
		{
			name: "Hexagon",
			keyframes: {
				clipPath: [
					`polygon(${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px)`,
					`polygon(${x + maxRadius}px ${y}px, ${x + maxRadius * 0.5}px ${y + maxRadius * 0.866}px, ${x - maxRadius * 0.5}px ${y + maxRadius * 0.866}px, ${x - maxRadius}px ${y}px, ${x - maxRadius * 0.5}px ${y - maxRadius * 0.866}px, ${x + maxRadius * 0.5}px ${y - maxRadius * 0.866}px)`,
				],
			},
			options: { duration: 550, easing: "ease-in-out" },
		},
		{
			name: "Starburst",
			keyframes: {
				clipPath: [
					createStarPolygon(8, 0, 0),
					createStarPolygon(8, maxRadius * 1.2, maxRadius * 0.4),
					createStarPolygon(8, maxRadius, maxRadius),
				],
			},
			options: {
				duration: 700,
				easing: "cubic-bezier(0.68, -0.55, 0.27, 1.55)",
			},
		},
		{
			name: "Ellipse",
			keyframes: {
				clipPath: [
					`ellipse(0px 0px at ${x}px ${y}px)`,
					`ellipse(${maxRadius * 0.5}px ${maxRadius}px at ${x}px ${y}px)`,
					`ellipse(${maxRadius}px ${maxRadius}px at ${x}px ${y}px)`,
				],
			},
			options: { duration: 600, easing: "ease-out" },
		},
		{
			name: "Horizontal",
			keyframes: {
				clipPath: [
					`inset(${y}px 0px ${window.innerHeight - y}px 0px)`,
					`inset(0px 0px 0px 0px)`,
				],
			},
			options: { duration: 450, easing: "ease-in-out" },
		},
	];
}

// Start view transition with random creative animation
async function startViewTransition(
	callback: () => void,
	clickX?: number,
	clickY?: number,
): Promise<void> {
	if ("startViewTransition" in document) {
		const x = clickX ?? window.innerWidth / 2;
		const y = clickY ?? window.innerHeight / 2;
		const maxRadius = getMaxRadius(x, y);
		const animations = getCreativeAnimations(x, y, maxRadius);
		const selected = animations[Math.floor(Math.random() * animations.length)];

		const transition = (
			document as Document & {
				startViewTransition: (cb: () => void) => {
					ready: Promise<void>;
					finished: Promise<void>;
				};
			}
		).startViewTransition(callback);

		await transition.ready;
		document.documentElement.animate(selected.keyframes, {
			...selected.options,
			pseudoElement: "::view-transition-new(root)",
		});
	} else {
		callback();
	}
}

const tabs = [
	{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ id: "audio", label: "Audio", icon: AudioWaveform },
	{ id: "forms", label: "Inputs", icon: Grid3X3 },
	{ id: "buttons", label: "Buttons", icon: MousePointerClick },
	{ id: "cards", label: "Cards", icon: CreditCard },
	{ id: "typography", label: "Type", icon: Type },
	{ id: "colors", label: "Colors", icon: Palette },
	{ id: "ai", label: "AI", icon: Bot },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function PreviewPage({ params }: Props) {
	const { origin } = use(params);
	const router = useRouter();
	const searchParams = useSearchParams();
	const { mode: globalMode } = useTheme();
	const [theme, setTheme] = useState<ThemeToken | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");
	const [copied, setCopied] = useState(false);
	const [copiedOrigin, setCopiedOrigin] = useState(false);
	const [showRemixDialog, setShowRemixDialog] = useState(false);
	const initialTab = (() => {
		const tabParam = searchParams.get("tab");
		return tabs.some((t) => t.id === tabParam) ? (tabParam as TabId) : "dashboard";
	})();
	const [activeTab, setActiveTab] = useState<TabId>(initialTab);
	const containerRef = useRef<HTMLDivElement>(null);

	const installCommand = `bunx shadcn@latest add https://themetoken.dev/r/themes/${origin}`;

	const copyCommand = useCallback(() => {
		navigator.clipboard.writeText(installCommand);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [installCommand]);

	const copyOrigin = useCallback(() => {
		navigator.clipboard.writeText(origin);
		setCopiedOrigin(true);
		setTimeout(() => setCopiedOrigin(false), 2000);
	}, [origin]);

	// Sync preview mode with global mode initially
	useEffect(() => {
		setPreviewMode(globalMode);
	}, []);

	// Keep tab in sync with URL (for refresh/back/forward)
	useEffect(() => {
		const tabParam = searchParams.get("tab");
		const nextTab = tabs.some((t) => t.id === tabParam) ? (tabParam as TabId) : "dashboard";
		if (nextTab !== activeTab) {
			setActiveTab(nextTab);
		}
	}, [searchParams, activeTab]);

	const handleTabChange = useCallback(
		(tabId: TabId) => {
			if (tabId === activeTab) return;
			setActiveTab(tabId);
			const params = new URLSearchParams(searchParams.toString());
			params.set("tab", tabId);
			router.replace(`?${params.toString()}`, { scroll: false });
		},
		[activeTab, router, searchParams],
	);

	// Fetch theme data
	useEffect(() => {
		async function fetchTheme() {
			setIsLoading(true);
			setError(null);

			try {
				const response = await fetch(`https://ordfs.network/${origin}`);
				if (!response.ok) {
					throw new Error("Theme not found");
				}

				const json = await response.json();
				const result = validateThemeToken(json);

				if (!result.valid) {
					throw new Error("Invalid theme format");
				}

				setTheme(result.theme);

				// Add to themes cache so it appears on homepage
				// Fire and forget - non-blocking
				fetch("/api/themes/cache", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						txid: origin.replace(/_\d+$/, ""),
						theme: result.theme,
					}),
				}).catch(() => {});
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load theme");
			} finally {
				setIsLoading(false);
			}
		}

		fetchTheme();
	}, [origin]);

	// Load fonts when theme changes (Google Fonts and on-chain fonts)
	useEffect(() => {
		if (!theme) return;

		const styles = theme.styles[previewMode];
		const fontProps = ["font-sans", "font-serif", "font-mono"] as const;

		// Check if any fonts are on-chain
		const hasOnChainFonts = fontProps.some(
			(prop) => styles[prop] && isOnChainFont(styles[prop] as string),
		);

		if (hasOnChainFonts) {
			// Load on-chain fonts
			loadThemeFonts(styles as Record<string, string>).then((resolved) => {
				console.log("[Preview] Loaded on-chain fonts:", resolved);
			});
		}

		// Also load Google Fonts for any non-on-chain fonts
		fontProps.forEach((prop) => {
			const fontValue = styles[prop];
			if (fontValue && !isOnChainFont(fontValue as string)) {
				const fontName = extractGoogleFontName(fontValue as string);
				if (fontName) {
					loadGoogleFont(fontName);
				}
			}
		});
	}, [theme, previewMode]);

	// Apply theme styles to the preview container
	useEffect(() => {
		if (!theme || !containerRef.current) return;
		applyStylesToElement(containerRef.current, theme.styles[previewMode]);
	}, [theme, previewMode]);

	const handleBack = useCallback(() => {
		router.back();
	}, [router]);

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="flex items-center gap-3 text-muted-foreground">
					<Loader2 className="h-6 w-6 animate-spin" />
					<span>Loading theme...</span>
				</div>
			</div>
		);
	}

	if (error || !theme) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
					<h1 className="mb-2 text-xl font-semibold">Theme Not Found</h1>
					<p className="mb-4 text-muted-foreground">
						{error || "Unable to load theme"}
					</p>
					<Button asChild variant="outline">
						<Link href="/market/browse">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Market
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			{/* Preview Container - Scoped Theme */}
			<div
				ref={containerRef}
				className={`relative z-0 min-h-screen ${previewMode === "dark" ? "dark" : ""}`}
				style={{
					backgroundColor: "var(--background)",
					color: "var(--foreground)",
				}}
			>
				{/* Compact Header */}
				<header
					className="sticky top-0 z-50 border-b backdrop-blur"
					style={{
						backgroundColor: "color-mix(in oklch, var(--background) 95%, transparent)",
						borderColor: "var(--border)",
					}}
				>
					<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
						<div className="flex items-center gap-4">
							<Button variant="ghost" size="sm" onClick={handleBack}>
								<ArrowLeft className="mr-2 h-4 w-4" />
								Back
							</Button>
						</div>

						<div className="flex items-center gap-3">
							{/* Mode Toggle */}
							<div
								className="flex items-center rounded-lg p-1"
								style={{ backgroundColor: "var(--muted)" }}
							>
								<button
									type="button"
									onClick={(e) => {
										if (previewMode !== "light") {
											startViewTransition(
												() => setPreviewMode("light"),
												e.clientX,
												e.clientY,
											);
										}
									}}
									className="rounded-md p-2 transition-colors"
									style={{
										backgroundColor:
											previewMode === "light" ? "var(--primary)" : "transparent",
										color:
											previewMode === "light"
												? "var(--primary-foreground)"
												: "var(--muted-foreground)",
									}}
								>
									<Sun className="h-4 w-4" />
								</button>
								<button
									type="button"
									onClick={(e) => {
										if (previewMode !== "dark") {
											startViewTransition(
												() => setPreviewMode("dark"),
												e.clientX,
												e.clientY,
											);
										}
									}}
									className="rounded-md p-2 transition-colors"
									style={{
										backgroundColor:
											previewMode === "dark" ? "var(--primary)" : "transparent",
										color:
											previewMode === "dark"
												? "var(--primary-foreground)"
												: "var(--muted-foreground)",
									}}
								>
									<Moon className="h-4 w-4" />
								</button>
							</div>

							<Button asChild size="sm" variant="outline">
								<a
									href={`https://1sat.market/outpoint/${origin}`}
									target="_blank"
									rel="noopener noreferrer"
								>
									<ExternalLink className="mr-2 h-4 w-4" />
									On-chain
								</a>
							</Button>

							<Button size="sm" onClick={() => setShowRemixDialog(true)}>
								<Sparkles className="mr-2 h-4 w-4" />
								Remix
							</Button>
						</div>
					</div>
				</header>

				<div className="mx-auto max-w-7xl px-6 py-6">
					{/* Header Section */}
					<div className="mb-4">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<div className="flex items-center gap-3 mb-1">
									<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
										{theme.name}
									</h1>
									<Badge
										variant="outline"
										className="font-mono text-[10px] uppercase tracking-widest"
										style={{
											borderColor: "color-mix(in oklch, var(--primary) 30%, transparent)",
											color: "var(--primary)",
											backgroundColor: "color-mix(in oklch, var(--primary) 5%, transparent)",
										}}
									>
										Inscribed
									</Badge>
								</div>
								{theme.author && (
									<p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
										by{" "}
										<span style={{ color: "var(--foreground)" }}>
											{theme.author}
										</span>
										<span className="mx-2" style={{ color: "var(--border)" }}>/</span>
										<button
											type="button"
											onClick={copyOrigin}
											className="inline-flex items-center gap-1 font-mono text-xs hover:text-foreground transition-colors group"
											title="Copy full origin TXID"
										>
											<span>{origin.slice(0, 8)}...</span>
											{copiedOrigin ? (
												<Check className="h-3 w-3 text-green-500" />
											) : (
												<Copy className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
											)}
										</button>
									</p>
								)}
							</div>

							{/* CLI Command */}
							<button
								type="button"
								onClick={copyCommand}
								className="group flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-xs transition-colors"
								style={{
									backgroundColor: "color-mix(in oklch, var(--muted) 50%, transparent)",
									borderWidth: "1px",
									borderColor: "var(--border)",
								}}
							>
								<span style={{ color: "var(--primary)" }}>$</span>
								<span className="hidden sm:inline" style={{ color: "var(--muted-foreground)" }}>
									bunx shadcn add .../{origin.slice(0, 8)}
								</span>
								<span className="sm:hidden" style={{ color: "var(--muted-foreground)" }}>
									Copy install
								</span>
								{copied ? (
									<Check className="ml-1 h-3 w-3 text-green-500" />
								) : (
									<Copy className="ml-1 h-3 w-3 opacity-50 group-hover:opacity-100" style={{ color: "var(--muted-foreground)" }} />
								)}
							</button>
						</div>
					</div>

					{/* Custom Tab Navigation - Compact & Scrolling */}
					<div className="mb-6 flex overflow-x-auto pb-1 scrollbar-none">
						<div className="flex gap-1">
							{tabs.map((tab) => {
								const Icon = tab.icon;
								const isActive = activeTab === tab.id;
								return (
									<button
										key={tab.id}
										onClick={() => handleTabChange(tab.id)}
										className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
											isActive
												? "text-foreground"
												: "text-muted-foreground hover:text-foreground/80"
										}`}
									>
										{isActive && (
											<motion.div
												layoutId="preview-active-tab"
												className="absolute inset-0 rounded-full"
												style={{ backgroundColor: "var(--muted)" }}
												transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
											/>
										)}
										<span className="relative z-10 flex items-center gap-1.5">
											<Icon className="h-3.5 w-3.5" />
											{tab.label}
										</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* Tab Content */}
					<div className="min-h-[500px]">
						{activeTab === "dashboard" && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.2 }}
							>
								<div className="space-y-6">
									<AnimatedThemeStripes />
									
									<div className="space-y-6">
										{/* Desktop Mockup - Full Width */}
										<div className="overflow-hidden flex flex-col shadow-2xl rounded-xl border bg-background">
											{/* Mock Browser Chrome */}
											<div className="h-10 flex items-center px-4 gap-3 select-none border-b bg-muted/40">
												<div className="flex gap-1.5">
													<div className="w-3 h-3 rounded-full bg-destructive/60" />
													<div className="w-3 h-3 rounded-full bg-primary/60" />
													<div className="w-3 h-3 rounded-full bg-accent/60" />
												</div>
												<div className="ml-2 flex-1 max-w-sm px-3 py-1 text-xs flex items-center gap-2 rounded-md bg-background border text-muted-foreground">
													<div className="w-3 h-3 rounded-full bg-primary/20 flex items-center justify-center">
														<div className="w-1.5 h-1.5 rounded-full bg-primary" />
													</div>
													<span className="opacity-70">app.yourproject.com</span>
												</div>
											</div>

											{/* Dashboard Content */}
											<div className="flex min-h-[450px]">
												{/* Sidebar */}
												<div className="w-52 hidden lg:flex flex-col border-r bg-card/50 p-4 gap-4">
													<div className="flex items-center gap-2 px-2">
														<div className="h-6 w-6 rounded-md bg-primary" />
														<span className="font-bold text-sm">Acme Inc</span>
													</div>
													<div className="space-y-1">
														<Button variant="secondary" size="sm" className="w-full justify-start">
															<LayoutDashboard className="mr-2 h-4 w-4" />
															Dashboard
														</Button>
														<Button variant="ghost" size="sm" className="w-full justify-start">
															<CreditCard className="mr-2 h-4 w-4" />
															Transactions
														</Button>
														<Button variant="ghost" size="sm" className="w-full justify-start">
															<Grid3X3 className="mr-2 h-4 w-4" />
															Integrations
														</Button>
														<Button variant="ghost" size="sm" className="w-full justify-start">
															<Palette className="mr-2 h-4 w-4" />
															Appearance
														</Button>
													</div>
												</div>

												{/* Main Area */}
												<div className="flex-1 flex flex-col bg-muted/10">
													{/* Header */}
													<div className="h-12 border-b bg-background px-4 flex items-center justify-between">
														<h2 className="font-semibold text-sm">Dashboard</h2>
														<div className="flex items-center gap-2">
															<Button variant="outline" size="sm" className="h-7 text-xs">Feedback</Button>
															<Avatar className="h-7 w-7">
																<AvatarImage src="https://github.com/shadcn.png" />
																<AvatarFallback>CN</AvatarFallback>
															</Avatar>
														</div>
													</div>

													<ScrollArea className="flex-1">
														<div className="p-4 space-y-4">
															{/* Stats */}
															<div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
																<Card className="p-0">
																	<CardHeader className="p-3 pb-1">
																		<CardTitle className="text-xs font-medium text-muted-foreground">Total Revenue</CardTitle>
																	</CardHeader>
																	<CardContent className="p-3 pt-0">
																		<div className="text-xl font-bold">$12,345</div>
																		<p className="text-[10px] text-emerald-500 font-medium">+12.5% from last month</p>
																	</CardContent>
																</Card>
																<Card className="p-0">
																	<CardHeader className="p-3 pb-1">
																		<CardTitle className="text-xs font-medium text-muted-foreground">Active Users</CardTitle>
																	</CardHeader>
																	<CardContent className="p-3 pt-0">
																		<div className="text-xl font-bold">+2,350</div>
																		<p className="text-[10px] text-emerald-500 font-medium">+18.2% from last week</p>
																	</CardContent>
																</Card>
																<Card className="p-0 hidden lg:block">
																	<CardHeader className="p-3 pb-1">
																		<CardTitle className="text-xs font-medium text-muted-foreground">Sales</CardTitle>
																	</CardHeader>
																	<CardContent className="p-3 pt-0">
																		<div className="text-xl font-bold">+1,203</div>
																		<p className="text-[10px] text-emerald-500 font-medium">+4.5% from yesterday</p>
																	</CardContent>
																</Card>
															</div>

															{/* Chart + Recent */}
															<div className="grid gap-3 lg:grid-cols-5">
																<Card className="lg:col-span-3 p-0">
																	<CardHeader className="p-3">
																		<CardTitle className="text-sm">Overview</CardTitle>
																	</CardHeader>
																	<CardContent className="p-3 pt-0">
																		<div className="h-[140px] w-full bg-muted/20 rounded-md flex items-end gap-1.5 p-3">
																			{[40, 30, 50, 80, 60, 90, 70, 45, 65].map((h, i) => (
																				<div key={i} className="flex-1 bg-primary/80 hover:bg-primary rounded-t-sm transition-all" style={{ height: `${h}%` }} />
																			))}
																		</div>
																	</CardContent>
																</Card>
																<Card className="lg:col-span-2 p-0">
																	<CardHeader className="p-3">
																		<CardTitle className="text-sm">Recent Sales</CardTitle>
																	</CardHeader>
																	<CardContent className="p-3 pt-0">
																		<div className="space-y-3">
																			{[1, 2, 3].map((i) => (
																				<div key={i} className="flex items-center gap-2">
																					<Avatar className="h-7 w-7">
																						<AvatarImage src={`https://avatar.vercel.sh/${i}.png`} />
																						<AvatarFallback>OM</AvatarFallback>
																					</Avatar>
																					<div className="flex-1 min-w-0">
																						<p className="text-xs font-medium truncate">Olivia Martin</p>
																						<p className="text-[10px] text-muted-foreground truncate">olivia@email.com</p>
																					</div>
																					<div className="text-xs font-bold">+$1,999</div>
																				</div>
																			))}
																		</div>
																	</CardContent>
																</Card>
															</div>
														</div>
													</ScrollArea>
												</div>
											</div>
										</div>

										{/* Mosaic Layout: Phone + Widgets */}
										<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
											{/* Phone Mockup - Compact & Left Aligned */}
											<div className="lg:col-span-4 xl:col-span-3 flex justify-center lg:justify-start">
												<div className="relative w-[260px] rounded-[2.5rem] border-[8px] border-foreground/80 bg-background shadow-xl overflow-hidden">
													{/* Notch */}
													<div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-foreground/80 rounded-b-2xl z-20" />
													
													{/* Screen Content */}
													<div className="flex flex-col h-[500px] bg-background">
														{/* Status Bar */}
														<div className="h-10 flex items-center justify-between px-5 pt-2 select-none">
															<span className="text-[10px] font-semibold">9:41</span>
															<div className="flex gap-1">
																<div className="h-2 w-2 rounded-full bg-foreground" />
																<div className="h-2 w-2 rounded-full bg-foreground" />
															</div>
														</div>

														{/* App Header */}
														<div className="px-4 py-2 flex items-center justify-between">
															<div>
																<span className="text-[10px] text-muted-foreground">Good morning,</span>
																<div className="text-lg font-bold">Alex</div>
															</div>
															<Avatar className="h-8 w-8">
																<AvatarImage src="https://github.com/shadcn.png" />
																<AvatarFallback>AL</AvatarFallback>
															</Avatar>
														</div>

														{/* Body */}
														<ScrollArea className="flex-1 px-4">
															<div className="space-y-4 py-2">
																{/* Balance Card */}
																<div className="rounded-xl bg-primary p-4 text-primary-foreground shadow-lg relative overflow-hidden">
																	<div className="absolute top-0 right-0 p-2 opacity-10">
																		<CreditCard className="w-16 h-16" />
																	</div>
																	<div className="relative z-10">
																		<div className="text-[10px] opacity-80 mb-0.5">Total Balance</div>
																		<div className="text-2xl font-bold mb-2">$14,235</div>
																		<Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px]">+2.5%</Badge>
																	</div>
																</div>

																{/* Quick Actions */}
																<div className="flex justify-between gap-2">
																	{["Send", "Receive", "More"].map((label, i) => (
																		<div key={i} className="flex flex-col items-center gap-1">
																			<Button variant="outline" size="icon" className="h-11 w-11 rounded-xl">
																				<ArrowLeft className={`h-4 w-4 ${i === 1 ? "rotate-180" : i === 2 ? "hidden" : ""}`} />
																				{i === 2 && <Grid3X3 className="h-4 w-4" />}
																			</Button>
																			<span className="text-[10px] font-medium">{label}</span>
																		</div>
																	))}
																</div>

																{/* List */}
																<div className="space-y-2">
																	<div className="flex items-center justify-between">
																		<span className="font-semibold text-xs">Transactions</span>
																		<Button variant="link" size="sm" className="h-auto p-0 text-[10px]">See All</Button>
																	</div>
																	{[1, 2].map(i => (
																		<Card key={i} className="p-2 flex items-center gap-2">
																			<div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
																				<div className="w-3 h-3 rounded-sm bg-muted-foreground/30" />
																			</div>
																			<div className="flex-1 min-w-0">
																				<div className="text-xs font-medium truncate">Dribbble Pro</div>
																				<div className="text-xs text-muted-foreground">Subscription</div>
																			</div>
																			<div className="text-xs font-bold">-$12</div>
																		</Card>
																	))}
																</div>
															</div>
														</ScrollArea>
														
														{/* Bottom Nav */}
														<div className="h-14 border-t bg-background flex items-center justify-around px-2">
															<Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-primary bg-primary/10">
																<LayoutDashboard className="h-4 w-4" />
															</Button>
															<Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground">
																<CreditCard className="h-4 w-4" />
															</Button>
															<Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground">
																<Bot className="h-4 w-4" />
															</Button>
															<Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground">
																<Type className="h-4 w-4" />
															</Button>
														</div>
													</div>
												</div>
											</div>

											{/* Widgets Grid - Tetris Layout */}
											<div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4">
												{/* Top: Music Player */}
												<Card className="p-4 relative overflow-hidden shadow-md w-full">
													<div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
														<AudioWaveform className="w-32 h-32" />
													</div>
													<div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
														<div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 ring-1 ring-border/50">
															<Music className="h-8 w-8" />
														</div>
														<div className="flex-1 min-w-0 text-center sm:text-left">
															<div className="flex items-center justify-center sm:justify-between mb-1">
																<div className="text-base font-semibold truncate">Theme Token Beat</div>
																<Badge variant="outline" className="hidden sm:flex text-[10px] font-mono">NOW PLAYING</Badge>
															</div>
															<div className="text-sm text-muted-foreground truncate mb-3">Lo-Fi Study Mix</div>
															{/* Progress Bar */}
															<div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
																<div className="h-full bg-primary w-1/3 rounded-full" />
															</div>
														</div>
														<div className="flex items-center gap-2">
															<Button variant="ghost" size="icon" className="h-10 w-10">
																<SkipBack className="h-5 w-5" />
															</Button>
															<Button size="icon" className="h-12 w-12 rounded-full shadow-lg hover:scale-105 transition-transform">
																<Play className="h-5 w-5 fill-current ml-0.5" />
															</Button>
															<Button variant="ghost" size="icon" className="h-10 w-10">
																<SkipForward className="h-5 w-5" />
															</Button>
														</div>
													</div>
												</Card>

												{/* Middle: Watch & Status & Controls */}
												<div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4">
													{/* Watch Mockup - Spans 2 Rows */}
													<Card className="md:row-span-2 h-full flex justify-center items-center p-6 relative overflow-hidden shadow-md border">
														<div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-transparent pointer-events-none" />
														<div className="relative w-[140px] h-[170px] rounded-[2rem] border-[6px] border-foreground/80 bg-background shadow-2xl overflow-hidden shrink-0 transform transition-transform hover:scale-105 duration-500">
															<div className="w-full h-full flex flex-col items-center justify-center p-3 relative">
																<div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
																<div className="text-3xl font-bold tracking-tighter relative z-10">10:09</div>
																<div className="text-[10px] text-primary font-medium uppercase tracking-widest mt-1 relative z-10">Tue 12</div>
																<div className="mt-3 flex gap-1.5 relative z-10">
																	<div className="w-6 h-6 rounded-full border-[3px] border-primary/30 border-t-primary" />
																	<div className="w-6 h-6 rounded-full border-[3px] border-accent/30 border-t-accent" />
																	<div className="w-6 h-6 rounded-full border-[3px] border-secondary/30 border-t-secondary" />
																</div>
															</div>
														</div>
													</Card>

													{/* Status Cards */}
													<Card className="p-4 flex flex-row items-center gap-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-primary">
														<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
															<Check className="w-5 h-5" />
														</div>
														<div>
															<div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">System Status</div>
															<div className="text-lg font-bold">Operational</div>
														</div>
													</Card>
													
													{/* Control Card 1 */}
													<Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
														<div className="flex items-center justify-between mb-3">
															<div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
																<Sun className="h-4 w-4" />
															</div>
															<Switch checked id="light-switch" />
														</div>
														<div className="font-bold text-sm">Smart Lighting</div>
														<div className="text-xs text-muted-foreground mt-1">75% Brightness</div>
													</Card>

													{/* AI Status */}
													<Card className="p-4 flex flex-row items-center gap-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-accent">
														<div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent-foreground shrink-0">
															<Bot className="w-5 h-5" />
														</div>
														<div>
															<div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">AI Model</div>
															<div className="text-lg font-bold">Ready v2.4</div>
														</div>
													</Card>

													{/* Control Card 2 */}
													<Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
														<div className="flex items-center justify-between mb-3">
															<div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
																<Sparkles className="h-4 w-4" />
															</div>
															<Switch id="ambiance-switch" />
														</div>
														<div className="font-bold text-sm">Ambiance</div>
														<div className="text-xs text-muted-foreground mt-1">Relax Mode</div>
													</Card>
												</div>
											</div>
										</div>
									</div>
								</div>
							</motion.div>
						)}

						{activeTab === "colors" && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.2 }}
							>
								<ColorsDemo theme={theme} mode={previewMode} />
							</motion.div>
						)}

						{activeTab === "typography" && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.2 }}
							>
								<TypographyDemo theme={theme} mode={previewMode} />
							</motion.div>
						)}

						{activeTab === "buttons" && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.2 }}
							>
								<ButtonsDemo />
							</motion.div>
						)}

						{activeTab === "forms" && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.2 }}
							>
								<FormsDemo />
							</motion.div>
						)}

						{activeTab === "cards" && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.2 }}
							>
								<CardsDemo />
							</motion.div>
						)}

						{activeTab === "audio" && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.2 }}
							>
								<AudioDemo />
							</motion.div>
						)}

						{activeTab === "ai" && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.2 }}
							>
								<AiDemo />
							</motion.div>
						)}
					</div>
				</div>

				{/* Remix Dialog */}
				<UnifiedRemixDialog
					isOpen={showRemixDialog}
					onClose={() => setShowRemixDialog(false)}
					type="theme"
					previousTheme={theme}
					onThemeRemixComplete={(newTheme) => {
						// Navigate to studio with the new remixed theme
						router.push(
							`/studio?remix=${encodeURIComponent(JSON.stringify(newTheme))}`,
						);
					}}
				/>
			</div>
		</div>
	);
}
