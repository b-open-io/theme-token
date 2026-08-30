import { type ThemeToken, validateThemeToken } from "@theme-token/sdk";

/**
 * Current 1sat-stack content gateway. It supports `_N` relative-vout package
 * directories, direct BEEF capture, and the latest ORDFS content behavior.
 */
const ORDFS_GATEWAY = "https://api.1sat.app/content";

/**
 * Build an ORDFS content URL for an outpoint, origin, or directory path
 * (e.g. `${origin}/theme.json`). Mirrors the `@theme-token/sdk` `getOrdfsUrl`
 * signature so it is a drop-in replacement.
 */
export function getOrdfsUrl(pathOrOrigin: string): string {
	return `${ORDFS_GATEWAY}/${pathOrOrigin}`;
}

/** Load either a package-directory theme or a legacy direct theme inscription. */
export async function fetchThemeFromOneSat(
	origin: string,
): Promise<ThemeToken | null> {
	for (const path of [`${origin}/theme.json`, origin]) {
		try {
			const response = await fetch(getOrdfsUrl(path), { cache: "no-store" });
			if (!response.ok) continue;
			const result = validateThemeToken(await response.json());
			if (result.valid) return result.theme;
		} catch {
			// Try the other representation before reporting a miss.
		}
	}
	return null;
}
