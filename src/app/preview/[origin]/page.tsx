"use client";

import {
	type ThemeStyleProps,
	type ThemeToken,
	validateThemeToken,
} from "@theme-token/sdk";
import { motion } from "framer-motion";
import {
	AlertCircle,
	ArrowLeft,
	Check,
	Copy,
	ExternalLink,
	Layers,
	Loader2,
	Moon,
	Palette,
	Sparkles,
	Sun,
	Type,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { ThemeDemo } from "@/components/theme-demo";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function PreviewPage({ params }: Props) {
	const { origin } = use(params);
	const router = useRouter();
	const { mode: globalMode } = useTheme();
	const [theme, setTheme] = useState<ThemeToken | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");
	const [copied, setCopied] = useState(false);
	const [showRemixDialog, setShowRemixDialog] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const installCommand = `bunx shadcn@latest add https://themetoken.dev/r/themes/${origin}.json`;

	const copyCommand = useCallback(() => {
		navigator.clipboard.writeText(installCommand);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [installCommand]);

	// Sync preview mode with global mode initially
	useEffect(() => {
		setPreviewMode(globalMode);
	}, []);

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

	// All semantic color keys for the spectrum bar
	const colorKeys = [
		"background",
		"card",
		"popover",
		"muted",
		"accent",
		"secondary",
		"primary",
		"destructive",
	];

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

				<div className="mx-auto max-w-7xl px-6 py-8">
					{/* Hero Section - Title + CLI + Color Spectrum */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="mb-8"
					>
						{/* Title Row with CLI */}
						<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
							<div>
								<div className="flex items-center gap-3 mb-1">
									<h1 className="text-4xl font-bold tracking-tight">
										{theme.name}
									</h1>
									<Badge
										variant="outline"
										className="font-mono text-xs uppercase tracking-widest"
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
									<p style={{ color: "var(--muted-foreground)" }}>
										by{" "}
										<span style={{ color: "var(--foreground)" }}>
											{theme.author}
										</span>
										<span
											className="mx-2"
											style={{ color: "var(--border)" }}
										>
											/
										</span>
										<span className="font-mono text-xs">
											{origin.slice(0, 8)}...
										</span>
									</p>
								)}
							</div>

							{/* Compact CLI */}
							<button
								type="button"
								onClick={copyCommand}
								className="group flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-sm transition-colors"
								style={{
									backgroundColor: "color-mix(in oklch, var(--muted) 50%, transparent)",
									borderWidth: "1px",
									borderColor: "var(--border)",
								}}
							>
								<span style={{ color: "var(--primary)" }}>$</span>
								<span
									className="hidden sm:inline"
									style={{ color: "var(--muted-foreground)" }}
								>
									bunx shadcn@latest add .../{origin.slice(0, 8)}
								</span>
								<span
									className="sm:hidden"
									style={{ color: "var(--muted-foreground)" }}
								>
									Copy install command
								</span>
								{copied ? (
									<Check className="ml-2 h-3 w-3 text-green-500" />
								) : (
									<Copy
										className="ml-2 h-3 w-3 opacity-50 group-hover:opacity-100"
										style={{ color: "var(--muted-foreground)" }}
									/>
								)}
							</button>
						</div>

						{/* Color Spectrum Bar - Full Width */}
						<div
							className="w-full h-14 flex rounded-xl overflow-hidden"
							style={{
								borderWidth: "1px",
								borderColor: "var(--border)",
							}}
						>
							{colorKeys.map((color) => (
								<div
									key={color}
									className="flex-1 flex items-end justify-center pb-2 hover:flex-[2] transition-all duration-300 cursor-pointer group relative"
									style={{
										backgroundColor: `var(--${color})`,
										color: `var(--${color}-foreground, var(--foreground))`,
									}}
								>
									<span className="text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap px-1">
										{color}
									</span>
								</div>
							))}
						</div>
					</motion.div>

					{/* Bento Grid: Semantic Colors + Mock UI */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8"
					>
						{/* Left Column: Semantic Color Pairs */}
						<div className="lg:col-span-4 grid grid-cols-2 gap-3">
							{["primary", "secondary", "accent", "destructive"].map(
								(color) => (
									<div
										key={color}
										className="p-4 flex flex-col justify-between h-28"
										style={{
											backgroundColor: `var(--${color})`,
											color: `var(--${color}-foreground)`,
											borderRadius: "var(--radius, 0.5rem)",
										}}
									>
										<span className="text-xs font-medium opacity-80 capitalize">
											{color}
										</span>
										<span className="font-bold text-2xl">Aa</span>
									</div>
								),
							)}
							{/* Muted and Card */}
							<div
								className="p-4 flex flex-col justify-between h-28"
								style={{
									backgroundColor: "var(--muted)",
									color: "var(--muted-foreground)",
									borderRadius: "var(--radius, 0.5rem)",
								}}
							>
								<span className="text-xs font-medium opacity-80">Muted</span>
								<span className="font-bold text-2xl">Aa</span>
							</div>
							<div
								className="p-4 flex flex-col justify-between h-28"
								style={{
									backgroundColor: "var(--card)",
									color: "var(--card-foreground)",
									borderRadius: "var(--radius, 0.5rem)",
									borderWidth: "1px",
									borderColor: "var(--border)",
								}}
							>
								<span className="text-xs font-medium opacity-80">Card</span>
								<span className="font-bold text-2xl">Aa</span>
							</div>
						</div>

						{/* Right Column: Mock Dashboard UI */}
						<div
							className="lg:col-span-8 overflow-hidden flex flex-col shadow-xl"
							style={{
								backgroundColor: "var(--background)",
								borderWidth: "1px",
								borderColor: "var(--border)",
								borderRadius: "var(--radius, 0.5rem)",
							}}
						>
							{/* Mock Browser Chrome */}
							<div
								className="h-10 flex items-center px-4 gap-2"
								style={{
									backgroundColor: "color-mix(in oklch, var(--muted) 30%, transparent)",
									borderBottomWidth: "1px",
									borderColor: "var(--border)",
								}}
							>
								<div className="flex gap-1.5">
									<div
										className="w-3 h-3 rounded-full"
										style={{ backgroundColor: "var(--destructive)", opacity: 0.6 }}
									/>
									<div
										className="w-3 h-3 rounded-full"
										style={{ backgroundColor: "var(--accent)", opacity: 0.6 }}
									/>
									<div
										className="w-3 h-3 rounded-full"
										style={{ backgroundColor: "var(--primary)", opacity: 0.6 }}
									/>
								</div>
								<div
									className="ml-4 px-3 py-1 text-xs w-48 flex items-center"
									style={{
										backgroundColor: "var(--background)",
										borderRadius: "var(--radius, 0.5rem)",
										borderWidth: "1px",
										borderColor: "color-mix(in oklch, var(--border) 50%, transparent)",
										color: "var(--muted-foreground)",
									}}
								>
									<span className="opacity-50 truncate">app.yourproject.com</span>
								</div>
							</div>

							{/* Mock Dashboard Content */}
							<div
								className="flex-1 p-4 flex gap-4"
								style={{
									backgroundColor: "color-mix(in oklch, var(--muted) 10%, transparent)",
								}}
							>
								{/* Mini Sidebar */}
								<div className="w-32 hidden md:flex flex-col gap-2">
									<div
										className="h-6 w-16 mb-4"
										style={{
											backgroundColor: "color-mix(in oklch, var(--primary) 20%, transparent)",
											borderRadius: "var(--radius, 0.5rem)",
										}}
									/>
									{[1, 2, 3].map((i) => (
										<div
											key={i}
											className="h-7 w-full flex items-center px-2 text-xs"
											style={{
												backgroundColor:
													i === 1 ? "var(--accent)" : "transparent",
												color:
													i === 1
														? "var(--accent-foreground)"
														: "var(--muted-foreground)",
												borderRadius: "var(--radius, 0.5rem)",
											}}
										>
											<div
												className="w-3 h-3 mr-2"
												style={{
													backgroundColor: "currentColor",
													opacity: 0.3,
													borderRadius: "2px",
												}}
											/>
											<span>Menu {i}</span>
										</div>
									))}
								</div>

								{/* Main Content */}
								<div className="flex-1 space-y-3">
									{/* Stats Row */}
									<div className="grid grid-cols-2 gap-3">
										<div
											className="p-3"
											style={{
												backgroundColor: "var(--card)",
												borderWidth: "1px",
												borderColor: "var(--border)",
												borderRadius: "var(--radius, 0.5rem)",
											}}
										>
											<div
												className="text-xs mb-1"
												style={{ color: "var(--muted-foreground)" }}
											>
												Revenue
											</div>
											<div className="text-xl font-bold">$12,345</div>
											<div
												className="text-xs mt-1"
												style={{ color: "var(--primary)" }}
											>
												+12.5%
											</div>
										</div>
										<div
											className="p-3"
											style={{
												backgroundColor: "var(--popover)",
												borderWidth: "1px",
												borderColor: "var(--border)",
												borderRadius: "var(--radius, 0.5rem)",
											}}
										>
											<div
												className="text-xs mb-1"
												style={{ color: "var(--muted-foreground)" }}
											>
												Users
											</div>
											<div className="text-xl font-bold">+2,350</div>
											<div
												className="text-xs mt-1"
												style={{ color: "var(--muted-foreground)" }}
											>
												This week
											</div>
										</div>
									</div>

									{/* Mini Table */}
									<div
										className="p-3 space-y-2"
										style={{
											backgroundColor: "var(--card)",
											borderWidth: "1px",
											borderColor: "var(--border)",
											borderRadius: "var(--radius, 0.5rem)",
										}}
									>
										<div
											className="flex justify-between items-center pb-2 text-sm font-medium"
											style={{
												borderBottomWidth: "1px",
												borderColor: "var(--border)",
											}}
										>
											<span>Recent Activity</span>
											<Button
												size="sm"
												variant="outline"
												className="h-6 text-xs px-2"
											>
												View
											</Button>
										</div>
										{[1, 2].map((i) => (
											<div
												key={i}
												className="flex items-center justify-between py-1.5 text-sm"
											>
												<div className="flex items-center gap-2">
													<div
														className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono"
														style={{
															backgroundColor: "var(--muted)",
															color: "var(--muted-foreground)",
														}}
													>
														TX
													</div>
													<div className="flex flex-col">
														<span className="text-xs font-medium">
															Payment #{i}
														</span>
														<span
															className="text-[10px]"
															style={{ color: "var(--muted-foreground)" }}
														>
															Just now
														</span>
													</div>
												</div>
												<span className="font-mono text-xs">-$99</span>
											</div>
										))}
										<Button className="w-full h-8 text-xs mt-2">
											New Transaction
										</Button>
									</div>
								</div>
							</div>
						</div>
					</motion.div>

					{/* Demo Tabs */}
					<Tabs defaultValue="components" className="w-full">
						<TabsList
							className="mb-8"
							style={{
								backgroundColor: "var(--muted)",
							}}
						>
							<TabsTrigger value="components">
								<Layers className="mr-2 h-4 w-4" />
								Components
							</TabsTrigger>
							<TabsTrigger value="colors">
								<Palette className="mr-2 h-4 w-4" />
								Colors
							</TabsTrigger>
							<TabsTrigger value="typography">
								<Type className="mr-2 h-4 w-4" />
								Typography
							</TabsTrigger>
						</TabsList>

						<TabsContent value="components">
							<ThemeDemo />
						</TabsContent>

						<TabsContent value="colors">
							<div className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
								{Object.entries(theme.styles[previewMode]).map(
									([key, value]) => {
										if (typeof value !== "string") return null;
										// Skip non-color values
										if (
											key.includes("radius") ||
											key.includes("font") ||
											key.includes("shadow") ||
											key.includes("spacing") ||
											key.includes("tracking")
										)
											return null;

										return (
											<div
												key={key}
												className="group cursor-pointer"
												style={{
													borderRadius: "var(--radius, 0.5rem)",
												}}
											>
												<div
													className="aspect-square rounded-lg shadow-sm transition-transform group-hover:scale-105"
													style={{
														backgroundColor: value,
														borderWidth: "1px",
														borderColor: "var(--border)",
													}}
												/>
												<p className="mt-1.5 text-xs font-medium truncate">
													{key}
												</p>
												<p
													className="font-mono text-[10px] truncate"
													style={{ color: "var(--muted-foreground)" }}
												>
													{value}
												</p>
											</div>
										);
									},
								)}
							</div>
						</TabsContent>

						<TabsContent value="typography">
							<div
								className="space-y-8 rounded-xl p-8"
								style={{
									backgroundColor: "var(--card)",
									borderColor: "var(--border)",
									borderWidth: "1px",
								}}
							>
								<div>
									<p
										className="mb-2 text-sm font-medium"
										style={{ color: "var(--muted-foreground)" }}
									>
										Heading 1
									</p>
									<h1 className="text-5xl font-extrabold tracking-tight">
										The quick brown fox jumps
									</h1>
								</div>
								<div>
									<p
										className="mb-2 text-sm font-medium"
										style={{ color: "var(--muted-foreground)" }}
									>
										Heading 2
									</p>
									<h2 className="text-3xl font-semibold tracking-tight">
										Over the lazy dog
									</h2>
								</div>
								<div>
									<p
										className="mb-2 text-sm font-medium"
										style={{ color: "var(--muted-foreground)" }}
									>
										Heading 3
									</p>
									<h3 className="text-2xl font-semibold tracking-tight">
										Pack my box with five dozen liquor jugs
									</h3>
								</div>
								<div>
									<p
										className="mb-2 text-sm font-medium"
										style={{ color: "var(--muted-foreground)" }}
									>
										Body Text
									</p>
									<p className="max-w-2xl text-base leading-7">
										Theme tokens bring the benefits of blockchain to design
										systems. Create beautiful, consistent experiences across
										your applications with tokenized themes that you truly own.
										Trade them on any ordinal marketplace, use them across any
										compatible app.
									</p>
								</div>
								<div>
									<p
										className="mb-2 text-sm font-medium"
										style={{ color: "var(--muted-foreground)" }}
									>
										Muted Text
									</p>
									<p
										className="max-w-2xl text-sm"
										style={{ color: "var(--muted-foreground)" }}
									>
										Secondary text provides additional context without drawing
										attention away from the primary content. Use it for
										descriptions, timestamps, and helper text.
									</p>
								</div>
								<div>
									<p
										className="mb-2 text-sm font-medium"
										style={{ color: "var(--muted-foreground)" }}
									>
										Code
									</p>
									<code
										className="rounded px-2 py-1 font-mono text-sm"
										style={{ backgroundColor: "var(--muted)" }}
									>
										const theme = await fetchTheme(origin);
									</code>
								</div>

								{/* Font Info */}
								{(theme.styles[previewMode]["font-sans"] ||
									theme.styles[previewMode]["font-serif"] ||
									theme.styles[previewMode]["font-mono"]) && (
									<div
										className="rounded-lg p-4"
										style={{
											backgroundColor: "var(--muted)",
										}}
									>
										<p className="mb-2 font-medium">Font Families</p>
										<div className="space-y-1 font-mono text-sm">
											{theme.styles[previewMode]["font-sans"] && (
												<p>Sans: {theme.styles[previewMode]["font-sans"]}</p>
											)}
											{theme.styles[previewMode]["font-serif"] && (
												<p>Serif: {theme.styles[previewMode]["font-serif"]}</p>
											)}
											{theme.styles[previewMode]["font-mono"] && (
												<p>Mono: {theme.styles[previewMode]["font-mono"]}</p>
											)}
										</div>
									</div>
								)}
							</div>
						</TabsContent>
					</Tabs>
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
