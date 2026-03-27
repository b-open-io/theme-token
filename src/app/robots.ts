import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/api/", "/_next/", "/cdn-cgi/", "/studio/"],
			},
			// AI Crawlers — Explicitly Welcome
			{ userAgent: "GPTBot", allow: "/" },
			{ userAgent: "ChatGPT-User", allow: "/" },
			{ userAgent: "Google-Extended", allow: "/" },
			{ userAgent: "Claude-Web", allow: "/" },
			{ userAgent: "anthropic-ai", allow: "/" },
			{ userAgent: "PerplexityBot", allow: "/" },
			{ userAgent: "Amazonbot", allow: "/" },
			{ userAgent: "Applebot-Extended", allow: "/" },
			{ userAgent: "Bytespider", allow: "/" },
			{ userAgent: "CCBot", allow: "/" },
			{ userAgent: "cohere-ai", allow: "/" },
			{ userAgent: "FacebookBot", allow: "/" },
			{ userAgent: "meta-externalagent", allow: "/" },
			{ userAgent: "Twitterbot", allow: "/" },
		],
		sitemap: "https://themetoken.dev/sitemap.xml",
	};
}
