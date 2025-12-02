import { NextResponse } from "next/server";
import { validateThemeToken, type ThemeStyleProps } from "@/lib/schema";

interface ShadcnRegistryItem {
  $schema: string;
  name: string;
  type: "registry:style";
  cssVars: {
    theme?: Record<string, string>;
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

// Extract shared theme values (fonts, radius, etc.) that are the same in light and dark
function extractSharedThemeVars(
  light: ThemeStyleProps,
  dark: ThemeStyleProps
): Record<string, string> {
  const shared: Record<string, string> = {};
  const sharedKeys = [
    "font-sans",
    "font-serif",
    "font-mono",
    "radius",
    "spacing",
    "tracking-normal",
  ];

  for (const key of sharedKeys) {
    const lightVal = light[key as keyof ThemeStyleProps];
    const darkVal = dark[key as keyof ThemeStyleProps];
    if (lightVal && lightVal === darkVal) {
      shared[key] = lightVal;
    }
  }

  return shared;
}

// Convert kebab-case name to a valid shadcn theme name (lowercase, no special chars)
function toShadcnName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

    // Extract shared theme variables
    const sharedVars = extractSharedThemeVars(
      theme.styles.light,
      theme.styles.dark
    );

    // Build the ShadCN registry item
    const registryItem: ShadcnRegistryItem = {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: toShadcnName(theme.name),
      type: "registry:style",
      cssVars: {
        ...(Object.keys(sharedVars).length > 0 ? { theme: sharedVars } : {}),
        light: theme.styles.light as unknown as Record<string, string>,
        dark: theme.styles.dark as unknown as Record<string, string>,
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
