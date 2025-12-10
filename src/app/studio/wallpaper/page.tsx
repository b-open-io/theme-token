"use client";

import { Image } from "lucide-react";
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
	EmptyDescription,
} from "@/components/ui/empty";

export default function WallpaperStudioPage() {
	return (
		<div className="flex min-h-0 flex-1 items-center justify-center p-4">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Image />
					</EmptyMedia>
					<EmptyTitle>Wallpaper Studio</EmptyTitle>
					<EmptyDescription>
						Design beautiful wallpapers for desktop and mobile. Coming soon!
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	);
}
