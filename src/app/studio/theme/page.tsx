"use client";

import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { ThemeStudio } from "@/components/theme-studio";
import { Metadata } from "next";

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
	return (
		<div className="flex h-full flex-col bg-background">
			<Suspense
				fallback={
					<div className="flex h-full items-center justify-center">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				}
			>
				<ThemeStudio />
			</Suspense>
		</div>
	);
}
