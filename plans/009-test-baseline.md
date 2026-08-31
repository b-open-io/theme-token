# Plan 009: Establish a test baseline with `bun test` over pure `src/lib` logic

> **Executor**: follow step by step; run every verification. STOP on any STOP
> condition; do not improvise. Commit in the worktree per git workflow. Do NOT
> update plans/README.md (reviewer maintains it). Audit every report claim
> against a real tool result. Reply with exactly the report format. Fresh
> worktree — run `bun install` first.
>
> **Drift check (run first)**: `git diff --stat 11236cd..HEAD -- src/lib/fonts.ts src/lib/tints.ts src/lib/registry-gateway.ts package.json`
> If any of those changed since 11236cd, re-read the function signatures below; on mismatch STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW (adds tests + one script; touches no runtime code)
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `11236cd`, 2026-06-16

## Why this matters

The repo has **zero automated tests** — the only ways to know it works are `tsc` and `biome`, neither of which executes a line of business logic. Pure transforms that produce on-chain-published artifacts (registry origin parsing, font sanitization, color math) can silently regress. This plan stands up the **lowest-cost** runner — Bun's built-in `bun test` (no new dependency) — and covers a handful of pure functions with real assertions. It unblocks safe execution of riskier plans (notably the auth/payment work) by giving review something to run.

## Current state

- **No test runner**: no `*.test.*`/`*.spec.*` files, no vitest/jest/playwright config. `bun test` is built into Bun (zero install). Test files use `import { test, expect, describe } from "bun:test"`.
- Pure functions to cover (read each implementation before asserting — tests must assert real, specific outputs, never be tautological):
  - `src/lib/registry-gateway.ts` — `export function extractTxid(origin: string): string | null` (line 56) and `export function extractVout(origin: string): number | null` (line 65). Origins look like `<64-hex-txid>_<vout>` (e.g. `aa…ff_0`).
  - `src/lib/fonts.ts` — `export function sanitizeFontValue(value: unknown, role: keyof typeof SYSTEM_FONTS): string | undefined` (line 137) and `export function sanitizeStyleModeFonts<T extends object>(mode: T): T` (line 158). Behavior (read to confirm): a valid CSS font stack passes through; a malformed value (contains `{`/`}`/newline, or `"type"`, or >200 chars) is replaced with `SYSTEM_FONTS[role]`; `undefined`/`null` returns `undefined`. `SYSTEM_FONTS` is exported from the same file.
  - `src/lib/tints.ts` — `export function hexToRgb(...)` (line 106) and `export function rgbToHex(r,g,b): string` (line 122). Read their exact signatures/return shapes before asserting; a round-trip is a strong, non-tautological test.
- Project conventions: TypeScript, tabs (Biome). No existing test to mirror — establish the pattern.

## Commands you will need

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Install   | `bun install`      | exit 0 |
| Tests     | `bun test`         | (after step 1) all pass; reports N passed |
| Typecheck | `bunx tsc --noEmit`| exit 0 (ignore `.next/`-path errors) |
| Lint      | `bun run lint`     | 0 errors |

## Scope

**In scope** (create/modify only):
- `package.json` — add a `"test"` script.
- `src/lib/registry-gateway.test.ts` (create)
- `src/lib/fonts.test.ts` (create)
- `src/lib/tints.test.ts` (create)

**Out of scope**: changing any runtime source under `src/lib` (tests only — if a function looks buggy, note it in your report, do NOT fix it here); adding any dependency (use built-in `bun:test`); CI config.

## Git workflow

One commit, conventional style: `test: add bun-test baseline for pure lib logic (registry/fonts/tints)`. Do not push.

## Steps

### Step 1: Add the `test` script

In `package.json` `scripts`, add `"test": "bun test"`. Keep JSON valid.

**Verify**: `bun test` runs (will report "0 tests" until step 2 — that's fine).

### Step 2: Write `src/lib/registry-gateway.test.ts`

Read `extractTxid`/`extractVout` first. Cover: a valid `<64-hex>_<n>` origin → correct txid / numeric vout; an invalid string (e.g. `"not-an-origin"`) → `null` for both; vout extraction for a non-zero vout. Use real 64-hex sample (e.g. `"a".repeat(64) + "_2"`).

```ts
import { describe, expect, test } from "bun:test";
import { extractTxid, extractVout } from "./registry-gateway";

describe("registry-gateway origin parsing", () => {
	const origin = `${"a".repeat(64)}_2`;
	test("extractTxid returns the txid for a valid origin", () => {
		expect(extractTxid(origin)).toBe("a".repeat(64));
	});
	test("extractVout returns the numeric vout", () => {
		expect(extractVout(origin)).toBe(2);
	});
	test("invalid origins return null", () => {
		expect(extractTxid("not-an-origin")).toBeNull();
		expect(extractVout("not-an-origin")).toBeNull();
	});
});
```
If the real behavior differs from these assertions (e.g. a different invalid-input result), adjust the assertions to match the **actual** implementation and note it — do not change the source.

### Step 3: Write `src/lib/fonts.test.ts`

Read `sanitizeFontValue`/`sanitizeStyleModeFonts`/`SYSTEM_FONTS` first.

```ts
import { describe, expect, test } from "bun:test";
import { SYSTEM_FONTS, sanitizeFontValue, sanitizeStyleModeFonts } from "./fonts";

describe("sanitizeFontValue", () => {
	test("passes through a valid font stack", () => {
		const v = '"Inter", ui-sans-serif, system-ui, sans-serif';
		expect(sanitizeFontValue(v, "sans")).toBe(v);
	});
	test("replaces malformed (brace/JSON) values with the system stack", () => {
		expect(sanitizeFontValue('"X" { "type": "string" }', "serif")).toBe(SYSTEM_FONTS.serif);
	});
	test("returns undefined for absent values", () => {
		expect(sanitizeFontValue(undefined, "mono")).toBeUndefined();
	});
});

describe("sanitizeStyleModeFonts", () => {
	test("replaces a garbage font-serif, keeps valid ones", () => {
		const mode = {
			"font-sans": '"Inter", sans-serif',
			"font-serif": 'bad {\n "type": "x" }',
		} as Record<string, string>;
		sanitizeStyleModeFonts(mode);
		expect(mode["font-serif"]).toBe(SYSTEM_FONTS.serif);
		expect(mode["font-sans"]).toBe('"Inter", sans-serif');
	});
});
```

### Step 4: Write `src/lib/tints.test.ts`

Read `hexToRgb`/`rgbToHex` signatures first, then assert a concrete value and a round-trip. Example (adjust to the real return shape):
```ts
import { describe, expect, test } from "bun:test";
import { hexToRgb, rgbToHex } from "./tints";

describe("tints color conversions", () => {
	test("rgbToHex produces lowercase hex", () => {
		expect(rgbToHex(255, 255, 255)).toBe("#ffffff");
	});
	test("hexToRgb/rgbToHex round-trip", () => {
		const rgb = hexToRgb("#3366ff");
		expect(rgbToHex(rgb.r, rgb.g, rgb.b)).toBe("#3366ff");
	});
});
```
If `hexToRgb` returns a different shape (array, different field names), match it.

### Step 5: Run the suite + gates

**Verify**: `bun test` → all pass (report the count). `bunx tsc --noEmit` → 0 (ignore `.next/`). `bun run lint` → 0 errors.

## Test plan

This plan *is* the test plan. New tests live in the three files above, asserting concrete input→output for each pure function (happy path + invalid/edge). Pattern established: `bun:test` `describe`/`test`/`expect`, colocated `*.test.ts`.

## Done criteria (ALL)

- [ ] `package.json` has `"test": "bun test"`
- [ ] `bun test` exits 0 and reports ≥ 6 passing tests across the 3 files
- [ ] Each test asserts a concrete expected value (not `expect(x).toBeDefined()`-style filler)
- [ ] `bunx tsc --noEmit` exits 0 (excluding `.next/`-path errors)
- [ ] `bun run lint` → 0 errors
- [ ] `git status --porcelain` shows only `package.json` + the 3 new `*.test.ts` files

## STOP conditions

- A pure function's real behavior can't be determined by reading it (heavy I/O / not actually pure) — skip that module, note it, keep the others.
- A test reveals what looks like a real bug — STOP and report it (do NOT fix source in this plan).
- `bun test` can't discover `*.test.ts` files — report the runner output; do not add a third-party test framework.

## Maintenance notes

- Wire `bun test` into CI (the CI workflow from plan 007 currently runs lint + typecheck — add a `bun test` step once this lands).
- The unused inscription bundler prototype was removed; the active bundle and registry gateway paths now have colocated round-trip coverage.
