# Theme Token

An open standard for tokenizing ShadCN UI themes on blockchain.

## What is Theme Token?

Theme Token defines a JSON schema for inscribing UI themes as NFT assets using protocols like 1Sat Ordinals. Any app using ShadCN UI can read and apply these on-chain themes.

## Schema v1.0

```json
{
  "$schema": "1.0",
  "protocol": "ThemeToken",
  "type": "ShadCN-UI",
  "metadata": {
    "name": "My Theme",
    "author": "designer.paymail",
    "license": "CC0"
  },
  "light": {
    "colors": {
      "primary": "oklch(0.55 0.22 255)",
      "background": "oklch(0.98 0.005 240)",
      ...
    },
    "dimensions": { "radius": "0.5rem" }
  },
  "dark": { ... }
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
