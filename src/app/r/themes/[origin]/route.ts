import { toShadcnRegistry, validateThemeToken, getOrdfsUrl } from "@theme-token/sdk";
import { NextResponse } from "next/server";

/**
 * Resolve {{vout:N}} placeholders in theme JSON to absolute /content/{txid}_{N} paths
 * This allows theme bundles to reference sibling inscriptions in the same transaction
 */
function resolveBundleReferences(
	theme: Record<string, unknown>,
	bundleOrigin: string,
): Record<string, unknown> {
	// Extract txid from origin (e.g., "abc123def456_3" → "abc123def456")
	const underscoreIndex = bundleOrigin.lastIndexOf("_");
	if (underscoreIndex === -1) return theme;
	const txid = bundleOrigin.slice(0, underscoreIndex);

	const resolveValue = (value: unknown): unknown => {
		if (typeof value !== "string") return value;
		// Match {{vout:N}} pattern
		const match = value.match(/^\{\{vout:(\d+)\}\}$/);
		if (!match) return value;
		const vout = parseInt(match[1], 10);
		return `/content/${txid}_${vout}`;
	};

	const resolveObject = (obj: Record<string, unknown>): Record<string, unknown> => {
		const resolved: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj)) {
			if (value && typeof value === "object" && !Array.isArray(value)) {
				resolved[key] = resolveObject(value as Record<string, unknown>);
			} else {
				resolved[key] = resolveValue(value);
			}
		}
		return resolved;
	};

	return resolveObject(theme);
}

/**
 * Check if theme JSON contains {{vout:N}} placeholders that need resolution
 */
function hasBundleReferences(theme: Record<string, unknown>): boolean {
	const jsonString = JSON.stringify(theme);
	return /\{\{vout:\d+\}\}/.test(jsonString);
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ origin: string }> },
) {
	try {
		const { origin } = await params;

		const response = await fetch(getOrdfsUrl(origin));
		if (!response.ok) {
			return NextResponse.json({ error: "Theme not found" }, { status: 404 });
		}

		let json = await response.json();

		// Resolve {{vout:N}} placeholders for bundle themes
		if (hasBundleReferences(json)) {
			json = resolveBundleReferences(json, origin);
		}

		const result = validateThemeToken(json);
		if (!result.valid) {
			return NextResponse.json(
				{ error: "Invalid theme format", details: result.error },
				{ status: 400 },
			);
		}

		const registryItem = toShadcnRegistry(result.theme);

		return NextResponse.json(registryItem, {
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=3600",
			},
		});
	} catch (error) {
		console.error("[Registry API] Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch theme" },
			{ status: 500 },
		);
	}
}
