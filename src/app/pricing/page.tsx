import type { Metadata } from "next";
import { PricingPageClient } from "./page-client";

export const metadata: Metadata = {
	title: "Prism Pass | Theme Token Membership",
	description:
		"Unlock creative superpowers with Prism Pass. 50% off AI generations, extended storage, and NFT membership benefits.",
	keywords: [
		"Prism Pass",
		"Theme Token Subscription",
		"1Sat Ordinals",
		"NFT Membership",
		"BSV",
		"ShadCN Themes",
		"AI Generation Discount",
	],
	openGraph: {
		title: "Prism Pass | Unlock Creative Superpowers",
		description:
			"Unlock creative superpowers with Prism Pass. 50% off AI generations, extended storage, and NFT membership benefits.",
		images: ["/og/pricing.png"],
	},
	twitter: {
		card: "summary_large_image",
		title: "Prism Pass | Unlock Creative Superpowers",
		description:
			"Unlock creative superpowers with Prism Pass. 50% off AI generations, extended storage, and NFT membership benefits.",
		images: ["/og/pricing.png"],
	},
	alternates: {
		canonical: "https://themetoken.dev/pricing",
	},
};

const jsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "WebPage",
			"@id": "https://themetoken.dev/pricing/#webpage",
			url: "https://themetoken.dev/pricing",
			name: "Prism Pass | Theme Token Membership",
			description:
				"Unlock creative superpowers with Prism Pass NFT membership. 50% off AI generations, extended storage, and exclusive benefits.",
			isPartOf: { "@id": "https://themetoken.dev/#website" },
			about: { "@id": "https://themetoken.dev/#softwareapplication" },
			inLanguage: "en-US",
		},
		{
			"@type": "Product",
			"@id": "https://themetoken.dev/pricing/#product",
			name: "Prism Pass",
			image: "https://themetoken.dev/og/pricing.png",
			description:
				"NFT membership pass for Theme Token. Unlocks 50% off AI generations, extended cloud storage, and exclusive member benefits. Inscribed as a 1Sat Ordinal on the BSV blockchain.",
			brand: { "@id": "https://bopen.io/#organization" },
			offers: {
				"@type": "Offer",
				name: "Prism Pass",
				price: "4",
				priceCurrency: "USD",
				description:
					"NFT membership with 50% off AI generations, extended storage, and exclusive benefits",
				availability: "https://schema.org/InStock",
			},
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
					name: "Pricing",
					item: "https://themetoken.dev/pricing",
				},
			],
		},
	],
};

export default function PricingPage() {
	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
			/>
			<PricingPageClient />
		</>
	);
}
