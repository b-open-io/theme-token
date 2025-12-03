"use client";

import { Check, Copy, FileCode, Palette, Type } from "lucide-react";
import { useCallback, useState } from "react";

type AssetType = "pattern" | "font" | "theme";

const ASSET_SCHEMAS: Record<
	AssetType,
	{
		icon: typeof Palette;
		label: string;
		description: string;
		contentInfo: string;
		example: Record<string, string>;
		fields: Array<{
			name: string;
			type: string;
			required?: boolean;
			options?: string[];
			description: string;
		}>;
	}
> = {
	theme: {
		icon: FileCode,
		label: "Themes",
		description: "Complete color schemes in ThemeToken JSON format",
		contentInfo:
			"Theme JSON already contains name, author, colors, and mode - no additional metadata needed beyond app/type for indexer discovery.",
		example: {
			app: "theme-token",
			type: "theme",
		},
		fields: [
			{
				name: "app",
				type: "string",
				required: true,
				description: 'Always "theme-token" - enables indexer filtering',
			},
			{
				name: "type",
				type: "string",
				required: true,
				description: 'Always "theme" - asset type identifier',
			},
		],
	},
	font: {
		icon: Type,
		label: "Fonts",
		description: "Web fonts in WOFF2, WOFF, or TTF format",
		contentInfo:
			"Font binary files don't expose metadata easily. We include name, weight, style, author, license, and aiGenerated flag in MAP data.",
		example: {
			app: "theme-token",
			type: "font",
			name: "MyFont",
			weight: "400",
			style: "normal",
			author: "John Doe",
			license: "OFL",
			aiGenerated: "true",
		},
		fields: [
			{
				name: "app",
				type: "string",
				required: true,
				description: 'Always "theme-token"',
			},
			{
				name: "type",
				type: "string",
				required: true,
				description: 'Always "font"',
			},
			{
				name: "name",
				type: "string",
				required: true,
				description: "Font family name",
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
				description: 'CSS font-style (omit if "normal")',
			},
			{
				name: "author",
				type: "string",
				description: "Font designer/author",
			},
			{
				name: "license",
				type: "string",
				description: "License identifier (OFL, MIT, CC0, etc.)",
			},
			{
				name: "aiGenerated",
				type: "boolean",
				description: '"true" if AI-generated',
			},
		],
	},
	pattern: {
		icon: Palette,
		label: "Patterns",
		description: "Tileable SVG backgrounds and textures",
		contentInfo:
			"SVG content is self-describing. Only the AI prompt (if AI-generated) is stored as provenance.",
		example: {
			app: "theme-token",
			type: "pattern",
			prompt: "evenly spaced dots",
		},
		fields: [
			{
				name: "app",
				type: "string",
				required: true,
				description: 'Always "theme-token"',
			},
			{
				name: "type",
				type: "string",
				required: true,
				description: 'Always "pattern"',
			},
			{
				name: "prompt",
				type: "string",
				description: "AI generation prompt (provenance, if AI-generated)",
			},
		],
	},
};

export function OnChainProtocol() {
	const [activeTab, setActiveTab] = useState<AssetType>("theme");
	const [copied, setCopied] = useState<string | null>(null);
	const [hoveredField, setHoveredField] = useState<string | null>(null);

	const copyToClipboard = useCallback((text: string, id: string) => {
		navigator.clipboard.writeText(text);
		setCopied(id);
		setTimeout(() => setCopied(null), 2000);
	}, []);

	const schema = ASSET_SCHEMAS[activeTab];

	return (
		<div className="space-y-8">
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
					<p className="mb-2 text-sm text-muted-foreground">
						{schema.description}
					</p>
					<p className="mb-6 rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
						{schema.contentInfo}
					</p>

					<div className="grid gap-6 lg:grid-cols-2">
						{/* JSON Preview */}
						<div className="flex flex-col">
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
							<div className="flex-1 overflow-auto rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs">
								<pre>
									{Object.entries(schema.example).map(([key, value], i) => {
										const field = schema.fields.find((f) => f.name === key);
										const isRequired = field?.required;

										return (
											<div
												key={key}
												className={`transition-colors ${
													hoveredField === key ? "bg-muted" : ""
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
														isRequired
															? "text-primary"
															: "text-muted-foreground"
													}
												>
													"{key}"
												</span>
												<span className="text-muted-foreground/50">: </span>
												<span className="text-foreground">"{value}"</span>
												{i < Object.keys(schema.example).length - 1 && (
													<span className="text-muted-foreground/50">,</span>
												)}
											</div>
										);
									})}
								</pre>
							</div>
						</div>

						{/* Field Specs */}
						<div className="flex flex-col">
							<h4 className="mb-2 font-mono text-xs text-muted-foreground">
								FIELD_REFERENCE
							</h4>
							<div className="flex-1 space-y-2 overflow-auto">
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
													field.required ? "text-primary" : "text-foreground"
												}`}
											>
												{field.name}
											</code>
											{field.required && (
												<span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium uppercase text-primary">
													required
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
		</div>
	);
}
