import type { Metadata } from "next";
import { SpecPageClient } from "./page-client";

export const metadata: Metadata = {
	title: "Theme Token Specification | ShadCN Registry Format",
	description:
		"Technical specification for Theme Token. Learn about the JSON schema, on-chain metadata protocol, and cross-chain implementations.",
	openGraph: {
		title: "Theme Token Specification | ShadCN Registry Format",
		description:
			"Technical specification for Theme Token. Learn about the JSON schema, on-chain metadata protocol, and cross-chain implementations.",
		images: ["/og/default.png"],
	},
	twitter: {
		card: "summary_large_image",
		title: "Theme Token Specification | ShadCN Registry Format",
		description:
			"Technical specification for Theme Token. Learn about the JSON schema, on-chain metadata protocol, and cross-chain implementations.",
		images: ["/og/default.png"],
	},
};

export default function SpecPage() {
	return <SpecPageClient />;
}
