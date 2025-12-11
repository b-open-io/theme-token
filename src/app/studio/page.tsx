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
};

export default function StudioPage() {
	return <StudioPageClient />;
}
