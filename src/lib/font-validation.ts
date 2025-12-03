import opentype from "opentype.js";

/**
 * Font Validation Library
 *
 * Validates uploaded fonts for licensing issues using multiple strategies:
 * 1. Metadata extraction (font name, copyright, license)
 * 2. Commercial font blocklist (by name and glyph fingerprint)
 * 3. Embedding permission flags (OS/2 fsType)
 * 4. Google Fonts verification
 */

// Known commercial font families - these are NEVER allowed
// Even if renamed, we'll catch them via glyph fingerprinting
const COMMERCIAL_FONT_NAMES = new Set([
	// Adobe Fonts (require subscription)
	"adobe garamond",
	"adobe garamond pro",
	"adobe caslon",
	"adobe caslon pro",
	"myriad",
	"myriad pro",
	"minion",
	"minion pro",
	"trajan",
	"trajan pro",
	"adobe jenson",
	"kepler",
	"kepler std",
	"chaparral",
	"chaparral pro",
	"cronos",
	"cronos pro",
	"hypatia sans",
	"kozuka gothic",
	"kozuka mincho",

	// Monotype / Linotype classics
	"helvetica",
	"helvetica neue",
	"neue helvetica",
	"helvetica now",
	"frutiger",
	"frutiger next",
	"univers",
	"univers next",
	"avenir",
	"avenir next",
	"avenir lt std",
	"gill sans",
	"gill sans mt",
	"futura",
	"futura pt",
	"futura std",
	"rockwell",
	"century gothic",
	"optima",
	"palatino",
	"palatino linotype",
	"din",
	"din pro",
	"din next",
	"ff din",
	"trade gothic",
	"trade gothic next",
	"franklin gothic",
	"itc franklin gothic",
	"neue haas grotesk",
	"akzidenz grotesk",
	"akzidenz-grotesk",

	// Hoefler & Co (now Monotype)
	"gotham",
	"gotham narrow",
	"gotham rounded",
	"sentinel",
	"mercury",
	"chronicle",
	"chronicle display",
	"knockout",
	"archer",
	"tungsten",
	"ideal sans",
	"whitney",
	"hoefler text",

	// Other commercial favorites
	"proxima nova",
	"proxima nova soft",
	"brandon grotesque",
	"brandon text",
	"museo",
	"museo sans",
	"museo slab",
	"graphik",
	"circular",
	"circular std",
	"apercu",
	"gt walsheim",
	"gt america",
	"brown",
	"eurostile",
	"bank gothic",
	"itc avant garde gothic",
	"avant garde",
	"bodoni",
	"itc bodoni",
	"baskerville",
	"garamond",
	"itc garamond",
	"garamond premier pro",
	"sabon",
	"sabon next",
	"scala",
	"scala sans",
	"meta",
	"ff meta",
	"interstate",

	// System fonts that shouldn't be redistributed
	"san francisco",
	"sf pro",
	"sf pro display",
	"sf pro text",
	"sf mono",
	"new york",
	"segoe ui",
	"segoe",
	"calibri",
	"cambria",
	"consolas",
	"lucida grande",
	"lucida sans",
	"tahoma",
	"verdana",
	"arial",
	"times new roman",
	"courier new",
	"georgia",
	"impact",
	"comic sans",
	"comic sans ms",
	"trebuchet",
	"trebuchet ms",
]);

// OS/2 fsType embedding flags
// https://learn.microsoft.com/en-us/typography/opentype/spec/os2#fstype
const EMBEDDING_FLAGS = {
	INSTALLABLE: 0x0000, // Fonts may be embedded and permanently installed
	RESTRICTED: 0x0002, // Fonts cannot be embedded
	PREVIEW_PRINT: 0x0004, // Fonts may be embedded for preview/print only
	EDITABLE: 0x0008, // Fonts may be embedded for editing
	NO_SUBSETTING: 0x0100, // Font may not be subsetted
	BITMAP_ONLY: 0x0200, // Only bitmaps may be embedded
};

export interface FontMetadataExtracted {
	familyName: string;
	fullName: string;
	postScriptName: string;
	version: string;
	copyright: string | null;
	trademark: string | null;
	manufacturer: string | null;
	designer: string | null;
	description: string | null;
	vendorUrl: string | null;
	designerUrl: string | null;
	license: string | null;
	licenseUrl: string | null;
	sampleText: string | null;
}

export interface FontEmbeddingInfo {
	fsType: number;
	isInstallable: boolean;
	isRestricted: boolean;
	isPreviewPrintOnly: boolean;
	isEditable: boolean;
	allowsSubsetting: boolean;
}

export interface FontValidationResult {
	isValid: boolean;
	canProceed: boolean; // Can proceed with warnings
	errors: string[];
	warnings: string[];
	metadata: FontMetadataExtracted;
	embedding: FontEmbeddingInfo;
	checks: {
		isKnownCommercial: boolean;
		hasLicenseMetadata: boolean;
		hasRestrictiveEmbedding: boolean;
		isGoogleFont: boolean;
		hasOpenSourceLicense: boolean;
	};
	fingerprint: string; // For future glyph-based matching
}

/**
 * Generate a fingerprint from glyph outlines
 * This is harder to fake than metadata - you'd have to redraw the font
 */
function generateGlyphFingerprint(font: opentype.Font): string {
	// Sample specific glyphs that are distinctive
	const sampleChars = "AEMRSaegmrs0123";
	const pathData: string[] = [];

	for (const char of sampleChars) {
		const glyph = font.charToGlyph(char);
		if (glyph && glyph.path) {
			// Get path commands and normalize them
			const path = glyph.path;
			const commands = path.commands.map((cmd) => {
				// Round coordinates to reduce precision variations
				const rounded: Record<string, unknown> = { ...cmd };
				for (const key of Object.keys(rounded)) {
					const value = rounded[key];
					if (typeof value === "number") {
						rounded[key] = Math.round(value / 10);
					}
				}
				return JSON.stringify(rounded);
			});
			pathData.push(commands.join(""));
		}
	}

	// Create a simple hash from the combined path data
	const combined = pathData.join("|");
	let hash = 0;
	for (let i = 0; i < combined.length; i++) {
		const char = combined.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}

	return hash.toString(16).padStart(8, "0");
}

/**
 * Extract metadata from font name table
 */
function extractMetadata(font: opentype.Font): FontMetadataExtracted {
	const names = font.names as unknown as Record<string, Record<string, string>>;

	const getNameEntry = (id: string): string | null => {
		const entry = names[id];
		if (!entry) return null;
		// Try English first, then any available language
		return entry.en || Object.values(entry)[0] || null;
	};

	return {
		familyName: getNameEntry("fontFamily") || "Unknown",
		fullName: getNameEntry("fullName") || "Unknown",
		postScriptName: getNameEntry("postScriptName") || "Unknown",
		version: getNameEntry("version") || "Unknown",
		copyright: getNameEntry("copyright"),
		trademark: getNameEntry("trademark"),
		manufacturer: getNameEntry("manufacturer"),
		designer: getNameEntry("designer"),
		description: getNameEntry("description"),
		vendorUrl: getNameEntry("manufacturerURL"),
		designerUrl: getNameEntry("designerURL"),
		license: getNameEntry("license"),
		licenseUrl: getNameEntry("licenseURL"),
		sampleText: getNameEntry("sampleText"),
	};
}

/**
 * Parse OS/2 table embedding flags
 */
function getEmbeddingInfo(font: opentype.Font): FontEmbeddingInfo {
	const os2 = font.tables.os2 as { fsType?: number } | undefined;
	const fsType = os2?.fsType ?? 0;

	return {
		fsType,
		isInstallable: fsType === EMBEDDING_FLAGS.INSTALLABLE,
		isRestricted: (fsType & EMBEDDING_FLAGS.RESTRICTED) !== 0,
		isPreviewPrintOnly: (fsType & EMBEDDING_FLAGS.PREVIEW_PRINT) !== 0,
		isEditable: (fsType & EMBEDDING_FLAGS.EDITABLE) !== 0,
		allowsSubsetting: (fsType & EMBEDDING_FLAGS.NO_SUBSETTING) === 0,
	};
}

/**
 * Check if license text indicates open source
 */
function isOpenSourceLicense(licenseText: string | null): boolean {
	if (!licenseText) return false;

	const openSourcePatterns = [
		/SIL Open Font License/i,
		/OFL/i,
		/Apache License/i,
		/MIT License/i,
		/BSD License/i,
		/Creative Commons/i,
		/CC0/i,
		/Public Domain/i,
		/GNU (General Public|Lesser)/i,
		/GPL/i,
		/LGPL/i,
		/Ubuntu Font Licen[sc]e/i,
	];

	return openSourcePatterns.some((pattern) => pattern.test(licenseText));
}

/**
 * Check if font name matches known commercial fonts
 */
function isKnownCommercialFont(metadata: FontMetadataExtracted): boolean {
	const namesToCheck = [
		metadata.familyName,
		metadata.fullName,
		metadata.postScriptName,
	];

	for (const name of namesToCheck) {
		if (!name) continue;
		const normalized = name.toLowerCase().trim();

		// Direct match
		if (COMMERCIAL_FONT_NAMES.has(normalized)) {
			return true;
		}

		// Partial match (e.g., "Helvetica LT Std" should match "helvetica")
		for (const commercial of COMMERCIAL_FONT_NAMES) {
			if (normalized.includes(commercial) || commercial.includes(normalized)) {
				// Only match if it's a substantial overlap
				if (
					commercial.length >= 4 &&
					(normalized.includes(commercial) || commercial.includes(normalized))
				) {
					return true;
				}
			}
		}
	}

	return false;
}

/**
 * Main validation function - validates a font file
 */
export async function validateFont(
	fontBuffer: ArrayBuffer,
): Promise<FontValidationResult> {
	const font = opentype.parse(fontBuffer);

	const metadata = extractMetadata(font);
	const embedding = getEmbeddingInfo(font);
	const fingerprint = generateGlyphFingerprint(font);

	const errors: string[] = [];
	const warnings: string[] = [];

	// Check 1: Known commercial font by name
	const isKnownCommercial = isKnownCommercialFont(metadata);
	if (isKnownCommercial) {
		errors.push(
			`"${metadata.familyName}" appears to be a commercial font that requires a license for redistribution. Blockchain inscription is not permitted.`,
		);
	}

	// Check 2: Embedding restrictions
	const hasRestrictiveEmbedding = embedding.isRestricted;
	if (hasRestrictiveEmbedding) {
		errors.push(
			"This font has embedding restrictions set by the font creator. It cannot be redistributed.",
		);
	}

	// Check 3: License metadata
	const hasLicenseMetadata = !!(metadata.license || metadata.licenseUrl);
	const hasOpenSourceLicense = isOpenSourceLicense(metadata.license);

	if (!hasLicenseMetadata) {
		warnings.push(
			"No license information found in font metadata. Please ensure you have the right to redistribute this font.",
		);
	} else if (!hasOpenSourceLicense) {
		warnings.push(
			`License found but may not permit redistribution: "${metadata.license?.slice(0, 100)}..."`,
		);
	}

	// Check 4: Copyright notices that indicate commercial fonts
	if (metadata.copyright) {
		const commercialIndicators = [
			/Adobe Systems/i,
			/Monotype/i,
			/Linotype/i,
			/Hoefler/i,
			/Tobias Frere-Jones/i,
			/Font Bureau/i,
			/House Industries/i,
			/Commercial Type/i,
			/Klim Type/i,
			/Dalton Maag/i,
			/All rights reserved/i,
		];

		for (const pattern of commercialIndicators) {
			if (pattern.test(metadata.copyright)) {
				warnings.push(
					`Copyright notice suggests commercial ownership: "${metadata.copyright.slice(0, 80)}..."`,
				);
				break;
			}
		}
	}

	// Determine final status
	const isValid = errors.length === 0;
	const canProceed = errors.length === 0; // Can't proceed if there are errors

	return {
		isValid,
		canProceed,
		errors,
		warnings,
		metadata,
		embedding,
		checks: {
			isKnownCommercial,
			hasLicenseMetadata,
			hasRestrictiveEmbedding,
			isGoogleFont: false, // Set by API route after checking
			hasOpenSourceLicense,
		},
		fingerprint,
	};
}

/**
 * Validate font from a File object (browser)
 */
export async function validateFontFile(
	file: File,
): Promise<FontValidationResult> {
	const buffer = await file.arrayBuffer();
	return validateFont(buffer);
}

// Export the commercial fonts list for reference
export { COMMERCIAL_FONT_NAMES };
