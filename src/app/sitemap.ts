import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = "https://themetoken.dev";

	return [
		{
			url: baseUrl,
			lastModified: "2025-06-01",
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${baseUrl}/studio`,
			lastModified: "2025-06-01",
			changeFrequency: "weekly",
			priority: 0.9,
		},
		{
			url: `${baseUrl}/pricing`,
			lastModified: "2025-06-01",
			changeFrequency: "weekly",
			priority: 0.8,
		},
		{
			url: `${baseUrl}/themes`,
			lastModified: "2025-06-01",
			changeFrequency: "daily",
			priority: 0.8,
		},
		{
			url: `${baseUrl}/market`,
			lastModified: "2025-06-01",
			changeFrequency: "daily",
			priority: 0.8,
		},
		{
			url: `${baseUrl}/market/browse`,
			lastModified: "2025-06-01",
			changeFrequency: "daily",
			priority: 0.8,
		},
		{
			url: `${baseUrl}/market/fonts`,
			lastModified: "2025-06-01",
			changeFrequency: "daily",
			priority: 0.8,
		},
		{
			url: `${baseUrl}/market/images`,
			lastModified: "2025-06-01",
			changeFrequency: "daily",
			priority: 0.8,
		},
		{
			url: `${baseUrl}/studio/theme`,
			lastModified: "2025-06-01",
			changeFrequency: "weekly",
			priority: 0.7,
		},
		{
			url: `${baseUrl}/studio/font`,
			lastModified: "2025-06-01",
			changeFrequency: "weekly",
			priority: 0.7,
		},
		{
			url: `${baseUrl}/studio/wallpaper`,
			lastModified: "2025-06-01",
			changeFrequency: "weekly",
			priority: 0.7,
		},
		{
			url: `${baseUrl}/studio/icon`,
			lastModified: "2025-06-01",
			changeFrequency: "weekly",
			priority: 0.7,
		},
		{
			url: `${baseUrl}/studio/patterns`,
			lastModified: "2025-06-01",
			changeFrequency: "weekly",
			priority: 0.7,
		},
		{
			url: `${baseUrl}/spec`,
			lastModified: "2025-06-01",
			changeFrequency: "monthly",
			priority: 0.5,
		},
	];
}
