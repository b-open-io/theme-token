"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Redirect to marketplace browse - this route is deprecated in favor of /market/browse
export function ThemesPageClient() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/market/browse");
	}, [router]);

	return (
		<div className="flex h-[50vh] items-center justify-center">
			<p className="text-muted-foreground">Redirecting to marketplace...</p>
		</div>
	);
}
