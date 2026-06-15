import { vercelAdapter } from "@flags-sdk/vercel";
import { flag } from "flags/next";
import type { FeatureFlags } from "./feature-flags";

/**
 * Feature flags backed by Vercel's first-party flag platform.
 *
 * These replace the old NEXT_PUBLIC_* env-constant approach. Definitions
 * here are auto-discovered by Vercel via the /.well-known/vercel/flags
 * endpoint and appear in the project's Vercel Flags dashboard. The
 * vercelAdapter() reads each flag's current value via the FLAGS env var
 * (an SDK key per environment).
 *
 * Every studio except the Theme studio is gated and defaults to OFF, so a
 * fresh environment exposes only the Theme studio until a flag is flipped:
 *
 *   vercel flags enable studio-fonts -e production
 *   vercel flags disable studio-fonts -e preview
 *
 * Or via the dashboard at vercel.com/<team>/<project>/flags.
 *
 * NOTE: these are server-only (flags/next uses node:async_hooks). Client
 * components read the resolved values through the FeatureFlagsProvider in
 * the root layout via the useFeatureFlags() hook from ./feature-flags.
 */

export const fontsFlag = flag<boolean>({
	key: "studio-fonts",
	adapter: vercelAdapter(),
	defaultValue: false,
	description:
		"Font studio: AI font generation + on-chain font inscription. Gates /studio/font, /market/fonts, /market/my-fonts, and the generateFont tool.",
});

export const imagesFlag = flag<boolean>({
	key: "studio-images",
	adapter: vercelAdapter(),
	defaultValue: false,
	description:
		"Image studios: pattern/tile generation and the images market. Gates /studio/patterns, /market/images, /market/my-patterns, and the generatePattern tool.",
});

export const iconsFlag = flag<boolean>({
	key: "studio-icons",
	adapter: vercelAdapter(),
	defaultValue: false,
	description:
		"Icon studio: custom icon generation. Gates /studio/icon and the generateIconSet/generateFavicon tools.",
});

export const wallpapersFlag = flag<boolean>({
	key: "studio-wallpapers",
	adapter: vercelAdapter(),
	defaultValue: false,
	description:
		"Wallpaper studio: AI wallpaper generation. Gates /studio/wallpaper, /market/my-wallpapers, and the generateWallpaper tool.",
});

export const registryFlag = flag<boolean>({
	key: "studio-registry",
	adapter: vercelAdapter(),
	defaultValue: false,
	description:
		"Registry/Component studio: shadcn blocks, components, and hooks. Gates /studio/registry and the generateBlock/generateComponent tools.",
});

export const projectFlag = flag<boolean>({
	key: "studio-project",
	adapter: vercelAdapter(),
	defaultValue: false,
	description:
		"Project studio: compose themes/fonts/icons into shadcn presets. Gates /studio/project and the createProject tool.",
});

export const componentPreviewFlag = flag<boolean>({
	key: "component-preview",
	adapter: vercelAdapter(),
	defaultValue: true,
	description:
		"Live sandbox preview of AI-generated components (Preview button in block-preview). Independent of the registry studio gate.",
});

/**
 * Resolve every feature flag into a single plain object for the request.
 * Called server-side (root layout, API routes) and handed to the client
 * via FeatureFlagsProvider so synchronous client gating keeps working.
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
	const [
		fonts,
		images,
		icons,
		wallpapers,
		registry,
		project,
		componentPreview,
	] = await Promise.all([
		fontsFlag(),
		imagesFlag(),
		iconsFlag(),
		wallpapersFlag(),
		registryFlag(),
		projectFlag(),
		componentPreviewFlag(),
	]);
	return {
		fonts,
		images,
		icons,
		wallpapers,
		registry,
		project,
		componentPreview,
	};
}
