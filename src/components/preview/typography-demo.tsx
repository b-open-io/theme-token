"use client";

import { type ThemeToken } from "@theme-token/sdk";
import { DemoSection } from "./utils";

export function TypographyDemo({ theme, mode }: { theme: ThemeToken; mode: "light" | "dark" }) {
	return (
		<DemoSection title="Typography" description="Headings and body text">
			<div
				className="space-y-6 rounded-xl border bg-card p-6"
			>
				<div>
					<p className="mb-2 text-sm font-medium text-muted-foreground">
						Heading 1
					</p>
					<h1 className="text-4xl font-extrabold tracking-tight">
						The quick brown fox jumps
					</h1>
				</div>
				<div>
					<p className="mb-2 text-sm font-medium text-muted-foreground">
						Heading 2
					</p>
					<h2 className="text-2xl font-semibold tracking-tight">
						Over the lazy dog
					</h2>
				</div>
				<div>
					<p className="mb-2 text-sm font-medium text-muted-foreground">
						Body Text
					</p>
					<p className="max-w-2xl text-base leading-7">
						Theme tokens bring the benefits of blockchain to design systems.
						Create beautiful, consistent experiences across your applications with
						tokenized themes that you truly own.
					</p>
				</div>
				<div>
					<p className="mb-2 text-sm font-medium text-muted-foreground">
						Muted Text
					</p>
					<p className="max-w-2xl text-sm text-muted-foreground">
						Secondary text provides additional context without drawing attention
						away from the primary content.
					</p>
				</div>
				<div>
					<p className="mb-2 text-sm font-medium text-muted-foreground">Code</p>
					<code className="rounded bg-muted px-2 py-1 font-mono text-sm">
						const theme = await fetchTheme(origin);
					</code>
				</div>

				{/* Font Info */}
				{(theme.styles[mode]["font-sans"] ||
					theme.styles[mode]["font-serif"] ||
					theme.styles[mode]["font-mono"]) && (
					<div className="rounded-lg bg-muted p-4">
						<p className="mb-2 font-medium">Font Families</p>
						<div className="space-y-1 font-mono text-sm">
							{theme.styles[mode]["font-sans"] && (
								<p>Sans: {theme.styles[mode]["font-sans"]}</p>
							)}
							{theme.styles[mode]["font-serif"] && (
								<p>Serif: {theme.styles[mode]["font-serif"]}</p>
							)}
							{theme.styles[mode]["font-mono"] && (
								<p>Mono: {theme.styles[mode]["font-mono"]}</p>
							)}
						</div>
					</div>
				)}
			</div>
		</DemoSection>
	);
}

