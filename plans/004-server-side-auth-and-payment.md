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

Recommended split: **004a = identity auth + N-free-per-identity + IDOR** (Phase 1, high value / low risk), **004b = payment verification** (Phase 2, optional), **004c = sandbox gating** (reuses 004a auth).

1. **Identity auth — DECIDED: `bitcoin-auth`** (see "Identity auth" below). `verifyAuthToken` server-side; no roll-your-own. No open question except UX: one token per mutating request (simplest, the wallet issues it) vs a short-lived server session — recommend per-request first.

2. **Free generations per identity — the maintainer's directive ("each account only gets N free generations").** Today free-gen is bypassable: the client reads `/api/user/storage?userId=<ordAddress>` and treats `totalDrafts === 0` as eligible (`use-swatchy-chat.ts:160-173`), keyed on a client-supplied address with no proof, and the server never enforces it. Replace with a **server-enforced counter keyed by the verified identity** (from `bitcoin-auth`): KV `freegen:<identityKey>` incremented atomically; allow up to **N**, then require payment. Admins (decision 4) get unlimited. This is the core of Phase 1.
   - **DECIDED — N is configurable.** N is **1 today** but must be a single named constant that's trivial to change (e.g. `3` later) without hunting through code. Define `FREE_GENERATIONS_PER_IDENTITY = 1` in one place — recommended `src/lib/pricing.ts` (alongside the existing cost constants) — and optionally allow an env override (`process.env.FREE_GENERATIONS_PER_IDENTITY`) so it can change per-environment without a deploy. Every free-gen check reads that one constant; do not hardcode `1` anywhere.

3. **Is server-side payment enforcement wanted now?** (Phase 2, your call — you flagged two concerns; here's the read on each.)
   - *Concern 1 — "trust the wallet, it can't be spoofed."* The wallet's response is trustworthy **on the client**, but the generate endpoints are reachable by plain `curl` with no wallet at all — so "trust the wallet said it paid" only holds once the request is provably from an authenticated identity. With Phase 1 (identity auth + per-identity free cap) in place, anonymous unlimited abuse is already gone; the residual risk is an *authenticated* user claiming paid generations they didn't pay for. That's lower-stakes, so trusting the wallet's payment claim for authenticated users is a defensible MVP — payment verification can be Phase 2.
   - *Concern 2 — GorillaPool timing race / false failure on 0-conf.* This is real **if** we verify by polling GP for the txid. Avoid it: **verify the transaction the wallet returns locally** (the `sendBsv`/inscribe response carries the raw tx / BEEF). Parse it with `@bsv/sdk`, assert an output pays `FEE_ADDRESS` (`src/lib/agent/config.ts`) ≥ the tool's price (`src/lib/pricing.ts`); the txid is the hash of the tx (cannot be spoofed); record it consumed in KV (replay guard). No GP round-trip, no propagation race. (BEEF even carries SPV input proofs if we want full validity, still no GP dependency.) → **Concern 2 is a non-issue with local tx verification.**
   - Decision: ship Phase 2 now, or accept "authenticated wallet claim" for paid gens until later?

4. **Admin key, server-side.** Today `src/lib/admins.ts` allowlists by identity **pubkey**, checked **client-only**. Once identity is proven server-side (decision 1), move the check server-side and pick the canonical key: the verified `pubkey` (current) or the **`bapId`** from `getProfile()` (more stable/semantic). Confirm allowlist location (code constant vs env).

5. **Sandbox routes.** Gate `preview-*-sandbox` behind the same `bitcoin-auth` proof + per-identity rate limit + concurrent-sandbox cap. Confirm rate limits.

## Current state (entry points to read)

- Paid generation routes: `src/app/api/generate-{theme,font,block,component,pattern,wallpaper,icon-set,favicon}/route.ts` — none import any verification helper (`grep -rn "verifyPayment\|getTransaction\|gorillapool.*tx" src/app/api src/lib/server` → nothing).
- Client payment flow: `src/components/swatchy/use-swatchy-chat.ts` (PAID_TOOLS, `sendPayment`, free/admin bypass ~lines 287-326, 1231-1269).
- Draft/storage routes: `src/app/api/drafts/route.ts`, `drafts/[id]/route.ts`, `user/storage/route.ts`; storage impl `src/lib/storage/`.
- Sandbox: `src/app/api/preview-registry-item-sandbox/route.ts`, `preview-component-sandbox/route.ts`, `src/lib/sandbox-preview.ts`.
- Existing primitives to reuse: `@bsv/sdk` (signatures), `@vercel/kv` (consumed-txid + nonce store), `FEE_ADDRESS` in `src/lib/agent/config.ts`, prices in `src/lib/pricing.ts`, GorillaPool base in the codebase.

## Identity auth — use `bitcoin-auth` (decided)

**Framework decision (resolve with the maintainer):** `@sigma-auth/better-auth-plugin` and `better-auth` are currently in the dependency tree but **completely unused** (0 imports in `src/`/`cli/`) — they're a full login/session/OAuth framework (peer-depends Neon DB, payload-auth, bsv-bap) that this app never wired up. Our actual need — *stateless server-side proof that a request comes from a given wallet identity* — is met by **`bitcoin-auth` standalone** (a per-request signed token + `verifyAuthToken`, no DB, no session framework). Recommendation: use `bitcoin-auth` directly and treat `@sigma-auth/better-auth-plugin` as a **dead-dep removal** (cross-ref audit finding #8) unless full account/login (OAuth, sessions, passkeys) is a deliberate roadmap item — in which case adopt better-auth properly as its own plan. Versions are already current (sigma 0.0.92 = latest, bitcoin-auth 0.0.8 = latest, better-auth 1.6.18 vs 1.6.19), so "update them" is a no-op either way.


**`bitcoin-auth` v0.0.8 is already installed** (transitive dep via `@sigma-auth/better-auth-plugin`, and a direct dep) and ships a **server-side verifier** — so we do NOT roll our own or reverse-engineer any token format. Yours Wallet's `getAuthToken` is compatible with it (maintainer-confirmed).

`bitcoin-auth` exports:
- `getAuthToken(config: { privateKeyWif, requestPath, body?, scheme?, bodyEncoding?, timestamp? }) => string` — client side (the wallet produces this; we do not handle the WIF ourselves — the wallet's `getAuthToken` provider method returns the token).
- `parseAuthToken(token) => AuthToken | null` where `AuthToken = { requestPath, timestamp, body?, pubkey, signature, scheme: "bsm"|"brc77" }`.
- **`verifyAuthToken(token, target: { requestPath, timestamp, body? }, timePad?, bodyEncoding?) => boolean`** — server side. `timePad` is the allowed clock-skew / replay window (seconds).

**Server flow (the IDOR + free-gen foundation):**
1. Client gets a token from the wallet (`getAuthToken({ requestPath, body })`) and sends it in a header (e.g. `X-Auth-Token`).
2. Route handler reconstructs the `target` (`requestPath` = the route path, `body` = the raw request body, `timestamp` from the token) and calls `verifyAuthToken(token, target, timePad)`. Reject on `false`.
3. `parseAuthToken(token).pubkey` is the **verified identity**. Derive the user's address from it (`@bsv/sdk` `PublicKey.fromString(pubkey).toAddress()`) and/or map to `bapId` via `getProfile`. That identity — not a client-supplied `userId` — is the owner key for drafts/storage (fixes IDOR) and the key for the free-generation counter.

This replaces the earlier "spike the token format / verify manually" caveat — a packaged verifier exists.

## Other primitives (Yours Wallet provider API + `@1sat/actions`)

Confirmed available in the installed `@1sat/actions` (exported from package root via `./signing`) and the Yours Wallet provider API. The app already uses `createWalletContext`/`getProfile` in `src/lib/wallet-actions.ts`.

- **`getAuthToken`** — `Action<AuthTokenRequest, AuthTokenResponse>`.
  - Request: `{ requestPath: string; body?: string; bodyEncoding?: 'utf8'|'hex'|'base64'; timestamp?: string }`.
  - Response: `{ authToken?: string; error?: string }`.
  - Server (per Yours docs): extract timestamp + signer from the token, re-derive the canonical message from `requestPath + body`, verify the signature against the user's identity key. **MUST verify both path and body** (no cross-endpoint/body replay); encoding mismatches produce valid-looking tokens that fail verification. No server verifier is packaged — implement it (spike the token format first).
- **`signBsm`** — `Action<SignBsmRequest, SignBsmResponse>`.
  - Request: `{ message: string; encoding?: 'utf8'|'hex'|'base64'; tag?: {...} }`.
  - Response: `{ address?: string; pubKey?: string; message?: string; sig?: string (base64 BSM); error?: string }`.
  - Server: verify with a **BSM-compatible** verifier in `@bsv/sdk` (the BSM helper — handles the `"Bitcoin Signed Message:\n"` prefix + length encoding); raw ECDSA verify will NOT work. Verify `sig` against `address`/`pubKey`, then confirm that address/pubkey is the user's identity.
- **`getProfile`** — `Action<{}, GetProfileResult>`. Returns `{ bapId?: string; profile?: { '@type'?, name?, image?, description?, ... }; error? }`. **`bapId`** is the on-chain BAP identity marker (null until the wallet publishes an identity record). Already wrapped in this repo as `getSocialProfile` (`src/lib/wallet-actions.ts`). This is the candidate canonical admin/identity key (Decision #4). (It also answers the maintainer's earlier "what's my BAP id" — it's `getProfile().bapId`.)

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
