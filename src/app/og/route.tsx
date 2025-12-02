import { ImageResponse } from "next/og";
import { fetchPublishedThemes } from "@/lib/fetch-themes";
import { exampleThemes } from "@/lib/schema";

export const runtime = "edge";
export const revalidate = 3600; // Cache for 1 hour

// Convert oklch to approximate hex for OG image rendering
function oklchToHex(oklch: string): string {
  // Parse oklch(L C H) format
  const match = oklch.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/);
  if (!match) return "#666666";

  const L = parseFloat(match[1]);
  const C = parseFloat(match[2]);
  const H = parseFloat(match[3]);

  // Convert oklch to approximate RGB
  // This is a simplified conversion - good enough for OG images
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // Approximate Lab to RGB conversion
  let r = L + 0.3963377774 * a + 0.2158037573 * b;
  let g = L - 0.1055613458 * a - 0.0638541728 * b;
  let b_ = L - 0.0894841775 * a - 1.291485548 * b;

  // Apply gamma and clamp
  r = Math.max(0, Math.min(1, r)) ** (1 / 2.2);
  g = Math.max(0, Math.min(1, g)) ** (1 / 2.2);
  b_ = Math.max(0, Math.min(1, b_)) ** (1 / 2.2);

  const toHex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b_)}`;
}

// Extract key colors from a theme
function extractColors(
  styles: Record<string, string>,
  mode: "light" | "dark" = "dark"
): string[] {
  const colorKeys = [
    "primary",
    "secondary",
    "accent",
    "background",
    "muted",
    "chart-1",
    "chart-2",
    "chart-3",
  ];

  return colorKeys
    .map((key) => styles[key])
    .filter(Boolean)
    .map(oklchToHex);
}

export async function GET() {
  // Fetch on-chain themes
  let allColors: string[] = [];

  try {
    const publishedThemes = await fetchPublishedThemes();

    if (publishedThemes.length > 0) {
      // Collect colors from all published themes
      for (const { theme } of publishedThemes) {
        const darkColors = extractColors(theme.styles.dark, "dark");
        const lightColors = extractColors(theme.styles.light, "light");
        allColors.push(...darkColors, ...lightColors);
      }
    }
  } catch {
    // Fall through to example themes
  }

  // If no on-chain themes, use example themes
  if (allColors.length === 0) {
    for (const theme of exampleThemes) {
      const darkColors = extractColors(theme.styles.dark, "dark");
      const lightColors = extractColors(theme.styles.light, "light");
      allColors.push(...darkColors, ...lightColors);
    }
  }

  // Dedupe and shuffle colors
  const uniqueColors = [...new Set(allColors)];
  const shuffled = uniqueColors.sort(() => Math.random() - 0.5);

  // Pick 10-15 colors for stripes
  const stripeColors = shuffled.slice(0, Math.min(15, Math.max(10, shuffled.length)));

  // Generate varying stripe widths
  const stripeWidths: number[] = [];
  let totalWidth = 0;
  const targetWidth = 1600; // Extra width to cover diagonal

  while (totalWidth < targetWidth) {
    const width = 40 + Math.random() * 80; // 40-120px
    stripeWidths.push(width);
    totalWidth += width;
  }

  // Build stripe rectangles for diagonal pattern
  const stripes = stripeWidths.map((width, i) => {
    const x = stripeWidths.slice(0, i).reduce((a, b) => a + b, 0);
    const color = stripeColors[i % stripeColors.length];
    return { x, width, color };
  });

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
        {/* Diagonal stripes container */}
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
              fontSize: 96,
              fontWeight: 700,
              color: "white",
              textShadow: "0 4px 20px rgba(0,0,0,0.5)",
              fontFamily: "system-ui, -apple-system, sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            Theme Token
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 500,
              color: "rgba(255,255,255,0.9)",
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
              fontFamily: "system-ui, -apple-system, sans-serif",
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
    }
  );
}
