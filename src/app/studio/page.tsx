import type { Metadata } from "next";
import { StudioPageClient } from "./page-client";

export const metadata: Metadata = {
	title: "Creator Studio | Theme Token",
	description:
		"Initialize your creative suite. Visual editors for themes, fonts, wallpapers, and icons. Inscribe directly to blockchain.",
	keywords: [
		"Creator Studio",
		"Theme Editor",
		"Font Generator",
		"Wallpaper AI",
		"SVG Patterns",
		"On-Chain Creation",
		"Design Tools",
	],
	openGraph: {
		title: "Creator Studio | Theme Token",
		description:
			"Initialize your creative suite. Visual editors for themes, fonts, wallpapers, and icons. Inscribe directly to blockchain.",
		images: ["/og/studio.png"],
	},
	twitter: {
		card: "summary_large_image",
		title: "Creator Studio | Theme Token",
		description:
			"Initialize your creative suite. Visual editors for themes, fonts, wallpapers, and icons. Inscribe directly to blockchain.",
		images: ["/og/studio.png"],
	},
	alternates: {
		canonical: "https://themetoken.dev/studio",
	},
};

const jsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "WebApplication",
			"@id": "https://themetoken.dev/studio/#webapplication",
			url: "https://themetoken.dev/studio",
			name: "Theme Token Creator Studio",
			description:
				"Web-based creative suite for designing ShadCN themes, generating AI fonts, creating wallpapers, and crafting SVG patterns. Inscribe creations directly to the BSV blockchain as 1Sat Ordinals.",
			applicationCategory: "DesignApplication",
			operatingSystem: "Web",
			provider: { "@id": "https://bopen.io/#organization" },
			isPartOf: { "@id": "https://themetoken.dev/#softwareapplication" },
			offers: {
				"@type": "Offer",
				price: "0",
				priceCurrency: "USD",
				description: "Free to use. AI generation features require BSV payment.",
			},
			featureList: [
				"Visual theme editor with OKLCH colors",
				"AI-powered font generation",
				"Wallpaper generation",
				"SVG pattern editor",
				"Icon customization",
				"ShadCN registry export",
				"Direct blockchain inscription",
			],
			keywords: [
				"Theme Design",
				"AI Font Generation",
				"Wallpaper Generation",
				"SVG Patterns",
				"On-Chain Inscription",
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
					name: "Creator Studio",
					item: "https://themetoken.dev/studio",
				},
			],
		},
	],
};

export default function StudioPage() {
	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
			/>
			<StudioPageClient />
		</>
	);
}
