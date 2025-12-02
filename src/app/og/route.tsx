import { ImageResponse } from "next/og";
import { fetchPublishedThemes } from "@/lib/fetch-themes";
import { exampleThemes, type ThemeToken } from "@/lib/schema";

export const runtime = "edge";
// Cache for 1 week - regenerates when cache expires
// Each unique theme generates once, then served from edge cache
export const revalidate = 604800;

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

// Extract key colors from a single theme for stripe generation
function extractThemeColors(theme: ThemeToken): string[] {
  const colorKeys = [
    "primary",
    "secondary",
    "accent",
    "background",
    "muted",
    "chart-1",
    "chart-2",
    "chart-3",
    "chart-4",
    "chart-5",
  ];

  const colors: string[] = [];

  // Get colors from both light and dark modes
  for (const mode of ["light", "dark"] as const) {
    const styles = theme.styles[mode];
    for (const key of colorKeys) {
      if (styles[key]) {
        colors.push(oklchToHex(styles[key]));
      }
    }
  }

  // Dedupe and return
  return [...new Set(colors)];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const themeOrigin = searchParams.get("theme");

  // Fetch on-chain themes
  let selectedTheme: ThemeToken | null = null;
  let themeName = "Theme Token";

  try {
    const publishedThemes = await fetchPublishedThemes();

    if (publishedThemes.length > 0) {
      // If specific theme requested via ?theme=origin, find it
      if (themeOrigin) {
        const found = publishedThemes.find((t) => t.origin === themeOrigin);
        if (found) {
          selectedTheme = found.theme;
          themeName = found.theme.name;
        }
      }

      // If no specific theme or not found, pick one deterministically
      if (!selectedTheme) {
        // Seed based on week of year so it changes weekly but stays stable for caching
        const now = new Date();
        const weekOfYear = Math.floor(
          (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) /
          (7 * 24 * 60 * 60 * 1000)
        );
        const seed = weekOfYear + now.getFullYear() * 52;
        const themeIndex = Math.abs(Math.floor(Math.sin(seed) * 10000)) % publishedThemes.length;

        const selected = publishedThemes[themeIndex];
        selectedTheme = selected.theme;
        themeName = selected.theme.name;
      }
    }
  } catch {
    // Fall through to example themes
  }

  // If no on-chain themes, pick from example themes
  if (!selectedTheme) {
    const now = new Date();
    const weekOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) /
      (7 * 24 * 60 * 60 * 1000)
    );
    const seed = weekOfYear + now.getFullYear() * 52;
    const themeIndex = Math.abs(Math.floor(Math.sin(seed) * 10000)) % exampleThemes.length;
    selectedTheme = exampleThemes[themeIndex];
    themeName = selectedTheme.name;
  }

  // Extract colors from the selected theme only
  const themeColors = extractThemeColors(selectedTheme);

  // Use deterministic seeded random for stripe arrangement
  const seed = themeName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seededRandom = (i: number) => {
    const x = Math.sin(seed + i) * 10000;
    return x - Math.floor(x);
  };

  // Shuffle colors with seeded random
  const shuffled = themeColors
    .map((c, i) => ({ c, r: seededRandom(i) }))
    .sort((a, b) => a.r - b.r)
    .map(({ c }) => c);

  // Use all available colors for stripes (repeat if needed)
  const stripeColors = shuffled.length >= 8
    ? shuffled
    : [...shuffled, ...shuffled, ...shuffled].slice(0, 12);

  // Generate varying stripe widths with seeded random
  const stripeWidths: number[] = [];
  let totalWidth = 0;
  const targetWidth = 1600; // Extra width to cover diagonal
  let widthSeed = 0;

  while (totalWidth < targetWidth) {
    const width = 40 + seededRandom(100 + widthSeed++) * 80; // 40-120px
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
