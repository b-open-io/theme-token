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
import { fetchDefaultTheme } from "../src/lib/default-theme";

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
  const seed = theme.name.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);

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

// Generate Pricing Page OG Image
async function generatePricingOg() {
  const outputPath = join(OUTPUT_DIR, "pricing.png");
  
  // Gradient colors from pricing page
  // from-primary via-purple-400 to-pink-400
  // Approx: Primary (Blue-ish), Purple, Pink
  const colors = ["#6366f1", "#c084fc", "#f472b6"]; 

  const svg = await satori(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#020617", // slate-950
        backgroundImage: "radial-gradient(circle at 50% 0%, #1e1b4b 0%, #020617 70%)",
        position: "relative",
        fontFamily: "Space Grotesk",
      }}
    >
      {/* Background Glows */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "20%",
          width: "600px",
          height: "600px",
          background: "linear-gradient(180deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 100%)",
          borderRadius: "100%",
          filter: "blur(80px)",
        }}
      />
      
      {/* Card Effect */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 100px",
          borderRadius: "40px",
          border: "2px solid rgba(255,255,255,0.1)",
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 600,
            color: "#a8a29e", // muted-foreground
            marginBottom: 20,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Theme Token
        </div>

        <div
          style={{
            fontSize: 100,
            fontWeight: 700,
            background: "linear-gradient(90deg, #6366f1, #c084fc, #f472b6)",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: 20,
            letterSpacing: "-0.03em",
          }}
        >
          Prism Pass
        </div>

        <div
          style={{
            fontSize: 42,
            color: "#f3f4f6",
            textAlign: "center",
            maxWidth: "800px",
          }}
        >
          Unlock Creative Superpowers
        </div>

        {/* Feature Pills */}
        <div style={{ display: "flex", gap: "24px", marginTop: "40px" }}>
           <div style={{ padding: "10px 24px", borderRadius: "100px", background: "rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 24 }}>
             50% Off Generations
           </div>
           <div style={{ padding: "10px 24px", borderRadius: "100px", background: "rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 24 }}>
             Extended Storage
           </div>
           <div style={{ padding: "10px 24px", borderRadius: "100px", background: "rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 24 }}>
             NFT Membership
           </div>
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
        {
            name: "Space Grotesk",
            data: fontData,
            weight: 600,
            style: "normal",
        }
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  writeFileSync(outputPath, pngBuffer);
  console.log(`Generated: ${outputPath}`);
}

async function generateStudioOg() {

  const outputPath = join(OUTPUT_DIR, "studio.png");
  const svg = await satori(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#09090b", // zinc-950
        backgroundImage: "radial-gradient(circle at 50% 50%, #27272a 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        position: "relative",
        fontFamily: "Space Grotesk",
      }}
    >
      <div
        style={{
          fontSize: 120,
          fontWeight: 700,
          color: "#e4e4e7",
          letterSpacing: "-0.05em",
          marginBottom: 20,
        }}
      >
        Studio
      </div>
      <div
        style={{
          fontSize: 40,
          color: "#a1a1aa",
          fontFamily: "monospace",
          backgroundColor: "#18181b",
          padding: "10px 30px",
          borderRadius: "8px",
          border: "1px solid #3f3f46",
        }}
      >
        $ init creative_suite
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Space Grotesk", data: fontData, weight: 700, style: "normal" },
      ],
    }
  );
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
  writeFileSync(outputPath, resvg.render().asPng());
  console.log(`Generated: ${outputPath}`);
}

async function generateThemeStudioOg() {
  const outputPath = join(OUTPUT_DIR, "studio-theme.png");
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#a855f7", "#ec4899"];
  const svg = await satori(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Space Grotesk",
      }}
    >
      {/* Abstract Color Mesh */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexWrap: "wrap", opacity: 0.4 }}>
        {colors.map((c, i) => (
          <div key={i} style={{ width: "25%", height: "50%", backgroundColor: c, filter: "blur(60px)", transform: "scale(1.5)" }} />
        ))}
      </div>
      
      <div
        style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.6)",
            padding: "60px 100px",
            borderRadius: "30px",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
        }}
      >
        <div style={{ fontSize: 90, fontWeight: 700, color: "#fff", marginBottom: 10 }}>
            Theme Studio
        </div>
        <div style={{ fontSize: 32, color: "#d4d4d8" }}>
            Design. Visualize. Inscribe.
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Space Grotesk", data: fontData, weight: 700, style: "normal" },
      ],
    }
  );
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
  writeFileSync(outputPath, resvg.render().asPng());
  console.log(`Generated: ${outputPath}`);
}

async function generateMarketOg() {
  const outputPath = join(OUTPUT_DIR, "market.png");
  const svg = await satori(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f172a",
        position: "relative",
        fontFamily: "Space Grotesk",
      }}
    >
        {/* Grid Background */}
        <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            opacity: 0.3
        }} />

        <div style={{
            fontSize: 100,
            fontWeight: 700,
            background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: 20,
            position: "relative",
        }}>
            Marketplace
        </div>
        
        <div style={{
            fontSize: 36,
            color: "#94a3b8",
            display: "flex",
            gap: "20px",
            position: "relative",
        }}>
            <span>Themes</span>
            <span style={{color: "#475569"}}>•</span>
            <span>Fonts</span>
            <span style={{color: "#475569"}}>•</span>
            <span>Assets</span>
        </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Space Grotesk", data: fontData, weight: 700, style: "normal" },
      ],
    }
  );
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
  writeFileSync(outputPath, resvg.render().asPng());
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

  // Generate default homepage OG (using first theme or fetch default)
  let defaultTheme: ThemeToken | null | undefined = publishedThemes[0]?.theme;
  if (!defaultTheme) {
    defaultTheme = await fetchDefaultTheme();
  }
  if (!defaultTheme) {
    console.error("No themes available for default OG image");
    process.exit(1);
  }
  // TypeScript knows defaultTheme is not null after the check above
  const defaultPath = join(OUTPUT_DIR, "default.png");
  await generateOgImage(defaultTheme, defaultPath);

  // Generate Static Pages OGs
  await generatePricingOg();
  await generateStudioOg();
  await generateThemeStudioOg();
  await generateMarketOg();

  console.log(`\nGenerated ${publishedThemes.length + 5} OG images`);
}

main().catch(console.error);
