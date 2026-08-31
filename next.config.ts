import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	async headers() {
		return [
			{
				source: "/api/themes/cache",
				headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
			},
		];
	},
};

export default nextConfig;
