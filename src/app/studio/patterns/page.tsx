import { Metadata } from "next";
import PatternGeneratorPage from "./pattern-client";

export const metadata: Metadata = {
	title: "Pattern Studio | AI SVG Patterns",
	description: "Generate seamless SVG vector patterns. Customize colors, geometry, and complexity. Inscribe as on-chain assets.",
	openGraph: {
		title: "Pattern Studio | AI SVG Patterns",
		description: "Generate seamless SVG vector patterns. Customize colors, geometry, and complexity. Inscribe as on-chain assets.",
		images: ["/og/studio.png"],
	},
	twitter: {
		card: "summary_large_image",
		title: "Pattern Studio | AI SVG Patterns",
		description: "Generate seamless SVG vector patterns. Customize colors, geometry, and complexity. Inscribe as on-chain assets.",
		images: ["/og/studio.png"],
	},
};

export default function Page() {
	return <PatternGeneratorPage />;
}
