import type { Metadata } from "next";
import { ThemeStudioPageClient } from "./page-client";

export const metadata: Metadata = {
	title: "Theme Studio | Create On-Chain Themes",
	description:
		"Advanced visual editor for ShadCN themes. Customize colors, radii, and fonts. Preview in real-time and inscribe to the blockchain.",
	keywords: [
		"Theme Studio",
		"ShadCN Theme Editor",
		"Visual Theme Builder",
		"CSS Variables",
		"On-Chain Inscription",
	],
	openGraph: {
		title: "Theme Studio | Create On-Chain Themes",
		description:
			"Advanced visual editor for ShadCN themes. Customize colors, radii, and fonts. Preview in real-time and inscribe to the blockchain.",
		images: ["/og/studio-theme.png"],
	},
	twitter: {
		card: "summary_large_image",
		title: "Theme Studio | Create On-Chain Themes",
		description:
			"Advanced visual editor for ShadCN themes. Customize colors, radii, and fonts. Preview in real-time and inscribe to the blockchain.",
		images: ["/og/studio-theme.png"],
	},
};

export default function ThemeStudioPage() {
	return <ThemeStudioPageClient />;
}
