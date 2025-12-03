import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Theme Studio | Create ShadCN Themes On-Chain",
	description:
		"Design and customize ShadCN UI themes with our visual editor. Edit colors, typography, and styling, then inscribe your theme on-chain.",
	openGraph: {
		title: "Theme Studio | Create ShadCN Themes On-Chain",
		description:
			"Design and customize ShadCN UI themes with our visual editor. Edit colors, typography, and styling, then inscribe your theme on-chain.",
	},
};

export default function StudioLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
