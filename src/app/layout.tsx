import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
	variable: "--font-display",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
	weight: ["400", "500", "600"],
});

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

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="h-full" suppressHydrationWarning>
			<body
				className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full font-sans antialiased`}
			>
				<Providers>
					<div className="flex min-h-full flex-col">
						<Header />
						<main className="flex min-h-0 flex-1 flex-col">{children}</main>
						<Footer />
					</div>
					<Toaster position="bottom-right" richColors closeButton />
				</Providers>
			</body>
		</html>
	);
}
