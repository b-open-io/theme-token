import { Metadata } from "next";
import FontMintPage from "./font-mint-client";

export const metadata: Metadata = {
	title: "Font Studio | Inscribe On-Chain Fonts",
	description: "Upload or generate AI fonts. Compile to WOFF2, optimize, and inscribe directly to Bitcoin SV. Permanent, decentralized font hosting.",
	openGraph: {
		title: "Font Studio | Inscribe On-Chain Fonts",
		description: "Upload or generate AI fonts. Compile to WOFF2, optimize, and inscribe directly to Bitcoin SV. Permanent, decentralized font hosting.",
		images: ["/og/studio.png"],
	},
	twitter: {
		card: "summary_large_image",
		title: "Font Studio | Inscribe On-Chain Fonts",
		description: "Upload or generate AI fonts. Compile to WOFF2, optimize, and inscribe directly to Bitcoin SV. Permanent, decentralized font hosting.",
		images: ["/og/studio.png"],
	},
};

export default function Page() {
	return <FontMintPage />;
}
