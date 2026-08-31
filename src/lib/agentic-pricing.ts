import {
	BASE_PRICES,
	formatSatoshis,
	PRISM_PASS_DISCOUNT,
	PRISM_PASS_USD_PRICE,
} from "@/lib/pricing";

export const AGENTIC_PRICING_MARKDOWN = `# Theme Token pricing

Browsing published themes, editing a theme manually, installing registry
items, and using the Theme Token SDK are free. Wallet transaction and
blockchain inscription fees still apply when you publish or trade an asset.

## AI generation

- Theme: ${formatSatoshis(BASE_PRICES.generateTheme)}
- Font: ${formatSatoshis(BASE_PRICES.generateFont)}
- Pattern: ${formatSatoshis(BASE_PRICES.generatePattern)}
- Icon set: ${formatSatoshis(BASE_PRICES.generateIconSet)}
- Favicon: ${formatSatoshis(BASE_PRICES.generateFavicon)}
- Wallpaper: ${formatSatoshis(BASE_PRICES.generateWallpaper)}
- Block: ${formatSatoshis(BASE_PRICES.generateBlock)}
- Component: ${formatSatoshis(BASE_PRICES.generateComponent)}
- Project preset: ${formatSatoshis(BASE_PRICES.createProject)}

Prices are paid in satoshis. The site may show an approximate fiat value using
the current BSV exchange rate.

## Prism Pass

Prism Pass is listed at $${PRISM_PASS_USD_PRICE} USD, converted to BSV at the
current exchange rate. A wallet transaction is required to mint the pass.
Pass holders receive ${PRISM_PASS_DISCOUNT * 100}% off the AI generation prices
above and extended hosted draft storage.

## Publishing costs

Publishing and marketplace transactions use the connected BRC-100 wallet.
Network cost depends on the transaction and inscription size, so the wallet
request is the authoritative total before approval.

- [Interactive pricing page](https://themetoken.dev/pricing)
- [Theme Token protocol](https://themetoken.dev/spec)
- [Contact](https://themetoken.dev/contact)
`;
