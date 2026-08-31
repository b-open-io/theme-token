export const AGENTIC_HOME_MARKDOWN = `# Theme Token

Theme Token creates, publishes, installs, and trades ShadCN-compatible themes
as 1Sat Ordinals on BSV. Published themes are available through ordinary HTTPS
registry URLs and can be installed with the standard ShadCN CLI.

## When to use Theme Token

Use Theme Token when you need to:

- find or preview an on-chain ShadCN theme;
- create a theme with light and dark CSS variables;
- validate a Theme Token document or convert it to a ShadCN registry item;
- install a published theme by its 1Sat origin;
- publish a theme, font, pattern, wallpaper, or related design asset; or
- inspect the protocol used to connect themes with immutable on-chain assets.

For general ShadCN component documentation, use the ShadCN documentation. For
raw blockchain content, use the 1Sat content gateway linked below.

## Start here

- [Browse themes](https://themetoken.dev/themes)
- [Open the Theme Studio](https://themetoken.dev/studio/theme)
- [Read the specification](https://themetoken.dev/spec)
- [Open the developer guide](https://themetoken.dev/developers)
- [Read the quick agent reference](https://themetoken.dev/llms.txt)
- [Read the full technical reference](https://themetoken.dev/llms-full.txt)
- [Read pricing in Markdown](https://themetoken.dev/pricing.md)
- [View the SDK](https://www.npmjs.com/package/@theme-token/sdk)
- [View the source](https://github.com/b-open-io/theme-token)

## Install a published theme

\`\`\`bash
bunx shadcn@latest add https://themetoken.dev/r/themes/[origin].json
\`\`\`

Replace \`[origin]\` with the theme's 1Sat origin in \`txid_vout\` form.
`;
