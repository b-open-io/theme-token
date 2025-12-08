export const WIDTH_CONFIG = {
	spec: "max-w-6xl",
	"studio-landing": "max-w-5xl",
	"studio-sub": "max-w-full",
	market: "max-w-[1400px]",
	themes: "max-w-7xl",
	preview: "max-w-7xl",
	default: "max-w-6xl",
} as const;

export type WidthVariant = keyof typeof WIDTH_CONFIG;

export function getWidthVariant(pathname: string | null): WidthVariant {
	if (pathname?.startsWith("/spec")) return "spec";
	if (pathname === "/studio") return "studio-landing";
	if (pathname?.startsWith("/studio/")) return "studio-sub";
	if (pathname?.startsWith("/market")) return "market";
	if (pathname?.startsWith("/themes")) return "themes";
	if (pathname?.startsWith("/preview")) return "preview";
	return "default";
}
