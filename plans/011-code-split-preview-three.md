# Plan 011: Code-split three.js out of the `/preview/[origin]` first-load bundle

> **Executor**: follow step by step; run every verification. STOP on any STOP
> condition; do not improvise. Commit in the worktree per git workflow. Do NOT
> update plans/README.md. Audit every report claim against a real tool result.
> Reply with exactly the report format. Fresh worktree — run `bun install` first.
>
> **Drift check (run first)**: `git diff --stat 11236cd..HEAD -- src/components/preview/audio-demo.tsx`
> If it changed since 11236cd, re-read the import below; on mismatch STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW-MED (touches the shared preview route; dynamic import is mechanical but build-verified)
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `11236cd`, 2026-06-16

## Why this matters

`/preview/[origin]` is the product's **share surface** (theme preview links). It statically imports `AudioVisualizerFractal`, which does `import * as THREE from "three"` (~600KB). The codebase uses `next/dynamic` nowhere, so three.js ships in the preview route's first-load JS for every visitor — hurting LCP/TBT on exactly the page people land on from shared links. Lazy-loading the visualizer moves three.js into an on-demand chunk, out of the critical first-load bundle.

## Current state

- `src/components/preview/audio-demo.tsx` — **`"use client"`** (confirmed line 1), so `next/dynamic({ ssr: false })` is valid here.
  - Line 6: `import { AudioVisualizerFractal } from "./audio-visualizer-fractal";`
  - Line 69 (usage): `<AudioVisualizerFractal theme={theme} mode={mode} />`
- `AudioVisualizerFractal` is a **named export** of `src/components/preview/audio-visualizer-fractal.tsx` (line 10), which does `import * as THREE from "three"`.
- This is the **only** static import of either visualizer in the codebase (grep confirmed). `AudioVisualizer3D` (in `audio-visualizer-3d.tsx`) is imported nowhere — leave it alone (its dead-code status is a separate concern).
- `AudioDemo` is statically imported into the preview route at `src/app/preview/[origin]/preview-client.tsx:39`, so three.js currently lands in that route's bundle.
- Convention: there is no existing `next/dynamic` usage to mirror — this introduces the pattern. Standard Next.js App Router form for a client component.

## Commands you will need

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Install   | `bun install`      | exit 0 |
| Build     | `bun run build`    | exit 0 — confirms the dynamic import compiles and the route still builds |
| Typecheck | `bunx tsc --noEmit`| exit 0 (ignore `.next/`-path errors) |
| Lint      | `bun run lint`     | 0 errors |

## Scope

**In scope**: only `src/components/preview/audio-demo.tsx`.
**Out of scope**: the visualizer implementation files (do not change `import * as THREE` — that's the conventional three.js usage; changing it is low-value and risky); `audio-visualizer-3d.tsx`; the preview route; any other file.

## Git workflow

One commit, conventional style: `perf(preview): lazy-load three.js audio visualizer via next/dynamic`. Do not push.

## Steps

### Step 1: Replace the static import with a `next/dynamic` lazy import

In `src/components/preview/audio-demo.tsx`:
- Remove line 6's static `import { AudioVisualizerFractal } from "./audio-visualizer-fractal";`.
- Add `import dynamic from "next/dynamic";` (with the other imports).
- Define the lazy component (named export → resolve it in the loader), with `ssr: false` so three.js never enters the server/first-load bundle:

```ts
import dynamic from "next/dynamic";

const AudioVisualizerFractal = dynamic(
	() =>
		import("./audio-visualizer-fractal").then((m) => m.AudioVisualizerFractal),
	{ ssr: false },
);
```

Leave the usage at line 69 (`<AudioVisualizerFractal theme={theme} mode={mode} />`) unchanged — it now refers to the dynamic component.

**Verify**: `grep -n "next/dynamic" src/components/preview/audio-demo.tsx` → 1 match; `grep -n 'import { AudioVisualizerFractal }' src/components/preview/audio-demo.tsx` → no matches (static import gone).

### Step 2: Build + typecheck + lint

**Verify**:
- `bun run build` → exit 0 (the dynamic import compiles; the preview route builds). 
- `bunx tsc --noEmit` → 0 (ignore `.next/`-path errors).
- `bun run lint` → 0 errors.

## Test plan

No unit test applies (this is a bundling change). Verification is `bun run build` succeeding + the greps. Optional reviewer spot-check: after `bun run build`, confirm `three` no longer appears in the preview route's first-load chunk (build output / `.next` analysis) — not required for done, but the intended effect.

## Done criteria (ALL)

- [ ] `grep -n "next/dynamic" src/components/preview/audio-demo.tsx` → 1 match
- [ ] `grep -n 'import { AudioVisualizerFractal } from "./audio-visualizer-fractal"' src/components/preview/audio-demo.tsx` → no matches
- [ ] `bun run build` exits 0
- [ ] `bunx tsc --noEmit` exits 0 (excluding `.next/`-path errors)
- [ ] `bun run lint` → 0 errors
- [ ] `git status --porcelain` shows only `src/components/preview/audio-demo.tsx` modified

## STOP conditions

- `audio-demo.tsx` is no longer `"use client"` (drift) — `ssr: false` requires a client component; STOP and report.
- `bun run build` fails with a dynamic-import/SSR error you can't resolve by the shape above — STOP and report (do not start refactoring the visualizer internals).

## Maintenance notes

- If a visualizer needs to render instantly with no flash, add a lightweight `loading` component to the `dynamic(...)` options later; not required now.
- `AudioVisualizer3D` is currently dead (imported nowhere) — a candidate for deletion in a separate cleanup, not this plan.
- A reviewer should confirm the preview page still renders the visualizer (it now mounts client-side after hydration).
