/**
 * Route Registry
 *
 * Centralized route definitions for the entire app.
 * Used by navigation components and Swatchy AI agent.
 */

import type { LucideIcon } from "lucide-react";
import { Blocks, FolderKanban, Grid3X3, Image, Palette, Shapes, Type } from "lucide-react";
import { featureFlags } from "./feature-flags";

export type RouteCategory = "main" | "studio" | "market" | "user";

export type FeatureFlagKey = keyof typeof featureFlags;

export interface RouteInfo {
	path: string;
	label: string;
	description: string;
	feature?: FeatureFlagKey;
	category: RouteCategory;
	icon?: LucideIcon;
	tools?: string[]; // Related Swatchy tools
	cost?: number; // Cost in sats for generation tools
}

/**
 * All routes in the application
 */
export const routes: RouteInfo[] = [
	// Main pages
	{
		path: "/",
		label: "Home",
		description: "Landing page with hero and theme showcase",
		category: "main",
	},
	{
		path: "/themes",
		label: "Themes Gallery",
		description: "Browse all published themes on-chain",
		category: "main",
	},
	{
		path: "/spec",
		label: "Specification",
		description: "Technical documentation for Theme Token format",
		category: "main",
	},
	{
		path: "/pricing",
		label: "Pricing",
		description: "Subscription tiers and pay-as-you-go options",
		category: "main",
	},

	// Studios
	{
		path: "/studio/theme",
		label: "Theme",
		description: "Create and edit shadcn themes with live preview",
		category: "studio",
		icon: Palette,
		tools: ["generateTheme", "setThemeColor", "setThemeRadius", "setThemeFont"],
		cost: 1_000_000,
	},
	{
		path: "/studio/font",
		label: "Font",
		description: "Generate custom AI fonts from descriptions",
		category: "studio",
		feature: "fonts",
		icon: Type,
		tools: ["generateFont"],
		cost: 10_000_000,
	},
	{
		path: "/studio/patterns",
		label: "Pattern",
		description: "Create AI SVG patterns and tiles",
		category: "studio",
		feature: "images",
		icon: Grid3X3,
		tools: ["generatePattern"],
		cost: 1_000_000,
	},
	{
		path: "/studio/icon",
		label: "Icon",
		description: "Generate custom icons for themes",
		category: "studio",
		feature: "icons",
		icon: Shapes,
		tools: [
			"generateIconSet",
			"generateFavicon",
			"setIconStudioTab",
			"setIconSetParams",
			"setFaviconParams",
		],
		cost: 5_000_000,
	},
	{
		path: "/studio/wallpaper",
		label: "Wallpaper",
		description:
			"Generate AI wallpapers for desktop (16:9) and mobile (9:16)",
		category: "studio",
		feature: "wallpapers",
		icon: Image,
		tools: ["generateWallpaper"],
		cost: 1_000_000,
	},
	{
		path: "/studio/registry",
		label: "Component",
		description: "Create shadcn blocks, components, and hooks for on-chain publishing",
		category: "studio",
		feature: "registry",
		icon: Blocks,
		tools: ["generateBlock", "generateComponent"],
	},
	{
		path: "/studio/project",
		label: "Project",
		description: "Compose themes, fonts, icons into complete shadcn/create presets",
		category: "studio",
		icon: FolderKanban,
		tools: ["createProject"],
	},

	// Market
	{
		path: "/market",
		label: "Marketplace",
		description: "Buy and sell themes, fonts, and images",
		category: "market",
	},
	{
		path: "/market/browse",
		label: "Browse Themes",
		description: "Browse themes available for purchase",
		category: "market",
	},
	{
		path: "/market/fonts",
		label: "Font Market",
		description: "Browse AI-generated fonts for purchase",
		category: "market",
		feature: "fonts",
	},
	{
		path: "/market/images",
		label: "Images Market",
		description: "Browse patterns, wallpapers, and icons",
		category: "market",
		feature: "images",
	},

	// User pages
	{
		path: "/market/my-themes",
		label: "My Themes",
		description: "View your owned theme ordinals",
		category: "user",
	},
	{
		path: "/market/my-fonts",
		label: "My Fonts",
		description: "View your owned font ordinals",
		category: "user",
		feature: "fonts",
	},
	{
		path: "/market/my-wallpapers",
		label: "My Wallpapers",
		description: "Manage your wallpaper drafts in cloud storage",
		category: "user",
		feature: "wallpapers",
	},
	{
		path: "/market/my-patterns",
		label: "My Patterns",
		description: "Manage your pattern drafts in cloud storage",
		category: "user",
		feature: "images",
	},
	{
		path: "/market/sell",
		label: "Sell",
		description: "List your ordinals for sale on the marketplace",
		category: "user",
	},
];

/**
 * Get all enabled routes based on feature flags
 */
export function getEnabledRoutes(): RouteInfo[] {
	return routes.filter((r) => !r.feature || featureFlags[r.feature]);
}

/**
 * Get enabled routes by category
 */
export function getRoutesByCategory(category: RouteCategory): RouteInfo[] {
	return getEnabledRoutes().filter((r) => r.category === category);
}

/**
 * Get studio routes for navigation tabs
 */
export function getStudioTabs(): RouteInfo[] {
	return getRoutesByCategory("studio");
}

/**
 * Format cost in human-readable format
 */
function formatCost(sats: number): string {
	if (sats >= 1_000_000) {
		return `${sats / 1_000_000}M sats`;
	}
	if (sats >= 1_000) {
		return `${sats / 1_000}K sats`;
	}
	return `${sats} sats`;
}

/**
 * Generate route documentation for Swatchy AI agent
 */
export function generateRouteDocumentation(): string {
	const enabledRoutes = getEnabledRoutes();

	const sections: string[] = [];

	// Main pages
	const mainRoutes = enabledRoutes.filter((r) => r.category === "main");
	if (mainRoutes.length > 0) {
		const lines = mainRoutes.map(
			(r) => `- **${r.label}** (${r.path}) - ${r.description}`,
		);
		sections.push(`**Main Pages:**\n${lines.join("\n")}`);
	}

	// Studios with tool info
	const studioRoutes = enabledRoutes.filter((r) => r.category === "studio");
	if (studioRoutes.length > 0) {
		const lines = studioRoutes.map((r) => {
			// Use full name "X Studio" for Swatchy documentation
			const fullName = `${r.label} Studio`;
			let line = `- **${fullName}** (${r.path}) - ${r.description}`;
			if (r.cost) {
				line += ` [${formatCost(r.cost)}]`;
			}
			if (r.tools && r.tools.length > 0) {
				line += `\n  Tools: ${r.tools.join(", ")}`;
			}
			return line;
		});
		sections.push(`**Creative Studios:**\n${lines.join("\n")}`);
	}

	// Market
	const marketRoutes = enabledRoutes.filter((r) => r.category === "market");
	if (marketRoutes.length > 0) {
		const lines = marketRoutes.map(
			(r) => `- **${r.label}** (${r.path}) - ${r.description}`,
		);
		sections.push(`**Marketplace:**\n${lines.join("\n")}`);
	}

	// User pages
	const userRoutes = enabledRoutes.filter((r) => r.category === "user");
	if (userRoutes.length > 0) {
		const lines = userRoutes.map(
			(r) => `- **${r.label}** (${r.path}) - ${r.description}`,
		);
		sections.push(`**User Pages:**\n${lines.join("\n")}`);
	}

	return sections.join("\n\n");
}
