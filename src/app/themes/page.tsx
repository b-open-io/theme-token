import type { Metadata } from "next";
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
};

export default function ThemesPage() {
	return <ThemesPageClient />;
}
