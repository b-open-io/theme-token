"use client";

import { Github, Menu, Moon, Sun, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WalletConnect } from "@/components/wallet-connect";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

// Width configurations per page type - must match content widths on each page
const WIDTH_CONFIG = {
	spec: "max-w-6xl", // matches spec/page.tsx content width
	"studio-landing": "max-w-5xl", // matches studio landing page content width
	"studio-sub": "max-w-full", // studio sub-pages are full-width edge-to-edge
	market: "max-w-[1400px]", // matches market/layout.tsx content width
	themes: "max-w-7xl", // matches themes/page.tsx content width
	default: "max-w-6xl", // matches home page content width
} as const;

function useGitHubStars() {
	const [stars, setStars] = useState<number | null>(null);

	useEffect(() => {
		fetch("https://api.github.com/repos/b-open-io/theme-token")
			.then((res) => res.json())
			.then((data) => {
				if (data.stargazers_count !== undefined) {
					setStars(data.stargazers_count);
				}
			})
			.catch(() => {
				// Ignore errors
			});
	}, []);

	return stars;
}

function getWidthVariant(pathname: string | null): keyof typeof WIDTH_CONFIG {
	if (pathname?.startsWith("/spec")) return "spec";
	if (pathname === "/studio") return "studio-landing";
	if (pathname?.startsWith("/studio/")) return "studio-sub";
	if (pathname?.startsWith("/market")) return "market";
	if (pathname?.startsWith("/themes")) return "themes";
	return "default";
}


const NAV_LINKS = [
	{ href: "/spec", label: "Spec", description: "Protocol specification" },
	{ href: "/studio", label: "Studio", description: "Create & edit themes" },
	{ href: "/market", label: "Market", description: "Browse & buy themes" },
];

export function Header() {
	const stars = useGitHubStars();
	const pathname = usePathname();
	const widthVariant = getWidthVariant(pathname);
	const widthClass = WIDTH_CONFIG[widthVariant];
	const [menuOpen, setMenuOpen] = useState(false);
	const { mode, toggleMode } = useTheme();

	// Close menu on route change
	useEffect(() => {
		setMenuOpen(false);
	}, [pathname]);

	// Prevent scroll when menu is open
	useEffect(() => {
		if (menuOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [menuOpen]);

	return (
		<>
			<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className={`mx-auto flex h-14 items-center justify-between px-4 md:px-0 transition-[max-width] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${widthClass}`}>
					{/* Logo - Text on mobile, icon+text on desktop */}
					<Link href="/" className="flex items-center gap-2">
						<Image
							src="/icon-transparent.png"
							alt="Theme Token"
							width={24}
							height={24}
							className="h-6 w-6 hidden sm:block"
						/>
						<span className="font-display text-lg font-semibold">
							Theme Token
						</span>
					</Link>

					{/* Center Nav Links - Desktop */}
					<nav className="hidden items-center gap-1 md:flex">
						{NAV_LINKS.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
									pathname === link.href || pathname?.startsWith(link.href + "/")
										? "text-foreground"
										: "text-muted-foreground"
								}`}
							>
								{link.label}
							</Link>
						))}
					</nav>

					{/* Right Side */}
					<div className="flex items-center gap-1">
						{/* GitHub - Desktop only */}
						<a
							href="https://github.com/b-open-io/theme-token"
							target="_blank"
							rel="noopener noreferrer"
							className="hidden sm:inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
						>
							<Github className="h-4 w-4" />
							{stars !== null && (
								<span className="text-xs tabular-nums">{stars}</span>
							)}
						</a>
						
						{/* Wallet - hide mode toggle on mobile via prop */}
						<WalletConnect hideModeToggleOnMobile />
						
						{/* Mobile Menu Button */}
						<Button
							variant="ghost"
							size="icon"
							className="md:hidden"
							onClick={() => setMenuOpen(true)}
						>
							<Menu className="h-5 w-5" />
							<span className="sr-only">Open menu</span>
						</Button>
					</div>
				</div>
			</header>

			{/* Fullscreen Mobile Menu */}
			<AnimatePresence>
				{menuOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-[100] bg-background md:hidden"
					>
						{/* Header */}
						<div className="flex h-14 items-center justify-between border-b border-border/40 px-4">
							<span className="font-display text-lg font-semibold">Menu</span>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setMenuOpen(false)}
							>
								<X className="h-5 w-5" />
								<span className="sr-only">Close menu</span>
							</Button>
						</div>

						{/* Menu Content */}
						<div className="flex h-[calc(100vh-3.5rem)] flex-col px-6 py-8">
							{/* Navigation Links */}
							<nav className="flex flex-col gap-2">
								{NAV_LINKS.map((link, i) => (
									<motion.div
										key={link.href}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: i * 0.1 }}
									>
										<Link
											href={link.href}
											onClick={() => setMenuOpen(false)}
											className={`group flex flex-col rounded-xl px-4 py-4 transition-colors ${
												pathname === link.href || pathname?.startsWith(link.href + "/")
													? "bg-primary/10 text-primary"
													: "hover:bg-muted"
											}`}
										>
											<span className="text-2xl font-semibold">{link.label}</span>
											<span className="text-sm text-muted-foreground">{link.description}</span>
										</Link>
									</motion.div>
								))}
							</nav>

							{/* Spacer */}
							<div className="flex-1" />

							{/* Bottom Section */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 }}
								className="space-y-4 border-t border-border pt-6"
							>
								{/* Theme Toggle */}
								<div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
									<span className="text-sm font-medium">Theme</span>
									<button
										onClick={(e) => toggleMode(e)}
										className="flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
									>
										{mode === "light" ? (
											<>
												<Sun className="h-4 w-4" />
												Light
											</>
										) : (
											<>
												<Moon className="h-4 w-4" />
												Dark
											</>
										)}
									</button>
								</div>

								{/* GitHub Link */}
								<a
									href="https://github.com/b-open-io/theme-token"
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									<Github className="h-5 w-5" />
									<span className="flex-1 text-sm font-medium">GitHub</span>
									{stars !== null && (
										<span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">
											{stars}
										</span>
									)}
								</a>
							</motion.div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
