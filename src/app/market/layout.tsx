import type { Metadata } from "next";
import type { Graph } from "schema-dts";
import { JsonLd } from "@/components/json-ld";
import { MarketLayoutClient } from "./layout-client";

export const metadata: Metadata = {
	title: "Marketplace | Buy & Sell On-Chain Themes",
	description:
		"Decentralized marketplace for ShadCN themes, fonts, and assets. Buy, sell, and trade immutable design tokens.",
	keywords: [
		"Theme Marketplace",
		"Buy Themes",
		"Sell Themes",
		"On-Chain Assets",
		"ShadCN UI",
		"Bitcoin SV",
		"Digital Artifacts",
	],
	openGraph: {
		title: "Marketplace | Buy & Sell On-Chain Themes",
		description:
			"Decentralized marketplace for ShadCN themes, fonts, and assets. Buy, sell, and trade immutable design tokens.",
		images: ["/og/market.png"],
	},
	twitter: {
		card: "summary_large_image",
		title: "Marketplace | Buy & Sell On-Chain Themes",
		description:
			"Decentralized marketplace for ShadCN themes, fonts, and assets. Buy, sell, and trade immutable design tokens.",
		images: ["/og/market.png"],
	},
	alternates: {
		canonical: "https://themetoken.dev/market",
	},
};

const jsonLd: Graph = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "CollectionPage",
			"@id": "https://themetoken.dev/market/#webpage",
			url: "https://themetoken.dev/market",
			name: "Theme Token Marketplace",
			description:
				"Decentralized marketplace for ShadCN UI themes, fonts, and design assets. Buy, sell, and trade immutable design tokens inscribed as 1Sat Ordinals on the BSV blockchain.",
			isPartOf: { "@id": "https://themetoken.dev/#website" },
			about: { "@id": "https://themetoken.dev/#softwareapplication" },
			inLanguage: "en-US",
			keywords: [
				"Theme Marketplace",
				"On-Chain Design Assets",
				"1Sat Ordinals Trading",
				"ShadCN Theme Trading",
				"Font Marketplace",
			],
		},
		{
			"@type": "BreadcrumbList",
			itemListElement: [
				{
					"@type": "ListItem",
					position: 1,
					name: "Home",
					item: "https://themetoken.dev",
				},
				{
					"@type": "ListItem",
					position: 2,
					name: "Marketplace",
					item: "https://themetoken.dev/market",
				},
			],
		},
	],
};

export default function MarketLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<JsonLd data={jsonLd} />
			<MarketLayoutClient>{children}</MarketLayoutClient>
		</>
	);
}
