# Theme Token

On-chain themes for ShadCN UI. Install themes directly from blockchain using the ShadCN CLI.

## Install from Blockchain

```bash
bunx shadcn@latest add https://themetoken.dev/r/themes/[origin].json
```

Replace `[origin]` with the theme's inscription origin ID (e.g., `85702d92...cf_0`).

## What is Theme Token?

Theme Token inscribes UI themes on the BSV blockchain as NFT assets. Any app using ShadCN UI can install these on-chain themes directly via the standard ShadCN CLI.

**For Designers:** True ownership with authorship recorded on-chain. Sell on any ordinal marketplace.

**For Developers:** 100% compatible with ShadCN ecosystem. One command to install.

**For Users:** Buy once, use across all supported apps. Collect rare themes.

## Theme Token Schema

Themes are inscribed in this format:

```json
{
  "$schema": "https://themetoken.dev/v1/schema.json",
  "name": "midnight-aurora",
  "author": "WildSatchmo (https://github.com/rohenaz)",
  "styles": {
    "light": {
      "background": "oklch(1 0 0)",
      "foreground": "oklch(0.145 0 0)",
      "primary": "oklch(0.55 0.22 255)",
      "primary-foreground": "oklch(0.98 0 0)",
      "secondary": "oklch(0.97 0 0)",
      "muted": "oklch(0.97 0 0)",
      "accent": "oklch(0.97 0 0)",
      "destructive": "oklch(0.55 0.22 25)",
      "border": "oklch(0.9 0 0)",
      "input": "oklch(0.9 0 0)",
      "ring": "oklch(0.55 0.22 255)",
      "radius": "0.5rem"
    },
    "dark": {
      "...": "dark mode variants"
    }
  }
}
```

## Registry API

The `/r/themes/[origin].json` endpoint converts theme tokens to ShadCN Registry Format:

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "midnight-aurora",
  "type": "registry:style",
  "cssVars": {
    "light": { "background": "oklch(1 0 0)", "...": "..." },
    "dark": { "...": "..." }
  }
}
```

## Studio Deep Links

The theme studio supports deep link imports for tool integrations:

```
https://themetoken.dev/studio?import=<base64>&name=<name>&source=<source>
```

**Parameters:**
- `import` or `css` - Base64-encoded CSS (required)
- `name` - Theme name (optional)
- `source` - Attribution shown in UI, e.g., "tweakcn" (optional)

**Example:**
```bash
# Encode your CSS
CSS=':root { --primary: oklch(0.6 0.15 145); }'
ENCODED=$(echo -n "$CSS" | base64)

# Generate deep link
echo "https://themetoken.dev/studio?import=$ENCODED&name=My%20Theme&source=tweakcn"
```

This enables integrations with theme builders like [tweakcn.com](https://tweakcn.com/editor/theme).

## CLI Tool

```bash
# Install a theme by origin ID
bunx themetoken add 85702d92d2ca2f5a48eaede302f0e85d9142924d68454565dbf621701b2d83cf_0

# Install by txid (assumes _0 vout)
bunx themetoken add 85702d92d2ca2f5a48eaede302f0e85d9142924d68454565dbf621701b2d83cf

# Get registry URL without installing
bunx themetoken url <origin>
```

## Development

```bash
bun install
bun run dev
```

Runs on http://localhost:3033

## Links

- [themetoken.dev](https://themetoken.dev)
- [1Sat Ordinals](https://1satordinals.com)
- [ShadCN UI](https://ui.shadcn.com)
- [tweakcn](https://tweakcn.com/editor/theme) - Theme builder

## License

MIT
