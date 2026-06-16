# Plan 002: Delete the unauthenticated `/api/test-gateway` debug route

> **Executor instructions**: Follow step by step; run every verification and
> confirm the expected result. If a STOP condition occurs, stop and report.
>
> **Drift check (run first)**: `git diff --stat 376f684..HEAD -- src/app/api/test-gateway/`
> If anything changed there since this plan was written, compare against the
> "Current state" excerpt; on a mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `376f684`, 2026-06-16

## Why this matters

`src/app/api/test-gateway/route.ts` is an **unauthenticated** `GET` that returns the first 10 characters of `AI_GATEWAY_API_KEY` plus the live credit/balance JSON from the Vercel AI Gateway and `NODE_ENV`. It is reachable in production and leaks a partial credential and account billing state to anyone who hits the URL — pure reconnaissance surface with no legitimate production use. It is a debugging leftover; nothing in the app references it. Deleting it removes the exposure outright.

## Current state

- `src/app/api/test-gateway/route.ts` — a debug route. Full content:

```ts
import { NextResponse } from "next/server";

export async function GET() {
	const apiKey = process.env.AI_GATEWAY_API_KEY;
	const hasKey = !!apiKey;
	const keyPrefix = apiKey ? `${apiKey.substring(0, 10)}...` : "NOT SET";

	// Test the credits endpoint
	let credits = null;
	let creditsError = null;

	if (apiKey) {
		try {
			const response = await fetch("https://ai-gateway.vercel.sh/v1/credits", {
				method: "GET",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
				},
			});
			credits = await response.json();
		} catch (err) {
			creditsError = err instanceof Error ? err.message : "Unknown error";
		}
	}

	return NextResponse.json({
		hasKey, keyPrefix, credits, creditsError,
		nodeEnv: process.env.NODE_ENV,
	});
}
```

- **Confirmed**: nothing references this route — `grep -rn "test-gateway" src/` returns no matches (it's a route handler; the URL is only reachable directly).

## Commands you will need

| Purpose   | Command            | Expected on success |
|-----------|--------------------|---------------------|
| Install   | `bun install`      | exit 0 |
| Typecheck | `bunx tsc --noEmit`| exit 0 (ignore errors whose path starts with `.next/`) |
| Lint      | `bun run lint`     | 0 errors |

## Scope

**In scope**:
- Delete `src/app/api/test-gateway/route.ts` (and the now-empty `src/app/api/test-gateway/` directory).

**Out of scope** (do NOT touch):
- Any other route under `src/app/api/`.
- The real gateway usage (`AI_GATEWAY_API_KEY` is consumed legitimately elsewhere via the AI SDK) — do not remove the env var or its real usages.

## Git workflow

- Work in your assigned worktree/branch.
- One commit, conventional style, e.g.:
  `chore(security): remove unauthenticated /api/test-gateway debug route that leaked key prefix + credits`
- Do NOT push or open a PR.

## Steps

### Step 1: Delete the route file

Remove `src/app/api/test-gateway/route.ts`. Also remove the containing directory `src/app/api/test-gateway/` if it is now empty (use `git rm` so the deletion is staged).

**Verify**: `ls src/app/api/test-gateway 2>/dev/null || echo GONE` → prints `GONE`.

### Step 2: Confirm no dangling references and the build still typechecks

**Verify**:
- `grep -rn "test-gateway" src/` → no matches.
- `bunx tsc --noEmit` → exit 0 (ignore `.next/`-path errors).
- `bun run lint` → 0 errors.

## Test plan

No test runner exists in this repo; no test to add. Verification is the grep + typecheck + lint gates.

## Done criteria

ALL must hold:

- [ ] `src/app/api/test-gateway/route.ts` no longer exists
- [ ] `grep -rn "test-gateway" src/` → no matches
- [ ] `bunx tsc --noEmit` exits 0 (excluding `.next/`-path errors)
- [ ] `bun run lint` → 0 errors
- [ ] `git -C <worktree> status --porcelain` shows only the deletion (route file + maybe the dir)

## STOP conditions

- The file's content differs materially from the excerpt (drifted) — report what's there instead of deleting blindly.
- `grep -rn "test-gateway" src/` finds a real reference (something imports/links it) — report it; do not delete until the reference is understood.

## Maintenance notes

- If gateway-credit visibility is ever genuinely needed, it belongs behind admin auth (see plan 004's auth foundation) and must never return the key prefix.
