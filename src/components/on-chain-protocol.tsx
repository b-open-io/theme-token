"use client";

import { motion } from "framer-motion";
import {
	Check,
	Copy,
	FileCode,
	FolderKanban,
	Image,
	Palette,
	Type,
} from "lucide-react";
import { useCallback, useState } from "react";
import { CodeBlock } from "@/components/code-block";

type AssetType = "theme" | "font" | "pattern" | "wallpaper" | "project";

interface FieldDef {
	key: string;
	type: string;
	description: string;
}

const FIELDS: FieldDef[] = [
	{ key: "app", type: "string", description: 'Always "theme-token"' },
	{ key: "type", type: "string", description: "Discovery type" },
	{ key: "kind", type: "string", description: "Asset kind" },
	{ key: "mediaType", type: "string", description: "Canonical MIME type" },
	{ key: "name", type: "string", description: "Display name" },
	{ key: "version", type: "string", description: "Semver, e.g. 1.0.0" },
	{ key: "description", type: "string", description: "Short summary" },
	{ key: "author", type: "string", description: "Creator name" },
	{ key: "license", type: "string", description: "OFL, MIT, CC0, etc." },
	{ key: "prompt", type: "string", description: "AI generation prompt" },
	{ key: "provider", type: "string", description: "AI provider" },
	{ key: "model", type: "string", description: "AI model ID" },
];

const BASE_REQUIRED = ["app", "type", "name", "version", "description"];

const FIELD_MAP: Record<AssetType, { active: string[]; required: string[] }> = {
	theme: {
		active: [...BASE_REQUIRED, "prompt", "provider", "model"],
		required: BASE_REQUIRED,
	},
	font: {
		active: [
			...BASE_REQUIRED,
			"kind",
			"mediaType",
			"author",
			"license",
			"prompt",
			"provider",
			"model",
		],
		required: [...BASE_REQUIRED, "kind", "mediaType"],
	},
	pattern: {
		active: [
			...BASE_REQUIRED,
			"kind",
			"mediaType",
			"author",
			"license",
			"prompt",
			"provider",
			"model",
		],
		required: [...BASE_REQUIRED, "kind", "mediaType"],
	},
	wallpaper: {
		active: [
			...BASE_REQUIRED,
			"kind",
			"mediaType",
			"author",
			"license",
			"prompt",
			"provider",
			"model",
		],
		required: [...BASE_REQUIRED, "kind", "mediaType"],
	},
	project: {
		active: [...BASE_REQUIRED, "author"],
		required: BASE_REQUIRED,
	},
};

const JSON_DATA: Record<AssetType, string> = {
	theme: `{
  "app": "theme-token",
  "type": "registry:style",
  "name": "Cyberpunk Neon",
  "version": "1.0.0",
  "description": "Cyberpunk neon theme",
  "prompt": "cyberpunk neon"
}`,
	font: `{
  "app": "theme-token",
  "type": "theme-token:asset",
  "kind": "font",
  "mediaType": "font/woff2",
  "name": "Elegant Serif",
  "version": "1.0.0",
  "description": "Elegant serif typeface",
  "author": "John Doe",
  "license": "OFL",
  "prompt": "elegant serif"
}`,
	pattern: `{
  "app": "theme-token",
  "type": "theme-token:asset",
  "kind": "pattern",
  "mediaType": "image/svg+xml",
  "name": "Dot Grid",
  "version": "1.0.0",
  "description": "Evenly spaced dot grid",
  "author": "Jane Smith",
  "license": "CC0",
  "prompt": "evenly spaced dots"
}`,
	wallpaper: `{
  "app": "theme-token",
  "type": "theme-token:asset",
  "kind": "wallpaper",
  "mediaType": "image/png",
  "name": "Gradient Mesh",
  "version": "1.0.0",
  "description": "Abstract gradient mesh wallpaper",
  "author": "Alex Chen",
  "license": "CC0",
  "prompt": "abstract gradient"
}`,
	project: `{
  "app": "theme-token",
  "type": "registry:base",
  "name": "My Project",
  "version": "1.0.0",
  "description": "Theme project bundle",
  "author": "John Doe"
}`,
};

const ASSET_META: Record<
	AssetType,
	{ icon: typeof Palette; label: string; format: string }
> = {
	theme: { icon: FileCode, label: "Theme", format: "JSON" },
	font: { icon: Type, label: "Font", format: "WOFF2" },
	pattern: { icon: Palette, label: "Pattern", format: "SVG" },
	wallpaper: { icon: Image, label: "Wallpaper", format: "PNG/WebP" },
	project: { icon: FolderKanban, label: "Project", format: "JSON" },
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
					{(
						["theme", "font", "pattern", "wallpaper", "project"] as AssetType[]
					).map((tab) => {
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
								<Icon
									className={`relative z-10 h-3.5 w-3.5 ${active === tab ? "text-primary" : "text-muted-foreground"}`}
								/>
								<span
									className={`relative z-10 hidden sm:inline ${active === tab ? "text-foreground" : "text-muted-foreground"}`}
								>
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
										// biome-ignore lint/a11y/noStaticElementInteractions: hover only toggles a row highlight; no click/keyboard interaction to expose
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
							{Array.from(
								{ length: FIELDS.length - visibleFields.length },
								(_, i) => `spacer-${i}`,
							).map((spacerKey) => (
								<div
									key={spacerKey}
									className="h-9 border-t border-transparent"
								/>
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
									{copied ? (
										<Check className="h-3 w-3 text-green-500" />
									) : (
										<Copy className="h-3 w-3" />
									)}
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
				MAP (Magic Attribute Protocol) metadata tags the package&apos;s{" "}
				<code className="text-primary">ord-fs/json</code> directory manifest —
				the tradeable ordinal — declaring its discovery type. The asset files
				(theme JSON, font binary, SVG) are separate inscriptions the directory
				references.
			</p>
		</div>
	);
}
