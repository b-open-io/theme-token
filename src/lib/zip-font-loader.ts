import JSZip from "jszip";

export interface ExtractedFontFile {
	name: string;
	data: Uint8Array;
	size: number;
	path: string;
}

export interface ZipFontPackage {
	fonts: ExtractedFontFile[];
	detectedLicense: string | null;
	licenseSource: string | null;
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
 * Extract license from FONTINFO.json if present
 */
function extractLicenseFromFontInfo(jsonStr: string): string | null {
	try {
		const info = JSON.parse(jsonStr);
		// Check common fields
		const licenseField =
			info.license || info.License || info.licence || info.Licence;
		if (licenseField) {
			return extractLicenseFromText(licenseField);
		}
	} catch {
		// Not valid JSON, ignore
	}
	return null;
}

/**
 * Load and parse a zip file containing font files
 */
export async function loadFontZip(zipFile: File): Promise<ZipFontPackage> {
	const zip = await JSZip.loadAsync(zipFile);
	const fonts: ExtractedFontFile[] = [];
	let detectedLicense: string | null = null;
	let licenseSource: string | null = null;
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

	// Second pass: extract license from files in priority order
	for (const licenseName of LICENSE_FILE_NAMES) {
		for (const [path, content] of textFiles) {
			const fileName = path.split("/").pop() || path;
			if (fileName.toUpperCase() === licenseName.toUpperCase()) {
				// Try to extract license
				let license: string | null = null;

				if (fileName.toUpperCase() === "FONTINFO.JSON") {
					license = extractLicenseFromFontInfo(content);
				} else {
					license = extractLicenseFromText(content);
				}

				if (license) {
					detectedLicense = license;
					licenseSource = fileName;
					break;
				}
			}
		}
		if (detectedLicense) break;
	}

	return {
		fonts,
		detectedLicense,
		licenseSource,
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
