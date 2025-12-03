"use client";

export interface FontMetadata {
	name: string;
	author: string;
	license: "SIL_OFL_1.1" | "APACHE_2.0" | "MIT" | "PROPRIETARY";
	website: string;
}

interface MetadataFormProps {
	value: FontMetadata;
	onChange: (value: FontMetadata) => void;
}

const LICENSE_OPTIONS: { value: FontMetadata["license"]; label: string }[] = [
	{ value: "SIL_OFL_1.1", label: "SIL Open Font License 1.1" },
	{ value: "APACHE_2.0", label: "Apache License 2.0" },
	{ value: "MIT", label: "MIT License" },
	{ value: "PROPRIETARY", label: "Proprietary / Custom" },
];

export function MetadataForm({ value, onChange }: MetadataFormProps) {
	const handleChange = (field: keyof FontMetadata, newValue: string) => {
		onChange({ ...value, [field]: newValue });
	};

	return (
		<div className="rounded border border-border bg-background">
			{/* Header */}
			<div className="border-b border-border px-3 py-2">
				<span className="font-mono text-xs text-muted-foreground">
					// MANIFEST_CONFIG
				</span>
			</div>

			{/* Form Fields */}
			<div className="space-y-3 p-4 font-mono text-xs">
				{/* Font Name */}
				<div className="flex items-center gap-3">
					<label
						htmlFor="font-name"
						className="w-28 shrink-0 text-muted-foreground"
					>
						FONT_NAME:
					</label>
					<input
						id="font-name"
						type="text"
						value={value.name}
						onChange={(e) => handleChange("name", e.target.value)}
						placeholder="My Custom Font"
						className="flex-1 rounded border border-border bg-transparent px-2 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
					/>
				</div>

				{/* Author */}
				<div className="flex items-center gap-3">
					<label
						htmlFor="font-author"
						className="w-28 shrink-0 text-muted-foreground"
					>
						FOUNDRY_AUTHOR:
					</label>
					<input
						id="font-author"
						type="text"
						value={value.author}
						onChange={(e) => handleChange("author", e.target.value)}
						placeholder="Designer Name"
						className="flex-1 rounded border border-border bg-transparent px-2 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
					/>
				</div>

				{/* License */}
				<div className="flex items-center gap-3">
					<label
						htmlFor="font-license"
						className="w-28 shrink-0 text-muted-foreground"
					>
						LICENSE:
					</label>
					<select
						id="font-license"
						value={value.license}
						onChange={(e) =>
							handleChange("license", e.target.value as FontMetadata["license"])
						}
						className="flex-1 rounded border border-border bg-transparent px-2 py-1.5 text-foreground focus:border-primary focus:outline-none"
					>
						{LICENSE_OPTIONS.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</div>

				{/* Website */}
				<div className="flex items-center gap-3">
					<label
						htmlFor="font-website"
						className="w-28 shrink-0 text-muted-foreground"
					>
						WEBSITE:
					</label>
					<input
						id="font-website"
						type="url"
						value={value.website}
						onChange={(e) => handleChange("website", e.target.value)}
						placeholder="https://example.com"
						className="flex-1 rounded border border-border bg-transparent px-2 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
					/>
				</div>
			</div>
		</div>
	);
}
