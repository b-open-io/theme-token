"use client";

import { WallpaperProvider } from "@/components/wallpaper/wallpaper-context";
import { WallpaperLayout } from "@/components/wallpaper/wallpaper-layout";

export default function WallpaperStudioPage() {
	return (
		<WallpaperProvider>
			<WallpaperLayout />
		</WallpaperProvider>
	);
}
