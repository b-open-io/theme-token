"use client";

import { usePathname } from "next/navigation";
import { getWidthVariant, WIDTH_CONFIG } from "@/lib/layout-config";
import { cn } from "@/lib/utils";

export function PageContainer({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	const pathname = usePathname();
	const widthVariant = getWidthVariant(pathname);
	const widthClass = WIDTH_CONFIG[widthVariant];

	return (
		<div className={cn("mx-auto px-4", widthClass, className)}>
			{children}
		</div>
	);
}
