"use client";

import { motion } from "framer-motion";
import { Metadata } from "next";
import { Bot, Check, Copy, FileText, Package, Terminal } from "lucide-react";
import { useCallback, useState } from "react";
import { ChainImplementations } from "@/components/chain-implementations";
import { CodeBlock } from "@/components/code-block";
import { OnChainProtocol } from "@/components/on-chain-protocol";
import { PageContainer } from "@/components/page-container";

export const metadata: Metadata = {
	title: "Theme Token Specification | ShadCN Registry Format",
	description:
		"Technical specification for Theme Token. Learn about the JSON schema, on-chain metadata protocol, and cross-chain implementations.",
	openGraph: {
		title: "Theme Token Specification | ShadCN Registry Format",
		description:
			"Technical specification for Theme Token. Learn about the JSON schema, on-chain metadata protocol, and cross-chain implementations.",
		images: ["/og/default.png"],
	},
	twitter: {
		card: "summary_large_image",
		title: "Theme Token Specification | ShadCN Registry Format",
		description:
			"Technical specification for Theme Token. Learn about the JSON schema, on-chain metadata protocol, and cross-chain implementations.",
		images: ["/og/default.png"],
	},
};

const fadeIn = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.5 },
};

const stagger = {
	animate: {
		transition: {
			staggerChildren: 0.1,
		},
	},
};

export default function SpecPage() {
	const [copied, setCopied] = useState<string | null>(null);
	const installCommand =
		"bunx shadcn@latest add https://themetoken.dev/r/themes/[origin]";
	const sdkInstallCommand = "bun add @theme-token/sdk";

	const copyToClipboard = useCallback((text: string, id: string) => {
		navigator.clipboard.writeText(text);
		setCopied(id);
		setTimeout(() => setCopied(null), 2000);
	}, []);

	return (
		<div className="min-h-screen bg-background">
			{/* Hero - CLI Install */}
			<section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent py-16">
				<PageContainer>
					<motion.div
						initial="initial"
						animate="animate"
						variants={stagger}
						className="text-center"
					>
						<motion.p
							variants={fadeIn}
							className="font-mono text-sm text-primary"
						>
							{"// ShadCN Registry Format"}
						</motion.p>
						<motion.h1
							variants={fadeIn}
							className="mb-4 text-3xl font-bold sm:text-4xl"
						>
							Install Themes from Blockchain
						</motion.h1>
						<motion.p
							variants={fadeIn}
							className="mx-auto mb-8 max-w-2xl text-muted-foreground"
						>
							Theme Token uses the ShadCN Registry Format. Install any on-chain
							theme directly with the ShadCN CLI.
						</motion.p>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className="mx-auto max-w-2xl"
					>
						<div className="rounded-xl border border-primary/20 bg-card p-6">
							<div className="mb-4 flex items-center gap-2">
								<Terminal className="h-5 w-5 text-primary" />
								<span className="font-semibold">Install via CLI</span>
							</div>
							<div className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 font-mono text-sm">
								<code className="flex-1 overflow-x-auto text-muted-foreground">
									<span className="text-primary">bunx</span> shadcn@latest add{" "}
									<span className="text-foreground">
										https://themetoken.dev/r/themes/[origin]
									</span>
								</code>
								<button
									type="button"
									onClick={() => copyToClipboard(installCommand, "cli")}
									className="flex-shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									title="Copy command"
								>
									{copied === "cli" ? (
										<Check className="h-4 w-4 text-green-500" />
									) : (
										<Copy className="h-4 w-4" />
									)}
								</button>
							</div>
							<p className="mt-3 text-center text-xs text-muted-foreground">
								Replace <code className="rounded bg-muted px-1">[origin]</code>{" "}
								with the inscription origin ID
							</p>
						</div>
					</motion.div>
				</PageContainer>
			</section>

			{/* Schema Documentation */}
			<section className="py-16">
				<PageContainer>
					<motion.div
						initial="initial"
						whileInView="animate"
						viewport={{ once: true }}
						variants={stagger}
					>
						<motion.p
							variants={fadeIn}
							className="font-mono text-sm text-primary"
						>
							{"// The Schema"}
						</motion.p>
						<motion.h2
							variants={fadeIn}
							className="mb-4 text-3xl font-bold sm:text-4xl"
						>
							ShadCN Registry Format
						</motion.h2>
						<motion.p
							variants={fadeIn}
							className="mb-12 max-w-2xl text-muted-foreground"
						>
							Theme Token uses the same CSS custom properties that power
							thousands of ShadCN-based applications. 100% compatible with the
							ShadCN CLI ecosystem.
						</motion.p>
					</motion.div>

					<div className="grid gap-8 lg:grid-cols-2 lg:items-start overflow-hidden">
						{/* Color Variables */}
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							className="space-y-4"
						>
							<h3 className="font-semibold">Theme Properties</h3>

							<div className="space-y-3">
								<div>
									<p className="text-xs font-medium text-muted-foreground mb-1">
										19 Core Colors <span className="text-primary">*</span>
									</p>
									<div className="grid grid-cols-3 gap-1 font-mono text-xs">
										{[
											"background",
											"foreground",
											"card",
											"popover",
											"primary",
											"secondary",
											"muted",
											"accent",
											"destructive",
											"border",
											"input",
											"ring",
										].map((name) => (
											<div
												key={name}
												className="flex items-center gap-1 rounded border border-border bg-muted/30 px-2 py-1"
											>
												<div
													className="h-2 w-2 rounded-full border"
													style={{ backgroundColor: `var(--${name})` }}
												/>
												<span>{name}</span>
											</div>
										))}
									</div>
								</div>

								<div>
									<p className="text-xs font-medium text-muted-foreground mb-1">
										Charts (optional)
									</p>
									<div className="flex gap-1 font-mono text-xs">
										{[
											"chart-1",
											"chart-2",
											"chart-3",
											"chart-4",
											"chart-5",
										].map((name) => (
											<div
												key={name}
												className="rounded border border-border bg-muted/30 px-2 py-1"
											>
												{name}
											</div>
										))}
									</div>
								</div>

								<div>
									<p className="text-xs font-medium text-muted-foreground mb-1">
										Sidebar (optional)
									</p>
									<div className="flex flex-wrap gap-1 font-mono text-xs">
										{[
											"sidebar",
											"sidebar-primary",
											"sidebar-accent",
											"sidebar-border",
											"sidebar-ring",
										].map((name) => (
											<div
												key={name}
												className="rounded border border-border bg-muted/30 px-2 py-1"
											>
												{name}
											</div>
										))}
									</div>
								</div>

								<div>
									<p className="text-xs font-medium text-muted-foreground mb-1">
										Typography & Layout
									</p>
									<div className="flex flex-wrap gap-1 font-mono text-xs">
										{[
											"radius",
											"font-sans",
											"font-serif",
											"font-mono",
											"letter-spacing",
											"spacing",
										].map((name) => (
											<div
												key={name}
												className="rounded border border-border bg-muted/30 px-2 py-1"
											>
												{name}
												{name === "radius" && (
													<span className="text-primary ml-1">*</span>
												)}
											</div>
										))}
									</div>
									<p className="mt-1 text-[10px] text-muted-foreground/70">
										Font values: Google Font name or{" "}
										<code className="rounded bg-muted px-1">/content/origin</code>{" "}
										for on-chain fonts
									</p>
								</div>

								<div>
									<p className="text-xs font-medium text-muted-foreground mb-1">
										Shadows (optional)
									</p>
									<div className="flex flex-wrap gap-1 font-mono text-xs">
										{[
											"shadow-2xs",
											"shadow-xs",
											"shadow-sm",
											"shadow",
											"shadow-md",
											"shadow-lg",
											"shadow-xl",
											"shadow-2xl",
										].map((name) => (
											<div
												key={name}
												className="rounded border border-border bg-muted/30 px-2 py-1"
											>
												{name}
											</div>
										))}
									</div>
								</div>
							</div>

							<p className="text-xs text-muted-foreground">
								Colors include{" "}
								<code className="rounded bg-muted px-1">-foreground</code>{" "}
								variants. All color values use{" "}
								<code className="rounded bg-muted px-1">oklch()</code> format.
								<span className="text-primary">*</span> = required.
							</p>
						</motion.div>

						{/* Schema Structure */}
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							className="flex flex-col min-w-0"
						>
							<h3 className="mb-4 font-semibold">Full Schema Structure</h3>
							<CodeBlock
								code={JSON.stringify({
									$schema: "https://themetoken.dev/v1/schema.json",
									name: "My Theme",
									author: "Name (https://github.com/username)",
									styles: {
										light: {
											background: "oklch(0.98 0.005 240)",
											foreground: "oklch(0.15 0.01 240)",
											card: "oklch(1 0 0)",
											"card-foreground": "oklch(0.15 0.01 240)",
											popover: "oklch(1 0 0)",
											"popover-foreground": "oklch(0.15 0.01 240)",
											primary: "oklch(0.55 0.22 255)",
											"primary-foreground": "oklch(0.98 0 0)",
											secondary: "oklch(0.95 0.005 240)",
											"secondary-foreground": "oklch(0.25 0.01 240)",
											muted: "oklch(0.95 0.005 240)",
											"muted-foreground": "oklch(0.5 0.01 240)",
											accent: "oklch(0.95 0.01 255)",
											"accent-foreground": "oklch(0.25 0.01 240)",
											destructive: "oklch(0.55 0.22 25)",
											"destructive-foreground": "oklch(0.98 0 0)",
											border: "oklch(0.9 0.005 240)",
											input: "oklch(0.9 0.005 240)",
											ring: "oklch(0.55 0.22 255)",
											radius: "0.5rem",
											"font-sans": "Inter",
											"font-mono": "/content/abc123_0",
										},
										dark: {
											background: "oklch(0.12 0.015 240)",
											foreground: "oklch(0.95 0.005 240)",
											card: "oklch(0.16 0.015 240)",
											"card-foreground": "oklch(0.95 0.005 240)",
											popover: "oklch(0.16 0.015 240)",
											"popover-foreground": "oklch(0.95 0.005 240)",
											primary: "oklch(0.65 0.22 255)",
											"primary-foreground": "oklch(0.12 0.015 240)",
											secondary: "oklch(0.2 0.015 240)",
											"secondary-foreground": "oklch(0.95 0.005 240)",
											muted: "oklch(0.2 0.015 240)",
											"muted-foreground": "oklch(0.65 0.01 240)",
											accent: "oklch(0.25 0.02 255)",
											"accent-foreground": "oklch(0.95 0.005 240)",
											destructive: "oklch(0.6 0.22 25)",
											"destructive-foreground": "oklch(0.98 0 0)",
											border: "oklch(0.25 0.015 240)",
											input: "oklch(0.25 0.015 240)",
											ring: "oklch(0.65 0.22 255)",
											radius: "0.5rem",
											"font-sans": "Inter",
											"font-mono": "/content/abc123_0",
										},
									},
								}, null, 2)}
								language="json"
								className="h-[500px]"
							/>
							<p className="mt-3 text-xs text-muted-foreground">
								Our{" "}
								<code className="rounded bg-muted px-1">
									/r/themes/[origin]
								</code>{" "}
								endpoint serves this as{" "}
								<a
									href="https://ui.shadcn.com/docs/registry"
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline"
								>
									ShadCN Registry Format
								</a>
								. Also compatible with{" "}
								<a
									href="https://tweakcn.com/editor/theme"
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline"
								>
									tweakcn
								</a>
								.{" "}
								<a
									href="https://docs.npmjs.com/cli/v10/configuring-npm/package-json#name"
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline"
								>
									Name
								</a>{" "}
								and{" "}
								<a
									href="https://docs.npmjs.com/cli/v10/configuring-npm/package-json#people-fields-author-contributors"
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline"
								>
									author
								</a>{" "}
								follow npm conventions.
							</p>
						</motion.div>
					</div>
				</PageContainer>
			</section>

			{/* On-Chain Protocol / MAP Metadata */}
			<section className="border-t border-border bg-muted/30 py-16">
				<PageContainer>
					<motion.div
						initial="initial"
						whileInView="animate"
						viewport={{ once: true }}
						variants={stagger}
					>
						<motion.p
							variants={fadeIn}
							className="font-mono text-sm text-primary"
						>
							{"// On-Chain Metadata"}
						</motion.p>
						<motion.h2
							variants={fadeIn}
							className="mb-4 text-3xl font-bold sm:text-4xl"
						>
							MAP Metadata Protocol
						</motion.h2>
						<motion.p
							variants={fadeIn}
							className="mb-12 max-w-2xl text-muted-foreground"
						>
							Assets use the MAP (Magic Attribute Protocol) for on-chain metadata.
						</motion.p>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
					>
						<OnChainProtocol />
					</motion.div>
				</PageContainer>
			</section>

			{/* Protocol Implementations */}
			<section className="border-t border-border py-16">
				<PageContainer>
					<motion.div
						initial="initial"
						whileInView="animate"
						viewport={{ once: true }}
						variants={stagger}
					>
						<motion.p
							variants={fadeIn}
							className="font-mono text-sm text-primary"
						>
							{"// Blockchain Implementations"}
						</motion.p>
						<motion.h2
							variants={fadeIn}
							className="mb-4 text-3xl font-bold sm:text-4xl"
						>
							Inscribe on Any Chain
						</motion.h2>
						<motion.p
							variants={fadeIn}
							className="mb-12 max-w-2xl text-muted-foreground"
						>
							Theme Tokens can be inscribed on multiple blockchains. Choose
							based on your cost, speed, and ecosystem requirements.
						</motion.p>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
					>
						<ChainImplementations />
					</motion.div>
				</PageContainer>
			</section>

			{/* SDK Section */}
			<section className="border-t border-border py-16">
				<PageContainer>
					<motion.div
						initial="initial"
						whileInView="animate"
						viewport={{ once: true }}
						variants={stagger}
					>
						<motion.p
							variants={fadeIn}
							className="font-mono text-sm text-primary"
						>
							{"// TypeScript SDK"}
						</motion.p>
						<motion.h2
							variants={fadeIn}
							className="mb-4 text-3xl font-bold sm:text-4xl"
						>
							@theme-token/sdk
						</motion.h2>
						<motion.p
							variants={fadeIn}
							className="mb-8 max-w-2xl text-muted-foreground"
						>
							TypeScript utilities for working with Theme Tokens. Validate,
							fetch, convert, and apply themes programmatically.
						</motion.p>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="space-y-6"
					>
						<div className="rounded-xl border border-primary/20 bg-card p-6">
							<div className="mb-4 flex items-center gap-2">
								<Package className="h-5 w-5 text-primary" />
								<span className="font-semibold">Install</span>
							</div>
							<div className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 font-mono text-sm">
								<code className="flex-1 overflow-x-auto text-muted-foreground">
									<span className="text-primary">bun</span> add @theme-token/sdk
								</code>
								<button
									type="button"
									onClick={() => copyToClipboard(sdkInstallCommand, "sdk")}
									className="flex-shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									title="Copy command"
								>
									{copied === "sdk" ? (
										<Check className="h-4 w-4 text-green-500" />
									) : (
										<Copy className="h-4 w-4" />
									)}
								</button>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							<div className="rounded-lg border border-border bg-card p-4">
								<h4 className="mb-1 font-mono text-sm font-semibold">
									validateThemeToken
								</h4>
								<p className="text-xs text-muted-foreground">
									Zod-powered schema validation
								</p>
							</div>
							<div className="rounded-lg border border-border bg-card p-4">
								<h4 className="mb-1 font-mono text-sm font-semibold">
									fetchThemeByOrigin
								</h4>
								<p className="text-xs text-muted-foreground">
									Fetch themes from blockchain
								</p>
							</div>
							<div className="rounded-lg border border-border bg-card p-4">
								<h4 className="mb-1 font-mono text-sm font-semibold">
									parseCss
								</h4>
								<p className="text-xs text-muted-foreground">
									Convert CSS to ThemeToken
								</p>
							</div>
							<div className="rounded-lg border border-border bg-card p-4">
								<h4 className="mb-1 font-mono text-sm font-semibold">
									applyTheme
								</h4>
								<p className="text-xs text-muted-foreground">
									Apply themes to DOM at runtime
								</p>
							</div>
						</div>

						<div className="flex gap-4">
							<a
								href="https://github.com/b-open-io/theme-token-sdk"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/50 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
							>
								<svg
									className="h-4 w-4"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
								</svg>
								View on GitHub
							</a>
							<a
								href="https://www.npmjs.com/package/@theme-token/sdk"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/50 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
							>
								<svg
									className="h-4 w-4"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path d="M0 0v24h24V0H0zm6.168 20.064H3.36V8.352h2.808v11.712zm6.552 0H9.936V3.936h2.784v16.128zm6.552 0h-2.784v-7.872h2.784v7.872z" />
								</svg>
								npm
							</a>
						</div>
					</motion.div>
				</PageContainer>
			</section>

			{/* LLM Documentation */}
			<section className="border-t border-border bg-muted/30 py-16">
				<PageContainer>
					<motion.div
						initial="initial"
						whileInView="animate"
						viewport={{ once: true }}
						variants={stagger}
					>
						<motion.p
							variants={fadeIn}
							className="font-mono text-sm text-primary"
						>
							{"// For AI Assistants"}
						</motion.p>
						<motion.h2
							variants={fadeIn}
							className="mb-4 text-3xl font-bold sm:text-4xl"
						>
							AI Agent Resources
						</motion.h2>
						<motion.p
							variants={fadeIn}
							className="mb-8 max-w-2xl text-muted-foreground"
						>
							Machine-readable documentation for AI coding assistants. Copy context
							directly into your AI tool or feed the URLs. Following the{" "}
							<a
								href="https://llmstxt.org"
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary hover:underline"
							>
								llms.txt
							</a>{" "}
							specification.
						</motion.p>
					</motion.div>

					{/* Copy Full Context Button */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="mb-6"
					>
						<button
							type="button"
							onClick={async () => {
								try {
									const [llmsRes, fullRes] = await Promise.all([
										fetch("/llms.txt"),
										fetch("/llms-full.txt"),
									]);
									const [llmsText, fullText] = await Promise.all([
										llmsRes.text(),
										fullRes.text(),
									]);
									const combined = `<context_document name="Theme Token - Quick Reference">\n${llmsText}\n</context_document>\n\n<context_document name="Theme Token - Full Documentation">\n${fullText}\n</context_document>`;
									await navigator.clipboard.writeText(combined);
									setCopied("full-context");
									setTimeout(() => setCopied(null), 2000);
								} catch (err) {
									console.error("Failed to copy:", err);
								}
							}}
							className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-sm font-medium transition-all hover:border-primary/50 hover:bg-primary/10"
						>
							{copied === "full-context" ? (
								<>
									<Check className="h-5 w-5 text-green-500" />
									<span className="text-green-600">
										Full system context copied!
									</span>
								</>
							) : (
								<>
									<Copy className="h-5 w-5 text-primary" />
									<span>Copy Full System Context</span>
									<span className="text-xs text-muted-foreground">
										(~8KB for comprehensive AI context)
									</span>
								</>
							)}
						</button>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="grid gap-4 sm:grid-cols-3"
					>
						{/* llms.txt Card */}
						<div className="flex flex-col rounded-lg border border-border bg-card p-6">
							<div className="mb-4 flex items-center gap-4">
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
									<Bot className="h-6 w-6 text-primary" />
								</div>
								<div className="flex-1">
									<h3 className="font-semibold">llms.txt</h3>
									<p className="text-sm text-muted-foreground">
										Quick reference (~2KB)
									</p>
								</div>
							</div>
							<div className="mt-auto flex gap-2">
								<button
									type="button"
									onClick={async () => {
										try {
											const res = await fetch("/llms.txt");
											const text = await res.text();
											const payload = `<context_document name="Theme Token Quick Reference">\n${text}\n</context_document>`;
											await navigator.clipboard.writeText(payload);
											setCopied("llms");
											setTimeout(() => setCopied(null), 2000);
										} catch (err) {
											console.error("Failed to copy:", err);
										}
									}}
									className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
								>
									{copied === "llms" ? (
										<>
											<Check className="h-4 w-4" />
											Copied
										</>
									) : (
										<>
											<Copy className="h-4 w-4" />
											Copy for AI
										</>
									)}
								</button>
								<a
									href="/llms.txt"
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
									title="View raw file"
								>
									<FileText className="h-4 w-4" />
								</a>
							</div>
						</div>

						{/* llms-full.txt Card */}
						<div className="flex flex-col rounded-lg border border-border bg-card p-6">
							<div className="mb-4 flex items-center gap-4">
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
									<FileText className="h-6 w-6 text-primary" />
								</div>
								<div className="flex-1">
									<h3 className="font-semibold">llms-full.txt</h3>
									<p className="text-sm text-muted-foreground">
										Complete docs (~6KB)
									</p>
								</div>
							</div>
							<div className="mt-auto flex gap-2">
								<button
									type="button"
									onClick={async () => {
										try {
											const res = await fetch("/llms-full.txt");
											const text = await res.text();
											const payload = `<context_document name="Theme Token Full Documentation">\n${text}\n</context_document>`;
											await navigator.clipboard.writeText(payload);
											setCopied("llms-full");
											setTimeout(() => setCopied(null), 2000);
										} catch (err) {
											console.error("Failed to copy:", err);
										}
									}}
									className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
								>
									{copied === "llms-full" ? (
										<>
											<Check className="h-4 w-4" />
											Copied
										</>
									) : (
										<>
											<Copy className="h-4 w-4" />
											Copy for AI
										</>
									)}
								</button>
								<a
									href="/llms-full.txt"
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
									title="View raw file"
								>
									<FileText className="h-4 w-4" />
								</a>
							</div>
						</div>

						{/* SDK Card */}
						<div className="flex flex-col rounded-lg border border-border bg-card p-6">
							<div className="mb-4 flex items-center gap-4">
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
									<Package className="h-6 w-6 text-primary" />
								</div>
								<div className="flex-1">
									<h3 className="font-semibold">@theme-token/sdk</h3>
									<p className="text-sm text-muted-foreground">
										TypeScript SDK
									</p>
								</div>
							</div>
							<div className="mt-auto flex gap-2">
								<button
									type="button"
									onClick={() => {
										navigator.clipboard.writeText("bun add @theme-token/sdk");
										setCopied("sdk-install");
										setTimeout(() => setCopied(null), 2000);
									}}
									className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
								>
									{copied === "sdk-install" ? (
										<>
											<Check className="h-4 w-4" />
											Copied
										</>
									) : (
										<>
											<Terminal className="h-4 w-4" />
											Copy Install
										</>
									)}
								</button>
								<a
									href="https://github.com/b-open-io/theme-token-sdk"
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
									title="View on GitHub"
								>
									<svg
										className="h-4 w-4"
										viewBox="0 0 24 24"
										fill="currentColor"
									>
										<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
									</svg>
								</a>
							</div>
						</div>
					</motion.div>

					{/* URL hint for AI tools */}
					<motion.p
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						className="mt-6 text-center text-xs text-muted-foreground"
					>
						AI tools can also fetch directly:{" "}
						<code className="rounded bg-muted px-1.5 py-0.5">
							themetoken.dev/llms.txt
						</code>{" "}
						or{" "}
						<code className="rounded bg-muted px-1.5 py-0.5">
							themetoken.dev/llms-full.txt
						</code>
					</motion.p>
				</PageContainer>
			</section>
		</div>
	);
}
