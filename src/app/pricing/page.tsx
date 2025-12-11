import type { Metadata } from "next";
import { PricingPageClient } from "./page-client";

export const metadata: Metadata = {
	title: "Prism Pass | Theme Token Membership",
	description:
		"Unlock creative superpowers with Prism Pass. 50% off AI generations, extended storage, and NFT membership benefits.",
	keywords: [
		"Prism Pass",
		"Theme Token Subscription",
		"1Sat Ordinals",
		"NFT Membership",
		"BSV",
		"ShadCN Themes",
		"AI Generation Discount",
	],
	openGraph: {
		title: "Prism Pass | Unlock Creative Superpowers",
		description:
			"Unlock creative superpowers with Prism Pass. 50% off AI generations, extended storage, and NFT membership benefits.",
		images: ["/og/pricing.png"],
	},
	twitter: {
		card: "summary_large_image",
		title: "Prism Pass | Unlock Creative Superpowers",
		description:
			"Unlock creative superpowers with Prism Pass. 50% off AI generations, extended storage, and NFT membership benefits.",
		images: ["/og/pricing.png"],
	},
};

export default function PricingPage() {
	return <PricingPageClient />;
}
