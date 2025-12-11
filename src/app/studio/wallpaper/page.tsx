import { Metadata } from "next";
import WallpaperStudioPage from "./wallpaper-client";

export const metadata: Metadata = {
	title: "Wallpaper Studio | Generate AI Wallpapers",
	description: "Create seamless, high-resolution wallpapers with AI. Inscribe as on-chain assets for use in themes and apps.",
	openGraph: {
		title: "Wallpaper Studio | Generate AI Wallpapers",
		description: "Create seamless, high-resolution wallpapers with AI. Inscribe as on-chain assets for use in themes and apps.",
		images: ["/og/studio.png"],
	},
	twitter: {
		card: "summary_large_image",
		title: "Wallpaper Studio | Generate AI Wallpapers",
		description: "Create seamless, high-resolution wallpapers with AI. Inscribe as on-chain assets for use in themes and apps.",
		images: ["/og/studio.png"],
	},
};

export default function Page() {
	return <WallpaperStudioPage />;
}
