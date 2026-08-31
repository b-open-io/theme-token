import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AGENTIC_HOME_MARKDOWN } from "@/lib/agentic-home";

export function proxy(request: NextRequest) {
	const accept = request.headers.get("accept") ?? "";

	if (accept.includes("text/markdown")) {
		return new NextResponse(AGENTIC_HOME_MARKDOWN, {
			headers: {
				"Cache-Control": "public, max-age=300, s-maxage=300",
				"Content-Type": "text/markdown; charset=utf-8",
				Vary: "Accept, Accept-Encoding",
			},
		});
	}

	return NextResponse.next();
}

export const config = { matcher: "/" };
