# Plan 007: DX baseline — `typecheck` script, `.env.example`, CI workflow

> **Executor**: follow step by step; run every verification. STOP on any STOP
> condition. Do not update plans/README.md (reviewer maintains it).
>
> **Drift check (run first)**: `git diff --stat 75bc583..HEAD -- package.json`
> If `package.json` changed since 75bc583, re-read its `scripts` block before
> editing; on a structural mismatch with "Current state", STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `75bc583`, 2026-06-16

## Why this matters

Three onboarding/safety gaps: (1) there's no `typecheck` script — typechecking only happens implicitly at `next build` or by manually running `bunx tsc --noEmit`, so CI/hooks have nothing to call; (2) there's no `.env.example` and the app needs 14+ env vars that are documented nowhere, so a fresh clone fails opaquely the moment it touches AI/KV/flags; (3) there's no CI — lint/typecheck only run on developer machines and at Vercel deploy time, so a broken `tsc` or biome violation can land on `master` and only fail at deploy. All three are cheap and high-leverage for a repo where agents execute changes.

## Current state

- `package.json` `scripts` (current):
  ```json
  "scripts": {
  	"dev": "next dev --port 3033",
  	"build": "next build",
  	"start": "next start",
  	"lint": "biome check",
  	"lint:fix": "biome check --write",
  	"cli": "bun run cli/index.ts",
  	"generate-og": "bun run scripts/generate-og-images.ts"
  }
  ```
- No `.env.example` exists. No `.github/` directory exists.
- Package manager is **Bun**; linter is **Biome** (`bun run lint`). Typecheck command verified during recon: `bunx tsc --noEmit` (exit 0 today, modulo stale `.next/` validator errors).

## Commands you will need

| Purpose   | Command              | Expected |
|-----------|----------------------|----------|
| Install   | `bun install`        | exit 0 |
| Typecheck | `bun run typecheck`  | (after step 1) runs `tsc --noEmit`; exit 0 ignoring `.next/`-path errors |
| Lint      | `bun run lint`       | 0 errors |

## Scope

**In scope** (create/modify only these):
- `package.json` — add one script.
- `.env.example` — new file.
- `.github/workflows/ci.yml` — new file.

**Out of scope**: any source file; the actual `.env*` files (never read their values; never commit them); adding/removing dependencies.

## Git workflow

One commit, conventional style: `chore(dx): add typecheck script, .env.example, and CI workflow`. Do not push.

## Steps

### Step 1: Add a `typecheck` script

In `package.json` `scripts`, add: `"typecheck": "tsc --noEmit"`. Keep JSON valid (comma placement).

**Verify**: `bun run typecheck` runs `tsc --noEmit`. Ignore any error whose path starts with `.next/` (stale generated validator files); there should be no other errors.

### Step 2: Create `.env.example`

Create `.env.example` listing every required env var **by name only, with a one-line comment, and NO values** (use empty `=` or a `<placeholder>`). Use exactly this set (the app's known env surface — do not copy real values from any `.env` file):

```bash
# AI generation (Vercel AI Gateway)
AI_GATEWAY_API_KEY=

# Vercel Flags (feature gating)
FLAGS=
FLAGS_SECRET=

# Vercel KV (drafts + caches)
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
KV_REDIS_URL=

# Vercel Blob (draft asset storage) — Vercel injects BLOB_READ_WRITE_TOKEN in prod
# BLOB_READ_WRITE_TOKEN=

# Sigma / BAP identity
SIGMA_MEMBER_PRIVATE_KEY=

# Sandbox preview (Vercel Sandbox) — uses VERCEL_OIDC_TOKEN in prod
SANDBOX_PREVIEW_SOURCE_URL=
VERCEL_OIDC_TOKEN=
VERCEL_TOKEN=
VERCEL_TEAM_ID=
VERCEL_PROJECT_ID=

# Cron auth (draft cleanup)
CRON_SECRET=

# Marketplace API
NEXT_PUBLIC_MARKET_API_HOST=
```

(Note for the reviewer, not the file: `CONVEX_DEPLOYMENT` / `NEXT_PUBLIC_CONVEX_URL` appear in some envs but Convex is not a dependency — likely stale; intentionally omitted from `.env.example`. `DEPS_JSON` is referenced by sandbox code — add it only if you confirm it's required at boot.)

**Verify**: `test -f .env.example && grep -c '=' .env.example` → file exists, ≥15 lines with `=`.

### Step 3: Create the CI workflow

Create `.github/workflows/ci.yml` that, on push and pull_request, installs deps and runs lint + typecheck with Bun:

```yaml
name: CI
on:
  push:
    branches: [master]
  pull_request:
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run lint
      - run: bun run typecheck
```

**Verify**: `test -f .github/workflows/ci.yml && grep -q "bun run typecheck" .github/workflows/ci.yml && echo OK` → `OK`.

### Step 4: Final gates

**Verify**: `bun run lint` → 0 errors; `bun run typecheck` → exit 0 (ignoring `.next/`-path errors).

## Test plan

No app test runner exists yet (separate plan). Verification is the file-existence + script-runs gates above.

## Done criteria (ALL)

- [ ] `bun run typecheck` exists and runs `tsc --noEmit` (exit 0 ignoring `.next/`-path errors)
- [ ] `.env.example` exists with the env var names above and **no real values**
- [ ] `.github/workflows/ci.yml` exists and runs `bun run lint` + `bun run typecheck`
- [ ] `bun run lint` → 0 errors
- [ ] `git status --porcelain` shows only `package.json`, `.env.example`, `.github/workflows/ci.yml`

## STOP conditions

- The `package.json` `scripts` block differs structurally from "Current state" (drift) — re-read and adapt, or STOP if unsure.
- You find a real `.env` file is tracked in git (`git ls-files | grep -E '^\.env'`) — STOP and report (that's a secret-exposure issue out of this plan's scope).

## Maintenance notes

- When the test baseline (separate plan) lands, add `bun test` as a CI step.
- The CI workflow is additive — it does not gate the existing Vercel auto-deploy. To make `master` truly protected, enable branch protection requiring this check (a GitHub setting, not a code change).
- A reviewer must confirm `.env.example` contains **no real secret values** — names/placeholders only.
