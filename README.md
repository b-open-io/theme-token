# Theme Token

**On-chain themes for ShadCN UI.**

Inscribe UI themes on Bitcoin. Install them with one command.

```bash
bunx shadcn@latest add https://themetoken.dev/r/themes/[origin]
```

---

## How It Works

1. **Create** a theme using [tweakcn](https://tweakcn.com/editor/theme) or any CSS editor
2. **Inscribe** it on Bitcoin via [themetoken.dev](https://themetoken.dev)
3. **Install** in any ShadCN project using the standard CLI

The registry API transforms on-chain data into the format ShadCN CLI expects.

---

## For Designers

| Benefit | Description |
|:--------|:------------|
| Ownership | Themes are inscribed as Bitcoin NFTs with cryptographic authorship |
| Monetization | List and sell on any ordinals marketplace |
| Permanence | On-chain forever, no hosting required |

## For Developers

| Benefit | Description |
|:--------|:------------|
| Familiar workflow | Standard ShadCN CLI, nothing new to learn |
| Full compatibility | Works with existing ShadCN UI setup |
| Runtime theming | Apply themes dynamically with [@theme-token/sdk](https://www.npmjs.com/package/@theme-token/sdk) |

---

## Studio Deep Links

Import themes programmatically into the studio:

```
https://themetoken.dev/studio?import=<base64-css>&name=<name>&source=<source>
```

| Parameter | Description |
|:----------|:------------|
| `import` | Base64-encoded CSS (required) |
| `name` | Theme name (optional) |
| `source` | Attribution, e.g. "tweakcn" (optional) |

---

## CLI

```bash
bunx themetoken add 85702d92...cf_0    # Install by origin
bunx themetoken url <origin>            # Get registry URL
```

---

## SDK

For building apps that integrate Theme Token:

```bash
bun add @theme-token/sdk
```

Documentation: [@theme-token/sdk](https://www.npmjs.com/package/@theme-token/sdk)

---

## Development

```bash
bun install
bun run dev
```

Runs at http://localhost:3033

---

## Links

- [themetoken.dev](https://themetoken.dev)
- [tweakcn](https://tweakcn.com/editor/theme)
- [ShadCN UI](https://ui.shadcn.com)
- [1Sat Ordinals](https://1satordinals.com)

---

## License

MIT
