"use client";

import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { ThemeStudio } from "@/components/theme-studio";

export function ThemeStudioPageClient() {
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
