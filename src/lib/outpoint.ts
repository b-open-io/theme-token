import { parse } from "bitcoin-image";

/**
 * Canonical internal outpoint format is `txid_vout` (underscore) — what
 * GorillaPool and ORDFS use. BRC-100 wallets serialize outpoints as `txid.vout`
 * (period). Rather than hand-roll string surgery, we normalize through
 * `bitcoin-image`'s parser, which accepts `txid_vout`, `txid.vout`, `ord://…`,
 * `/content/…`, and bare txids.
 *
 * Convert at I/O boundaries only: the wallet (BRC-100) speaks period; the
 * indexer/ORDFS speak underscore. Everything in between uses this canonical
 * form.
 */
export function normalizeOutpoint(outpoint: string): string {
	const parsed = parse(outpoint);
	if (
		parsed.isValid &&
		parsed.txid !== undefined &&
		parsed.vout !== undefined
	) {
		return `${parsed.txid}_${parsed.vout}`;
	}
	return outpoint;
}

/** True when two outpoints refer to the same output regardless of delimiter. */
export function sameOutpoint(a: string, b: string): boolean {
	return normalizeOutpoint(a) === normalizeOutpoint(b);
}
