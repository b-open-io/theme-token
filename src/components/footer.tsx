"use client";

import {
	Box,
	Cpu,
	Github,
	Layers,
	Package,
	Palette,
} from "lucide-react";
import Link from "next/link";

export function Footer() {
	return (
		<footer className="relative w-full bg-background text-foreground border-t border-border overflow-hidden">
			{/* Theme Flex: Gradient Top Border */}
			<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary opacity-80" />

			{/* Background Texture (Subtle Dot Pattern) */}
			<div
				className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
				style={{
					backgroundImage:
						"radial-gradient(circle, currentColor 1px, transparent 1px)",
					backgroundSize: "24px 24px",
				}}
			/>

			<div className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-8">
				{/* Main Grid Layout */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-12">
					{/* Brand Column */}
					<div className="lg:col-span-4 flex flex-col space-y-5">
						<div className="flex items-center gap-2">
							<div className="p-2 bg-primary text-primary-foreground rounded-lg">
								<Layers className="w-5 h-5" />
							</div>
							<span className="text-xl font-bold tracking-tight">
								Theme Token
							</span>
						</div>

						<p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
							The protocol for creating, publishing, and trading on-chain UI
							themes. Immutable design systems powered by Bitcoin SV.
						</p>

						{/* Active Palette - Shows off the current theme colors */}
						<div className="mt-2 p-3 border border-border rounded-xl bg-muted/30">
							<div className="flex items-center justify-between mb-2">
								<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Active Palette
								</span>
								<Palette className="w-3 h-3 text-muted-foreground" />
							</div>
							<div className="flex gap-1.5">
								<div
									className="h-6 w-6 rounded-full bg-primary ring-2 ring-background shadow-sm"
									title="Primary"
								/>
								<div
									className="h-6 w-6 rounded-full bg-secondary ring-2 ring-background shadow-sm"
									title="Secondary"
								/>
								<div
									className="h-6 w-6 rounded-full bg-accent ring-2 ring-background shadow-sm"
									title="Accent"
								/>
								<div
									className="h-6 w-6 rounded-full bg-muted ring-2 ring-background shadow-sm"
									title="Muted"
								/>
								<div
									className="h-6 w-6 rounded-full bg-destructive ring-2 ring-background shadow-sm"
									title="Destructive"
								/>
							</div>
						</div>
					</div>

					{/* Navigation Columns */}
					<div className="lg:col-span-2 md:col-span-1">
						<h3 className="font-semibold text-foreground mb-4 text-sm">
							Product
						</h3>
						<ul className="space-y-3">
							<li>
								<Link
									href="/themes"
									className="text-sm text-muted-foreground hover:text-primary transition-colors"
								>
									Explore Themes
								</Link>
							</li>
							<li>
								<Link
									href="/studio/theme"
									className="text-sm text-muted-foreground hover:text-primary transition-colors"
								>
									Theme Studio
								</Link>
							</li>
							<li>
								<Link
									href="/market"
									className="text-sm text-muted-foreground hover:text-primary transition-colors"
								>
									Market
								</Link>
							</li>
							<li>
								<Link
									href="/spec"
									className="text-sm text-muted-foreground hover:text-primary transition-colors"
								>
									Token Spec
								</Link>
							</li>
						</ul>
					</div>

					<div className="lg:col-span-2 md:col-span-1">
						<h3 className="font-semibold text-foreground mb-4 text-sm">
							Resources
						</h3>
						<ul className="space-y-3">
							<li>
								<a
									href="https://github.com/b-open-io/theme-token"
									target="_blank"
									rel="noreferrer"
									className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
								>
									<Github className="w-3.5 h-3.5" /> GitHub
								</a>
							</li>
							<li>
								<a
									href="https://www.npmjs.com/package/@theme-token/sdk"
									target="_blank"
									rel="noreferrer"
									className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
								>
									<Package className="w-3.5 h-3.5" /> SDK Package
								</a>
							</li>
						</ul>
					</div>

					{/* Infrastructure Column */}
					<div className="lg:col-span-4 flex flex-col space-y-4">
						<h3 className="font-semibold text-foreground text-sm">
							Infrastructure
						</h3>

						<div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors group">
							<div className="flex items-start gap-3">
								<div className="bg-orange-500/10 p-2 rounded-md text-orange-500">
									<Box className="w-4 h-4" />
								</div>
								<div>
									<h4 className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
										Built on Bitcoin SV
									</h4>
									<p className="text-xs text-muted-foreground mt-1">
										Unbounded scaling and low fees of the original Bitcoin.
									</p>
								</div>
							</div>
						</div>

						<div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors group">
							<div className="flex items-start gap-3">
								<div className="bg-blue-500/10 p-2 rounded-md text-blue-500">
									<Cpu className="w-4 h-4" />
								</div>
								<div>
									<h4 className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
										1Sat Ordinals
									</h4>
									<p className="text-xs text-muted-foreground mt-1">
										Themes inscribed on-chain. Permanent ownership.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
					<p className="text-sm text-muted-foreground">
						© {new Date().getFullYear()} Theme Token Protocol
					</p>

					<div className="flex items-center gap-4">
						<a
							href="https://github.com/b-open-io/theme-token"
							target="_blank"
							rel="noreferrer"
							className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
							aria-label="GitHub"
						>
							<Github className="w-4 h-4" />
						</a>

						{/* Status Indicator */}
						<div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
							<span className="relative flex h-2 w-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
								<span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
							</span>
							<span className="text-xs font-medium text-primary">
								Mainnet Live
							</span>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
