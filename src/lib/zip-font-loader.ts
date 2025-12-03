import JSZip from "jszip";

export interface ExtractedFontFile {
	name: string;
	data: Uint8Array;
	size: number;
	path: string;
}

export interface ZipFontMetadata {
	name: string | null;
	authors: string[] | null;
	license: string | null;
	licenseSource: string | null;
	website: string | null;
}

export interface ZipFontPackage {
	fonts: ExtractedFontFile[];
	metadata: ZipFontMetadata;
	readme: string | null;
}

/**
 * Known open source license patterns to search for
 */
const LICENSE_PATTERNS: Array<{ pattern: RegExp; license: string }> = [
	{ pattern: /SIL Open Font Licen[sc]e/i, license: "OFL" },
	{ pattern: /Open Font Licen[sc]e/i, license: "OFL" },
	{ pattern: /\bOFL\b(?:-1\.1)?/i, license: "OFL" },
	{ pattern: /Apache Licen[sc]e.*?2\.0/i, license: "Apache-2.0" },
	{ pattern: /\bAPACHE2?\b/i, license: "Apache-2.0" },
	{ pattern: /MIT Licen[sc]e/i, license: "MIT" },
	{ pattern: /\bMIT\b(?=\s+licen[sc]e|\s*\)|\s*,|\s*\.|\s*$)/i, license: "MIT" },
	{ pattern: /BSD.*?Licen[sc]e/i, license: "BSD" },
	{ pattern: /Creative Commons Zero/i, license: "CC0" },
	{ pattern: /\bCC0\b/i, license: "CC0" },
	{ pattern: /Creative Commons/i, license: "CC" },
	{ pattern: /Public Domain/i, license: "Public Domain" },
	{ pattern: /GNU General Public Licen[sc]e/i, license: "GPL" },
	{ pattern: /\bGPL\b/i, license: "GPL" },
	{ pattern: /Ubuntu Font Licen[sc]e/i, license: "UFL" },
	{ pattern: /\bUFL\b/i, license: "UFL" },
	{ pattern: /Bitstream Vera Licen[sc]e/i, license: "Bitstream Vera" },
];

/**
 * Metadata file names to look for, in priority order
 */
const METADATA_FILE_NAMES = [
	// Structured metadata files (highest priority)
	"FONTINFO.json",
	"METADATA.pb",
	"metadata.json",
	"font.json",
	"package.json",
	"info.txt", // FontSpace format
	// License files
	"LICENSE",
	"LICENSE.txt",
	"LICENSE.md",
	"COPYING",
	"COPYING.txt",
	"OFL.txt",
	"OFL-1.1.txt",
	// Documentation
	"README.md",
	"README.txt",
	"README",
	"FONTLOG.txt",
	"FONTLOG.md",
	"FONTLOG",
];

/**
 * Font file extensions we support
 */
const FONT_EXTENSIONS = [".woff2", ".woff", ".ttf", ".otf"];

/**
 * Extract license identifier from text content
 */
function extractLicenseFromText(text: string): string | null {
	for (const { pattern, license } of LICENSE_PATTERNS) {
		if (pattern.test(text)) {
			return license;
		}
	}
	return null;
}

/**
 * Extract author from copyright line: "Copyright (c) 2023 Author Name"
 */
function extractAuthorFromCopyright(text: string): string[] | null {
	const patterns = [
		// "Copyright (c) 2023 The Inter Project Authors (url)"
		/Copyright\s+(?:\(c\)|©)?\s*\d{4}(?:-\d{4})?\s+(?:by\s+)?(.+?)(?:\s*\(|$)/im,
		// "Copyright 2023 Author Name"
		/Copyright\s+\d{4}(?:-\d{4})?\s+(?:by\s+)?([^(\n]+)/im,
		// "(c) Author Name"
		/\(c\)\s*\d{0,4}\s*([^(\n]+)/im,
	];

	for (const pattern of patterns) {
		const match = text.match(pattern);
		if (match?.[1]) {
			const author = match[1]
				.trim()
				.replace(/\s*\([^)]*\)\s*$/, "") // Remove trailing (url)
				.replace(/\s*<[^>]*>\s*$/, "") // Remove trailing <email>
				.replace(/[.,]+$/, "") // Remove trailing punctuation
				.trim();

			if (author.length > 1 && author.length < 100) {
				// Split on common separators for multiple authors
				if (author.includes(" and ")) {
					return author.split(/\s+and\s+/).map((a) => a.trim());
				}
				return [author];
			}
		}
	}
	return null;
}

/**
 * Parse FontSpace info.txt format:
 * license: OFL
 * link: https://www.fontspace.com/...
 */
function extractFromInfoTxt(content: string): Partial<ZipFontMetadata> {
	const result: Partial<ZipFontMetadata> = {};

	// Parse license line
	const licenseMatch = content.match(/^license:\s*(.+)$/im);
	if (licenseMatch) {
		const licenseText = licenseMatch[1].trim();
		result.license = extractLicenseFromText(licenseText);
		// If no standard license detected, check for common FontSpace values
		if (!result.license) {
			if (/freeware/i.test(licenseText)) result.license = "Freeware";
			else if (/demo/i.test(licenseText)) result.license = "Demo";
			else if (/commercial/i.test(licenseText)) result.license = "Commercial";
		}
	}

	// Parse link line
	const linkMatch = content.match(/^link:\s*(https?:\/\/\S+)$/im);
	if (linkMatch) {
		result.website = linkMatch[1].trim();
	}

	return result;
}

/**
 * Parse Google Fonts METADATA.pb format (text-based protocol buffer)
 */
function extractFromMetadataPb(content: string): Partial<ZipFontMetadata> {
	const result: Partial<ZipFontMetadata> = {};

	// Extract name
	const nameMatch = content.match(/^name:\s*"([^"]+)"/m);
	if (nameMatch) result.name = nameMatch[1];

	// Extract designer (author)
	const designerMatch = content.match(/^designer:\s*"([^"]+)"/m);
	if (designerMatch) {
		// Split on comma for multiple designers
		result.authors = designerMatch[1].split(/,\s*/).map((d) => d.trim());
	}

	// Extract license
	const licenseMatch = content.match(/^license:\s*"([^"]+)"/m);
	if (licenseMatch) {
		result.license = extractLicenseFromText(licenseMatch[1]);
	}

	// Extract minisite_url (website)
	const urlMatch = content.match(/^minisite_url:\s*"([^"]+)"/m);
	if (urlMatch) result.website = urlMatch[1];

	// Fallback to source repository URL
	if (!result.website) {
		const sourceMatch = content.match(/repository_url:\s*"([^"]+)"/m);
		if (sourceMatch) result.website = sourceMatch[1];
	}

	return result;
}

/**
 * Parse package.json (NPM-style font packages like Fontsource)
 */
function extractFromPackageJson(content: string): Partial<ZipFontMetadata> {
	const result: Partial<ZipFontMetadata> = {};

	try {
		const pkg = JSON.parse(content);

		// Extract name (remove scope like @fontsource/)
		if (pkg.name) {
			const cleanName = pkg.name.replace(/^@[^/]+\//, "").replace(/-/g, " ");
			// Capitalize first letter of each word
			result.name = cleanName.replace(/\b\w/g, (c: string) => c.toUpperCase());
		}

		// Extract author
		if (pkg.author) {
			if (typeof pkg.author === "string") {
				// "Author Name <email>" format
				const authorName = pkg.author.replace(/<[^>]+>/, "").trim();
				result.authors = [authorName];
			} else if (pkg.author.name) {
				result.authors = [pkg.author.name];
			}
		}

		// Extract license
		if (pkg.license) {
			result.license = extractLicenseFromText(pkg.license);
		}

		// Extract homepage/repository
		result.website = pkg.homepage || pkg.repository?.url || null;
		if (result.website) {
			// Clean up git URLs
			result.website = result.website
				.replace(/^git\+/, "")
				.replace(/\.git$/, "");
		}
	} catch {
		// Invalid JSON
	}

	return result;
}

/**
 * Parse FONTINFO.json (Type Design Boilerplate format)
 */
function extractFromFontInfo(content: string): Partial<ZipFontMetadata> {
	const result: Partial<ZipFontMetadata> = {};

	try {
		// Handle JSON with comments by stripping them
		const cleanJson = content.replace(/\/\/.*$/gm, "").replace(/,(\s*[}\]])/g, "$1");
		const info = JSON.parse(cleanJson);

		// Handle nested typeface structure
		const typeface = info.typeface || info;

		// Extract license
		const licenseField = typeface.license || typeface.License || typeface.licence || typeface.Licence;
		if (licenseField) {
			result.license = extractLicenseFromText(String(licenseField));
		}

		// Extract name
		result.name = typeface.name || typeface.Name || info.name || null;

		// Extract authors
		const authors = typeface.authors || typeface.author || typeface.Authors || typeface.Author ||
			typeface.designer || typeface.Designer;
		if (Array.isArray(authors)) {
			result.authors = authors.map(String);
		} else if (typeof authors === "string") {
			result.authors = authors.split(/,\s*/).map((a) => a.trim());
		}

		// Extract website
		result.website =
			typeface["project-URL"] ||
			typeface.projectUrl ||
			typeface.projectURL ||
			typeface.website ||
			typeface.url ||
			typeface.homepage ||
			typeface["repository-URL"] ||
			null;
	} catch {
		// Invalid JSON
	}

	return result;
}

/**
 * Parse generic metadata.json or font.json
 */
function extractFromGenericJson(content: string): Partial<ZipFontMetadata> {
	const result: Partial<ZipFontMetadata> = {};

	try {
		const data = JSON.parse(content);

		// Try common field names
		result.name = data.name || data.family || data.fontFamily || data.font_name || null;

		// Author fields
		const author = data.author || data.designer || data.creator || data.authors || data.designers;
		if (Array.isArray(author)) {
			result.authors = author.map(String);
		} else if (typeof author === "string") {
			result.authors = [author];
		}

		// License
		const license = data.license || data.licence;
		if (license) {
			result.license = extractLicenseFromText(String(license));
		}

		// Website
		result.website = data.website || data.homepage || data.url || data.repository || null;
	} catch {
		// Invalid JSON
	}

	return result;
}

/**
 * Extract author from README content using common patterns
 */
function extractAuthorFromReadme(readme: string): string[] | null {
	const patterns = [
		// Section headers with list
		/##?\s*(?:Contributors?|Authors?|Credits?|Created by|Designed by|Designer)\s*\n([\s\S]*?)(?=\n##|\n\n\n|$)/i,
		// Inline patterns
		/(?:Author|Designer|Created by|Designed by|Type design(?:er)?)[:\s]+([^\n]+)/i,
		// "by Author Name" pattern
		/(?:^|\n)\s*by\s+([A-Z][a-zA-Z\s]+?)(?:\s*[(\n]|$)/m,
	];

	for (const pattern of patterns) {
		const match = readme.match(pattern);
		if (match) {
			const section = match[1];
			const names: string[] = [];

			// Match markdown links: [Name](url) or plain list items: - Name
			const listMatches = section.matchAll(/[-*]\s*\[([^\]]+)\]|[-*]\s+([^\n\[]+)/g);
			for (const m of listMatches) {
				const name = (m[1] || m[2])?.trim();
				if (name && name.length > 1 && name.length < 50 && !/^http/i.test(name)) {
					names.push(name);
				}
			}

			// If no list items, try to get the whole match as a single author
			if (names.length === 0 && match[1]) {
				const cleaned = match[1]
					.trim()
					.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove markdown links
					.replace(/\s*\([^)]*\)/g, "") // Remove parentheticals
					.trim();

				if (cleaned.length > 1 && cleaned.length < 100 && !/^http/i.test(cleaned)) {
					names.push(cleaned);
				}
			}

			if (names.length > 0) {
				return names;
			}
		}
	}

	return null;
}

/**
 * Extract website from README content
 */
function extractWebsiteFromReadme(readme: string): string | null {
	const patterns = [
		// Specimen/project links in markdown
		/(?:Visit|View|See).*?(?:specimen|project|website)[^\n]*\((https?:\/\/[^)]+)\)/i,
		/\[.*?(?:specimen|website|demo|homepage).*?\]\((https?:\/\/[^)]+)\)/i,
		// Labeled URLs
		/(?:Website|Homepage|Project|Demo)[:\s]+(https?:\/\/[^\s\n]+)/i,
		// Repository links
		/(?:Repository|Source|GitHub)[:\s]+(https?:\/\/[^\s\n]+)/i,
	];

	for (const pattern of patterns) {
		const match = readme.match(pattern);
		if (match?.[1]) {
			return match[1];
		}
	}

	return null;
}

/**
 * Try to extract font name from filename
 */
function extractNameFromFontFile(filename: string): string | null {
	// Remove extension
	let name = filename.replace(/\.(woff2?|ttf|otf)$/i, "");

	// Remove common suffixes like -Regular, -Bold, etc.
	name = name.replace(/[-_]?(Regular|Bold|Italic|Light|Medium|Thin|Black|Heavy|Book|Normal|Variable|VF|Var).*$/i, "");

	// Remove "Demo" suffix
	name = name.replace(/[-_]?Demo$/i, "");

	// Convert camelCase or PascalCase to spaces
	name = name.replace(/([a-z])([A-Z])/g, "$1 $2");

	// Replace dashes/underscores with spaces
	name = name.replace(/[-_]+/g, " ");

	// Clean up
	name = name.trim();

	if (name.length > 1) {
		return name;
	}
	return null;
}

/**
 * Load and parse a zip file containing font files
 */
export async function loadFontZip(zipFile: File): Promise<ZipFontPackage> {
	const zip = await JSZip.loadAsync(zipFile);
	const fonts: ExtractedFontFile[] = [];
	const metadata: ZipFontMetadata = {
		name: null,
		authors: null,
		license: null,
		licenseSource: null,
		website: null,
	};
	let readme: string | null = null;

	// Collect all files
	const textFiles: Map<string, string> = new Map();

	for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
		if (zipEntry.dir) continue;

		const fileName = relativePath.split("/").pop() || relativePath;
		const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
		const upperName = fileName.toUpperCase();

		// Check if it's a font file
		if (FONT_EXTENSIONS.includes(ext)) {
			const data = await zipEntry.async("uint8array");
			fonts.push({
				name: fileName,
				data,
				size: data.length,
				path: relativePath,
			});
		}

		// Check if it's a metadata/license/readme file
		const isMetadataFile = METADATA_FILE_NAMES.some(
			(f) => upperName === f.toUpperCase() || fileName.toLowerCase() === f.toLowerCase(),
		);

		// Also check for common patterns in subdirectories
		const isInMiscFolder = /^misc\//i.test(relativePath) || /\/misc\//i.test(relativePath);
		const isTextFile = /\.(txt|md|json|pb)$/i.test(fileName) || !/\./i.test(fileName);

		if (isMetadataFile || (isInMiscFolder && isTextFile)) {
			try {
				const text = await zipEntry.async("string");
				textFiles.set(relativePath, text);

				if (upperName.startsWith("README")) {
					readme = text;
				}
			} catch {
				// Binary file, skip
			}
		}
	}

	// Process metadata files in priority order
	const processedFiles = new Set<string>();

	// 1. FONTINFO.json (Type Design Boilerplate)
	for (const [path, content] of textFiles) {
		const fileName = path.split("/").pop()?.toLowerCase();
		if (fileName === "fontinfo.json") {
			const extracted = extractFromFontInfo(content);
			mergeMetadata(metadata, extracted, fileName);
			processedFiles.add(path);
		}
	}

	// 2. METADATA.pb (Google Fonts)
	for (const [path, content] of textFiles) {
		const fileName = path.split("/").pop()?.toLowerCase();
		if (fileName === "metadata.pb") {
			const extracted = extractFromMetadataPb(content);
			mergeMetadata(metadata, extracted, fileName);
			processedFiles.add(path);
		}
	}

	// 3. package.json (NPM packages)
	for (const [path, content] of textFiles) {
		const fileName = path.split("/").pop()?.toLowerCase();
		if (fileName === "package.json") {
			const extracted = extractFromPackageJson(content);
			mergeMetadata(metadata, extracted, fileName);
			processedFiles.add(path);
		}
	}

	// 4. info.txt (FontSpace)
	for (const [path, content] of textFiles) {
		const fileName = path.split("/").pop()?.toLowerCase();
		if (fileName === "info.txt") {
			const extracted = extractFromInfoTxt(content);
			mergeMetadata(metadata, extracted, fileName);
			processedFiles.add(path);
		}
	}

	// 5. Generic JSON files
	for (const [path, content] of textFiles) {
		const fileName = path.split("/").pop()?.toLowerCase();
		if ((fileName === "metadata.json" || fileName === "font.json") && !processedFiles.has(path)) {
			const extracted = extractFromGenericJson(content);
			mergeMetadata(metadata, extracted, fileName);
			processedFiles.add(path);
		}
	}

	// 6. LICENSE files - extract license and author from copyright
	for (const [path, content] of textFiles) {
		const fileName = path.split("/").pop()?.toUpperCase() || "";
		if (
			fileName.startsWith("LICENSE") ||
			fileName.startsWith("COPYING") ||
			fileName.startsWith("OFL")
		) {
			if (!metadata.license) {
				const license = extractLicenseFromText(content);
				if (license) {
					metadata.license = license;
					metadata.licenseSource = path.split("/").pop() || null;
				}
			}
			if (!metadata.authors) {
				metadata.authors = extractAuthorFromCopyright(content);
			}
		}
	}

	// 7. README files - extract remaining metadata
	if (readme) {
		if (!metadata.authors) {
			metadata.authors = extractAuthorFromReadme(readme);
		}
		if (!metadata.website) {
			metadata.website = extractWebsiteFromReadme(readme);
		}
		if (!metadata.name) {
			const headingMatch = readme.match(/^#\s+([^\n]+)/);
			if (headingMatch) {
				metadata.name = headingMatch[1].trim();
			}
		}
		if (!metadata.license) {
			metadata.license = extractLicenseFromText(readme);
			if (metadata.license) {
				metadata.licenseSource = "README";
			}
		}
	}

	// 8. Fallback: try to get name from font filename
	if (!metadata.name && fonts.length > 0) {
		metadata.name = extractNameFromFontFile(fonts[0].name);
	}

	return {
		fonts,
		metadata,
		readme,
	};
}

/**
 * Merge extracted metadata into main metadata object (only fill empty fields)
 */
function mergeMetadata(
	target: ZipFontMetadata,
	source: Partial<ZipFontMetadata>,
	sourceName?: string,
): void {
	if (!target.name && source.name) target.name = source.name;
	if (!target.authors && source.authors) target.authors = source.authors;
	if (!target.license && source.license) {
		target.license = source.license;
		target.licenseSource = sourceName || null;
	}
	if (!target.website && source.website) target.website = source.website;
}

/**
 * Convert extracted font to a File object for the existing validation flow
 */
export function extractedFontToFile(font: ExtractedFontFile): File {
	const copy = new Uint8Array(font.data);
	const blob = new Blob([copy], { type: getMimeType(font.name) });
	return new File([blob], font.name, { type: getMimeType(font.name) });
}

/**
 * Get MIME type for font file
 */
function getMimeType(filename: string): string {
	const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
	switch (ext) {
		case ".woff2":
			return "font/woff2";
		case ".woff":
			return "font/woff";
		case ".ttf":
			return "font/ttf";
		case ".otf":
			return "font/otf";
		default:
			return "application/octet-stream";
	}
}

/**
 * Check if a file is a zip file
 */
export function isZipFile(file: File): boolean {
	return (
		file.type === "application/zip" ||
		file.type === "application/x-zip-compressed" ||
		file.name.toLowerCase().endsWith(".zip")
	);
}
