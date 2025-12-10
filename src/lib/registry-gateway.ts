import { getOrdfsUrl } from "@theme-token/sdk";

/**
 * Registry Gateway - Shared logic for serving shadcn registry items from the blockchain
 *
 * Handles:
 * - Fetching content from ORDFS (Ordinals File System)
 * - Resolving {{vout:N}} placeholders to absolute content URLs
 * - Hydrating multi-file registry items (blocks, components) with file contents
 */

// ORDFS base URL for content
const ORDFS_BASE = "https://ordfs.network";

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
	| "registry:page";

/**
 * File entry in a registry manifest (inscribed JSON)
 */
export interface RegistryFileEntry {
	path: string;
	type: RegistryItemType;
	vout?: number; // Reference to sibling inscription output
	content?: string; // Already-embedded content (for single-file items)
	target?: string; // Alternative to vout: {{vout:N}} pattern
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
 * Extract txid from origin string (e.g., "abc123def456_3" → "abc123def456")
 */
export function extractTxid(origin: string): string | null {
	const underscoreIndex = origin.lastIndexOf("_");
	if (underscoreIndex === -1) return null;
	return origin.slice(0, underscoreIndex);
}

/**
 * Extract vout from origin string (e.g., "abc123def456_3" → 3)
 */
export function extractVout(origin: string): number | null {
	const underscoreIndex = origin.lastIndexOf("_");
	if (underscoreIndex === -1) return null;
	const voutStr = origin.slice(underscoreIndex + 1);
	const vout = parseInt(voutStr, 10);
	return Number.isNaN(vout) ? null : vout;
}

/**
 * Resolve {{vout:N}} placeholders in a string value to absolute /content/{txid}_{N} paths
 */
export function resolveVoutPlaceholder(
	value: string,
	txid: string,
): string {
	const match = value.match(/^\{\{vout:(\d+)\}\}$/);
	if (!match) return value;
	const vout = parseInt(match[1], 10);
	return `${ORDFS_BASE}/content/${txid}_${vout}`;
}

/**
 * Check if a value contains a {{vout:N}} placeholder
 */
export function hasVoutPlaceholder(value: unknown): boolean {
	if (typeof value !== "string") return false;
	return /\{\{vout:\d+\}\}/.test(value);
}

/**
 * Recursively resolve all {{vout:N}} placeholders in an object
 */
export function resolveBundleReferences<T extends Record<string, unknown>>(
	obj: T,
	origin: string,
): T {
	const txid = extractTxid(origin);
	if (!txid) return obj;

	const resolveValue = (value: unknown): unknown => {
		if (typeof value === "string") {
			return resolveVoutPlaceholder(value, txid);
		}
		if (Array.isArray(value)) {
			return value.map(resolveValue);
		}
		if (value && typeof value === "object") {
			return resolveObject(value as Record<string, unknown>);
		}
		return value;
	};

	const resolveObject = (obj: Record<string, unknown>): Record<string, unknown> => {
		const resolved: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj)) {
			resolved[key] = resolveValue(value);
		}
		return resolved;
	};

	return resolveObject(obj) as T;
}

/**
 * Check if an object contains any {{vout:N}} placeholders
 */
export function hasBundleReferences(obj: Record<string, unknown>): boolean {
	const jsonString = JSON.stringify(obj);
	return /\{\{vout:\d+\}\}/.test(jsonString);
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
 * Hydrate a registry manifest by fetching file contents from sibling inscriptions
 *
 * For multi-file blocks/components, the manifest references files by vout index.
 * This function fetches each file's content and injects it into the response.
 */
export async function hydrateRegistryManifest(
	manifest: RegistryManifest,
	origin: string,
): Promise<RegistryManifest> {
	const txid = extractTxid(origin);
	if (!txid) return manifest;

	// Process files that need hydration
	const hydratedFiles = await Promise.all(
		manifest.files.map(async (file) => {
			// If content is already present, no hydration needed
			if (file.content) return file;

			// Determine vout from explicit vout field or target placeholder
			let vout: number | null = null;

			if (typeof file.vout === "number") {
				vout = file.vout;
			} else if (file.target && hasVoutPlaceholder(file.target)) {
				const match = file.target.match(/\{\{vout:(\d+)\}\}/);
				if (match) {
					vout = parseInt(match[1], 10);
				}
			}

			if (vout === null) return file;

			// Fetch content from sibling inscription
			const fileOrigin = `${txid}_${vout}`;
			const content = await fetchTextFromOrdfs(fileOrigin);

			if (!content) {
				console.warn(`[Registry Gateway] Failed to fetch file at ${fileOrigin}`);
				return file;
			}

			return {
				...file,
				content,
				// Remove vout/target from output - CLI doesn't need them
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
	];

	if (!validTypes.includes(obj.type as RegistryItemType)) {
		return { valid: false, error: `Invalid type: ${obj.type}. Expected one of: ${validTypes.join(", ")}` };
	}

	if (!Array.isArray(obj.files)) {
		return { valid: false, error: "Missing required field: files (array)" };
	}

	return { valid: true, manifest: obj as unknown as RegistryManifest };
}
