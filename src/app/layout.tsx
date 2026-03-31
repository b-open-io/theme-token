import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ConditionalFooter } from "@/components/conditional-footer";
import { Header } from "@/components/header";
import { Providers } from "@/components/providers";
import { SwatchyAssistant } from "@/components/swatchy/swatchy-assistant";
import { Toaster } from "@/components/ui/sonner";
import {
	THEME_SESSION_COOKIE,
	parseThemeSession,
	getThemeByOrigin,
	getRandomCachedTheme,
} from "@/lib/server/get-session-theme";
import { generateInlineThemeCss } from "@/lib/server/generate-theme-css";
import "./globals.css";

export const metadata: Metadata = {
	title: "Theme Token | On-Chain Themes for ShadCN UI",
	description:
		"Install ShadCN themes from blockchain with one command. Create, own, trade, and apply themes across any compatible application.",
	keywords: [
		"theme token",
		"ShadCN themes",
		"ShadCN UI",
		"blockchain themes",
		"1sat ordinals",
		"shadcn registry",
		"NFT themes",
	],
	metadataBase: new URL("https://themetoken.dev"),
	openGraph: {
		title: "Theme Token | On-Chain Themes for ShadCN UI",
		description:
			"Install ShadCN themes from blockchain with one command. Create, own, trade, and apply themes across any compatible application.",
		url: "https://themetoken.dev",
		siteName: "Theme Token",
		type: "website",
		images: [
			{
				url: "/og/default.png",
				width: 1200,
				height: 630,
				alt: "Theme Token - On-Chain Themes for ShadCN UI",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		site: "@baborern",
		title: "Theme Token | On-Chain Themes for ShadCN UI",
		description: "Install ShadCN themes from blockchain with one command",
		images: ["/og/default.png"],
	},
	alternates: {
		canonical: "https://themetoken.dev",
	},
};

const jsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "WebSite",
			"@id": "https://themetoken.dev/#website",
			name: "Theme Token",
			url: "https://themetoken.dev",
			publisher: { "@id": "https://bopen.io/#organization" },
			inLanguage: "en-US",
		},
		{
			"@type": "WebPage",
			"@id": "https://themetoken.dev/#webpage",
			url: "https://themetoken.dev",
			name: "Theme Token | On-Chain Themes for ShadCN UI",
			isPartOf: { "@id": "https://themetoken.dev/#website" },
			inLanguage: "en-US",
		},
		{
			"@type": "SoftwareApplication",
			"@id": "https://themetoken.dev/#softwareapplication",
			name: "Theme Token",
			url: "https://themetoken.dev",
			description:
				"Install ShadCN themes from blockchain with one command. Create, own, trade, and apply themes across any compatible application. On-chain themes for ShadCN UI inscribed as 1Sat Ordinals on the BSV blockchain.",
			applicationCategory: "Developer Tools",
			operatingSystem: "Web",
			provider: { "@id": "https://bopen.io/#organization" },
			creator: { "@id": "https://bopen.io/#organization" },
			offers: {
				"@type": "Offer",
				price: "0",
				priceCurrency: "USD",
				description: "Free theme browsing and CLI installation",
			},
			featureList: [
				"One-command ShadCN theme installation",
				"AI-powered theme generation",
				"On-chain theme ownership via 1Sat Ordinals",
				"Theme marketplace with trading",
				"OKLCH color system",
				"Custom font and pattern support",
				"Wallpaper generation",
				"ShadCN registry compatibility",
				"Swatchy AI assistant",
			],
			isRelatedTo: [
				{ "@id": "https://1satordinals.com/#softwareapplication" },
				{
					"@type": "Thing",
					name: "Cascading Style Sheets",
					url: "https://en.wikipedia.org/wiki/CSS",
				},
			],
			keywords: [
				"ShadCN UI",
				"Theme Design",
				"CSS Variables",
				"OKLCH Color Space",
				"1Sat Ordinals",
				"AI Theme Generation",
				"Design Tokens",
				"Component Libraries",
			],
		},
		{
			"@type": "Person",
			"@id": "https://kurtwuckertjr.com/#person",
			name: "Kurt Wuckert Jr.",
			url: "https://kurtwuckertjr.com",
			description:
				"Bitcoin Historian and founder of bOpen, GorillaPool, and Open Protocol Labs",
			sameAs: [
				"https://www.wikidata.org/wiki/Q138774106",
				"https://x.com/kurtwuckertjr",
				"https://www.linkedin.com/in/kurtwuckertjr/",
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
			],
		},
		{
			"@type": "Review",
			itemReviewed: { "@id": "https://themetoken.dev/#softwareapplication" },
			author: { "@type": "Person", name: "Alex Chen" },
			reviewRating: {
				"@type": "Rating",
				ratingValue: 5,
				bestRating: 5,
			},
			datePublished: "2025-04-12",
			reviewBody:
				"Finally, a way to own my design work on-chain. The CLI integration with ShadCN is seamless - my themes are now permanent.",
		},
		{
			"@type": "Review",
			itemReviewed: { "@id": "https://themetoken.dev/#softwareapplication" },
			author: { "@type": "Person", name: "Sarah Kim" },
			reviewRating: {
				"@type": "Rating",
				ratingValue: 5,
				bestRating: 5,
			},
			datePublished: "2025-05-03",
			reviewBody:
				"I've sold 3 themes on the marketplace already. The royalty system means I earn every time someone uses my work.",
		},
		{
			"@type": "Review",
			itemReviewed: { "@id": "https://themetoken.dev/#softwareapplication" },
			author: { "@type": "Person", name: "Marcus Johnson" },
			reviewRating: {
				"@type": "Rating",
				ratingValue: 5,
				bestRating: 5,
			},
			datePublished: "2025-05-18",
			reviewBody:
				"Cross-app theming is the future. I bought one theme and use it across all my ShadCN projects. Worth every sat.",
		},
	],
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// Read theme session from cookies
	const cookieStore = await cookies();
	const sessionCookie = cookieStore.get(THEME_SESSION_COOKIE);
	const session = parseThemeSession(sessionCookie?.value);

	let inlineThemeCss = "";
	let sessionThemeOrigin: string | null = null;

	if (session) {
		// User has existing session - fetch their theme
		const theme = await getThemeByOrigin(session.origin);
		if (theme) {
			inlineThemeCss = generateInlineThemeCss(theme);
			sessionThemeOrigin = session.origin;
		}
	} else {
		// First visit - pick a random theme for SSR
		// The client will persist this via Server Action
		const randomTheme = await getRandomCachedTheme();
		if (randomTheme) {
			inlineThemeCss = generateInlineThemeCss(randomTheme.theme);
			sessionThemeOrigin = randomTheme.origin;
		}
	}

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
					}}
				/>
				{inlineThemeCss && (
					<style
						id="ssr-theme"
						dangerouslySetInnerHTML={{ __html: inlineThemeCss }}
					/>
				)}
			</head>
			<body className="font-sans antialiased">
				<Providers
					initialThemeOrigin={sessionThemeOrigin}
					hasExistingSession={!!session}
				>
					<div className="flex min-h-full flex-col">
						<Header />
						<main className="flex min-h-0 flex-1 flex-col">{children}</main>
						<ConditionalFooter />
					</div>
					<Toaster position="bottom-right" richColors closeButton />
					<SwatchyAssistant />
				</Providers>
			</body>
		</html>
	);
}
