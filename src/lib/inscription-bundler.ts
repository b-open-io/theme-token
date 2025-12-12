/**
 * Inscription Bundler - Shared core service for creating on-chain bundles
 *
 * This service provides the foundational bundling logic used by:
 * - Component Studio (intra-asset bundling: code files for a single component)
 * - Project Studio (inter-asset bundling: theme + font + icons for a design system)
 *
 * Architecture follows Gemini's recommendation:
 * - Shared vout management and reference generation
 * - Common base64 encoding and size estimation
 * - Flexible manifest generation via callbacks
 */

import { Utils } from "@bsv/sdk";
import type { BundleItem, BundleAssetType } from "@/hooks/use-yours-wallet";

// ============================================================================
// Core Types
// ============================================================================

/**
 * A generic artifact to be inscribed
 */
export interface Artifact {
	/** Unique identifier for this artifact (used for vout mapping) */
	id: string;
	/** Raw content (string for text, base64 for binary) */
	content: string;
	/** Whether content is already base64 encoded */
	isBase64?: boolean;
	/** MIME type of the content */
	contentType: string;
	/** Display name */
	name?: string;
	/** Asset type for inscription metadata */
	assetType: BundleAssetType;
	/** Additional metadata */
	metadata?: Record<string, string>;
}

/**
 * Result of bundling artifacts
 */
export interface BundleResult {
	/** Items ready for inscription */
	items: BundleItem[];
	/** Map of artifact IDs to their vout indices */
	voutMap: Map<string, number>;
	/** Total estimated size in bytes */
	estimatedSize: number;
}

/**
 * Options for the bundler
 */
export interface BundlerOptions {
	/** Artifacts to bundle (order determines vout indices) */
	artifacts: Artifact[];
	/** Optional manifest to add as the last item */
	manifest?: {
		content: Record<string, unknown>;
		assetType: BundleAssetType;
		name?: string;
		metadata?: Record<string, string>;
	};
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Unicode-safe base64 encoding using @bsv/sdk
 */
export function toBase64(str: string): string {
	return Utils.toBase64(Utils.toArray(str, "utf8"));
}

/**
 * Generate a vout reference placeholder
 */
export function voutRef(index: number): string {
	return `{{vout:${index}}}`;
}

/**
 * Estimate the size of base64-encoded content
 */
export function estimateBase64Size(base64: string): number {
	const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, "");
	return Math.floor((cleanBase64.length * 3) / 4);
}

/**
 * Estimate inscription overhead (envelope + metadata)
 */
export function estimateInscriptionOverhead(): number {
	return 250; // ~50 bytes envelope + ~200 bytes metadata
}

// ============================================================================
// Main Bundler
// ============================================================================

/**
 * Create an inscription bundle from artifacts
 *
 * @example
 * ```ts
 * // Component bundle (code files + manifest)
 * const result = createBundle({
 *   artifacts: [
 *     { id: "main", content: "export function...", contentType: "text/plain", assetType: "file" },
 *     { id: "hook", content: "export function...", contentType: "text/plain", assetType: "file" },
 *   ],
 *   manifest: {
 *     content: { name: "my-component", files: [{ path: "main.tsx", vout: 0 }] },
 *     assetType: "component",
 *   },
 * });
 *
 * // Project bundle (assets + config)
 * const result = createBundle({
 *   artifacts: [
 *     { id: "font", content: fontBase64, isBase64: true, contentType: "font/woff2", assetType: "font" },
 *     { id: "icons", content: spriteBase64, isBase64: true, contentType: "image/svg+xml", assetType: "file" },
 *   ],
 *   manifest: {
 *     content: { type: "registry:base", cssVars: {...}, registryDependencies: ["{{vout:0}}"] },
 *     assetType: "file",
 *   },
 * });
 * ```
 */
export function createBundle(options: BundlerOptions): BundleResult {
	const { artifacts, manifest } = options;
	const items: BundleItem[] = [];
	const voutMap = new Map<string, number>();
	let totalSize = 0;

	// Add artifacts first
	for (const artifact of artifacts) {
		const vout = items.length;
		voutMap.set(artifact.id, vout);

		const base64Data = artifact.isBase64
			? artifact.content
			: toBase64(artifact.content);

		const size = estimateBase64Size(base64Data) + estimateInscriptionOverhead();
		totalSize += size;

		items.push({
			type: artifact.assetType,
			base64Data,
			mimeType: artifact.contentType,
			name: artifact.name,
			metadata: artifact.metadata,
		});
	}

	// Add manifest as last item if provided
	if (manifest) {
		const manifestJson = JSON.stringify(manifest.content, null, 2);
		const manifestBase64 = toBase64(manifestJson);

		const size = estimateBase64Size(manifestBase64) + estimateInscriptionOverhead();
		totalSize += size;

		items.push({
			type: manifest.assetType,
			base64Data: manifestBase64,
			mimeType: "application/json",
			name: manifest.name,
			metadata: manifest.metadata,
		});
	}

	return {
		items,
		voutMap,
		estimatedSize: totalSize,
	};
}

/**
 * Transform an object by replacing artifact IDs with vout references
 *
 * @example
 * ```ts
 * const voutMap = new Map([["font", 0], ["icons", 1]]);
 * const manifest = {
 *   registryDependencies: ["utils", "{{font}}", "{{icons}}"],
 * };
 * const resolved = resolveVoutRefs(manifest, voutMap);
 * // { registryDependencies: ["utils", "{{vout:0}}", "{{vout:1}}"] }
 * ```
 */
export function resolveVoutRefs<T extends Record<string, unknown>>(
	obj: T,
	voutMap: Map<string, number>,
): T {
	const json = JSON.stringify(obj);

	// Replace {{artifactId}} patterns with {{vout:N}}
	const resolved = json.replace(/\{\{(\w+)\}\}/g, (match, id) => {
		const vout = voutMap.get(id);
		if (vout !== undefined) {
			return voutRef(vout);
		}
		return match; // Keep original if not found
	});

	return JSON.parse(resolved) as T;
}

// ============================================================================
// Convenience Builders
// ============================================================================

/**
 * Build a component bundle (code files with manifest)
 *
 * This is for Component Studio - intra-asset bundling where
 * multiple code files make up a single component/block.
 */
export interface ComponentBundleFile {
	path: string;
	type: string;
	content: string;
}

export interface ComponentBundleOptions {
	name: string;
	type: "registry:block" | "registry:component";
	description: string;
	dependencies?: string[];
	registryDependencies?: string[];
	files: ComponentBundleFile[];
	author?: string;
}

export function buildComponentBundle(options: ComponentBundleOptions): BundleResult {
	const {
		name,
		type,
		description,
		dependencies = [],
		registryDependencies = [],
		files,
		author,
	} = options;

	// Create artifacts from files
	const artifacts: Artifact[] = files.map((file, index) => ({
		id: `file-${index}`,
		content: file.content,
		contentType: "text/plain",
		assetType: "file" as BundleAssetType,
		name: file.path,
		metadata: {
			registryType: file.type,
			path: file.path,
		},
	}));

	// Build manifest with vout references to files
	// Files will be at vout 0, 1, 2... and manifest at the end
	const manifestContent = {
		name,
		type,
		description,
		dependencies,
		registryDependencies,
		files: files.map((file, index) => ({
			path: file.path,
			type: file.type,
			vout: index,
		})),
	};

	return createBundle({
		artifacts,
		manifest: {
			content: manifestContent,
			assetType: type === "registry:block" ? "block" : "component",
			name,
			metadata: {
				registryType: type,
				...(author && { author }),
			},
		},
	});
}

/**
 * Estimate total bundle cost in satoshis
 */
export function estimateBundleCost(itemCount: number): number {
	// Base cost: 1 sat per output
	return itemCount;
}

/**
 * Format byte size for display
 */
export function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
