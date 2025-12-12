import type { Metadata } from "next";
import { ProjectStudioPageClient } from "./page-client";

export const metadata: Metadata = {
	title: "Project Studio | Create shadcn/create Presets",
	description:
		"Compose themes, fonts, icons, and wallpapers into complete shadcn/create presets. Bundle and inscribe as on-chain projects.",
	keywords: [
		"Project Studio",
		"shadcn/create",
		"registry:base",
		"UI Bundle",
		"On-Chain Projects",
		"shadcn preset",
	],
	openGraph: {
		title: "Project Studio | Create shadcn/create Presets",
		description:
			"Compose themes, fonts, icons, and wallpapers into complete shadcn/create presets. Bundle and inscribe as on-chain projects.",
		images: ["/og/studio-project.png"],
	},
	twitter: {
		card: "summary_large_image",
		title: "Project Studio | Create shadcn/create Presets",
		description:
			"Compose themes, fonts, icons, and wallpapers into complete shadcn/create presets. Bundle and inscribe as on-chain projects.",
		images: ["/og/studio-project.png"],
	},
};

export default function ProjectStudioPage() {
	return <ProjectStudioPageClient />;
}
