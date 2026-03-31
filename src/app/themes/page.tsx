import type { Metadata } from "next";
import type { Graph } from "schema-dts";
import { JsonLd } from "@/components/json-ld";
import { ThemesPageClient } from "./page-client";

export const metadata: Metadata = {
	title: "Browse On-Chain Themes | Theme Token",
	description:
		"Discover, collect, and remix themes inscribed on the blockchain. Browse the decentralized registry of ShadCN UI themes.",
	openGraph: {
		title: "Browse On-Chain Themes | Theme Token",
		description:
			"Discover, collect, and remix themes inscribed on the blockchain. Browse the decentralized registry of ShadCN UI themes.",
		images: ["/og/default.png"],
	},
	twitter: {
		card: "summary_large_image",
		title: "Browse On-Chain Themes | Theme Token",
		description:
			"Discover, collect, and remix themes inscribed on the blockchain. Browse the decentralized registry of ShadCN UI themes.",
		images: ["/og/default.png"],
	},
	alternates: {
		canonical: "https://themetoken.dev/themes",
	},
};

const jsonLd: Graph = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "CollectionPage",
			"@id": "https://themetoken.dev/themes/#webpage",
			url: "https://themetoken.dev/themes",
			name: "Browse On-Chain Themes | Theme Token",
			description:
				"Discover, collect, and remix ShadCN UI themes inscribed on the BSV blockchain as 1Sat Ordinals. Browse the decentralized theme registry.",
			isPartOf: { "@id": "https://themetoken.dev/#website" },
			about: { "@id": "https://themetoken.dev/#softwareapplication" },
			inLanguage: "en-US",
			keywords: [
				"ShadCN UI Themes",
				"On-Chain Theme Registry",
				"1Sat Ordinals",
				"OKLCH Color System",
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
					name: "Themes",
					item: "https://themetoken.dev/themes",
				},
			],
		},
	],
};

export default function ThemesPage() {
	return (
		<>
			<JsonLd data={jsonLd} />
			<ThemesPageClient />
		</>
	);
}
