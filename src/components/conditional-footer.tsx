"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/footer";

export function ConditionalFooter() {
	const pathname = usePathname();

	// Hide footer on studio subroutes (but show on /studio landing page)
	const isStudioSubroute = pathname?.startsWith("/studio/");

	if (isStudioSubroute) {
		return null;
	}

	return <Footer />;
}
