"use client";

import {
	motion,
	useMotionValue,
	useSpring,
	useTransform,
} from "framer-motion";
import { Grid3X3, Palette, Type } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const tabs = [
	{ href: "/studio/theme", label: "Theme", icon: Palette },
	{ href: "/studio/font", label: "Font", icon: Type },
	{ href: "/studio/patterns", label: "Pattern", icon: Grid3X3 },
];

export default function StudioLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const barRef = useRef<HTMLDivElement>(null);

	// Only show header on subroutes, not on /studio landing
	const isSubroute = pathname !== "/studio";

	// Mouse tracking for spotlight effect
	const mouseX = useMotionValue(0);
	const smoothMouseX = useSpring(mouseX, { stiffness: 400, damping: 40 });
	const spotlightX = useTransform(smoothMouseX, (x) => x - 200);

	useEffect(() => {
		function handleMouseMove(e: MouseEvent) {
			if (barRef.current) {
				const rect = barRef.current.getBoundingClientRect();
				const relativeX = e.clientX - rect.left;
				mouseX.set(relativeX);
			}
		}

		window.addEventListener("mousemove", handleMouseMove);
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, [mouseX]);

	if (!isSubroute) {
		return <>{children}</>;
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col bg-background">
			{/* Terminal-style Header */}
			<header className="sticky top-14 z-40 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="mx-auto max-w-full px-4">
					{/* Row: Title + Tabs */}
					<div className="flex h-11 items-center gap-2 sm:gap-6">
						{/* Terminal-style title - hidden on mobile */}
						<h1 className="hidden font-mono text-sm font-medium tracking-tight text-foreground/90 sm:block">
							<span className="text-primary">$</span> studio
						</h1>

						{/* Divider - hidden on mobile */}
						<div className="hidden h-4 w-px bg-border sm:block" />

						{/* Tab Navigation */}
						<nav className="flex items-center gap-0.5 sm:gap-1">
							{tabs.map((tab) => {
								const Icon = tab.icon;
								const isActive = pathname?.startsWith(tab.href);
								return (
									<Link
										key={tab.href}
										href={tab.href}
										className={`relative flex items-center gap-1 rounded-md px-2 py-1.5 font-mono text-xs transition-colors sm:gap-1.5 sm:px-3 ${
											isActive
												? "text-foreground"
												: "text-muted-foreground hover:text-foreground/80"
										}`}
									>
										{isActive && (
											<motion.div
												layoutId="studio-active-tab"
												className="absolute inset-0 rounded-md bg-muted/60"
												transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
											/>
										)}
										<Icon className="relative z-10 h-3.5 w-3.5" />
										<span className="relative z-10 hidden sm:inline">
											{tab.label}
										</span>
									</Link>
								);
							})}
						</nav>
					</div>

					{/* Animated Gradient Bar with Spotlight */}
					<div
						ref={barRef}
						className="relative h-0.5 w-full overflow-hidden"
					>
						{/* Base: Dim animated gradient */}
						<motion.div
							className="absolute inset-0 opacity-30"
							style={{
								backgroundImage:
									"linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--secondary)), hsl(var(--primary)))",
								backgroundSize: "300% 100%",
							}}
							animate={{
								backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
							}}
							transition={{
								duration: 12,
								ease: "linear",
								repeat: Number.POSITIVE_INFINITY,
							}}
						/>

						{/* Spotlight: Bright gradient that follows mouse */}
						<motion.div
							className="pointer-events-none absolute inset-y-0 w-[400px]"
							style={{
								x: spotlightX,
								background:
									"linear-gradient(90deg, transparent 0%, hsl(var(--primary)) 20%, hsl(var(--accent)) 40%, white 50%, hsl(var(--accent)) 60%, hsl(var(--primary)) 80%, transparent 100%)",
							}}
						/>
					</div>
				</div>
			</header>

			{/* Content */}
			<div className="flex-1">
				{children}
			</div>
		</div>
	);
}
