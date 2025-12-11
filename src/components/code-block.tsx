"use client";

import { Check, Copy } from "lucide-react";
import * as React from "react";
import { type Highlighter, createHighlighter } from "shiki";
import { cn } from "@/lib/utils";

let highlighterPromise: Promise<Highlighter> | null = null;

async function getHighlighter() {
	if (!highlighterPromise) {
		highlighterPromise = createHighlighter({
			themes: ["css-variables"],
			langs: ["json", "typescript", "bash", "css", "html"],
		});
	}
	return highlighterPromise;
}

interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
	code: string;
	language?: string;
	showLineNumbers?: boolean;
	showCopy?: boolean;
	filename?: string;
	icon?: React.ReactNode;
}

export function CodeBlock({
	code,
	language = "json",
	className,
	showLineNumbers = false,
	showCopy = true,
	filename,
	icon,
	...props
}: CodeBlockProps) {
	const [html, setHtml] = React.useState<string>("");
	const [copied, setCopied] = React.useState(false);
	const [isLoaded, setIsLoaded] = React.useState(false);

	React.useEffect(() => {
		let mounted = true;

		async function highlight() {
			try {
				const highlighter = await getHighlighter();
				const result = highlighter.codeToHtml(code, {
					lang: language,
					theme: "css-variables",
				});
				if (mounted) {
					setHtml(result);
					setIsLoaded(true);
				}
			} catch (error) {
				console.error("Failed to highlight code:", error);
				// Fallback to plain text if highlighting fails
				if (mounted) setIsLoaded(true);
			}
		}

		highlight();

		return () => {
			mounted = false;
		};
	}, [code, language]);

	const copyToClipboard = React.useCallback(() => {
		navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [code]);

	return (
		<div
			className={cn(
				"relative group rounded-lg border border-border bg-muted/50 text-sm font-mono overflow-hidden",
				className
			)}
			{...props}
		>
			{(filename || icon) && (
				<div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
					<div className="flex items-center gap-2">
						{icon}
						{filename && <span>{filename}</span>}
					</div>
				</div>
			)}
			
			<div className="relative h-full">
				{showCopy && (
					<button
						type="button"
						onClick={copyToClipboard}
						className="absolute right-3 top-3 z-10 p-1.5 rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground group-hover:opacity-100"
						title="Copy code"
					>
						{copied ? (
							<Check className="h-3.5 w-3.5 text-green-500" />
						) : (
							<Copy className="h-3.5 w-3.5" />
						)}
					</button>
				)}

				<div className="overflow-auto h-full p-4">
					{isLoaded && html ? (
						<div dangerouslySetInnerHTML={{ __html: html }} />
					) : (
						<pre className="shiki css-variables" style={{ backgroundColor: 'transparent' }}>
							<code>{code}</code>
						</pre>
					)}
				</div>
			</div>
		</div>
	);
}
