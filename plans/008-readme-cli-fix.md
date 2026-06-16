# Plan 008: Fix the broken CLI install instructions in the README

> **Executor**: follow step by step; run every verification. STOP on any STOP
> condition. Do not update plans/README.md (reviewer maintains it).
>
> **Drift check (run first)**: `git diff --stat 75bc583..HEAD -- README.md`
> If README changed since 75bc583, re-read the "## CLI" section before editing;
> on mismatch with "Current state", STOP.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `75bc583`, 2026-06-16

## Why this matters

The README's "## CLI" section tells users to run `bunx themetoken add <origin>` / `bunx themetoken url <origin>`, but that cannot work: `package.json` has **no `bin` field**, is `"private": true`, and the package name is `theme-token` (not `themetoken`). So `bunx themetoken …` resolves to nothing. The documented headline install path is non-functional — actively-wrong docs are worse than missing ones. The repo *does* have a working install story (the `shadcn add` URL form, already shown earlier in the README) and a local dev CLI (`bun run cli …`). Fix the section to reflect reality.

## Current state

- `README.md` "## CLI" section (~lines 57–62):
  ```markdown
  ## CLI

  ```bash
  bunx themetoken add 85702d92...cf_0    # Install by origin
  bunx themetoken url <origin>            # Get registry URL
  ```
  ```
- `README.md:8` already documents the **working** install path:
  `bunx shadcn@latest add https://themetoken.dev/r/themes/[origin]`
- `package.json`: `name: "theme-token"`, `private: true`, no `bin`, and a `"cli": "bun run cli/index.ts"` script (so the local CLI runs via `bun run cli …`).
- The CLI (`cli/index.ts`) currently supports `add` and `url` for **themes** only (`list` is a "coming soon" stub) — so don't document `list`.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| (none — docs only) | `grep -n "bunx themetoken" README.md` | after the change: no matches |

(No build/typecheck needed — this is a Markdown-only change. Still confirm nothing else broke: `bun run lint` → 0 errors, since Biome may check Markdown formatting.)

## Scope

**In scope**: only `README.md` (the "## CLI" section).
**Out of scope**: `cli/index.ts` (changing/publishing the CLI is a separate direction item); `package.json`; any other README section.

## Git workflow

One commit, conventional style: `docs(readme): correct CLI install instructions — shadcn URL form + local cli script`. Do not push.

## Steps

### Step 1: Rewrite the "## CLI" section to the working commands

Replace the broken `bunx themetoken …` block with the actually-working paths. Target content:

```markdown
## Install a theme

Install any published theme into your shadcn project with the standard CLI —
no extra tooling:

```bash
bunx shadcn@latest add https://themetoken.dev/r/themes/<origin>
```

Blocks and components publish the same way:

```bash
bunx shadcn@latest add https://themetoken.dev/r/blocks/<origin>
bunx shadcn@latest add https://themetoken.dev/r/components/<origin>
```

### Local CLI (this repo)

A helper CLI lives in `cli/index.ts` (run via Bun — it is not published to npm):

```bash
bun run cli add <origin>    # resolve + verify a theme by origin
bun run cli url <origin>    # print the registry URL for an origin
```
```

(If the heading `## CLI` is referenced by an anchor/table-of-contents elsewhere in the README, keep the heading text `## CLI` instead of `## Install a theme` to avoid breaking the anchor — check with `grep -n "#cli\|(#cli)" README.md` and decide; if no anchor references it, the clearer heading is fine.)

**Verify**: `grep -n "bunx themetoken" README.md` → **no matches**; `grep -n "bunx shadcn@latest add https://themetoken.dev/r/" README.md` → ≥1 match.

### Step 2: Lint

**Verify**: `bun run lint` → 0 errors.

## Test plan

Docs-only; no tests. Verification is the greps + lint.

## Done criteria (ALL)

- [ ] `grep -n "bunx themetoken" README.md` → no matches
- [ ] README documents `bunx shadcn@latest add https://themetoken.dev/r/...` and the `bun run cli` local usage
- [ ] `bun run lint` → 0 errors
- [ ] `git status --porcelain` shows only `README.md` modified

## STOP conditions

- The "## CLI" section doesn't match "Current state" (drift) — re-read and adapt.
- You discover the CLI was actually published (a `bin` field now exists in `package.json`) — then `bunx themetoken` might be valid; STOP and report rather than removing it.

## Maintenance notes

- The real fix for the CLI is a direction decision (publish it with a `bin`, or drop it): see the audit's DIRECTION items. This plan only stops the README from documenting a command that doesn't run.
