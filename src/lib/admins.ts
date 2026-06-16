/**
 * Admin allowlist.
 *
 * Admins are identified by their wallet **identity public key** (the hex
 * returned by getPublicKey({ identityKey: true }) — the same value surfaced as
 * `addresses.identityKey`). It's the stable, wallet-level identity, so it's the
 * right key to allowlist against (addresses can be re-derived; the identity key
 * is constant).
 *
 * Admins get every paid generation for free (payment is skipped client-side).
 */
export const ADMIN_IDENTITY_KEYS: ReadonlySet<string> = new Set([
	// Satchmo
	"038ddac2dbdbeb3f0aa6085493dfdd35754b932200f1c8b533b9530d408f76382f",
]);

export function isAdminIdentity(identityKey?: string | null): boolean {
	return (
		typeof identityKey === "string" && ADMIN_IDENTITY_KEYS.has(identityKey)
	);
}
