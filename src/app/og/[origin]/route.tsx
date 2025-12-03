import { ImageResponse } from "next/og";
import { fetchThemeByOrigin } from "@theme-token/sdk";

export const runtime = "edge";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ origin: string }> },
) {
	const { origin } = await params;
	// Strip .png extension if present
	const cleanOrigin = origin.replace(/\.png$/, "");

	let themeName = "Theme Token";
	let author: string | undefined;
	let colors = {
		primary: "#6366f1",
		secondary: "#a855f7",
		accent: "#ec4899",
		background: "#09090b",
		foreground: "#fafafa",
		muted: "#27272a",
	};

	try {
		const published = await fetchThemeByOrigin(cleanOrigin);
		if (published) {
			themeName = published.theme.name;
			author = published.theme.author;
			const styles = published.theme.styles.dark;
			colors = {
				primary: styles.primary || colors.primary,
				secondary: styles.secondary || colors.secondary,
				accent: styles.accent || colors.accent,
				background: styles.background || colors.background,
				foreground: styles.foreground || colors.foreground,
				muted: styles.muted || colors.muted,
			};
		}
	} catch {
		// Use defaults
	}

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					backgroundColor: colors.background,
					color: colors.foreground,
					padding: 60,
				}}
			>
				{/* Color bar at top */}
				<div
					style={{
						display: "flex",
						width: "100%",
						height: 12,
						borderRadius: 6,
						overflow: "hidden",
						marginBottom: 50,
					}}
				>
					<div style={{ flex: 1, backgroundColor: colors.primary }} />
					<div style={{ flex: 1, backgroundColor: colors.secondary }} />
					<div style={{ flex: 1, backgroundColor: colors.accent }} />
				</div>

				{/* Main content */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						justifyContent: "center",
					}}
				>
					<div
						style={{
							fontSize: 24,
							color: colors.primary,
							marginBottom: 16,
							fontWeight: 600,
						}}
					>
						Theme Token
					</div>
					<div
						style={{
							fontSize: 72,
							fontWeight: 700,
							lineHeight: 1.1,
							marginBottom: 24,
						}}
					>
						{themeName}
					</div>
					{author && (
						<div
							style={{
								fontSize: 28,
								color: colors.muted,
							}}
						>
							by {author}
						</div>
					)}
				</div>

				{/* Color swatches at bottom */}
				<div
					style={{
						display: "flex",
						gap: 16,
						marginTop: "auto",
					}}
				>
					{[
						{ name: "Primary", color: colors.primary },
						{ name: "Secondary", color: colors.secondary },
						{ name: "Accent", color: colors.accent },
					].map((swatch) => (
						<div
							key={swatch.name}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 12,
							}}
						>
							<div
								style={{
									width: 48,
									height: 48,
									borderRadius: 8,
									backgroundColor: swatch.color,
								}}
							/>
							<div
								style={{
									display: "flex",
									flexDirection: "column",
								}}
							>
								<span style={{ fontSize: 16, fontWeight: 500 }}>
									{swatch.name}
								</span>
								<span style={{ fontSize: 14, color: colors.muted }}>
									{swatch.color}
								</span>
							</div>
						</div>
					))}
				</div>
			</div>
		),
		{
			width: 1200,
			height: 630,
		},
	);
}
