# Plan 003: Make the cron cleanup endpoint fail closed when `CRON_SECRET` is unset

> **Executor instructions**: Follow step by step; run every verification and
> confirm the expected result. If a STOP condition occurs, stop and report.
>
> **Drift check (run first)**: `git diff --stat 376f684..HEAD -- src/app/api/cron/cleanup-drafts/route.ts`
> If it changed since this plan was written, compare against "Current state"; on
> a mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `376f684`, 2026-06-16

## Why this matters

`src/app/api/cron/cleanup-drafts/route.ts` guards a **destructive, cross-user** operation (deleting every user's expired drafts) with `if (CRON_SECRET && authHeader !== \`Bearer ${CRON_SECRET}\`)`. When `CRON_SECRET` is unset or empty, the `CRON_SECRET &&` short-circuits to false and **auth is skipped entirely** — any unauthenticated caller can trigger a full cleanup. This is fail-open auth on a destructive route, and it contradicts the project's documented "fail informatively and immediately, never fall back" convention. The fix makes a missing secret a hard refusal instead of an open door.

## Current state

- `src/app/api/cron/cleanup-drafts/route.ts` — Vercel cron endpoint. Two handlers share the same fail-open guard.

Excerpt (line ~19, then the `POST` guard ~26–30):

```ts
// Vercel Cron authorization
const CRON_SECRET = process.env.CRON_SECRET;

// ...
export async function POST(request: NextRequest) {
	// Verify cron secret (Vercel adds this header)
	const authHeader = request.headers.get("authorization");
	if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	// ... destructive cleanup ...
}
```

And the `GET` handler (~80–91) — a health-check that *falls through to `POST` when authorized*:

```ts
export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("authorization");
	if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
		return NextResponse.json({
			status: "ok",
			message: "Cleanup endpoint ready. Use POST to trigger cleanup.",
		});
	}
	// If authorized, trigger cleanup
	return POST(request);
}
```

- Convention to match (from the repo's CLAUDE.md): *"Fallbacks are generally bad. Instead, fail informatively and immediately."* A missing secret is a misconfiguration → respond 500, do not proceed.

## Commands you will need

| Purpose   | Command            | Expected on success |
|-----------|--------------------|---------------------|
| Install   | `bun install`      | exit 0 |
| Typecheck | `bunx tsc --noEmit`| exit 0 (ignore errors whose path starts with `.next/`) |
| Lint      | `bun run lint`     | 0 errors |

## Scope

**In scope**:
- `src/app/api/cron/cleanup-drafts/route.ts`

**Out of scope**:
- The cleanup logic itself (`kv.scan`, deletion loop) — unchanged.
- Any other route or the cron schedule config (`vercel.json` if present) — do not touch.

## Git workflow

- Work in your assigned worktree/branch.
- One commit, conventional style, e.g.:
  `fix(security): fail closed in cron cleanup when CRON_SECRET is unset`
- Do NOT push or open a PR.

## Steps

### Step 1: Add a fail-closed guard and make the auth comparison unconditional

In `POST`, before the auth comparison, refuse when the secret is missing; then compare unconditionally:

```ts
export async function POST(request: NextRequest) {
	if (!CRON_SECRET) {
		return NextResponse.json(
			{ error: "CRON_SECRET is not configured" },
			{ status: 500 },
		);
	}
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	// ... unchanged destructive cleanup ...
}
```

### Step 2: Apply the same fail-closed posture to `GET`

`GET` must not fall through to `POST` when the secret is missing. Add the same `!CRON_SECRET` 500 guard at the top of `GET`, and keep the unconditional comparison for the health-check branch:

```ts
export async function GET(request: NextRequest) {
	if (!CRON_SECRET) {
		return NextResponse.json(
			{ error: "CRON_SECRET is not configured" },
			{ status: 500 },
		);
	}
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${CRON_SECRET}`) {
		return NextResponse.json({
			status: "ok",
			message: "Cleanup endpoint ready. Use POST to trigger cleanup.",
		});
	}
	return POST(request);
}
```

**Verify**: `grep -n "CRON_SECRET &&" src/app/api/cron/cleanup-drafts/route.ts` → **no matches** (the fail-open `&&` pattern is gone), and `grep -c "if (!CRON_SECRET)" src/app/api/cron/cleanup-drafts/route.ts` → `2`.

### Step 3: Typecheck and lint

**Verify**: `bunx tsc --noEmit` → exit 0 (ignore `.next/`-path errors). `bun run lint` → 0 errors.

## Test plan

No test runner exists in this repo; no test to add. Verification is the grep + typecheck + lint gates above. (Behavioral note for the reviewer: with `CRON_SECRET` unset, both handlers now return 500; with it set, an unauthenticated POST returns 401 and an authenticated POST runs cleanup — unchanged from intended behavior.)

## Done criteria

ALL must hold:

- [ ] `grep -n "CRON_SECRET &&" src/app/api/cron/cleanup-drafts/route.ts` → no matches
- [ ] `grep -c "if (!CRON_SECRET)" src/app/api/cron/cleanup-drafts/route.ts` → 2
- [ ] `bunx tsc --noEmit` exits 0 (excluding `.next/`-path errors)
- [ ] `bun run lint` → 0 errors
- [ ] `git -C <worktree> status --porcelain` shows only `src/app/api/cron/cleanup-drafts/route.ts` modified

## STOP conditions

- The handlers don't match the "Current state" excerpts (drifted).
- There is additional auth logic elsewhere in the file you'd need to change to keep behavior consistent — report it rather than guessing.

## Maintenance notes

- Ensure `CRON_SECRET` is actually set in every Vercel environment (Production/Preview/Development) — with this change, a missing secret now returns 500 (loud) instead of silently allowing access. That is the intended trade-off.
- The Vercel cron scheduler sends `Authorization: Bearer <CRON_SECRET>` automatically when the env var is configured on the project, so scheduled runs keep working.
