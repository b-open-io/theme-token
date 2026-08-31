import { AGENTIC_PRICING_MARKDOWN } from "@/lib/agentic-pricing";

export function GET() {
	return new Response(AGENTIC_PRICING_MARKDOWN, {
		headers: { "Content-Type": "text/markdown; charset=utf-8" },
	});
}
