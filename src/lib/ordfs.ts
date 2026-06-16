/**
 * ORDFS content gateway.
 *
 * ordfs.network currently runs a 1sat-stack deploy that predates the `_N`
 * relative-vout directory convention (1sat-stack commit `fff8850`), so it
 * cannot resolve our `ord-fs/json` package directories — a bare-origin fetch
 * of a directory 404s. `api.1sat.app` runs current 1sat-stack and serves
 * content under `/content/*`.
 *
 * TEMPORARY: we point at api.1sat.app until ordfs.network is redeployed from
 * current 1sat-stack. Once that's done, flip `ORDFS_GATEWAY` back to
 * `https://ordfs.network` (note: root path, no `/content` prefix).
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
