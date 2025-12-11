import type { Metadata } from "next";
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
};

export default function MarketLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <MarketLayoutClient>{children}</MarketLayoutClient>;
}
