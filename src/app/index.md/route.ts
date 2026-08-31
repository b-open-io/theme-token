import { AGENTIC_HOME_MARKDOWN } from "@/lib/agentic-home";

export function GET() {
	return new Response(AGENTIC_HOME_MARKDOWN, {
		headers: { "Content-Type": "text/markdown; charset=utf-8" },
	});
}
