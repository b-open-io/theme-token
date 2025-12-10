import { from } from "better-color-tools";
import { ImageResponse } from "next/og";
import { fetchThemeByOrigin, type ThemeToken } from "@theme-token/sdk";

export const runtime = "edge";

// Cache OG images for 1 hour, stale-while-revalidate for 1 day
export const revalidate = 3600;

// Space Grotesk Bold TTF from Fontsource CDN
const FONT_URL =
	"https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-700-normal.ttf";

// Convert any color format to hex for ImageResponse compatibility
function toHex(color: string | undefined, fallback: string): string {
	if (!color) return fallback;
	try {
		return from(color).hex;
	} catch {
		return fallback;
	}
}

// Extract colors from dark mode for stripes
function extractColors(theme: ThemeToken): string[] {
	const colorKeys = [
		"primary",
		"secondary",
		"accent",
		"muted",
		"chart-1",
		"chart-2",
		"chart-3",
		"chart-4",
		"chart-5",
	];

	const colors: string[] = [];
	const styles = theme.styles.dark;
	for (const key of colorKeys) {
		const color = styles[key as keyof typeof styles];
		if (color && typeof color === "string") {
			colors.push(toHex(color, "#666666"));
		}
	}
	return [...new Set(colors)];
}

// Seeded random for deterministic stripe layout
function seededRandom(seed: number, i: number) {
	const x = Math.sin(seed + i) * 10000;
	return x - Math.floor(x);
}

// Fetch theme from cache first, then ORDFS
async function getTheme(origin: string): Promise<ThemeToken | null> {
	// Try our KV cache API first (for recently inscribed themes)
	try {
		const cacheUrl = new URL("/api/themes/cache", "https://themetoken.dev");
		const cacheRes = await fetch(cacheUrl.toString(), {
			headers: { "Content-Type": "application/json" },
		});
		if (cacheRes.ok) {
			const data = await cacheRes.json();
			const cached = data.themes?.find((t: { origin: string }) => t.origin === origin);
			if (cached?.theme) {
				return cached.theme;
			}
		}
	} catch {
		// Fall through to ORDFS
	}

	// Fall back to ORDFS via SDK
	try {
		const published = await fetchThemeByOrigin(origin);
		return published?.theme || null;
	} catch {
		return null;
	}
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ origin: string }> },
) {
	const [fontData, { origin }] = await Promise.all([
		fetch(FONT_URL).then((res) => res.arrayBuffer()),
		params,
	]);

	// Default colors
	const defaultColors = ["#6366f1", "#a855f7", "#ec4899", "#52525b", "#3b82f6"];
	let stripeColors = defaultColors;
	let foregroundColor = "#fafafa";
	let themeName = "Theme Token";

	const theme = await getTheme(origin);
	if (theme) {
		const extracted = extractColors(theme);
		if (extracted.length > 0) {
			stripeColors = extracted;
		}
		foregroundColor = toHex(theme.styles.dark.foreground, "#fafafa");
		themeName = theme.name || "Theme Token";
	}

	// Generate seed from origin for deterministic layout
	const seed = origin
		.split("")
		.reduce((acc, char) => acc + char.charCodeAt(0), 0);

	// Shuffle colors deterministically
	const shuffled = stripeColors
		.map((c, i) => ({ c, r: seededRandom(seed, i) }))
		.sort((a, b) => a.r - b.r)
		.map(({ c }) => c);

	// Ensure enough colors for stripes
	const finalColors =
		shuffled.length >= 8
			? shuffled
			: [...shuffled, ...shuffled, ...shuffled].slice(0, 12);

	// Generate stripe widths
	const stripes: { x: number; width: number; color: string }[] = [];
	let totalWidth = 0;
	let widthSeed = 0;
	while (totalWidth < 1600) {
		const width = 40 + seededRandom(seed, 100 + widthSeed) * 80;
		stripes.push({
			x: totalWidth,
			width,
			color: finalColors[widthSeed % finalColors.length],
		});
		totalWidth += width;
		widthSeed++;
	}

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#0f172a",
					position: "relative",
					overflow: "hidden",
				}}
			>
				{/* Diagonal stripes */}
				<div
					style={{
						position: "absolute",
						top: "-50%",
						left: "-25%",
						width: "150%",
						height: "200%",
						display: "flex",
						transform: "rotate(-35deg)",
					}}
				>
					{stripes.map((stripe, i) => (
						<div
							key={i}
							style={{
								width: stripe.width,
								height: "100%",
								backgroundColor: stripe.color,
								flexShrink: 0,
							}}
						/>
					))}
				</div>
				{/* Text overlay */}
				<div
					style={{
						position: "relative",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						textAlign: "center",
					}}
				>
					<div
						style={{
							display: "flex",
							fontSize: themeName.length > 20 ? 64 : 96,
							fontWeight: 700,
							fontFamily: "Space Grotesk",
							color: foregroundColor,
							textShadow: "0 4px 20px rgba(0,0,0,0.5)",
							letterSpacing: "-0.02em",
						}}
					>
						{themeName}
					</div>
					<div
						style={{
							display: "flex",
							fontSize: 36,
							fontWeight: 700,
							fontFamily: "Space Grotesk",
							color: foregroundColor,
							textShadow: "0 2px 10px rgba(0,0,0,0.5)",
							marginTop: 8,
							opacity: 0.8,
						}}
					>
						themetoken.dev
					</div>
				</div>
			</div>
		),
		{
			width: 1200,
			height: 630,
			fonts: [
				{
					name: "Space Grotesk",
					data: fontData,
					weight: 700,
					style: "normal",
				},
			],
		},
	);
}
