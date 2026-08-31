# ADR 0001: On-chain asset relationships

- Status: Accepted; resolver and ShadCN compiler implemented behind disabled features (OPL-3941, OPL-3946)
- Date: 2026-08-30

## Context

Theme Token currently uses three similar-looking formats for different jobs:

1. An `ord-fs/json` package stores immutable files and a directory manifest.
2. A Theme Token document describes a theme and may relate it to assets.
3. The registry gateway emits a ShadCN registry item for installation.

Treating these as one format has produced ambiguous `_N` references and raw asset
packages labeled as ShadCN items even when they are not directly installable.

## Decision

Keep the three contracts separate. The Theme Token gateway is the compiler and
compatibility boundary between the on-chain source document and ShadCN.

### 1. Storage contract

`ord-fs/json` remains the generic storage primitive. A package contains file
outputs followed by directory manifests whose `_N` values point to outputs in
the same transaction. [`package-builder.ts`](../../src/lib/package-builder.ts)
remains ignorant of themes, roles, CSS, and ShadCN installation behavior.

The canonical identity of an inscription is its immutable origin in
`<64-lowercase-hex-txid>_<non-negative-vout>` form. A transfer changes the
current outpoint, not the origin or referenced content.

### 2. Theme Token source contract

Theme Token v2 adds a top-level `assets` array. It replaces `bundle` as the
authoring model because an asset may be a sibling output or an independently
published origin. Asset references do not appear directly in style values.

Each asset relationship has:

- `role`: where the theme uses the asset;
- `kind`: what the asset is;
- `source`: a sibling output or immutable external origin, optionally with an
  `ord-fs` path;
- `mediaType`: expected media type;
- `integrity`: SHA-256 of the exact resolved file bytes;
- `delivery`: `linked` or `vendored`;
- optional `render`: role-specific presentation settings;
- optional `required`, defaulting to `true`.

Stable v2 roles are:

- `font.sans`, `font.serif`, `font.mono`, `font.heading`;
- `background.page`, `background.card`, `background.sidebar`;
- `icon.set`.

Stable v2 kinds are `font`, `pattern`, `wallpaper`, and `icon`. Role says how an
asset is used; kind must not be inferred from its filename. New standard roles
or kinds require a later Theme Token schema version. Namespaced extension roles
may be preserved but are ignored by compilers that do not understand them.

A sibling source is resolved against the transaction ID of the containing
Theme Token package origin:

```json
{ "kind": "sibling", "vout": 0, "path": "pattern.svg" }
```

An external source uses an immutable origin:

```json
{
  "kind": "origin",
  "origin": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa_0",
  "path": "font.woff2"
}
```

`path` is optional for a direct file output. When present, it is a normalized,
relative `ord-fs` path: no leading slash, empty segment, `.` or `..` segment.

### 3. ShadCN install contract

The gateway resolves and verifies Theme Token source data, then emits a document
that validates against `https://ui.shadcn.com/schema/registry-item.json`.

- Theme values compile into `cssVars.theme`, `cssVars.light`, and
  `cssVars.dark`.
- Asset behavior compiles into standard `css` rules such as `@font-face` and
  background/mask declarations.
- Vendored UTF-8 assets compile into `files` with explicit `registry:file`
  targets under `~/public/theme-token/`.
- `registryDependencies` may contain only ShadCN item addresses or full URLs
  that return valid registry-item JSON. `_N`, an ordinal origin, and a raw
  `/content/` URL are not registry dependencies.
- Provenance may be copied into the ShadCN item's `meta`, but it is not required
  for installation.

Theme Token does not invent new `registry:*` values: ShadCN owns that namespace.
Future raw asset packages use a Theme Token namespace such as
`theme-token:asset`, with kind in metadata. Existing `registry:file` and
`registry:font` inscriptions remain discoverable as legacy records. An on-chain
WOFF file is not emitted as `registry:font` while ShadCN restricts that type's
required provider model to Google fonts; it compiles as part of a
`registry:style` or universal `registry:item` instead.

## Resolution, integrity, and indexing

Resolution is deterministic:

1. Normalize the package origin and source path.
2. Convert a sibling reference to `<package-txid>_<vout>`; use an external
   reference's declared origin unchanged.
3. Resolve any `ord-fs` path from that origin.
4. Require the returned media type to match `mediaType`.
5. Hash the exact response bytes and require a match with
   `integrity`, formatted as `sha256:<64-lowercase-hex>`.

New v2 publications require integrity for every asset. Imported v1 bundles may
be read without it but are marked unverified. An integrity mismatch is always a
hard failure and must never fall back to different content.

Publishers relay the transaction's Atomic BEEF to the current 1Sat
infrastructure once for the complete package. Search/catalog indexing is not a
validity requirement. A resolver should read immutable content directly and may
retry another compatible gateway only for the same origin and only if the bytes
pass the same integrity check. It must never substitute an asset found by name,
category, current owner, or latest version.

An unresolved required asset prevents a successful install response. While the
asset is plausibly still propagating, the gateway returns a retryable failure
rather than incomplete registry JSON. An unresolved optional asset may be
omitted with an explicit diagnostic, but never silently replaced. Successfully
verified immutable bytes may be cached indefinitely by origin and integrity.

## Linked and vendored delivery

`linked` is the default and works for every supported media type. The compiled
CSS uses an absolute `https://api.1sat.app/content/...` URL derived from the
immutable origin. Theme source documents continue to store relative references,
not deployment-host URLs.

`vendored` makes installation independent of a content gateway. It is supported
only when the ShadCN CLI can reproduce the bytes without a post-install decoder:
currently UTF-8 assets such as SVG. The gateway emits the verified content as a
targeted file and rewrites generated CSS to the installed public path. Binary
WOFF and raster assets must use `linked` until conformance tests prove a
standard, byte-preserving ShadCN installation path. The compiler rejects an
unsupported vendored request; it does not silently switch delivery modes.

## Minimal relationship examples

Theme plus a sibling pattern, inside an otherwise normal Theme Token v2:

```json
{
  "assets": [
    {
      "role": "background.page",
      "kind": "pattern",
      "source": { "kind": "sibling", "vout": 0 },
      "mediaType": "image/svg+xml",
      "integrity": "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      "delivery": "linked",
      "render": { "mode": "mask", "repeat": "repeat" }
    }
  ]
}
```

An independently published on-chain font:

```json
{
  "assets": [
    {
      "role": "font.sans",
      "kind": "font",
      "source": {
        "kind": "origin",
        "origin": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa_0",
        "path": "font.woff2"
      },
      "mediaType": "font/woff2",
      "integrity": "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
      "delivery": "linked"
    }
  ]
}
```

## Provenance and ownership

The relationship means “this theme composes this immutable asset.” It does not
mean that the theme owner owns the asset, that both ordinals transfer together,
or that the relationship grants a license. Asset origin, declared author,
license, and generation metadata are provenance claims and should be preserved.
MAP `author` is informational unless separately bound to a verifiable identity.
Transaction signatures prove transaction authorization, not a human creator's
identity or ongoing ownership.

## Versioning and backward compatibility

The published v1 schema remains frozen at
`https://themetoken.dev/v1/schema.json`. Existing direct `/content/<origin>`
style values and `bundle.version: 1` documents continue to load.

A compatibility reader normalizes v1 bundle slots as follows:

| v1 slot/property | v2 role |
| --- | --- |
| `sans` / `font-sans` | `font.sans` |
| `serif` / `font-serif` | `font.serif` |
| `mono` / `font-mono` | `font.mono` |
| `pattern` / `--bg-pattern` | `background.page`, kind `pattern` |
| `wallpaper` / `--hero-image` | `background.page`, kind `wallpaper` |

The reader resolves legacy `_N` values relative to the containing package
transaction, but no new publisher or gateway emits `_N` inside CSS variables.
New relationships are published only under a v2 schema URL. ShadCN output is
versioned independently by its upstream schema and may change without rewriting
immutable Theme Token source documents.

## Consequences

- The generic publisher stays small and reusable.
- On-chain relationships remain portable across content gateways.
- ShadCN can evolve without forcing an on-chain Theme Token migration.
- A compiler/resolver and conformance tests are required before enabling bundled
  pattern, wallpaper, or local-font publishing.
- Current raw asset MAP types and the dormant bundle builder are legacy input,
  not the canonical contract for new publications.

## Implementation status

The deterministic resolver and integrity boundary lives in
`src/lib/theme-assets-v2.ts`. The registry gateway compiles verified v2 assets
into current ShadCN CSS, font imports, and targeted vendored files; the current
ShadCN CLI accepts the emitted item. Raw pattern, wallpaper, and font packages
publish as `theme-token:asset` and resolve their primary file through the
package origin. Composed v2 theme authoring remains disabled until a studio can
publish the theme document and its declared asset integrity values end to end.
