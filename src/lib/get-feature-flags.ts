import type { FeatureFlags } from "./feature-flags";
import {
	componentPreviewFlag,
	fontsFlag,
	iconsFlag,
	imagesFlag,
	projectFlag,
	registryFlag,
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
