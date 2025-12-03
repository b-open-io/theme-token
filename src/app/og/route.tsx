import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

export const runtime = "edge";

// Space Grotesk font URL - TTF format for satori compatibility
const FONT_URL =
	"https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj4PVksj.ttf";

// Seeded random for deterministic stripe layout
function seededRandom(seed: number, i: number) {
	const x = Math.sin(seed + i) * 10000;
	return x - Math.floor(x);
}

export async function GET(request: Request) {
	const fontData = await fetch(FONT_URL).then((res) => res.arrayBuffer());
	const url = new URL(request.url);
	const themeOrigin = url.searchParams.get("theme");

	// Redirect to dynamic OG if theme is specified
	if (themeOrigin) {
		return NextResponse.redirect(
			new URL(`/og/${themeOrigin}.png`, url.origin),
		);
	}

	// Default homepage OG with branded stripes
	const stripeColors = [
		"#6366f1",
		"#a855f7",
		"#ec4899",
		"#3b82f6",
		"#10b981",
	];
	const seed = 42; // Fixed seed for consistent default image

	// Generate stripe widths
	const stripes: { width: number; color: string }[] = [];
	let totalWidth = 0;
	let widthSeed = 0;
	while (totalWidth < 1600) {
		const width = 40 + seededRandom(seed, 100 + widthSeed) * 80;
		stripes.push({
			width,
			color: stripeColors[widthSeed % stripeColors.length],
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
							fontSize: 96,
							fontWeight: 700,
							fontFamily: "Space Grotesk",
							color: "#fafafa",
							textShadow: "0 4px 20px rgba(0,0,0,0.5)",
							letterSpacing: "-0.02em",
						}}
					>
						Theme Token
					</div>
					<div
						style={{
							display: "flex",
							fontSize: 36,
							fontWeight: 700,
							fontFamily: "Space Grotesk",
							color: "#fafafa",
							textShadow: "0 2px 10px rgba(0,0,0,0.5)",
							marginTop: 8,
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
