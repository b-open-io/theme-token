import { getOrdfsUrl } from "@theme-token/sdk";

/**
 * Registry Gateway - Shared logic for serving shadcn registry items from the blockchain
 *
 * Handles:
 * - Fetching content from ORDFS (Ordinals File System)
 * - Hydrating multi-file registry items (blocks, components) with file contents via ORDFS directory traversal
 */

/**
 * Registry item types we support
 */
export type RegistryItemType =
	| "registry:style"
	| "registry:block"
	| "registry:component"
	| "registry:hook"
	| "registry:lib"
	| "registry:ui"
	| "registry:page"
	| "registry:font"
	| "registry:theme"
	| "registry:file";

/**
 * File entry in a registry manifest (inscribed JSON)
 */
export interface RegistryFileEntry {
	path: string;
	type: RegistryItemType;
	vout?: number; // Reference to sibling inscription output
	content?: string; // Already-embedded content (for single-file items)
	target?: string; // Alternative to vout: _N relative reference
}

/**
 * Registry manifest structure (what gets inscribed for multi-file items)
 */
export interface RegistryManifest {
	$schema?: string;
	name: string;
	type: RegistryItemType;
	description?: string;
	dependencies?: string[];
	registryDependencies?: string[];
	files: RegistryFileEntry[];
	cssVars?: Record<string, Record<string, string>>;
	css?: Record<string, unknown>;
	tailwind?: Record<string, unknown>;
}

/**
 * Extract txid from origin string (e.g., "abc123def456_3" -> "abc123def456")
 */
export function extractTxid(origin: string): string | null {
	const underscoreIndex = origin.lastIndexOf("_");
	if (underscoreIndex === -1) return null;
	return origin.slice(0, underscoreIndex);
}

/**
 * Extract vout from origin string (e.g., "abc123def456_3" -> 3)
 */
export function extractVout(origin: string): number | null {
	const underscoreIndex = origin.lastIndexOf("_");
	if (underscoreIndex === -1) return null;
	const voutStr = origin.slice(underscoreIndex + 1);
	const vout = parseInt(voutStr, 10);
	return Number.isNaN(vout) ? null : vout;
}

/**
 * Fetch content from ORDFS by origin
 */
export async function fetchFromOrdfs(origin: string): Promise<Response> {
	return fetch(getOrdfsUrl(origin));
}

/**
 * Fetch and parse JSON from ORDFS
 */
export async function fetchJsonFromOrdfs<T = unknown>(
	origin: string,
): Promise<T | null> {
	const response = await fetchFromOrdfs(origin);
	if (!response.ok) return null;
	return response.json() as Promise<T>;
}

/**
 * Fetch raw text content from ORDFS
 */
export async function fetchTextFromOrdfs(
	origin: string,
): Promise<string | null> {
	const response = await fetchFromOrdfs(origin);
	if (!response.ok) return null;
	return response.text();
}

/**
 * Hydrate a registry manifest by fetching file contents via ORDFS directory traversal
 *
 * For multi-file blocks/components, ORDFS resolves _N refs and nested directories
 * natively. This function fetches each file's content by path and injects it into the response.
 */
export async function hydrateRegistryManifest(
	manifest: RegistryManifest,
	origin: string,
): Promise<RegistryManifest> {
	const hydratedFiles = await Promise.all(
		manifest.files.map(async (file) => {
			if (file.content) return file;

			// Fetch file content via ORDFS directory traversal
			const content = await fetchTextFromOrdfs(`${origin}/${file.path}`);

			if (!content) {
				console.warn(`[Registry Gateway] Failed to fetch file at ${origin}/${file.path}`);
				return file;
			}

			return {
				...file,
				content,
				vout: undefined,
				target: undefined,
			};
		}),
	);

	return {
		...manifest,
		files: hydratedFiles,
	};
}

/**
 * Convert a hydrated registry manifest to shadcn CLI-compatible format
 */
export function toShadcnRegistryItem(manifest: RegistryManifest): Record<string, unknown> {
	return {
		$schema: "https://ui.shadcn.com/schema/registry-item.json",
		name: manifest.name,
		type: manifest.type,
		description: manifest.description,
		dependencies: manifest.dependencies,
		registryDependencies: manifest.registryDependencies,
		files: manifest.files.map((file) => ({
			path: file.path,
			type: file.type,
			content: file.content,
		})),
		cssVars: manifest.cssVars,
		css: manifest.css,
		tailwind: manifest.tailwind,
	};
}

/**
 * Validate that a manifest has the required structure for a registry item
 */
export function validateRegistryManifest(
	data: unknown,
): { valid: true; manifest: RegistryManifest } | { valid: false; error: string } {
	if (!data || typeof data !== "object") {
		return { valid: false, error: "Invalid data: expected object" };
	}

	const obj = data as Record<string, unknown>;

	if (typeof obj.name !== "string" || !obj.name) {
		return { valid: false, error: "Missing required field: name" };
	}

	if (typeof obj.type !== "string" || !obj.type) {
		return { valid: false, error: "Missing required field: type" };
	}

	const validTypes: RegistryItemType[] = [
		"registry:style",
		"registry:block",
		"registry:component",
		"registry:hook",
		"registry:lib",
		"registry:ui",
		"registry:page",
		"registry:font",
		"registry:theme",
		"registry:file",
	];

	if (!validTypes.includes(obj.type as RegistryItemType)) {
		return { valid: false, error: `Invalid type: ${obj.type}. Expected one of: ${validTypes.join(", ")}` };
	}

	if (!Array.isArray(obj.files)) {
		return { valid: false, error: "Missing required field: files (array)" };
	}

	return { valid: true, manifest: obj as unknown as RegistryManifest };
}
