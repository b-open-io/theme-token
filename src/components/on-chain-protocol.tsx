"use client";

import { motion } from "framer-motion";
import { Check, Copy, FileCode, Palette, Type } from "lucide-react";
import { useCallback, useState } from "react";

type AssetType = "theme" | "font" | "pattern";

// All possible fields across all asset types (union)
const ALL_FIELDS = [
	{
		key: "app",
		type: "string",
		description: 'Always "theme-token" - enables indexer filtering',
	},
	{
		key: "type",
		type: "string",
		description: "Asset type identifier (theme, font, pattern)",
	},
	{
		key: "name",
		type: "string",
		description: "Display name for the asset",
	},
	{
		key: "author",
		type: "string",
		description: "Creator/designer name",
	},
	{
		key: "license",
		type: "string",
		description: "License identifier (OFL, MIT, CC0, etc.)",
	},
	{
		key: "prompt",
		type: "string",
		description: "AI generation prompt (provenance for AI-created assets)",
	},
];

// Which fields are active for each asset type, and which are required
const FIELD_MAP: Record<AssetType, { active: string[]; required: string[] }> = {
	theme: {
		active: ["app", "type"],
		required: ["app", "type"],
	},
	font: {
		active: ["app", "type", "author", "license", "prompt"],
		required: ["app", "type"],
	},
	pattern: {
		active: ["app", "type", "name", "author", "license", "prompt"],
		required: ["app", "type", "license"],
	},
};

// JSON examples for each type
const JSON_DATA: Record<AssetType, string> = {
	theme: `{
  "app": "theme-token",
  "type": "theme"
}`,
	font: `{
  "app": "theme-token",
  "type": "font",
  "author": "John Doe",
  "license": "OFL",
  "prompt": "elegant serif with tall ascenders"
}`,
	pattern: `{
  "app": "theme-token",
  "type": "pattern",
  "name": "Dot Grid",
  "author": "Jane Doe",
  "license": "CC0",
  "prompt": "evenly spaced dots"
}`,
};

// Content info for each type
const CONTENT_INFO: Record<AssetType, string> = {
	theme:
		"Theme JSON already contains name, author, colors, and mode - no additional metadata needed beyond app/type for indexer discovery.",
	font:
		"Font name, weight, and style are embedded in the binary. Only author, license, and AI prompt go in metadata.",
	pattern:
		"Patterns include name, author, and license metadata. License defaults to CC0 (public domain) if not specified.",
};

const ASSET_INFO: Record<
	AssetType,
	{ icon: typeof Palette; label: string; description: string }
> = {
	theme: {
		icon: FileCode,
		label: "Theme",
		description: "Complete color schemes in ThemeToken JSON format",
	},
	font: {
		icon: Type,
		label: "Font",
		description: "Web fonts in WOFF2, WOFF, or TTF format",
	},
	pattern: {
		icon: Palette,
		label: "Pattern",
		description: "Tileable SVG backgrounds and textures",
	},
};

export function OnChainProtocol() {
	const [active, setActive] = useState<AssetType>("theme");
	const [copied, setCopied] = useState(false);

	const copyToClipboard = useCallback(() => {
		navigator.clipboard.writeText(JSON_DATA[active]);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [active]);

	const activeFields = FIELD_MAP[active].active;
	const requiredFields = FIELD_MAP[active].required;

	return (
		<div className="space-y-6">
			{/* Segmented Control */}
			<div className="flex justify-center">
				<div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
					{(["theme", "font", "pattern"] as AssetType[]).map((tab) => {
						const info = ASSET_INFO[tab];
						const Icon = info.icon;
						return (
							<button
								key={tab}
								type="button"
								onClick={() => setActive(tab)}
								className="relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors sm:px-6"
							>
								{active === tab && (
									<motion.div
										layoutId="protocol-active-tab"
										className="absolute inset-0 rounded-md bg-background shadow-sm"
										transition={{
											type: "spring",
											bounce: 0.15,
											duration: 0.5,
										}}
									/>
								)}
								<Icon
									className={`relative z-10 h-4 w-4 ${
										active === tab
											? "text-primary"
											: "text-muted-foreground"
									}`}
								/>
								<span
									className={`relative z-10 hidden sm:inline ${
										active === tab
											? "text-foreground"
											: "text-muted-foreground"
									}`}
								>
									{info.label}
								</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* Content Info */}
			<motion.p
				key={`info-${active}`}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="mx-auto max-w-2xl rounded-lg bg-muted/30 p-3 text-center text-xs text-muted-foreground"
			>
				{CONTENT_INFO[active]}
			</motion.p>

			{/* Code Preview (Fixed Height) */}
			<div className="relative mx-auto max-w-2xl overflow-hidden rounded-xl border border-border bg-card">
				{/* Header bar */}
				<div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
					<span className="font-mono text-xs text-muted-foreground">
						MAP_DATA
					</span>
					<button
						type="button"
						onClick={copyToClipboard}
						className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						{copied ? (
							<>
								<Check className="h-3 w-3 text-primary" />
								Copied
							</>
						) : (
							<>
								<Copy className="h-3 w-3" />
								Copy
							</>
						)}
					</button>
				</div>

				{/* JSON with fixed height */}
				<div className="h-48 overflow-auto p-4">
					<motion.pre
						key={active}
						initial={{ opacity: 0, filter: "blur(4px)" }}
						animate={{ opacity: 1, filter: "blur(0px)" }}
						transition={{ duration: 0.3 }}
						className="font-mono text-sm"
					>
						<code className="text-primary">{JSON_DATA[active]}</code>
					</motion.pre>
				</div>
			</div>

			{/* Unified Field Matrix */}
			<div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-border bg-card">
				<div className="border-b border-border bg-muted/30 px-4 py-2">
					<span className="font-mono text-xs text-muted-foreground">
						FIELD_REFERENCE
					</span>
				</div>

				<div className="divide-y divide-border">
					{ALL_FIELDS.map((field) => {
						const isActive = activeFields.includes(field.key);
						const isRequired = requiredFields.includes(field.key);

						return (
							<div
								key={field.key}
								className={`flex items-center gap-4 px-4 py-3 transition-all duration-300 ${
									isActive ? "" : "opacity-30"
								}`}
							>
								{/* Field name */}
								<div className="w-20 shrink-0">
									<code
										className={`rounded border px-2 py-1 font-mono text-xs ${
											isActive
												? isRequired
													? "border-primary/30 bg-primary/10 text-primary"
													: "border-border bg-muted text-foreground"
												: "border-border bg-muted/50 text-muted-foreground"
										}`}
									>
										{field.key}
									</code>
								</div>

								{/* Type */}
								<div className="w-16 shrink-0">
									<span className="font-mono text-xs text-muted-foreground">
										{field.type}
									</span>
								</div>

								{/* Description */}
								<div className="min-w-0 flex-1">
									<span className="text-xs text-muted-foreground">
										{field.description}
									</span>
								</div>

								{/* Status */}
								<div className="w-20 shrink-0 text-right">
									{isActive ? (
										isRequired ? (
											<span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
												<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
												required
											</span>
										) : (
											<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
												optional
											</span>
										)
									) : (
										<span className="text-[10px] text-muted-foreground/50">
											—
										</span>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
