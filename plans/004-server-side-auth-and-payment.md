# Plan 004: Server-side identity proof + payment verification (auth foundation)

> **⚠️ DO NOT auto-execute.** Unlike plans 001–003, this one has unresolved
> product/design decisions (see "Decisions required"). It must be reviewed and
> the decisions locked before an executor is dispatched. It is recorded now so
> the three linked findings aren't lost and so the design is captured in one
> place.

## Status

- **Priority**: P1 (highest *impact*, but gated on decisions)
- **Effort**: L
- **Risk**: MED — touches every paid/generation route and the client wallet flow; a wrong cutoff rejects legitimate users mid-payment.
- **Depends on**: a verification baseline (a `bun test` runner — recommended finding #7, not yet written as a plan) **should land first** so the payment-verification and signature logic ship with tests.
- **Category**: security
- **Planned at**: commit `376f684`, 2026-06-16

## Why this matters

There is **no server-side authorization anywhere** in `src/app/api` (no `middleware.ts`, no session/signature checks). Three findings are facets of this one gap:

1. **No payment verification** — `paymentTxid` is accepted from the request body and merely stored; it's never checked on-chain. `src/app/api/generate-theme/route.ts:127,313`, `generate-block/route.ts:156`, `generate-component/route.ts:181`, and `generate-font/route.ts:92` (which takes no `userId`/txid at all). The client (`use-swatchy-chat.ts:1252`) even passes the literal `"free-first-gen"`. ⇒ anyone can `curl` these for unlimited free Gemini/Opus generation billed to the project's AI Gateway.
2. **IDOR** — drafts and storage are keyed by a client-supplied `userId` (the user's **public** ordinals address) with no ownership proof: `src/app/api/drafts/route.ts:38-124`, `drafts/[id]/route.ts:27-100`, `user/storage/route.ts:14`. ⇒ anyone who knows an address can list/read/modify/delete that user's drafts and read their storage usage.
3. **Unauthenticated server-side code execution** — `src/app/api/preview-registry-item-sandbox/route.ts:26-41` (and the sibling `preview-component*` routes) run `bun add` + esbuild bundling inside a Vercel Sandbox VM under the project's `VERCEL_OIDC_TOKEN`/`VERCEL_TOKEN`, with no auth ⇒ on-demand sandbox spend / supply-chain surface for any caller.

All three are fixed by the same primitive: **prove the caller controls the wallet identity they claim, server-side**, and gate paid/destructive work on it.

## Decisions required (resolve before executing)

1. **Is server-side payment enforcement actually wanted now?** Today payment is client-trust and an admin allowlist (`src/lib/admins.ts`) bypasses it client-side. Confirm the business intent: should the server reject unpaid generation? (If "not yet," this plan narrows to IDOR + sandbox auth only.)
2. **Payment verification mechanism.** Proposed: given `paymentTxid`, fetch the tx from GorillaPool (`ordinals.gorillapool.io/api` is already used in this repo), assert an output pays `FEE_ADDRESS` (`src/lib/agent/config.ts`) ≥ the tool's price (`src/lib/pricing.ts`), accept 0-conf (mempool) within a tolerance, and **record the txid in KV as consumed** (one txid = one generation) to prevent replay. Confirm: 0-conf acceptable? price source authoritative?
3. **Identity-proof mechanism for drafts/storage.** Proposed: client signs a short challenge (nonce + timestamp) with the wallet key; server verifies the signature derives the claimed address (BSM via `@bsv/sdk`, already a dep) before any draft/storage op. Confirm: acceptable UX (one signature per session vs per request)?
4. **Admin free-gen, server-side.** Move the `isAdminIdentity` check (currently client-only, `src/lib/admins.ts`) to the server so admins bypass payment *server-side* once identity is proven. Confirm allowlist location (code constant vs env).
5. **Sandbox routes.** Gate `preview-*-sandbox` behind the same identity proof + per-identity rate limit + concurrent-sandbox cap. Confirm rate limits.

## Current state (entry points to read)

- Paid generation routes: `src/app/api/generate-{theme,font,block,component,pattern,wallpaper,icon-set,favicon}/route.ts` — none import any verification helper (`grep -rn "verifyPayment\|getTransaction\|gorillapool.*tx" src/app/api src/lib/server` → nothing).
- Client payment flow: `src/components/swatchy/use-swatchy-chat.ts` (PAID_TOOLS, `sendPayment`, free/admin bypass ~lines 287-326, 1231-1269).
- Draft/storage routes: `src/app/api/drafts/route.ts`, `drafts/[id]/route.ts`, `user/storage/route.ts`; storage impl `src/lib/storage/`.
- Sandbox: `src/app/api/preview-registry-item-sandbox/route.ts`, `preview-component-sandbox/route.ts`, `src/lib/sandbox-preview.ts`.
- Existing primitives to reuse: `@bsv/sdk` (signatures), `@vercel/kv` (consumed-txid + nonce store), `FEE_ADDRESS` in `src/lib/agent/config.ts`, prices in `src/lib/pricing.ts`, GorillaPool base in the codebase.

## Commands you will need

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Install   | `bun install`      | exit 0 |
| Typecheck | `bunx tsc --noEmit`| exit 0 (ignore `.next/`-path errors) |
| Lint      | `bun run lint`     | 0 errors |
| Tests     | `bun test`         | (after plan 005 adds the runner) all pass |

## Proposed scope (when greenlit)

- New: `src/lib/server/verify-payment.ts` (txid → on-chain check + KV consume), `src/lib/server/verify-identity.ts` (challenge issue + signature verify), and a thin wrapper applied at the top of each paid/draft/sandbox route.
- Modified: the generation routes, draft/storage routes, sandbox routes, and the client to sign a challenge + send proof.
- **Out of scope**: changing the public registry `/r/` routes (read-only, no auth needed); the theme studio UI beyond the wallet-signature call.

## Test plan (depends on 005)

- Unit-test `verify-payment` with mocked GorillaPool responses: valid payment to `FEE_ADDRESS` ≥ price → accept; underpayment → reject; wrong recipient → reject; replayed txid → reject.
- Unit-test `verify-identity`: valid signature for claimed address → accept; mismatched address → reject; expired nonce → reject.

## STOP conditions

- Any decision in "Decisions required" is still open → STOP, do not execute.
- On-chain lookup latency would push a route past its `maxDuration` → STOP and report (may need a different confirmation strategy).
- Adding identity proof would break the existing free-generation eligibility flow in a way not covered by decision #3 → STOP.

## Maintenance notes

- This is the security cornerstone — once it exists, the client admin bypass (`src/lib/admins.ts`) and `hasFreeGeneration` checks should be re-derived server-side; the client copies become UX hints only.
- Sequence: land the test baseline → resolve decisions → split this into sub-plans if it's too large for one executor (e.g. 004a payment, 004b identity/IDOR, 004c sandbox).
