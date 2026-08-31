/** Vercel AI Gateway models used by each generation workload. */
export const AI_MODELS = {
	conversation: "openai/gpt-5.6-luna",
	theme: "openai/gpt-5.6-luna",
	premium: "spacexai/grok-4.6",
	pattern: "openai/gpt-5.6-luna",
	code: "openai/gpt-5.6-luna",
	font: "openai/gpt-5.6-luna",
	wallpaper: "openai/gpt-image-2",
} as const;

/** Accept old saved form values while routing new premium requests to Grok. */
export function wantsPremiumModel(model: unknown): boolean {
	return model === "grok-4.6" || model === "claude-opus-4.5";
}
