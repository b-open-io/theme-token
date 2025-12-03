"use client";

import { BsvRateProvider } from "@/hooks/use-bsv-rate-context";

export default function FontStudioLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <BsvRateProvider>{children}</BsvRateProvider>;
}
