import type { FeatureFlags } from "./feature-flags";
import {
	componentPreviewFlag,
	componentsFlag,
	fontsFlag,
	iconsFlag,
	imagesFlag,
	projectFlag,
	themeFlag,
	wallpapersFlag,
} from "./flags";

/**
 * Resolve every feature flag into a single plain object for the request.
 * Called server-side (root layout, API routes) and handed to the client via
 * FeatureFlagsProvider so synchronous client gating keeps working.
 *
 * Kept separate from ./flags so that module exports only flag definitions —
 * the /.well-known/vercel/flags discovery endpoint star-imports ./flags and
 * getProviderData() rejects non-flag exports.
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
	const [
		theme,
		fonts,
		images,
		icons,
		wallpapers,
		components,
		project,
		componentPreview,
	] = await Promise.all([
		themeFlag(),
		fontsFlag(),
		imagesFlag(),
		iconsFlag(),
		wallpapersFlag(),
		componentsFlag(),
		projectFlag(),
		componentPreviewFlag(),
	]);
	return {
		theme,
		fonts,
		images,
		icons,
		wallpapers,
		components,
		project,
		componentPreview,
	};
}
