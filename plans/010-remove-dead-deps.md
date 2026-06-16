# Plan 010: Remove 7 unused dependencies

> **Executor**: follow step by step; run every verification. STOP on any STOP
> condition; do not improvise. Commit in the worktree per git workflow. Do NOT
> update plans/README.md. Audit every report claim against a real tool result.
> Reply with exactly the report format. Fresh worktree — run `bun install` first.
>
> **Drift check (run first)**: `git diff --stat 11236cd..HEAD -- package.json`
> If `package.json` dependencies changed since 11236cd, re-verify the import
> counts in Step 1 before removing anything.

## Status

- **Priority**: P2
- **Effort**: S (but verification requires a full `bun run build`)
- **Risk**: LOW (each dep verified to have 0 imports; build is the safety gate)
- **Depends on**: none
- **Category**: deps
- **Planned at**: commit `11236cd`, 2026-06-16

## Why this matters

Seven dependencies are declared in `package.json` but **imported nowhere** in `src/` (verified by grep at planning time). They inflate install size, slow CI, and widen the supply-chain surface for nothing — and `lodash` is pinned to a bogus `^4.18.1` (lodash's latest is 4.17.x; `4.18.1` doesn't exist on npm). Removing them is pure cleanup.

## Current state

Dependencies to remove (each confirmed **0 import sites** in `src/`/`cli/` at planning time):

- `@react-three/fiber`
- `@react-three/drei`
- `@rive-app/react-webgl2`
- `satori` (the OG routes use `next/og`'s built-in renderer, not the `satori` package directly — it appears only in a comment)
- `jotai` (state management is `zustand`)
- `lodash` (also the bogus `^4.18.1` pin)
- `change-case`

**Explicitly NOT in scope** (do not remove): `motion` and `swr` (each has 1 import — deduping them touches source/vendored code and is deferred to a separate plan); `@sigma-auth/better-auth-plugin` / `@1sat/connect` (unused today but tied to a pending auth-direction decision — leave them).

## Commands you will need

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Install   | `bun install`      | exit 0 |
| Remove    | `bun remove <pkgs>`| updates package.json + bun.lock |
| Build     | `bun run build`    | exit 0 — **the safety gate**; confirms nothing transitively/dynamically needed broke |
| Typecheck | `bunx tsc --noEmit`| exit 0 (ignore `.next/`-path errors) |
| Lint      | `bun run lint`     | 0 errors |

## Scope

**In scope**: `package.json` and `bun.lock` (via `bun remove`).
**Out of scope**: any source file (this is dependency-only); the deps listed under "Explicitly NOT in scope".

## Git workflow

One commit, conventional style: `chore(deps): remove 7 unused dependencies (react-three x2, rive, satori, jotai, lodash, change-case)`. Do not push.

## Steps

### Step 1: Re-confirm zero imports (safety before removal)

Run, for each package, that there are no import sites:
```bash
for p in "@react-three/fiber" "@react-three/drei" "@rive-app/react-webgl2" "satori" "jotai" "lodash" "change-case"; do
  echo -n "$p: "; grep -rln "from \"$p\"\|from '$p'\|require(\"$p\"\|from \"$p/" src/ cli/ 2>/dev/null | grep -v node_modules | wc -l | tr -d ' '
done
```
**Every count must be 0.** If any is non-zero → that package is actually used; STOP and report (do not remove it).

### Step 2: Remove the packages

```bash
bun remove @react-three/fiber @react-three/drei @rive-app/react-webgl2 satori jotai lodash change-case
```

**Verify**: `grep -E '"(@react-three/(fiber|drei)|@rive-app/react-webgl2|satori|jotai|lodash|change-case)"' package.json` → no matches.

### Step 3: Build (the real gate) + typecheck + lint

**Verify**:
- `bun run build` → exit 0 (a successful production build proves none of the removed packages were transitively/dynamically required).
- `bunx tsc --noEmit` → exit 0 (ignore `.next/`-path errors).
- `bun run lint` → 0 errors.

## Test plan

The verification is `bun run build` succeeding after removal (plus tsc/lint). No unit test applies to a dependency removal.

## Done criteria (ALL)

- [ ] All 7 packages gone from `package.json` (grep in Step 2 → none)
- [ ] `bun run build` exits 0
- [ ] `bunx tsc --noEmit` exits 0 (excluding `.next/`-path errors)
- [ ] `bun run lint` → 0 errors
- [ ] `git status --porcelain` shows only `package.json` and `bun.lock`

## STOP conditions

- Step 1 finds a non-zero import count for any package — remove only the ones that are truly 0, or STOP and report which is used.
- `bun run build` fails after removal — report the error; the failing package was needed (re-add it and note it). Do NOT start editing source to make the build pass.

## Maintenance notes

- Deferred (separate plans): dedup `motion`→`framer-motion` (1 vendored import in `ai-elements/shimmer.tsx`) and `swr`→`@tanstack/react-query` (1 import in `font-mint/ai-generate-tab.tsx`, behavioral — has polling).
- The `@sigma-auth/better-auth-plugin` removal is gated on the auth-direction decision (see plan 004) — if the maintainer chooses `bitcoin-auth` standalone, that plugin becomes removable too.
