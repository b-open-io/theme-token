/**
 * Pre-generate OG images for all published themes
 * Run with: bun run scripts/generate-og-images.tsx
 */

import React from "react";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import better from "better-color-tools";
import { fetchPublishedThemes, type ThemeToken } from "@theme-token/sdk";
import { exampleThemes } from "../src/lib/example-themes";

const OUTPUT_DIR = join(process.cwd(), "public/og");
const FONT_PATH = join(process.cwd(), "public/fonts/space-grotesk-latin-700-normal.woff");

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load font
const fontData = readFileSync(FONT_PATH);

// Convert OKLCH to hex using better-color-tools
function oklchToHex(oklch: string): string {
  try {
    return better.from(oklch).hex;
  } catch {
    return "#666666";
  }
}

// Extract colors from dark mode for stripes (better contrast)
function extractDarkModeColors(theme: ThemeToken): string[] {
  const colorKeys = [
    "primary", "secondary", "accent", "background", "muted",
    "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
  ];

  const colors: string[] = [];
  const styles = theme.styles.dark;
  for (const key of colorKeys) {
    if (styles[key]) {
      colors.push(oklchToHex(styles[key]));
    }
  }
  return [...new Set(colors)];
}

// Get foreground color from dark mode theme
function getForegroundColor(theme: ThemeToken): string {
  return oklchToHex(theme.styles.dark.foreground);
}

// Seeded random for deterministic output
function seededRandom(seed: number, i: number) {
  const x = Math.sin(seed + i) * 10000;
  return x - Math.floor(x);
}

// Generate OG image for a theme
async function generateOgImage(theme: ThemeToken, outputPath: string) {
  const themeColors = extractDarkModeColors(theme);
  const foregroundColor = getForegroundColor(theme);
  const seed = theme.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Shuffle colors
  const shuffled = themeColors
    .map((c, i) => ({ c, r: seededRandom(seed, i) }))
    .sort((a, b) => a.r - b.r)
    .map(({ c }) => c);

  const stripeColors = shuffled.length >= 8
    ? shuffled
    : [...shuffled, ...shuffled, ...shuffled].slice(0, 12);

  // Generate stripe widths
  const stripeWidths: number[] = [];
  let totalWidth = 0;
  let widthSeed = 0;
  while (totalWidth < 1600) {
    const width = 40 + seededRandom(seed, 100 + widthSeed++) * 80;
    stripeWidths.push(width);
    totalWidth += width;
  }

  const stripes = stripeWidths.map((width, i) => {
    const x = stripeWidths.slice(0, i).reduce((a, b) => a + b, 0);
    const color = stripeColors[i % stripeColors.length];
    return { x, width, color };
  });

  // Create SVG using satori
  const svg = await satori(
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
            fontSize: 96,
            fontWeight: 700,
            color: foregroundColor,
            textShadow: "0 4px 20px rgba(0,0,0,0.5)",
            fontFamily: "Space Grotesk",
            letterSpacing: "-0.02em",
          }}
        >
          Theme Token
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: foregroundColor,
            textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            fontFamily: "Space Grotesk",
            marginTop: 8,
          }}
        >
          themetoken.dev
        </div>
      </div>
    </div>,
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
    }
  );

  // Convert SVG to PNG
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  writeFileSync(outputPath, pngBuffer);
  console.log(`Generated: ${outputPath}`);
}

async function main() {
  console.log("Fetching published themes...");

  const publishedThemes = await fetchPublishedThemes();
  console.log(`Found ${publishedThemes.length} on-chain themes`);

  // Generate images for on-chain themes
  for (const { theme, origin } of publishedThemes) {
    const outputPath = join(OUTPUT_DIR, `${origin}.png`);
    await generateOgImage(theme, outputPath);
  }

  // Generate default homepage OG (using first theme or example)
  const defaultTheme = publishedThemes[0]?.theme ?? exampleThemes[0];
  const defaultPath = join(OUTPUT_DIR, "default.png");
  await generateOgImage(defaultTheme, defaultPath);

  console.log(`\nGenerated ${publishedThemes.length + 1} OG images`);
}

main().catch(console.error);
