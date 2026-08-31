# ADR 0001: On-chain asset relationships

- Status: Accepted; resolver and registry compiler implemented behind disabled studios
- Date: 2026-08-30

## Context

Theme Token uses three contracts:

1. `ord-fs/json` stores immutable files and a directory manifest.
2. A Theme Token document describes styles and their related assets.
3. The registry gateway emits the ShadCN item installed by the CLI.

The storage package stays generic. Theme semantics belong in `theme.json`, and
ShadCN-specific installation behavior belongs in the registry gateway.

## Decision

Theme Token has one document format. Its existing schema URL remains
`https://themetoken.dev/v1/schema.json` because published inscriptions already
contain that immutable value. The format is presented simply as Theme Token.

The optional top-level `assets` array relates a theme to immutable fonts,
patterns, and wallpapers. Existing themes remain valid without it. Older
`bundle` metadata remains accepted but does not drive asset compilation.

Each relationship contains:

- `role`: where the theme uses the asset;
- `kind`: `font`, `pattern`, or `wallpaper`;
- `source`: a sibling transaction output or an existing ordinal origin;
- `mediaType`: the expected media type;
- `integrity`: the SHA-256 digest of the resolved bytes;
- optional `delivery`: `linked` or `vendored`;
- optional `render`: background presentation settings;
- optional `required`, which defaults to `true`.

Supported roles are:

- `font.sans`, `font.serif`, `font.mono`, `font.heading`;
- `background.page`, `background.card`, `background.sidebar`.

Icons remain outside this contract until ShadCN has a standard install target
for an on-chain icon set.

### Sources

A sibling source uses the transaction ID of the containing package:

```json
{ "kind": "sibling", "vout": 0, "path": "pattern.svg" }
```

An independently published asset uses its immutable origin:

```json
{
  "kind": "origin",
  "origin": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa_0",
  "path": "font.woff2"
}
```

`path` is optional for a direct file output. A path is relative and normalized:
it has no leading slash, empty segment, `.` segment, or `..` segment.

## Resolution and integrity

The gateway resolves each asset deterministically:

1. Normalize the package origin and source path.
2. Resolve a sibling as `<package-txid>_<vout>` or use the declared external
   origin.
3. Resolve the optional `ord-fs` path.
4. Match the returned media type to `mediaType`.
5. Hash the exact response bytes and match `integrity`, formatted as
   `sha256:<64-lowercase-hex>`.

An integrity or media-type mismatch is a hard failure. Missing required content
returns a retryable response while indexing catches up. Missing optional content
is omitted with a diagnostic. Verified immutable bytes may be cached by origin
and digest.

Publishers relay the complete package's Atomic BEEF to 1Sat once. Catalog
indexing helps discovery but does not establish validity.

## Delivery

`linked` is the default. Generated CSS uses an absolute
`https://api.1sat.app/content/...` URL for the immutable asset while the Theme
Token document keeps the portable origin reference.

`vendored` writes verified UTF-8 content, currently SVG, into the ShadCN
registry item's `files`. Binary fonts and raster images use linked delivery
until the ShadCN CLI has a byte-preserving installation path for them.

Unsupported vendoring fails explicitly.

## ShadCN output

The gateway compiles a Theme Token into a document that follows
`https://ui.shadcn.com/schema/registry-item.json`:

- theme values populate `cssVars.theme`, `cssVars.light`, and `cssVars.dark`;
- font relationships add verified font imports and family variables;
- background relationships add standard CSS rules;
- vendored text assets become targeted `registry:file` entries;
- relationship provenance may appear in `meta.themeToken`.

Theme Token asset packages use MAP type `theme-token:asset`. Theme installations
continue to use ShadCN's `registry:style` output.

## Example

```json
{
  "$schema": "https://themetoken.dev/v1/schema.json",
  "name": "Graph Paper",
  "styles": {
    "light": { "...": "complete style map" },
    "dark": { "...": "complete style map" }
  },
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

## Compatibility and rollout

- Existing Theme Token inscriptions and SDK consumers continue to read the
  required theme fields.
- The SDK preserves and validates `assets`.
- The registry gateway already verifies and compiles relationships.
- Theme, pattern, wallpaper, and font studios should adopt the field only when
  their complete publish-and-install flow passes conformance tests.
