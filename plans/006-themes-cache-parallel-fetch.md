# Plan 006: Parallelize the N+1 ORDFS fetch in the themes cache builder

> **Executor**: follow step by step; run every verification. STOP on any STOP
> condition. Do not update plans/README.md (reviewer maintains it).
>
> **Drift check (run first)**: `git diff --stat 75bc583..HEAD -- src/app/api/themes/cache/route.ts`
> If it changed since 75bc583, compare against "Current state"; on mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW-MED (parallel fetches could hit ORDFS rate limits — cap concurrency)
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `75bc583`, 2026-06-16

## Why this matters

`fetchFromChain()` in `src/app/api/themes/cache/route.ts` builds the theme list by awaiting one ORDFS `fetch` per search result **inside a sequential `for` loop**. On a cache miss / `?refresh=true` / KV outage, the response blocks on N serial round-trips (one per theme) — multi-second with dozens of themes. Fetching them concurrently (with a bounded concurrency cap to respect ORDFS) collapses that to roughly the slowest single fetch. Steady-state is already fine (5-min KV cache), so this targets cold-start / forced-refresh latency.

## Current state

`src/app/api/themes/cache/route.ts`, `fetchFromChain()` (excerpt ~207–240):

```ts
	const themes: CachedTheme[] = [];
	const seenOrigins = new Set<string>();

	for (const item of results) {
		try {
			const originOutpoint = item.origin?.outpoint;
			if (!originOutpoint || seenOrigins.has(originOutpoint)) continue;
			seenOrigins.add(originOutpoint);

			const contentResponse = await fetch(getOrdfsUrl(originOutpoint), {
				next: { revalidate: 3600 },
			});
			if (!contentResponse.ok) continue;

			const content = await contentResponse.json();
			if (!content.$schema) continue; // skip test/invalid inscriptions

			const result = validateThemeToken(content);
			if (!result.valid) continue;

			themes.push({
				origin: originOutpoint,
				theme: result.theme,
				inscribedAt: item.height ? item.height * 1000 : Date.now(),
				owner: item.owner,
			});
		} catch {
			// Skip invalid
		}
	}

	return themes;
```

- `results` is the GorillaPool search result array; each `item` has `origin.outpoint`, `height`, `owner`.
- `getOrdfsUrl`, `validateThemeToken`, `CachedTheme` are already imported in this file.
- Behavior to preserve **exactly**: dedupe by `originOutpoint` (first occurrence wins); skip non-ok fetches, missing `$schema`, and invalid themes; per-item errors are swallowed (one bad theme must not fail the batch).

## Commands you will need

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Install   | `bun install`      | exit 0 |
| Typecheck | `bunx tsc --noEmit`| exit 0 (ignore `.next/`-path errors) |
| Lint      | `bun run lint`     | 0 errors |

## Scope

**In scope**: only `src/app/api/themes/cache/route.ts` (the `fetchFromChain` function body).
**Out of scope**: the KV caching layer, the route handler, the GorillaPool search call, any other file.

## Git workflow

One commit, conventional style: `perf(themes-cache): fetch ORDFS content concurrently with bounded concurrency`. Do not push.

## Steps

### Step 1: Dedupe first, then fetch concurrently with a concurrency cap

Replace the sequential `for` loop with: (a) build the de-duplicated list of outpoints first (preserving order/first-wins), then (b) process them in **chunks of 10** with `Promise.all` per chunk, each task doing the same fetch→validate→map and returning either a `CachedTheme` or `null`, then (c) push the non-null results in order.

Target shape:

```ts
	const seenOrigins = new Set<string>();
	const uniqueItems = results.filter((item) => {
		const o = item.origin?.outpoint;
		if (!o || seenOrigins.has(o)) return false;
		seenOrigins.add(o);
		return true;
	});

	async function loadTheme(item: (typeof results)[number]): Promise<CachedTheme | null> {
		try {
			const originOutpoint = item.origin?.outpoint;
			if (!originOutpoint) return null;
			const contentResponse = await fetch(getOrdfsUrl(originOutpoint), {
				next: { revalidate: 3600 },
			});
			if (!contentResponse.ok) return null;
			const content = await contentResponse.json();
			if (!content.$schema) return null;
			const result = validateThemeToken(content);
			if (!result.valid) return null;
			return {
				origin: originOutpoint,
				theme: result.theme,
				inscribedAt: item.height ? item.height * 1000 : Date.now(),
				owner: item.owner,
			};
		} catch {
			return null;
		}
	}

	const themes: CachedTheme[] = [];
	const CONCURRENCY = 10;
	for (let i = 0; i < uniqueItems.length; i += CONCURRENCY) {
		const chunk = uniqueItems.slice(i, i + CONCURRENCY);
		const loaded = await Promise.all(chunk.map(loadTheme));
		for (const t of loaded) {
			if (t) themes.push(t);
		}
	}

	return themes;
```

If the exact `(typeof results)[number]` type annotation causes a TS error, type the `loadTheme` parameter to match whatever element type `results` already has in this file (look at how `item` is used today) — do not introduce `any`.

**Verify**: `grep -n "Promise.all" src/app/api/themes/cache/route.ts` → at least 1 match; `grep -n "for (const item of results)" src/app/api/themes/cache/route.ts` → no matches (the serial loop is gone).

### Step 2: Typecheck + lint

**Verify**: `bunx tsc --noEmit` → exit 0 (ignore `.next/`-path errors); `bun run lint` → 0 errors.

## Test plan

No test runner exists in this repo; no test to add. Verification is the greps + typecheck + lint. (Reviewer behavioral check: dedupe still first-wins; one failed fetch yields `null` and is skipped, not thrown.)

## Done criteria (ALL)

- [ ] `grep -n "for (const item of results)" src/app/api/themes/cache/route.ts` → no matches
- [ ] `grep -n "Promise.all" src/app/api/themes/cache/route.ts` → ≥1 match
- [ ] No `any` introduced (`git diff` shows no new `any`/`as any`)
- [ ] `bunx tsc --noEmit` exits 0 (excluding `.next/`-path errors)
- [ ] `bun run lint` → 0 errors
- [ ] `git status --porcelain` shows only `src/app/api/themes/cache/route.ts` modified

## STOP conditions

- `fetchFromChain` doesn't match the excerpt (drift).
- Preserving the exact dedupe/skip semantics conflicts with the parallel shape in a way you can't resolve cleanly — STOP and report rather than changing behavior.

## Maintenance notes

- `CONCURRENCY = 10` is a guess to avoid ORDFS rate-limiting; if ORDFS returns 429s in practice, lower it. A reviewer should confirm the dedupe is still first-occurrence-wins and ordering is acceptable (the result is sorted/consumed downstream — verify no code depends on the prior serial ordering).
