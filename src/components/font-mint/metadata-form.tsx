"use client";

import { AlertTriangle, Check, ExternalLink, Info } from "lucide-react";

export type LicenseType =
	| "CC0_1.0"
	| "SIL_OFL_1.1"
	| "MIT"
	| "APACHE_2.0"
	| "CC_BY_4.0"
	| "PROPRIETARY";

export interface FontMetadata {
	name: string;
	author: string;
	license: LicenseType;
	website: string;
	originalAuthor?: string; // For derived works or redistributed fonts
	isAIGenerated?: boolean;
}

export interface FontAttestations {
	ownsRights: boolean;
	understandsPermanence: boolean;
	acceptsAttribution: boolean;
	oflNoSaleAcknowledged: boolean; // Only for OFL
	aiGeneratedAcknowledged: boolean; // Only for AI-generated
}

interface MetadataFormProps {
	value: FontMetadata;
	onChange: (value: FontMetadata) => void;
	attestations: FontAttestations;
	onAttestationsChange: (attestations: FontAttestations) => void;
	isAIGenerated?: boolean;
}

interface LicenseOption {
	value: LicenseType;
	label: string;
	description: string;
	attributionRequired: boolean;
	spdxId: string;
	url: string;
}

const LICENSE_OPTIONS: LicenseOption[] = [
	{
		value: "CC0_1.0",
		label: "CC0 1.0 (Public Domain)",
		description: "No restrictions. Anyone can use for any purpose.",
		attributionRequired: false,
		spdxId: "CC0-1.0",
		url: "https://creativecommons.org/publicdomain/zero/1.0/",
	},
	{
		value: "SIL_OFL_1.1",
		label: "SIL Open Font License 1.1",
		description: "Industry standard for open fonts. Allows modification and redistribution.",
		attributionRequired: true,
		spdxId: "OFL-1.1",
		url: "https://openfontlicense.org/",
	},
	{
		value: "MIT",
		label: "MIT License",
		description: "Permissive license. Requires copyright notice in copies.",
		attributionRequired: true,
		spdxId: "MIT",
		url: "https://opensource.org/licenses/MIT",
	},
	{
		value: "APACHE_2.0",
		label: "Apache License 2.0",
		description: "Permissive with patent grants. Requires attribution.",
		attributionRequired: true,
		spdxId: "Apache-2.0",
		url: "https://www.apache.org/licenses/LICENSE-2.0",
	},
	{
		value: "CC_BY_4.0",
		label: "Creative Commons Attribution 4.0",
		description: "Share and adapt with attribution. Good for creative works.",
		attributionRequired: true,
		spdxId: "CC-BY-4.0",
		url: "https://creativecommons.org/licenses/by/4.0/",
	},
	{
		value: "PROPRIETARY",
		label: "Proprietary / Custom License",
		description: "All rights reserved. Custom terms apply.",
		attributionRequired: false,
		spdxId: "LicenseRef-Proprietary",
		url: "",
	},
];

export function MetadataForm({
	value,
	onChange,
	attestations,
	onAttestationsChange,
	isAIGenerated = false,
}: MetadataFormProps) {
	const handleChange = (field: keyof FontMetadata, newValue: string | boolean) => {
		onChange({ ...value, [field]: newValue });
	};

	const handleAttestationChange = (field: keyof FontAttestations, checked: boolean) => {
		onAttestationsChange({ ...attestations, [field]: checked });
	};

	const selectedLicense = LICENSE_OPTIONS.find((l) => l.value === value.license);
	const isOFL = value.license === "SIL_OFL_1.1";

	return (
		<div className="rounded border border-border bg-background">
			{/* Header */}
			<div className="border-b border-border px-3 py-2">
				<span className="font-mono text-xs text-muted-foreground">
					{"// MANIFEST_CONFIG"}
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

				{/* Original Author (for derived works) */}
				{selectedLicense?.attributionRequired && (
					<div className="flex items-center gap-3">
						<label
							htmlFor="font-original-author"
							className="w-28 shrink-0 text-muted-foreground"
						>
							ORIGINAL_AUTHOR:
						</label>
						<input
							id="font-original-author"
							type="text"
							value={value.originalAuthor || ""}
							onChange={(e) => handleChange("originalAuthor", e.target.value)}
							placeholder="(if derived work)"
							className="flex-1 rounded border border-border bg-transparent px-2 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
						/>
					</div>
				)}

				{/* License */}
				<div className="space-y-2">
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
								handleChange("license", e.target.value as LicenseType)
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

					{/* License Info */}
					{selectedLicense && (
						<div className="ml-[7.75rem] flex items-start gap-2 rounded border border-border/50 bg-muted/30 p-2">
							<Info className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
							<div className="space-y-1">
								<p className="text-muted-foreground">{selectedLicense.description}</p>
								{selectedLicense.url && (
									<a
										href={selectedLicense.url}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1 text-primary hover:underline"
									>
										View license <ExternalLink className="h-2.5 w-2.5" />
									</a>
								)}
							</div>
						</div>
					)}
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

			{/* Attestations Section */}
			<div className="border-t border-border">
				<div className="border-b border-border px-3 py-2">
					<span className="font-mono text-xs text-muted-foreground">
						{"// LEGAL_ATTESTATIONS"}
					</span>
				</div>

				<div className="space-y-3 p-4 font-mono text-xs">
					{/* Rights Ownership */}
					<label className="flex cursor-pointer items-start gap-3">
						<div className="relative mt-0.5">
							<input
								type="checkbox"
								checked={attestations.ownsRights}
								onChange={(e) => handleAttestationChange("ownsRights", e.target.checked)}
								className="peer sr-only"
							/>
							<div className="h-4 w-4 rounded border border-border bg-transparent peer-checked:border-primary peer-checked:bg-primary/20 peer-focus:ring-1 peer-focus:ring-primary" />
							{attestations.ownsRights && (
								<Check className="absolute inset-0 m-auto h-3 w-3 text-primary" />
							)}
						</div>
						<span className="text-foreground">
							I have the legal right to inscribe this font (I am the creator, have a valid license, or it is in the public domain)
						</span>
					</label>

					{/* Permanence Understanding */}
					<label className="flex cursor-pointer items-start gap-3">
						<div className="relative mt-0.5">
							<input
								type="checkbox"
								checked={attestations.understandsPermanence}
								onChange={(e) => handleAttestationChange("understandsPermanence", e.target.checked)}
								className="peer sr-only"
							/>
							<div className="h-4 w-4 rounded border border-border bg-transparent peer-checked:border-primary peer-checked:bg-primary/20 peer-focus:ring-1 peer-focus:ring-primary" />
							{attestations.understandsPermanence && (
								<Check className="absolute inset-0 m-auto h-3 w-3 text-primary" />
							)}
						</div>
						<span className="text-foreground">
							I understand blockchain inscriptions are permanent and cannot be deleted or modified
						</span>
					</label>

					{/* Attribution Requirement */}
					{selectedLicense?.attributionRequired && (
						<label className="flex cursor-pointer items-start gap-3">
							<div className="relative mt-0.5">
								<input
									type="checkbox"
									checked={attestations.acceptsAttribution}
									onChange={(e) => handleAttestationChange("acceptsAttribution", e.target.checked)}
									className="peer sr-only"
								/>
								<div className="h-4 w-4 rounded border border-border bg-transparent peer-checked:border-primary peer-checked:bg-primary/20 peer-focus:ring-1 peer-focus:ring-primary" />
								{attestations.acceptsAttribution && (
									<Check className="absolute inset-0 m-auto h-3 w-3 text-primary" />
								)}
							</div>
							<span className="text-foreground">
								I will ensure proper attribution is maintained as required by the {selectedLicense.label}
							</span>
						</label>
					)}

					{/* OFL Specific Warning */}
					{isOFL && (
						<div className="space-y-2">
							<div className="flex items-start gap-2 rounded border border-yellow-500/50 bg-yellow-500/10 p-2 text-yellow-600 dark:text-yellow-400">
								<AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
								<div>
									<p className="font-medium">OFL License Notice</p>
									<p className="mt-1 text-yellow-600/80 dark:text-yellow-400/80">
										The SIL OFL prohibits selling the font &ldquo;by itself&rdquo; - it must be bundled with other software. NFT sales of standalone font files may violate this clause. Consider CC0 or MIT for unrestricted commercial use.
									</p>
								</div>
							</div>
							<label className="flex cursor-pointer items-start gap-3">
								<div className="relative mt-0.5">
									<input
										type="checkbox"
										checked={attestations.oflNoSaleAcknowledged}
										onChange={(e) => handleAttestationChange("oflNoSaleAcknowledged", e.target.checked)}
										className="peer sr-only"
									/>
									<div className="h-4 w-4 rounded border border-border bg-transparent peer-checked:border-primary peer-checked:bg-primary/20 peer-focus:ring-1 peer-focus:ring-primary" />
									{attestations.oflNoSaleAcknowledged && (
										<Check className="absolute inset-0 m-auto h-3 w-3 text-primary" />
									)}
								</div>
								<span className="text-foreground">
									I understand the OFL restrictions on standalone font sales
								</span>
							</label>
						</div>
					)}

					{/* AI-Generated Acknowledgment */}
					{isAIGenerated && (
						<div className="space-y-2">
							<div className="flex items-start gap-2 rounded border border-blue-500/50 bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
								<Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
								<div>
									<p className="font-medium">AI-Generated Content Notice</p>
									<p className="mt-1 text-blue-600/80 dark:text-blue-400/80">
										AI-generated works may not be eligible for copyright protection in some jurisdictions. The US Copyright Office (2025) requires &ldquo;sufficient human authorship&rdquo; for registration.
									</p>
								</div>
							</div>
							<label className="flex cursor-pointer items-start gap-3">
								<div className="relative mt-0.5">
									<input
										type="checkbox"
										checked={attestations.aiGeneratedAcknowledged}
										onChange={(e) => handleAttestationChange("aiGeneratedAcknowledged", e.target.checked)}
										className="peer sr-only"
									/>
									<div className="h-4 w-4 rounded border border-border bg-transparent peer-checked:border-primary peer-checked:bg-primary/20 peer-focus:ring-1 peer-focus:ring-primary" />
									{attestations.aiGeneratedAcknowledged && (
										<Check className="absolute inset-0 m-auto h-3 w-3 text-primary" />
									)}
								</div>
								<span className="text-foreground">
									I understand this font was AI-generated and may have limited copyright protection
								</span>
							</label>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// Helper to check if all required attestations are complete
export function areAttestationsComplete(
	attestations: FontAttestations,
	license: LicenseType,
	isAIGenerated: boolean,
): boolean {
	const selectedLicense = LICENSE_OPTIONS.find((l) => l.value === license);

	if (!attestations.ownsRights || !attestations.understandsPermanence) {
		return false;
	}

	if (selectedLicense?.attributionRequired && !attestations.acceptsAttribution) {
		return false;
	}

	if (license === "SIL_OFL_1.1" && !attestations.oflNoSaleAcknowledged) {
		return false;
	}

	if (isAIGenerated && !attestations.aiGeneratedAcknowledged) {
		return false;
	}

	return true;
}

// Get default attestations state
export function getDefaultAttestations(): FontAttestations {
	return {
		ownsRights: false,
		understandsPermanence: false,
		acceptsAttribution: false,
		oflNoSaleAcknowledged: false,
		aiGeneratedAcknowledged: false,
	};
}
