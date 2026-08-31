import type { Metadata } from "next";
import type { Graph } from "schema-dts";
import { JsonLd } from "@/components/json-ld";
import { SpecPageClient } from "./page-client";

export const metadata: Metadata = {
	title: "Theme Token Specification | ShadCN Registry Format",
	description:
		"Technical specification for Theme Token. Learn about the JSON schema, on-chain metadata protocol, and BSV implementation.",
	openGraph: {
		title: "Theme Token Specification | ShadCN Registry Format",
		description:
			"Technical specification for Theme Token. Learn about the JSON schema, on-chain metadata protocol, and BSV implementation.",
		images: ["/og/default.png"],
	},
	twitter: {
		card: "summary_large_image",
		title: "Theme Token Specification | ShadCN Registry Format",
		description:
			"Technical specification for Theme Token. Learn about the JSON schema, on-chain metadata protocol, and BSV implementation.",
		images: ["/og/default.png"],
	},
	alternates: {
		canonical: "https://themetoken.dev/spec",
	},
};

const jsonLd: Graph = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "TechArticle",
			"@id": "https://themetoken.dev/spec/#article",
			url: "https://themetoken.dev/spec",
			name: "Theme Token Specification",
			headline: "Theme Token Technical Specification",
			description:
				"Technical specification for the Theme Token format. Covers JSON schema, on-chain MAP metadata, ShadCN registry compatibility, OKLCH colors, and the BSV implementation.",
			isPartOf: { "@id": "https://themetoken.dev/#website" },
			about: { "@id": "https://themetoken.dev/#softwareapplication" },
			inLanguage: "en-US",
			proficiencyLevel: "Expert",
			publisher: { "@id": "https://bopen.io/#organization" },
			keywords: [
				"Theme Token JSON Schema",
				"ShadCN Registry Format",
				"On-Chain Metadata Protocol",
				"OKLCH Color System",
				"1Sat Ordinals Inscription",
				"CSS Variables",
				"Design Token Specification",
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
					name: "Specification",
					item: "https://themetoken.dev/spec",
				},
			],
		},
	],
};

export default function SpecPage() {
	return (
		<>
			<JsonLd data={jsonLd} />
			<SpecPageClient />
		</>
	);
}
