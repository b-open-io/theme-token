# Registry Module in @1sat/actions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract `buildPackageOutputs` from clawnet CLI into `@1sat/actions` as a shared registry module, so both theme-token and clawnet (and any future publisher) use the same code for building on-chain registry packages.

**Architecture:** Create `src/registry/` module in `@1sat/actions` containing the package output builder, registry types/constants, and content type detection. The existing `src/registry.ts` (ActionRegistry) gets renamed to `src/action-registry.ts` to avoid the naming conflict. `buildPackageOutputs` is a plain exported function (not an Action) since it returns output descriptors without broadcasting. The `PackageMapMetadata.app` field becomes a generic `string` instead of the hard-coded `"clawnet"` literal. `registry:font` is added to `REGISTRY_TYPES`.

**Tech Stack:** `@1sat/templates` (Inscription, MAP, AIP, PrivateKeySigner), `@bsv/sdk` (P2PKH, PrivateKey, Script, Utils) — both already deps of `@1sat/actions`.

**Source repo:** `/Users/satchmo/code/1sat-sdk`
**Source to extract from:** `/Users/satchmo/code/clawnet/packages/cli/src/package/`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `packages/actions/src/action-registry.ts` | Rename from `src/registry.ts` | ActionRegistry for MCP tool registration (unchanged content) |
| `packages/actions/src/registry/index.ts` | Create | Exports: `buildPackageOutputs`, types, constants, `detectContentType` |
| `packages/actions/src/registry/package-tx.ts` | Create | Core `buildPackageOutputs` function (extracted from clawnet) |
| `packages/actions/src/registry/types.ts` | Create | `PackageFile`, `PackageMapMetadata`, `PackageTxOutput`, `PackageTxResult`, `PackageBroadcastResult` |
| `packages/actions/src/registry/constants.ts` | Create | `REGISTRY_TYPES`, `RegistryType`, `MANIFEST_CONTENT_TYPE` |
| `packages/actions/src/index.ts` | Modify | Update import from `action-registry.ts`, add `export * from './registry'` |

---

### Task 1: Rename `registry.ts` → `action-registry.ts`

**Files:**
- Rename: `packages/actions/src/registry.ts` → `packages/actions/src/action-registry.ts`
- Modify: `packages/actions/src/index.ts` (update import path)

- [ ] **Step 1: Read current `registry.ts` and `index.ts` to understand the import**

Read `packages/actions/src/registry.ts` and find where it's imported in `packages/actions/src/index.ts`.

- [ ] **Step 2: Rename the file**

```bash
cd /Users/satchmo/code/1sat-sdk
mv packages/actions/src/registry.ts packages/actions/src/action-registry.ts
```

- [ ] **Step 3: Update the import in `index.ts`**

Change:
```typescript
export { ActionRegistry, actionRegistry, type McpTool } from './registry'
```
To:
```typescript
export { ActionRegistry, actionRegistry, type McpTool } from './action-registry'
```

Also update the import at the bottom of `index.ts`:
```typescript
import { actionRegistry } from './action-registry'
```

- [ ] **Step 4: Check for any other files that import from `./registry`**

```bash
grep -r "from.*['\"]\.\/registry['\"]" packages/actions/src/
```

Update any found.

- [ ] **Step 5: Verify build**

```bash
cd /Users/satchmo/code/1sat-sdk/packages/actions && bun run build 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
git add packages/actions/src/
git commit -m "refactor(actions): rename registry.ts to action-registry.ts

Frees the src/registry/ directory for the new registry package module."
```

---

### Task 2: Create registry constants and types

**Files:**
- Create: `packages/actions/src/registry/constants.ts`
- Create: `packages/actions/src/registry/types.ts`

- [ ] **Step 1: Read clawnet source for reference**

Read `/Users/satchmo/code/clawnet/packages/cli/src/package/constants.ts` and `/Users/satchmo/code/clawnet/packages/cli/src/package/types.ts`.

- [ ] **Step 2: Create `constants.ts`**

Create `packages/actions/src/registry/constants.ts`:

```typescript
/**
 * Registry constants — shared across all publishers.
 */

export const REGISTRY_TYPES = [
	// shadcn/ui standard types
	'registry:lib',
	'registry:block',
	'registry:component',
	'registry:ui',
	'registry:hook',
	'registry:page',
	'registry:file',
	'registry:font',
	'registry:theme',
	'registry:style',
	'registry:example',
	'registry:internal',
	// Agent extension types
	'registry:skill',
	'registry:agent',
	'registry:organization',
] as const

export type RegistryType = (typeof REGISTRY_TYPES)[number]
export const REGISTRY_TYPE_SET: ReadonlySet<string> = new Set(REGISTRY_TYPES)
export const MANIFEST_CONTENT_TYPE = 'ord-fs/json'
```

Note: `MAP_PREFIX` and `AIP_PREFIX` are NOT duplicated here — they come from `@1sat/templates`.

- [ ] **Step 3: Create `types.ts`**

Create `packages/actions/src/registry/types.ts`:

```typescript
import type { RegistryType } from './constants'

/**
 * A file to include in a registry package inscription.
 */
export interface PackageFile {
	/** Relative file path (e.g. "SKILL.md", "refs/api.md") */
	path: string
	/** File content as bytes */
	content: Uint8Array
	/** MIME content type (e.g. "text/markdown", "font/woff2") */
	contentType: string
}

/**
 * MAP metadata for a registry package manifest.
 * All fields become MAP SET key-value pairs on the manifest inscription.
 */
export interface PackageMapMetadata {
	/** Registry identifier — consumer-provided (e.g. "clawnet", "theme-token") */
	app: string
	/** Registry type with registry: prefix */
	type: RegistryType
	/** Package name (lowercase, hyphenated, 1-64 chars) */
	name: string
	/** Semantic version (e.g. "1.0.0") */
	version: string
	/** Human-readable description */
	description: string
	/** BCP 47 language tag (e.g. "en", "zh") */
	language?: string
	/** URL to homepage or repository */
	homepage?: string
	/** Previous manifest outpoint for version chaining */
	prev?: string
	/** OpNS name if publisher owns it */
	'opns.name'?: string
	/** Outpoint of the OpNS name ordinal */
	'opns.outpoint'?: string
	/** Human-readable display title */
	title?: string
	/** Author name or identifier */
	author?: string
	/** JSON-serialized string[] of npm dependencies */
	dependencies?: string
	/** JSON-serialized string[] of dev dependencies */
	devDependencies?: string
	/** JSON-serialized string[] of registry item dependencies */
	registryDependencies?: string
	/** JSON-serialized string[] of category tags */
	categories?: string
	/** Additional MAP fields (e.g. font.family, font.variable) */
	[key: string]: string | undefined
}

/**
 * A single output in a package inscription transaction.
 */
export interface PackageTxOutput {
	/** Hex-encoded locking script */
	lockingScriptHex: string
	/** Satoshi amount (always 1 for inscriptions) */
	satoshis: number
	/** Human-readable description of this output */
	description: string
	/** Whether this is the manifest output (the package's on-chain identity) */
	isManifest: boolean
}

/**
 * Result of building package inscription outputs.
 */
export interface PackageTxResult {
	/** All outputs ready for transaction construction */
	outputs: PackageTxOutput[]
	/** Index of the manifest output in the outputs array */
	manifestVout: number
}

/**
 * Result after broadcasting a package inscription transaction.
 */
export interface PackageBroadcastResult {
	/** Transaction ID */
	txid: string
	/** Manifest outpoint: "{txid}_{manifestVout}" */
	manifestOutpoint: string
}
```

- [ ] **Step 4: Verify types compile**

```bash
cd /Users/satchmo/code/1sat-sdk/packages/actions && npx tsc --noEmit 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add packages/actions/src/registry/
git commit -m "feat(actions): add registry types and constants

PackageFile, PackageMapMetadata, PackageTxOutput, PackageTxResult,
PackageBroadcastResult types. REGISTRY_TYPES includes registry:font.
Generic app field (string, not hard-coded to any publisher)."
```

---

### Task 3: Extract `buildPackageOutputs` function

**Files:**
- Create: `packages/actions/src/registry/package-tx.ts`

- [ ] **Step 1: Read the clawnet source**

Read `/Users/satchmo/code/clawnet/packages/cli/src/package/package-tx.ts` completely. This is the reference implementation to extract.

- [ ] **Step 2: Create `package-tx.ts`**

Create `packages/actions/src/registry/package-tx.ts`. This is a direct extraction of clawnet's `buildPackageOutputs` with these changes:

1. Import types from local `./types` and `./constants` instead of clawnet's files
2. Import `MAP_PREFIX` from `@1sat/templates` (via the constant name) instead of redefining it
3. The `AIP_PREFIX` constant value is `"15PciHG22SNLQJXMoSUaWVi7WSqc7hCfva"` — import from `@1sat/templates` or define locally

Read the clawnet source carefully and reproduce the function, `buildBitComSuffix` helper, and `detectContentType` utility. The logic must be identical — this is an extraction, not a rewrite.

- [ ] **Step 3: Verify build**

```bash
cd /Users/satchmo/code/1sat-sdk/packages/actions && bun run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add packages/actions/src/registry/package-tx.ts
git commit -m "feat(actions): extract buildPackageOutputs from clawnet CLI

Builds ordinal inscription outputs for registry packages. Handles
file inscriptions, nested ord-fs/json directory manifests, MAP
metadata, and AIP signing. Extracted from clawnet CLI package-tx.ts."
```

---

### Task 4: Create registry module index and wire into actions exports

**Files:**
- Create: `packages/actions/src/registry/index.ts`
- Modify: `packages/actions/src/index.ts`

- [ ] **Step 1: Create `registry/index.ts`**

```typescript
/**
 * Registry Module
 *
 * Shared infrastructure for building on-chain registry packages.
 * Used by clawnet (skills, agents), theme-token (fonts, themes),
 * and any publisher creating ord-fs/json registry items.
 */

export {
	buildPackageOutputs,
	detectContentType,
} from './package-tx'

export type {
	PackageFile,
	PackageMapMetadata,
	PackageTxOutput,
	PackageTxResult,
	PackageBroadcastResult,
} from './types'

export {
	MANIFEST_CONTENT_TYPE,
	REGISTRY_TYPES,
	REGISTRY_TYPE_SET,
	type RegistryType,
} from './constants'
```

- [ ] **Step 2: Add to `packages/actions/src/index.ts`**

Add this line alongside the other module exports:
```typescript
export * from './registry'
```

And add registry to the action registration block if there are any actions (there aren't — `buildPackageOutputs` is a plain function, not an Action).

- [ ] **Step 3: Full build and verify**

```bash
cd /Users/satchmo/code/1sat-sdk/packages/actions && bun run build 2>&1 | tail -5
```

- [ ] **Step 4: Verify exports are accessible**

```bash
cd /Users/satchmo/code/1sat-sdk && node -e "
  import('@1sat/actions').then(m => {
    console.log('buildPackageOutputs:', typeof m.buildPackageOutputs);
    console.log('REGISTRY_TYPES:', m.REGISTRY_TYPES);
    console.log('MANIFEST_CONTENT_TYPE:', m.MANIFEST_CONTENT_TYPE);
  })
" 2>&1 || echo "ESM check requires build"
```

- [ ] **Step 5: Verify react package still builds**

```bash
cd /Users/satchmo/code/1sat-sdk/packages/react && bun run build 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
git add packages/actions/src/registry/index.ts packages/actions/src/index.ts
git commit -m "feat(actions): export registry module

buildPackageOutputs, detectContentType, types, and constants
now available from @1sat/actions for all registry publishers."
```

---

### Task 5: Bump version and publish

**Files:**
- Modify: `packages/actions/package.json` (version bump)

- [ ] **Step 1: Run preflight**

```bash
cd /Users/satchmo/code/1sat-sdk/packages/actions && bash /Users/satchmo/.claude/plugins/cache/b-open-io/bopen-tools/1.1.11/skills/npm-publish/scripts/preflight.sh
```

Use the npm-publish skill for the full publish flow: preflight → changelog → release → publish → verify.

- [ ] **Step 2: Write CHANGELOG entry**

Document: Added registry module with `buildPackageOutputs`, `detectContentType`, `PackageFile`, `PackageMapMetadata`, `REGISTRY_TYPES` (now includes `registry:font`), `MANIFEST_CONTENT_TYPE`.

- [ ] **Step 3: Release and publish**

Follow the npm-publish skill steps exactly.

- [ ] **Step 4: Verify**

```bash
npm view @1sat/actions version
```
