"use client";

import { Github, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { WalletConnect } from "@/components/wallet-connect";

// Width configurations per page type - must match content widths on each page
const WIDTH_CONFIG = {
	spec: "max-w-6xl", // matches spec/page.tsx content width
	"studio-landing": "max-w-5xl", // matches studio landing page content width
	"studio-sub": "max-w-full", // studio sub-pages are full-width edge-to-edge
	market: "max-w-[1400px]", // matches market/layout.tsx content width
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
	return "default";
}


export function Header() {
	const stars = useGitHubStars();
	const pathname = usePathname();
	const widthVariant = getWidthVariant(pathname);
	const widthClass = WIDTH_CONFIG[widthVariant];

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className={`mx-auto flex h-14 items-center justify-between px-4 transition-[max-width] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${widthClass}`}>
				{/* Logo */}
				<Link href="/" className="flex items-center gap-2">
					<Image
						src="/icon-transparent.png"
						alt="Theme Token"
						width={24}
						height={24}
						className="h-6 w-6"
					/>
					<span className="font-display text-lg font-semibold">
						Theme Token
					</span>
				</Link>

				{/* Center Nav Links */}
				<nav className="hidden items-center gap-6 md:flex">
					<Link
						href="/spec"
						className="text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						Spec
					</Link>
					<Link
						href="/studio"
						className="text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						Studio
					</Link>
					<Link
						href="/market"
						className="text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						Market
					</Link>
				</nav>

				{/* Right Side: GitHub + Wallet */}
				<div className="flex items-center gap-3">
					<a
						href="https://github.com/b-open-io/theme-token"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						<Github className="h-4 w-4" />
						<Star className="h-3 w-3" />
						{stars !== null && <span className="font-medium">{stars}</span>}
					</a>
					<WalletConnect />
				</div>
			</div>
		</header>
	);
}
