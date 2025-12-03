import { NextResponse } from "next/server";
import { validateThemeToken, type ThemeStyleProps } from "@theme-token/sdk";

interface ShadcnRegistryItem {
  $schema: string;
  name: string;
  type: "registry:style";
  css: {
    "@layer base": Record<string, Record<string, string>>;
  };
  cssVars: {
    theme: Record<string, string>;
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

// Helper to get value from either theme, preferring light
function getThemeValue(
  light: ThemeStyleProps,
  dark: ThemeStyleProps,
  key: keyof ThemeStyleProps
): string {
  return (light[key] || dark[key] || "") as string;
}

// Convert kebab-case name to a valid shadcn theme name (lowercase, no special chars)
function toShadcnName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Transform internal theme props to registry cssVars format
// Maps letter-spacing → tracking-normal for CSS output
function toRegistryVars(props: ThemeStyleProps): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue;
    const strValue = value as string;

    // Map internal letter-spacing to CSS tracking-normal
    if (key === "letter-spacing") {
      vars["tracking-normal"] = strValue;
    } else {
      vars[key] = strValue;
    }
  }

  return vars;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ origin: string }> }
) {
  try {
    const { origin } = await params;

    // Remove .json extension if present
    const cleanOrigin = origin.replace(/\.json$/, "");

    // Fetch theme from ordfs
    const response = await fetch(`https://ordfs.network/${cleanOrigin}`);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Theme not found" },
        { status: 404 }
      );
    }

    const json = await response.json();
    const result = validateThemeToken(json);

    if (!result.valid) {
      return NextResponse.json(
        { error: "Invalid theme format", details: result.error },
        { status: 400 }
      );
    }

    const theme = result.theme;
    const { light, dark } = theme.styles;

    // Build the ShadCN registry item
    const registryItem: ShadcnRegistryItem = {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: toShadcnName(theme.name),
      type: "registry:style",
      // CSS section always includes body letter-spacing
      css: {
        "@layer base": {
          body: {
            "letter-spacing": "var(--tracking-normal)",
          },
        },
      },
      cssVars: {
        // Shared theme vars (fonts, radius, tracking calculations)
        theme: {
          "font-sans": getThemeValue(light, dark, "font-sans") || "Inter, sans-serif",
          "font-mono": getThemeValue(light, dark, "font-mono") || "monospace",
          "font-serif": getThemeValue(light, dark, "font-serif") || "serif",
          radius: getThemeValue(light, dark, "radius") || "0.5rem",
          "tracking-tighter": "calc(var(--tracking-normal) - 0.05em)",
          "tracking-tight": "calc(var(--tracking-normal) - 0.025em)",
          "tracking-wide": "calc(var(--tracking-normal) + 0.025em)",
          "tracking-wider": "calc(var(--tracking-normal) + 0.05em)",
          "tracking-widest": "calc(var(--tracking-normal) + 0.1em)",
        },
        // Light mode vars (includes tracking-normal and spacing)
        light: {
          ...toRegistryVars(light),
          "tracking-normal": getThemeValue(light, dark, "letter-spacing") || "0em",
          spacing: getThemeValue(light, dark, "spacing") || "0.25rem",
        },
        // Dark mode vars
        dark: toRegistryVars(dark),
      },
    };

    return NextResponse.json(registryItem, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("[Registry API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch theme" },
      { status: 500 }
    );
  }
}
