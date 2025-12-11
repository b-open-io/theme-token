"use client";

import { motion } from "framer-motion";
import { Check, Copy, FileCode, Image, Palette, Shapes, Type } from "lucide-react";
import { useCallback, useState } from "react";
import { CodeBlock } from "@/components/code-block";

type AssetType = "theme" | "font" | "tile" | "wallpaper" | "icon";

interface FieldDef {
	key: string;
	type: string;
	description: string;
}

const FIELDS: FieldDef[] = [
	{ key: "app", type: "string", description: "Always \"theme-token\"" },
	{ key: "type", type: "string", description: "Asset type identifier" },
	{ key: "name", type: "string", description: "Display name" },
	{ key: "author", type: "string", description: "Creator name" },
	{ key: "license", type: "string", description: "OFL, MIT, CC0, etc." },
	{ key: "prompt", type: "string", description: "AI generation prompt" },
	{ key: "provider", type: "string", description: "AI provider" },
	{ key: "model", type: "string", description: "AI model ID" },
];

const FIELD_MAP: Record<AssetType, { active: string[]; required: string[] }> = {
	theme: {
		active: ["app", "type", "prompt", "provider", "model"],
		required: ["app", "type"],
	},
	font: {
		active: ["app", "type", "author", "license", "prompt", "provider", "model"],
		required: ["app", "type"],
	},
	tile: {
		active: ["app", "type", "name", "author", "license", "prompt", "provider", "model"],
		required: ["app", "type"],
	},
	wallpaper: {
		active: ["app", "type", "name", "author", "license", "prompt", "provider", "model"],
		required: ["app", "type"],
	},
	icon: {
		active: ["app", "type", "name", "author", "license", "prompt", "provider", "model"],
		required: ["app", "type"],
	},
};

const JSON_DATA: Record<AssetType, string> = {
	theme: `{
  "app": "theme-token",
  "type": "theme",
  "prompt": "cyberpunk neon",
  "provider": "anthropic",
  "model": "claude-opus-4-5"
}`,
	font: `{
  "app": "theme-token",
  "type": "font",
  "author": "John Doe",
  "license": "OFL",
  "prompt": "elegant serif",
  "provider": "anthropic",
  "model": "claude-opus-4-5"
}`,
	tile: `{
  "app": "theme-token",
  "type": "tile",
  "name": "Dot Grid",
  "author": "Jane Smith",
  "license": "CC0",
  "prompt": "evenly spaced dots",
  "provider": "google",
  "model": "gemini-2.5-flash"
}`,
	wallpaper: `{
  "app": "theme-token",
  "type": "wallpaper",
  "name": "Gradient Mesh",
  "author": "Alex Chen",
  "license": "CC0",
  "prompt": "abstract gradient",
  "provider": "google",
  "model": "imagen-3"
}`,
	icon: `{
  "app": "theme-token",
  "type": "icon",
  "name": "Settings",
  "author": "Icon Studio",
  "license": "CC0",
  "prompt": "minimal gear icon",
  "provider": "google",
  "model": "gemini-2.5-flash"
}`,
};

const ASSET_META: Record<AssetType, { icon: typeof Palette; label: string; format: string }> = {
	theme: { icon: FileCode, label: "Theme", format: "JSON" },
	font: { icon: Type, label: "Font", format: "WOFF2" },
	tile: { icon: Palette, label: "Tile", format: "SVG" },
	wallpaper: { icon: Image, label: "Wallpaper", format: "PNG/WebP" },
	icon: { icon: Shapes, label: "Icon", format: "SVG" },
};

export function OnChainProtocol() {
	const [active, setActive] = useState<AssetType>("theme");
	const [copied, setCopied] = useState(false);
	const [hoveredField, setHoveredField] = useState<string | null>(null);

	const copyToClipboard = useCallback(() => {
		navigator.clipboard.writeText(JSON_DATA[active]);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [active]);

	const activeFields = FIELD_MAP[active].active;
	const requiredFields = FIELD_MAP[active].required;
	const visibleFields = FIELDS.filter((f) => activeFields.includes(f.key));

	return (
		<div className="space-y-4">
			{/* Compact Tab Strip */}
			<div className="flex justify-center">
				<div className="inline-flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
					{(["theme", "font", "tile", "wallpaper", "icon"] as AssetType[]).map((tab) => {
						const meta = ASSET_META[tab];
						const Icon = meta.icon;
						return (
							<button
								key={tab}
								type="button"
								onClick={() => setActive(tab)}
								className="relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
							>
								{active === tab && (
									<motion.div
										layoutId="protocol-tab"
										className="absolute inset-0 rounded-md bg-background shadow-sm"
										transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
									/>
								)}
								<Icon className={`relative z-10 h-3.5 w-3.5 ${active === tab ? "text-primary" : "text-muted-foreground"}`} />
								<span className={`relative z-10 hidden sm:inline ${active === tab ? "text-foreground" : "text-muted-foreground"}`}>
									{meta.label}
								</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* Side-by-Side Layout */}
			<div className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-border bg-card">
				<div className="grid grid-cols-1 lg:grid-cols-12">
					{/* Left: Field Specs */}
					<div className="border-b border-border bg-muted/20 lg:col-span-5 lg:border-b-0 lg:border-r">
						<div className="border-b border-border px-4 py-2">
							<span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
								{ASSET_META[active].label} Fields
							</span>
						</div>
						{/* Visible fields + spacer to maintain 8-row height */}
						<div className="flex flex-col">
							<div className="divide-y divide-border/50">
								{visibleFields.map((field) => {
									const isRequired = requiredFields.includes(field.key);
									return (
										<div
											key={field.key}
											onMouseEnter={() => setHoveredField(field.key)}
											onMouseLeave={() => setHoveredField(null)}
											className={`flex items-center justify-between px-4 py-2 transition-colors ${
												hoveredField === field.key ? "bg-primary/5" : ""
											}`}
										>
											<div className="flex items-center gap-2">
												<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary">
													{field.key}
												</code>
												<span className="hidden text-[10px] text-muted-foreground sm:inline">
													{field.description}
												</span>
											</div>
											<span
												className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
													isRequired
														? "bg-primary/10 text-primary"
														: "bg-muted text-muted-foreground"
												}`}
											>
												{isRequired ? "req" : "opt"}
											</span>
										</div>
									);
								})}
							</div>
							{/* Spacer rows to maintain consistent height - each row ~36px */}
							{Array.from({ length: FIELDS.length - visibleFields.length }).map((_, i) => (
								<div key={`spacer-${i}`} className="h-9 border-t border-transparent" />
							))}
						</div>
					</div>

					{/* Right: JSON Preview */}
					<div className="flex flex-col lg:col-span-7 bg-muted/10">
						<div className="flex items-center justify-between border-b border-border px-4 py-2 bg-muted/30">
							<span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
								MAP_DATA
							</span>
							<div className="flex items-center gap-2">
								<span className="rounded border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground">
									{ASSET_META[active].format}
								</span>
								<button
									type="button"
									onClick={copyToClipboard}
									className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									{copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
									{copied ? "copied" : "copy"}
								</button>
							</div>
						</div>
						<motion.div
							key={active}
							initial={{ opacity: 0, filter: "blur(2px)" }}
							animate={{ opacity: 1, filter: "blur(0px)" }}
							transition={{ duration: 0.2 }}
							className="flex-1"
						>
							<CodeBlock
								code={JSON_DATA[active]}
								language="json"
								className="h-full min-h-[350px] border-none rounded-none bg-transparent"
								showCopy={false}
							/>
						</motion.div>
					</div>
				</div>
			</div>

			{/* Compact Footer Note */}
			<p className="mx-auto max-w-2xl text-center text-[10px] text-muted-foreground">
				MAP (Magic Attribute Protocol) metadata is inscribed alongside the asset content.
				Theme JSON includes name, author, cssVars. Font metadata is embedded in the binary.
			</p>
		</div>
	);
}
