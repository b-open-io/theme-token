import { vercelAdapter } from "@flags-sdk/vercel";
import { flag } from "flags/next";

/**
 * Feature flags backed by Vercel's first-party Flags platform.
 *
 * These replace the old NEXT_PUBLIC_* env-constant approach. Definitions here
 * are discovered by Vercel via the /.well-known/vercel/flags endpoint and
 * managed in the project's Flags dashboard (vercel.com/<team>/<project>/flags).
 * vercelAdapter() reads each flag's served value via the FLAGS SDK key.
 *
 * No defaultValue: the served value comes from the platform per environment.
 * If the platform can't be reached the flag throws rather than silently
 * falling back to a baked-in default (a stale default would hide the
 * misconfiguration). Flip values per environment in the dashboard or via:
 *
 *   vercel flags enable studio-registry -e production
 *   vercel flags disable studio-fonts   -e production
 *
 * NOTE: server-only (flags/next uses node:async_hooks). Client components read
 * the resolved values through the FeatureFlagsProvider in the root layout via
 * the useFeatureFlags() hook from ./feature-flags.
 */

export const themeFlag = flag<boolean>({
	key: "studio-theme",
	adapter: vercelAdapter(),
	description:
		"Theme studio: create/edit shadcn themes. Gates /studio/theme. Normally enabled everywhere — it's the primary studio.",
});

export const fontsFlag = flag<boolean>({
	key: "studio-fonts",
	adapter: vercelAdapter(),
	description:
		"Font studio: AI font generation + on-chain font inscription. Gates /studio/font, /market/fonts, /market/my-fonts, and the generateFont tool.",
});

export const imagesFlag = flag<boolean>({
	key: "studio-images",
	adapter: vercelAdapter(),
	description:
		"Image studios: pattern/tile generation and the images market. Gates /studio/patterns, /market/images, /market/my-patterns, and the generatePattern tool.",
});

export const iconsFlag = flag<boolean>({
	key: "studio-icons",
	adapter: vercelAdapter(),
	description:
		"Icon studio: custom icon generation. Gates /studio/icon and the generateIconSet/generateFavicon tools.",
});

export const wallpapersFlag = flag<boolean>({
	key: "studio-wallpapers",
	adapter: vercelAdapter(),
	description:
		"Wallpaper studio: AI wallpaper generation. Gates /studio/wallpaper, /market/my-wallpapers, and the generateWallpaper tool.",
});

export const registryFlag = flag<boolean>({
	key: "studio-registry",
	adapter: vercelAdapter(),
	description:
		"Registry/Component studio: shadcn blocks, components, and hooks. Gates /studio/registry and the generateBlock/generateComponent tools.",
});

export const projectFlag = flag<boolean>({
	key: "studio-project",
	adapter: vercelAdapter(),
	description:
		"Project studio: compose themes/fonts/icons into shadcn presets. Gates /studio/project and the createProject tool.",
});

export const componentPreviewFlag = flag<boolean>({
	key: "component-preview",
	adapter: vercelAdapter(),
	description:
		"Live sandbox preview of AI-generated components (Preview button in block-preview). Independent of the registry studio gate.",
});

// The per-request resolver lives in ./get-feature-flags so this module only
// exports flag definitions — the /.well-known/vercel/flags discovery endpoint
// star-imports this file and getProviderData() rejects non-flag exports.
