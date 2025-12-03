# Theme Token

**On-chain themes for ShadCN UI.**

Inscribe UI themes on Bitcoin. Install them with one command.

```bash
bunx shadcn@latest add https://themetoken.dev/r/themes/[origin].json
```

## How It Works

1. **Create** a theme using [tweakcn](https://tweakcn.com/editor/theme) or any CSS
2. **Inscribe** it on Bitcoin via [themetoken.dev](https://themetoken.dev)
3. **Install** in any ShadCN project with `bunx shadcn add <url>`

The registry API transforms on-chain themes into the format ShadCN CLI expects.

## For Designers

- **Own your work** — Themes are inscribed as Bitcoin NFTs with cryptographic authorship
- **Sell anywhere** — List on any ordinals marketplace
- **Permanent** — On-chain forever, no hosting required

## For Developers

- **One command** — Standard ShadCN CLI, nothing new to learn
- **100% compatible** — Works with existing ShadCN UI setup
- **Runtime support** — Apply themes dynamically with [@theme-token/sdk](https://www.npmjs.com/package/@theme-token/sdk)

## Studio Deep Links

Import themes programmatically into the studio:

```
https://themetoken.dev/studio?import=<base64-css>&name=<name>&source=<source>
```

| Parameter | Description |
|-----------|-------------|
| `import` or `css` | Base64-encoded CSS (required) |
| `name` | Theme name (optional) |
| `source` | Attribution, e.g., "tweakcn" (optional) |

## CLI

```bash
# Install theme by origin
bunx themetoken add 85702d92...cf_0

# Get registry URL
bunx themetoken url <origin>
```

## SDK

For building apps that integrate Theme Token:

```bash
bun add @theme-token/sdk
```

See [@theme-token/sdk documentation](https://www.npmjs.com/package/@theme-token/sdk).

## Development

```bash
bun install
bun run dev  # http://localhost:3033
```

## Links

- [themetoken.dev](https://themetoken.dev)
- [tweakcn](https://tweakcn.com/editor/theme) — Theme builder
- [ShadCN UI](https://ui.shadcn.com)
- [1Sat Ordinals](https://1satordinals.com)

## License

MIT
