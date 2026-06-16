# Plan 005: Add CDN caching to the `/r/` registry routes (immutable on-chain content)

> **Executor**: follow step by step; run every verification and confirm the
> expected result. STOP and report on any STOP condition. Do not update
> plans/README.md (the reviewer maintains it).
>
> **Drift check (run first)**: `git diff --stat 75bc583..HEAD -- src/app/r/`
> If any `/r/` route changed since 75bc583, compare against "Current state"; on
> mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `75bc583`, 2026-06-16

## Why this matters

The shadcn-registry gateway routes (`/r/themes|blocks|components/[origin]`) are what external `shadcn` CLIs hit to install an on-chain item. They currently set only `Cache-Control: public, max-age=3600` — no shared/CDN directive — so every browser-cache miss re-fetches from ORDFS and (for blocks/components) re-hydrates all sibling inscriptions. The content is **content-addressed and immutable**: a given `origin` never changes. The project's own `/og/[origin]` route already caches correctly with `s-maxage`; these routes should match. Adding `s-maxage` + `immutable` lets Vercel's edge serve installs without round-tripping ORDFS each time.

## Current state

All four **success** responses (and only success responses — error/`400` responses set no `Cache-Control`, so they stay uncached) use the same header:

- `src/app/r/themes/[origin]/route.ts` — two success returns (new-format and old-format), both:
  ```ts
  return NextResponse.json(registryItem, {
  	headers: {
  		"Content-Type": "application/json",
  		"Cache-Control": "public, max-age=3600",
  	},
  });
  ```
- `src/app/r/blocks/[origin]/route.ts` — one identical success return.
- `src/app/r/components/[origin]/route.ts` — one identical success return.

Total: **4 occurrences** of the literal `"Cache-Control": "public, max-age=3600"`, all on success responses.

Reference (the pattern to match) — `src/app/og/[origin]/route.tsx` already uses:
`"public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"`. For these routes the content is fully immutable per origin, so use a stronger directive (below).

## Commands you will need

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Install   | `bun install`      | exit 0 |
| Typecheck | `bunx tsc --noEmit`| exit 0 (ignore errors whose path starts with `.next/`) |
| Lint      | `bun run lint`     | 0 errors |

## Scope

**In scope**:
- `src/app/r/themes/[origin]/route.ts`
- `src/app/r/blocks/[origin]/route.ts`
- `src/app/r/components/[origin]/route.ts`

**Out of scope**: any error/`400`/`404` response headers (leave uncached); the hydration/validation logic; the `/og` routes.

## Git workflow

One commit in the worktree, conventional style:
`perf(registry): cache immutable /r/ responses at the edge (s-maxage + immutable)`. Do not push.

## Steps

### Step 1: Upgrade the 4 success-response cache headers

In each of the three route files, replace every **success-response** occurrence of:
```ts
"Cache-Control": "public, max-age=3600",
```
with:
```ts
"Cache-Control": "public, max-age=3600, s-maxage=31536000, immutable",
```
(Do NOT add a `Cache-Control` to any error/`400` response that currently lacks one.)

**Verify**:
- `grep -rn '"public, max-age=3600"' src/app/r/` → **no matches** (old header gone).
- `grep -rc 'max-age=3600, s-maxage=31536000, immutable' src/app/r/themes/[origin]/route.ts` → `2`; same grep on blocks route → `1`; on components route → `1`.

### Step 2: Typecheck + lint

**Verify**: `bunx tsc --noEmit` → exit 0 (ignore `.next/`-path errors); `bun run lint` → 0 errors.

## Test plan

No test runner exists in this repo; no test to add. Verification is the grep + typecheck + lint gates.

## Done criteria (ALL)

- [ ] `grep -rn '"public, max-age=3600"' src/app/r/` → no matches
- [ ] 4 total occurrences of `max-age=3600, s-maxage=31536000, immutable` across the 3 routes (2/1/1)
- [ ] `bunx tsc --noEmit` exits 0 (excluding `.next/`-path errors)
- [ ] `bun run lint` → 0 errors
- [ ] `git status --porcelain` shows only the 3 `/r/` route files modified

## STOP conditions

- A `max-age=3600` header turns out to be on an error/`404` response (it shouldn't be) — do NOT make error responses immutable; report it.
- The routes don't match the "Current state" excerpts (drift).

## Maintenance notes

- `immutable` is correct because an `origin` is content-addressed (txid_vout) and never changes. If a route ever begins serving mutable/aggregated data for a path, revisit.
- A reviewer should confirm no error/not-found response gained a long cache directive.
