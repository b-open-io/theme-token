# Theme Token

On-chain themes for ShadCN UI using the ShadCN Registry Format.

## Install from Blockchain

```bash
bunx shadcn@latest add https://themetoken.dev/r/themes/[origin].json
```

Replace `[origin]` with the inscription origin ID.

## What is Theme Token?

Theme Token inscribes UI themes on blockchain as NFT assets. Any app using ShadCN UI can install and apply these on-chain themes directly via the ShadCN CLI.

## Schema

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
      "secondary-foreground": "oklch(0.145 0 0)",
      "muted": "oklch(0.97 0 0)",
      "muted-foreground": "oklch(0.45 0 0)",
      "accent": "oklch(0.97 0 0)",
      "accent-foreground": "oklch(0.145 0 0)",
      "destructive": "oklch(0.55 0.22 25)",
      "destructive-foreground": "oklch(0.98 0 0)",
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

The `/r/themes/[origin].json` endpoint serves themes in ShadCN Registry Format:

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "midnight-aurora",
  "type": "registry:style",
  "cssVars": {
    "light": { "...": "light mode CSS vars" },
    "dark": { "...": "dark mode CSS vars" }
  }
}
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

## License

MIT
