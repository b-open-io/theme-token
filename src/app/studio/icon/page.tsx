import { Metadata } from "next";
import IconStudioPage from "./icon-client";

export const metadata: Metadata = {
	title: "Icon Studio | SVG Icon Generator",
	description: "Generate and edit SVG icons for your design system. Coming soon to Theme Token.",
	openGraph: {
		title: "Icon Studio | SVG Icon Generator",
		description: "Generate and edit SVG icons for your design system. Coming soon to Theme Token.",
		images: ["/og/studio.png"],
	},
	twitter: {
		card: "summary_large_image",
		title: "Icon Studio | SVG Icon Generator",
		description: "Generate and edit SVG icons for your design system. Coming soon to Theme Token.",
		images: ["/og/studio.png"],
	},
};

export default function Page() {
	return <IconStudioPage />;
}
