# Plan 001: Drop the hardcoded Google API key — validate fonts via the key-less metadata endpoint

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" occurs, stop and report — do not
> improvise.
>
> **Drift check (run first)**: `git diff --stat 376f684..HEAD -- src/app/api/validate-font/route.ts`
> If that file changed since this plan was written, compare the "Current state"
> excerpt below against the live code before proceeding; on a mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `376f684`, 2026-06-16

## Why this matters

`src/app/api/validate-font/route.ts` hardcodes a Google **Web Fonts Developer API** key directly in a fetch URL (and a comment falsely claims "no key required"). The key is committed to git history, so it is burned: anyone can extract it and drain the project's Google quota/billing. The route only uses that API to check whether an uploaded font's family name is a known Google Font (to mark it open-source and strip license warnings). Google publishes the **same catalog with no key** at `https://fonts.google.com/metadata/fonts`, so the right fix removes the credential entirely rather than relocating it — eliminating the secret, the rotation burden, and the misleading comment in one change.

(Separately, a human must **revoke** the leaked key in Google Cloud Console — that is a manual console action, out of scope for this code change. See Maintenance notes.)

## Current state

- `src/app/api/validate-font/route.ts` — POST route that parses an uploaded font file and cross-checks its family name against the Google Fonts catalog. The catalog fetch lives in `getGoogleFonts()`.
- Current excerpt (lines ~9–44):

```ts
async function getGoogleFonts(): Promise<Set<string>> {
	const now = Date.now();

	// Return cached if valid
	if (googleFontsCache && now - googleFontsCacheTime < CACHE_TTL) {
		return googleFontsCache;
	}

	try {
		// Google Fonts API - free, no key required for this endpoint
		const response = await fetch(
			"https://www.googleapis.com/webfonts/v1/webfonts?key=<HARDCODED_KEY_AT_LINE_20>&sort=alpha",
			{ next: { revalidate: 3600 } },
		);

		if (!response.ok) {
			console.warn("[validate-font] Failed to fetch Google Fonts list");
			return googleFontsCache || new Set();
		}

		const data = await response.json();
		const fonts = new Set<string>(
			data.items?.map((item: { family: string }) =>
				item.family.toLowerCase(),
			) || [],
		);

		googleFontsCache = fonts;
		googleFontsCacheTime = now;

		return fonts;
	} catch (error) {
		console.error("[validate-font] Error fetching Google Fonts:", error);
		return googleFontsCache || new Set();
	}
}
```

- **Verified facts about the replacement endpoint** (do not re-verify by calling it during execution — it returns a 2.6MB payload):
  - URL: `https://fonts.google.com/metadata/fonts` — **no API key**, returns HTTP 200, `Content-Type` JSON.
  - Shape: `{ "familyMetadataList": [ { "family": "Inter", ... }, ... ] }` — i.e. family names live at `familyMetadataList[].family` (NOT `items[].family`). ~1936 families; includes "Inter", "Roboto", "Playfair Display".
  - It currently returns plain JSON, but Google sometimes prefixes such endpoints with an XSSI guard (`)]}'`). Parse defensively by stripping a leading guard before `JSON.parse` (see Step 1) so a future guard can't break it.
- Repo conventions: this file already lowercases family names into a `Set<string>` and returns the stale cache on failure — preserve both behaviors.

## Commands you will need

| Purpose   | Command            | Expected on success |
|-----------|--------------------|---------------------|
| Install   | `bun install`      | exit 0 |
| Typecheck | `bunx tsc --noEmit`| exit 0, no errors (a few stale `.next/` validator errors that reference deleted/moved routes may appear — ignore errors whose path starts with `.next/`) |
| Lint      | `bun run lint`     | `Checked … files`, 0 errors |

## Scope

**In scope** (only file to modify):
- `src/app/api/validate-font/route.ts`

**Out of scope** (do NOT touch):
- The font-parsing logic in `@/lib/font-validation` / `validateFont` — unchanged.
- Any `.env` file or env wiring — the whole point is that no key is needed; do NOT introduce a `GOOGLE_FONTS_API_KEY` env var.
- The `POST` handler body below `getGoogleFonts` — only the fetch + parse inside `getGoogleFonts` changes.

## Git workflow

- Work in your assigned worktree on its branch.
- One commit; conventional-commit style (matches repo `git log`), e.g.:
  `fix(validate-font): use key-less Google Fonts metadata endpoint, drop committed API key`
- Do NOT push or open a PR.

## Steps

### Step 1: Replace the keyed fetch + parse in `getGoogleFonts()`

In `src/app/api/validate-font/route.ts`, replace the `try { … }` block inside `getGoogleFonts()` so it:

1. Fetches `https://fonts.google.com/metadata/fonts` with **no key** and `{ next: { revalidate: 3600 } }`.
2. Reads the body as text, strips a leading XSSI guard if present, and `JSON.parse`s it.
3. Maps `familyMetadataList[].family` (lowercased) into the `Set`.
4. Keeps the existing not-ok / catch fallbacks (warn + return stale cache).
5. Fixes the comment to state the truth.

Target shape:

```ts
	try {
		// Google Fonts catalog via the public, key-less metadata endpoint.
		const response = await fetch("https://fonts.google.com/metadata/fonts", {
			next: { revalidate: 3600 },
		});

		if (!response.ok) {
			console.warn("[validate-font] Failed to fetch Google Fonts list");
			return googleFontsCache || new Set();
		}

		// Strip a leading XSSI guard ()]}') if Google ever adds one, then parse.
		const text = await response.text();
		const data = JSON.parse(text.replace(/^\)\]\}'?\n?/, "")) as {
			familyMetadataList?: { family: string }[];
		};
		const fonts = new Set<string>(
			data.familyMetadataList?.map((item) => item.family.toLowerCase()) || [],
		);

		googleFontsCache = fonts;
		googleFontsCacheTime = now;

		return fonts;
	} catch (error) {
		console.error("[validate-font] Error fetching Google Fonts:", error);
		return googleFontsCache || new Set();
	}
```

The hardcoded key string (currently in the URL at line ~20) must be **gone** from the file after this step.

**Verify**: `grep -n "googleapis.com/webfonts\|AIza\|key=" src/app/api/validate-font/route.ts` → **no matches**.

### Step 2: Typecheck and lint

**Verify**: `bunx tsc --noEmit` → exit 0 (ignore any error whose path starts with `.next/`). Then `bun run lint` → 0 errors.

## Test plan

There is no test runner in this repo (no `*.test.*`, no vitest/jest config), so do **not** add a test here — it would be the only test and require standing up a runner (that is a separate plan). Verification is by the grep + typecheck + lint gates above.

If you want a manual sanity check (optional, not required): the parse logic is exercised by the shape note in "Current state" — `familyMetadataList[].family` lowercased.

## Done criteria

ALL must hold:

- [ ] `grep -n "googleapis.com/webfonts\|AIza\|key=" src/app/api/validate-font/route.ts` → no matches
- [ ] `grep -n "fonts.google.com/metadata/fonts" src/app/api/validate-font/route.ts` → 1 match
- [ ] `grep -n "no key required" src/app/api/validate-font/route.ts` → no matches (misleading comment removed)
- [ ] `bunx tsc --noEmit` exits 0 (excluding `.next/`-path errors)
- [ ] `bun run lint` → 0 errors
- [ ] `git -C <worktree> status --porcelain` shows only `src/app/api/validate-font/route.ts` modified

## STOP conditions

Stop and report (do not improvise) if:

- The live `getGoogleFonts()` no longer matches the "Current state" excerpt (file drifted).
- Typecheck reveals `familyMetadataList` typing problems you can't resolve by the cast shown above.
- You find the key is referenced anywhere **other** than this file (`grep -rn "AIza" src/`) — that's a separate exposure; report it.

## Maintenance notes

- **Manual follow-up for a human (NOT this executor):** revoke/rotate the leaked key in Google Cloud Console — it is in git history and cannot be un-leaked by code changes.
- If Google changes the metadata endpoint shape or adds auth, this lookup degrades gracefully (returns the stale/empty `Set`, so `isGoogleFont` just stays false) — acceptable, never throws.
- A reviewer should confirm no `GOOGLE_FONTS_API_KEY` env var was introduced (the fix is to need no key).
