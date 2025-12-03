"use client";

import { motion } from "framer-motion";
import { Check, Copy, Database, FileCode, Palette, Type } from "lucide-react";
import { useCallback, useState } from "react";

type AssetType = "pattern" | "font" | "theme";

const ASSET_SCHEMAS: Record<
	AssetType,
	{
		icon: typeof Palette;
		label: string;
		description: string;
		example: Record<string, string>;
		fields: Array<{
			name: string;
			type: string;
			badge?: "context" | "subcontext";
			options?: string[];
			description: string;
		}>;
	}
> = {
	pattern: {
		icon: Palette,
		label: "Patterns",
		description: "Tileable SVG backgrounds and textures",
		example: {
			app: "theme-token",
			type: "pattern",
			context: "name",
			name: "Dot Grid",
			subcontext: "render",
			render: "tile",
			tile: "50,50",
			colorMode: "currentColor",
			prompt: "evenly spaced dots",
			contentType: "image/svg+xml",
		},
		fields: [
			{
				name: "context",
				type: "string",
				badge: "context",
				description: 'Always "name" - points to the name field',
			},
			{
				name: "name",
				type: "string",
				description: "Human-readable pattern name (indexed)",
			},
			{
				name: "subcontext",
				type: "string",
				badge: "subcontext",
				description: 'Always "render" - points to render mode',
			},
			{
				name: "render",
				type: "enum",
				options: ["tile", "cover", "contain"],
				description: "How the SVG fills the container",
			},
			{
				name: "tile",
				type: "string",
				description: 'Tile dimensions "width,height" if render=tile',
			},
			{
				name: "colorMode",
				type: "enum",
				options: ["currentColor", "theme", "grayscale"],
				description: "How colors are applied",
			},
			{
				name: "prompt",
				type: "string",
				description: "AI generation prompt (if AI-generated)",
			},
		],
	},
	font: {
		icon: Type,
		label: "Fonts",
		description: "Web fonts in WOFF2, WOFF, or TTF format",
		example: {
			app: "theme-token",
			type: "font",
			context: "name",
			name: "MyFont",
			subcontext: "weight",
			weight: "400",
			style: "normal",
			role: "body",
			author: "John Doe",
			license: "OFL",
			glyphCount: "95",
			contentType: "font/woff2",
		},
		fields: [
			{
				name: "context",
				type: "string",
				badge: "context",
				description: 'Always "name" - points to the name field',
			},
			{
				name: "name",
				type: "string",
				description: "Font family name (indexed)",
			},
			{
				name: "subcontext",
				type: "string",
				badge: "subcontext",
				description: 'Always "weight" - points to font weight',
			},
			{
				name: "weight",
				type: "enum",
				options: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
				description: "CSS font-weight value",
			},
			{
				name: "style",
				type: "enum",
				options: ["normal", "italic", "oblique"],
				description: "CSS font-style value",
			},
			{
				name: "role",
				type: "enum",
				options: ["heading", "body", "mono", "display", "accent"],
				description: "Typographic purpose hint",
			},
			{
				name: "author",
				type: "string",
				description: "Font designer/author",
			},
			{
				name: "license",
				type: "string",
				description: "License identifier (OFL, MIT, etc.)",
			},
			{
				name: "glyphCount",
				type: "number",
				description: "Number of glyphs in the font",
			},
		],
	},
	theme: {
		icon: FileCode,
		label: "Themes",
		description: "Complete color schemes in ThemeToken JSON format",
		example: {
			app: "theme-token",
			type: "theme",
			context: "name",
			name: "Midnight",
			subcontext: "mode",
			mode: "dark",
			colorCount: "12",
			contentType: "application/json",
		},
		fields: [
			{
				name: "context",
				type: "string",
				badge: "context",
				description: 'Always "name" - points to the name field',
			},
			{
				name: "name",
				type: "string",
				description: "Theme name (indexed)",
			},
			{
				name: "subcontext",
				type: "string",
				badge: "subcontext",
				description: 'Always "mode" - points to color mode',
			},
			{
				name: "mode",
				type: "enum",
				options: ["light", "dark", "auto"],
				description: "Color scheme preference",
			},
			{
				name: "colorCount",
				type: "number",
				description: "Number of unique colors in theme",
			},
			{
				name: "author",
				type: "string",
				description: "Theme creator",
			},
			{
				name: "description",
				type: "string",
				description: "Theme description",
			},
		],
	},
};

const INDEXER_CODE = `// How indexers efficiently query assets
function queryAssets(inscriptions, filters) {
  return inscriptions.filter(i => {
    // 1. Filter by app and type
    if (i.app !== "theme-token") return false;
    if (filters.type && i.type !== filters.type) return false;

    // 2. Read context to find the ID field name
    const idField = i.context;        // e.g., "name"
    const variantField = i.subcontext; // e.g., "render"

    // 3. O(1) lookup - no guessing field names
    if (filters.name && i[idField] !== filters.name) return false;
    if (filters.variant && i[variantField] !== filters.variant) return false;

    return true;
  });
}`;

export function OnChainProtocol() {
	const [activeTab, setActiveTab] = useState<AssetType>("pattern");
	const [copied, setCopied] = useState<string | null>(null);
	const [hoveredField, setHoveredField] = useState<string | null>(null);

	const copyToClipboard = useCallback((text: string, id: string) => {
		navigator.clipboard.writeText(text);
		setCopied(id);
		setTimeout(() => setCopied(null), 2000);
	}, []);

	const schema = ASSET_SCHEMAS[activeTab];

	return (
		<div className="space-y-12">
			{/* Context Mapping Visualizer */}
			<div className="rounded-xl border border-border bg-card p-6">
				<h3 className="mb-4 font-mono text-sm text-muted-foreground">
					CONTEXT_MAPPING
				</h3>

				<div className="relative">
					{/* Visual explanation */}
					<div className="mb-6 grid gap-4 md:grid-cols-2">
						{/* Pointer Side */}
						<div className="space-y-3">
							<p className="text-xs font-medium text-muted-foreground">
								Pointer Fields
							</p>
							<div
								className="group flex items-center gap-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 transition-colors hover:border-cyan-500/50"
								onMouseEnter={() => setHoveredField("context")}
								onMouseLeave={() => setHoveredField(null)}
							>
								<div className="h-3 w-3 rounded-full bg-cyan-500" />
								<code className="font-mono text-sm">
									<span className="text-muted-foreground">context:</span>{" "}
									<span className="text-cyan-400">"name"</span>
								</code>
								<svg
									className="ml-auto h-4 w-4 text-cyan-500 opacity-50 group-hover:opacity-100"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d="M5 12h14M12 5l7 7-7 7" />
								</svg>
							</div>
							<div
								className="group flex items-center gap-3 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/5 p-3 transition-colors hover:border-fuchsia-500/50"
								onMouseEnter={() => setHoveredField("subcontext")}
								onMouseLeave={() => setHoveredField(null)}
							>
								<div className="h-3 w-3 rounded-full bg-fuchsia-500" />
								<code className="font-mono text-sm">
									<span className="text-muted-foreground">subcontext:</span>{" "}
									<span className="text-fuchsia-400">
										"
										{activeTab === "pattern"
											? "render"
											: activeTab === "font"
												? "weight"
												: "mode"}
										"
									</span>
								</code>
								<svg
									className="ml-auto h-4 w-4 text-fuchsia-500 opacity-50 group-hover:opacity-100"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d="M5 12h14M12 5l7 7-7 7" />
								</svg>
							</div>
						</div>

						{/* Target Side */}
						<div className="space-y-3">
							<p className="text-xs font-medium text-muted-foreground">
								Target Fields (Indexed)
							</p>
							<div
								className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
									hoveredField === "context"
										? "border-cyan-500 bg-cyan-500/10"
										: "border-border bg-muted/30"
								}`}
							>
								<code className="font-mono text-sm">
									<span className="text-muted-foreground">name:</span>{" "}
									<span className="text-emerald-400">
										"{schema.example.name}"
									</span>
								</code>
								{hoveredField === "context" && (
									<span className="ml-auto rounded bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-400">
										Primary ID
									</span>
								)}
							</div>
							<div
								className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
									hoveredField === "subcontext"
										? "border-fuchsia-500 bg-fuchsia-500/10"
										: "border-border bg-muted/30"
								}`}
							>
								<code className="font-mono text-sm">
									<span className="text-muted-foreground">
										{activeTab === "pattern"
											? "render"
											: activeTab === "font"
												? "weight"
												: "mode"}
										:
									</span>{" "}
									<span className="text-emerald-400">
										"
										{activeTab === "pattern"
											? schema.example.render
											: activeTab === "font"
												? schema.example.weight
												: schema.example.mode}
										"
									</span>
								</code>
								{hoveredField === "subcontext" && (
									<span className="ml-auto rounded bg-fuchsia-500/20 px-2 py-0.5 text-xs text-fuchsia-400">
										Variant
									</span>
								)}
							</div>
						</div>
					</div>

					<p className="text-center text-xs text-muted-foreground">
						<Database className="mr-1 inline h-3 w-3" />
						Indexers read <code className="text-cyan-400">context</code> to know
						which field contains the ID - no guessing required
					</p>
				</div>
			</div>

			{/* Schema Explorer with Tabs */}
			<div className="rounded-xl border border-border bg-card">
				{/* Tab Navigation */}
				<div className="flex border-b border-border">
					{(Object.keys(ASSET_SCHEMAS) as AssetType[]).map((type) => {
						const s = ASSET_SCHEMAS[type];
						const Icon = s.icon;
						return (
							<button
								key={type}
								type="button"
								onClick={() => setActiveTab(type)}
								className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
									activeTab === type
										? "border-b-2 border-primary bg-primary/5 text-foreground"
										: "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
								}`}
							>
								<Icon className="h-4 w-4" />
								{s.label}
							</button>
						);
					})}
				</div>

				{/* Content */}
				<div className="p-6">
					<p className="mb-6 text-sm text-muted-foreground">
						{schema.description}
					</p>

					<div className="grid gap-6 lg:grid-cols-2">
						{/* JSON Preview */}
						<div>
							<div className="mb-2 flex items-center justify-between">
								<h4 className="font-mono text-xs text-muted-foreground">
									MAP_DATA
								</h4>
								<button
									type="button"
									onClick={() =>
										copyToClipboard(
											JSON.stringify(schema.example, null, 2),
											"json",
										)
									}
									className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									{copied === "json" ? (
										<>
											<Check className="h-3 w-3 text-green-500" />
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
							<div className="rounded-lg border border-border bg-black/50 p-4 font-mono text-xs">
								<pre className="overflow-x-auto">
									{Object.entries(schema.example).map(([key, value], i) => {
										const field = schema.fields.find((f) => f.name === key);
										const isContext = field?.badge === "context";
										const isSubcontext = field?.badge === "subcontext";
										const isContextTarget = key === "name";
										const isSubcontextTarget =
											(activeTab === "pattern" && key === "render") ||
											(activeTab === "font" && key === "weight") ||
											(activeTab === "theme" && key === "mode");

										return (
											<div
												key={key}
												className={`transition-colors ${
													hoveredField === key ? "bg-muted/30" : ""
												}`}
												onMouseEnter={() => setHoveredField(key)}
												onMouseLeave={() => setHoveredField(null)}
											>
												<span className="select-none text-muted-foreground/50">
													{String(i + 1).padStart(2, " ")}
												</span>
												{"  "}
												<span
													className={
														isContext
															? "text-cyan-400"
															: isSubcontext
																? "text-fuchsia-400"
																: isContextTarget
																	? "text-cyan-300"
																	: isSubcontextTarget
																		? "text-fuchsia-300"
																		: "text-slate-400"
													}
												>
													"{key}"
												</span>
												<span className="text-slate-500">: </span>
												<span className="text-emerald-400">"{value}"</span>
												{i < Object.keys(schema.example).length - 1 && (
													<span className="text-slate-500">,</span>
												)}
											</div>
										);
									})}
								</pre>
							</div>
						</div>

						{/* Field Specs */}
						<div>
							<h4 className="mb-2 font-mono text-xs text-muted-foreground">
								FIELD_REFERENCE
							</h4>
							<div className="space-y-2">
								{schema.fields.map((field) => (
									<div
										key={field.name}
										className={`rounded-lg border p-3 transition-colors ${
											hoveredField === field.name
												? "border-primary/50 bg-primary/5"
												: "border-border bg-muted/20"
										}`}
										onMouseEnter={() => setHoveredField(field.name)}
										onMouseLeave={() => setHoveredField(null)}
									>
										<div className="mb-1 flex items-center gap-2">
											<code
												className={`font-mono text-sm font-semibold ${
													field.badge === "context"
														? "text-cyan-400"
														: field.badge === "subcontext"
															? "text-fuchsia-400"
															: "text-foreground"
												}`}
											>
												{field.name}
											</code>
											{field.badge && (
												<span
													className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
														field.badge === "context"
															? "bg-cyan-500/20 text-cyan-400"
															: "bg-fuchsia-500/20 text-fuchsia-400"
													}`}
												>
													{field.badge}
												</span>
											)}
											<span className="text-xs text-muted-foreground">
												{field.type}
											</span>
										</div>
										{field.options && (
											<div className="mb-1 flex flex-wrap gap-1">
												{field.options.map((opt) => (
													<span
														key={opt}
														className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
													>
														{opt}
													</span>
												))}
											</div>
										)}
										<p className="text-xs text-muted-foreground">
											{field.description}
										</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Indexer Logic Terminal */}
			<div className="rounded-xl border border-border bg-card p-6">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="font-mono text-sm text-muted-foreground">
						INDEXER_LOGIC
					</h3>
					<button
						type="button"
						onClick={() => copyToClipboard(INDEXER_CODE, "indexer")}
						className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						{copied === "indexer" ? (
							<>
								<Check className="h-3 w-3 text-green-500" />
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

				<div className="rounded-lg border border-border bg-black/50 p-4">
					<pre className="overflow-x-auto font-mono text-xs">
						<code>
							{INDEXER_CODE.split("\n").map((line, i) => {
								// Simple syntax highlighting
								let highlighted = line
									.replace(
										/(\/\/.*)/g,
										'<span class="text-slate-500">$1</span>',
									)
									.replace(
										/\b(function|return|if|const)\b/g,
										'<span class="text-fuchsia-400">$1</span>',
									)
									.replace(
										/(".*?")/g,
										'<span class="text-emerald-400">$1</span>',
									)
									.replace(
										/\b(context|subcontext)\b/g,
										'<span class="text-cyan-400">$1</span>',
									);

								return (
									<div key={i}>
										<span className="select-none text-muted-foreground/50">
											{String(i + 1).padStart(2, " ")}
										</span>
										{"  "}
										<span
											// biome-ignore lint: this is fine for syntax highlighting
											dangerouslySetInnerHTML={{ __html: highlighted }}
										/>
									</div>
								);
							})}
						</code>
					</pre>
				</div>

				<p className="mt-4 text-center text-xs text-muted-foreground">
					The context/subcontext pattern enables O(1) field lookups without
					hardcoding field names
				</p>
			</div>
		</div>
	);
}
