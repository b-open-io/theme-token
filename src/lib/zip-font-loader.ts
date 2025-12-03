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
 * Known open source license patterns to search for in README/LICENSE files
 */
const LICENSE_PATTERNS: Array<{ pattern: RegExp; license: string }> = [
	{ pattern: /SIL Open Font Licen[sc]e/i, license: "OFL" },
	{ pattern: /Open Font Licen[sc]e/i, license: "OFL" },
	{ pattern: /\bOFL\b/i, license: "OFL" },
	{ pattern: /Apache Licen[sc]e.*?2\.0/i, license: "Apache-2.0" },
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
	{ pattern: /Bitstream Vera Licen[sc]e/i, license: "Bitstream Vera" },
];

/**
 * Files to check for license information, in priority order
 */
const LICENSE_FILE_NAMES = [
	"LICENSE",
	"LICENSE.txt",
	"LICENSE.md",
	"COPYING",
	"COPYING.txt",
	"license",
	"license.txt",
	"OFL.txt",
	"OFL-1.1.txt",
	"README.md",
	"README.txt",
	"README",
	"FONTLOG.txt",
	"FONTLOG",
	"FONTINFO.json",
];

/**
 * Font file extensions we support
 */
const FONT_EXTENSIONS = [".woff2", ".woff", ".ttf", ".otf"];

/**
 * Extract license from text content
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
 * Parsed metadata from FONTINFO.json
 */
interface FontInfoData {
	license: string | null;
	name: string | null;
	authors: string[] | null;
	website: string | null;
}

/**
 * Extract metadata from FONTINFO.json if present
 */
function extractFromFontInfo(jsonStr: string): FontInfoData {
	const result: FontInfoData = {
		license: null,
		name: null,
		authors: null,
		website: null,
	};

	try {
		// Handle JSON with comments by stripping them
		const cleanJson = jsonStr.replace(/\/\/.*$/gm, "").replace(/,(\s*[}\]])/g, "$1");
		const info = JSON.parse(cleanJson);

		// Handle nested typeface structure (like Avara's FONTINFO.json)
		const typeface = info.typeface || info;

		// Extract license
		const licenseField =
			typeface.license || typeface.License || typeface.licence || typeface.Licence;
		if (licenseField) {
			result.license = extractLicenseFromText(String(licenseField));
		}

		// Extract name
		result.name = typeface.name || typeface.Name || info.name || null;

		// Extract authors
		const authors = typeface.authors || typeface.author || typeface.Authors || typeface.Author;
		if (Array.isArray(authors)) {
			result.authors = authors.map(String);
		} else if (typeof authors === "string") {
			result.authors = [authors];
		}

		// Extract website
		result.website =
			typeface["project-URL"] ||
			typeface.projectUrl ||
			typeface.website ||
			typeface.url ||
			typeface["repository-URL"] ||
			null;
	} catch {
		// Not valid JSON, ignore
	}

	return result;
}

/**
 * Extract author from README content using common patterns
 */
function extractAuthorFromReadme(readme: string): string[] | null {
	// Look for "Contributors" or "Authors" or "Created by" sections
	const patterns = [
		/##?\s*(?:Contributors|Authors|Credits|Created by|Designed by)\s*\n([\s\S]*?)(?=\n##|\n\n\n|$)/i,
		/(?:Author|Designer|Created by|Designed by)[:\s]+([^\n]+)/i,
	];

	for (const pattern of patterns) {
		const match = readme.match(pattern);
		if (match) {
			const section = match[1];
			// Extract names from markdown list items or inline
			const names: string[] = [];

			// Match markdown links: [Name](url) or plain list items: - Name
			const listMatches = section.matchAll(/[-*]\s*\[([^\]]+)\]|[-*]\s*([^\n\[]+)/g);
			for (const m of listMatches) {
				const name = (m[1] || m[2])?.trim();
				if (name && name.length > 1 && name.length < 50) {
					names.push(name);
				}
			}

			// If no list items, try to get the whole match as a single author
			if (names.length === 0 && match[1]) {
				const cleaned = match[1].trim().replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
				if (cleaned.length > 1 && cleaned.length < 100) {
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
	// Look for specimen/project links
	const patterns = [
		/(?:Visit|View|See).*?(?:specimen|project|website)[^\n]*\((https?:\/\/[^)]+)\)/i,
		/(?:Website|Homepage|Project)[:\s]+(https?:\/\/[^\s\n]+)/i,
		/\[.*?(?:specimen|website|demo).*?\]\((https?:\/\/[^)]+)\)/i,
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

	// First pass: collect all files and look for license info
	const textFiles: Map<string, string> = new Map();

	for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
		if (zipEntry.dir) continue;

		const fileName = relativePath.split("/").pop() || relativePath;
		const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();

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

		// Check if it's a potential license/readme file
		const upperName = fileName.toUpperCase();
		if (
			LICENSE_FILE_NAMES.some(
				(f) => upperName === f.toUpperCase() || relativePath.toUpperCase().endsWith(f.toUpperCase()),
			)
		) {
			const text = await zipEntry.async("string");
			textFiles.set(relativePath, text);

			// Store README content
			if (upperName.startsWith("README")) {
				readme = text;
			}
		}
	}

	// Second pass: extract metadata from FONTINFO.json first (most structured)
	for (const [path, content] of textFiles) {
		const fileName = path.split("/").pop() || path;
		if (fileName.toUpperCase() === "FONTINFO.JSON") {
			const fontInfo = extractFromFontInfo(content);
			if (fontInfo.name) metadata.name = fontInfo.name;
			if (fontInfo.authors) metadata.authors = fontInfo.authors;
			if (fontInfo.license) {
				metadata.license = fontInfo.license;
				metadata.licenseSource = fileName;
			}
			if (fontInfo.website) metadata.website = fontInfo.website;
			break;
		}
	}

	// Third pass: extract license from other files if not found
	if (!metadata.license) {
		for (const licenseName of LICENSE_FILE_NAMES) {
			for (const [path, content] of textFiles) {
				const fileName = path.split("/").pop() || path;
				if (fileName.toUpperCase() === licenseName.toUpperCase()) {
					const license = extractLicenseFromText(content);
					if (license) {
						metadata.license = license;
						metadata.licenseSource = fileName;
						break;
					}
				}
			}
			if (metadata.license) break;
		}
	}

	// Fourth pass: extract missing metadata from README
	if (readme) {
		if (!metadata.authors) {
			metadata.authors = extractAuthorFromReadme(readme);
		}
		if (!metadata.website) {
			metadata.website = extractWebsiteFromReadme(readme);
		}
		// Try to get name from README heading if not found
		if (!metadata.name) {
			const headingMatch = readme.match(/^#\s+([^\n]+)/);
			if (headingMatch) {
				metadata.name = headingMatch[1].trim();
			}
		}
	}

	return {
		fonts,
		metadata,
		readme,
	};
}

/**
 * Convert extracted font to a File object for the existing validation flow
 */
export function extractedFontToFile(font: ExtractedFontFile): File {
	// Create a new Uint8Array copy to ensure ArrayBuffer compatibility
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
