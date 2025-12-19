import type { Metadata } from "next";
import type { SoftwareApplication, WithContext } from "schema-dts";
import { cookies } from "next/headers";
import { JsonLd } from "@/components/json-ld";
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
		title: "Theme Token | On-Chain Themes for ShadCN UI",
		description: "Install ShadCN themes from blockchain with one command",
		images: ["/og/default.png"],
	},
};

const jsonLd: WithContext<SoftwareApplication> = {
	"@context": "https://schema.org",
	"@type": "SoftwareApplication",
	name: "Theme Token",
	url: "https://themetoken.dev",
	description:
		"Install ShadCN UI themes from blockchain with one command. Create, own, trade, and apply themes across any compatible application.",
	applicationCategory: "DeveloperApplication",
	operatingSystem: "Web",
	offers: {
		"@type": "Offer",
		price: "0",
		priceCurrency: "USD",
	},
	provider: {
		"@type": "Organization",
		name: "Theme Token",
		url: "https://themetoken.dev",
	},
	featureList: [
		"On-chain theme storage via Bitcoin ordinals",
		"ShadCN CLI compatible registry",
		"Theme marketplace with NFT ownership",
		"Runtime theme application via SDK",
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
				<JsonLd data={jsonLd} />
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
