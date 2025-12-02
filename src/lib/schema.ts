/**
 * Theme Token Standard v1.0
 *
 * A standard for tokenizing ShadCN-compatible UI themes on blockchain.
 * Compatible with tweakcn theme format.
 *
 * All color values use the Oklch format: "oklch(L C H)"
 */

import { z } from "zod";

export const THEME_TOKEN_SCHEMA_URL = "https://themetoken.dev/v1/schema.json" as const;

/**
 * Theme style properties - flat, kebab-case, matches ShadCN CSS vars exactly
 * Compatible with tweakcn format
 */
export const themeStylePropsSchema = z.object({
  // Core colors
  background: z.string(),
  foreground: z.string(),
  card: z.string(),
  "card-foreground": z.string(),
  popover: z.string(),
  "popover-foreground": z.string(),
  primary: z.string(),
  "primary-foreground": z.string(),
  secondary: z.string(),
  "secondary-foreground": z.string(),
  muted: z.string(),
  "muted-foreground": z.string(),
  accent: z.string(),
  "accent-foreground": z.string(),
  destructive: z.string(),
  "destructive-foreground": z.string(),
  border: z.string(),
  input: z.string(),
  ring: z.string(),

  // Charts
  "chart-1": z.string().optional(),
  "chart-2": z.string().optional(),
  "chart-3": z.string().optional(),
  "chart-4": z.string().optional(),
  "chart-5": z.string().optional(),

  // Sidebar (optional)
  sidebar: z.string().optional(),
  "sidebar-foreground": z.string().optional(),
  "sidebar-primary": z.string().optional(),
  "sidebar-primary-foreground": z.string().optional(),
  "sidebar-accent": z.string().optional(),
  "sidebar-accent-foreground": z.string().optional(),
  "sidebar-border": z.string().optional(),
  "sidebar-ring": z.string().optional(),

  // Typography (optional)
  "font-sans": z.string().optional(),
  "font-serif": z.string().optional(),
  "font-mono": z.string().optional(),

  // Dimensions
  radius: z.string(),
  "letter-spacing": z.string().optional(),
  spacing: z.string().optional(),

  // Shadow (optional)
  "shadow-color": z.string().optional(),
  "shadow-opacity": z.string().optional(),
  "shadow-blur": z.string().optional(),
  "shadow-spread": z.string().optional(),
  "shadow-offset-x": z.string().optional(),
  "shadow-offset-y": z.string().optional(),
  "shadow-x": z.string().optional(),
  "shadow-y": z.string().optional(),

  // Tracking (optional)
  "tracking-normal": z.string().optional(),
}).catchall(z.string()); // Allow additional CSS properties from tweakcn (must be strings)

export type ThemeStyleProps = z.infer<typeof themeStylePropsSchema>;

/**
 * Theme styles with light and dark modes
 */
export const themeStylesSchema = z.object({
  light: themeStylePropsSchema,
  dark: themeStylePropsSchema,
});

export type ThemeStyles = z.infer<typeof themeStylesSchema>;

/**
 * Theme Token - matches tweakcn format with optional extension fields
 * Required: name, styles
 * Optional: $schema (for validation), author (paymail/identity)
 */
export const themeTokenSchema = z.object({
  $schema: z.string().optional(),
  name: z.string(),
  author: z.string().optional(),
  styles: themeStylesSchema,
});

export type ThemeToken = z.infer<typeof themeTokenSchema>;

/**
 * Apply theme styles to document root
 */
export function applyTheme(styles: ThemeStyleProps): void {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(styles)) {
    if (value !== undefined) {
      root.style.setProperty(`--${key}`, value);
    }
  }
}

/**
 * Validate a ThemeToken object
 */
export function validateThemeToken(
  data: unknown
): { valid: true; theme: ThemeToken } | { valid: false; error: string } {
  const result = themeTokenSchema.safeParse(data);
  if (result.success) {
    return { valid: true, theme: result.data };
  }
  return { valid: false, error: result.error.message };
}

/**
 * Example Theme Tokens (tweakcn format)
 */
export const exampleThemes: ThemeToken[] = [
  {
    name: "Blueprint",
    styles: {
      light: {
        background: "oklch(0.98 0.005 240)",
        foreground: "oklch(0.15 0.01 240)",
        card: "oklch(1 0 0)",
        "card-foreground": "oklch(0.15 0.01 240)",
        popover: "oklch(1 0 0)",
        "popover-foreground": "oklch(0.15 0.01 240)",
        primary: "oklch(0.55 0.22 255)",
        "primary-foreground": "oklch(0.98 0 0)",
        secondary: "oklch(0.95 0.005 240)",
        "secondary-foreground": "oklch(0.25 0.01 240)",
        muted: "oklch(0.95 0.005 240)",
        "muted-foreground": "oklch(0.5 0.01 240)",
        accent: "oklch(0.95 0.01 255)",
        "accent-foreground": "oklch(0.25 0.01 240)",
        destructive: "oklch(0.55 0.22 25)",
        "destructive-foreground": "oklch(0.98 0 0)",
        border: "oklch(0.9 0.005 240)",
        input: "oklch(0.9 0.005 240)",
        ring: "oklch(0.55 0.22 255)",
        "chart-1": "oklch(0.55 0.22 255)",
        "chart-2": "oklch(0.6 0.18 200)",
        "chart-3": "oklch(0.65 0.15 145)",
        "chart-4": "oklch(0.7 0.12 60)",
        "chart-5": "oklch(0.55 0.18 330)",
        radius: "0.5rem",
      },
      dark: {
        background: "oklch(0.12 0.015 240)",
        foreground: "oklch(0.95 0.005 240)",
        card: "oklch(0.16 0.015 240)",
        "card-foreground": "oklch(0.95 0.005 240)",
        popover: "oklch(0.16 0.015 240)",
        "popover-foreground": "oklch(0.95 0.005 240)",
        primary: "oklch(0.65 0.22 255)",
        "primary-foreground": "oklch(0.12 0.015 240)",
        secondary: "oklch(0.2 0.015 240)",
        "secondary-foreground": "oklch(0.95 0.005 240)",
        muted: "oklch(0.2 0.015 240)",
        "muted-foreground": "oklch(0.65 0.01 240)",
        accent: "oklch(0.25 0.02 255)",
        "accent-foreground": "oklch(0.95 0.005 240)",
        destructive: "oklch(0.6 0.22 25)",
        "destructive-foreground": "oklch(0.98 0 0)",
        border: "oklch(0.25 0.015 240)",
        input: "oklch(0.25 0.015 240)",
        ring: "oklch(0.65 0.22 255)",
        "chart-1": "oklch(0.65 0.22 255)",
        "chart-2": "oklch(0.65 0.18 200)",
        "chart-3": "oklch(0.7 0.15 145)",
        "chart-4": "oklch(0.75 0.12 60)",
        "chart-5": "oklch(0.6 0.18 330)",
        radius: "0.5rem",
      },
    },
  },
  {
    name: "Ocean Depths",
    styles: {
      light: {
        background: "oklch(0.98 0.01 240)",
        foreground: "oklch(0.15 0.02 240)",
        card: "oklch(1 0 0)",
        "card-foreground": "oklch(0.15 0.02 240)",
        popover: "oklch(1 0 0)",
        "popover-foreground": "oklch(0.15 0.02 240)",
        primary: "oklch(0.55 0.2 240)",
        "primary-foreground": "oklch(0.98 0.01 240)",
        secondary: "oklch(0.95 0.01 240)",
        "secondary-foreground": "oklch(0.25 0.02 240)",
        muted: "oklch(0.95 0.01 240)",
        "muted-foreground": "oklch(0.5 0.02 240)",
        accent: "oklch(0.95 0.02 200)",
        "accent-foreground": "oklch(0.25 0.02 240)",
        destructive: "oklch(0.55 0.25 25)",
        "destructive-foreground": "oklch(0.98 0.01 0)",
        border: "oklch(0.9 0.01 240)",
        input: "oklch(0.9 0.01 240)",
        ring: "oklch(0.55 0.2 240)",
        "chart-1": "oklch(0.55 0.2 240)",
        "chart-2": "oklch(0.65 0.18 200)",
        "chart-3": "oklch(0.6 0.15 180)",
        "chart-4": "oklch(0.7 0.12 260)",
        "chart-5": "oklch(0.75 0.1 220)",
        radius: "0.625rem",
      },
      dark: {
        background: "oklch(0.15 0.02 240)",
        foreground: "oklch(0.95 0.01 240)",
        card: "oklch(0.2 0.02 240)",
        "card-foreground": "oklch(0.95 0.01 240)",
        popover: "oklch(0.2 0.02 240)",
        "popover-foreground": "oklch(0.95 0.01 240)",
        primary: "oklch(0.65 0.2 240)",
        "primary-foreground": "oklch(0.15 0.02 240)",
        secondary: "oklch(0.25 0.02 240)",
        "secondary-foreground": "oklch(0.95 0.01 240)",
        muted: "oklch(0.25 0.02 240)",
        "muted-foreground": "oklch(0.65 0.02 240)",
        accent: "oklch(0.3 0.02 200)",
        "accent-foreground": "oklch(0.95 0.01 240)",
        destructive: "oklch(0.65 0.2 25)",
        "destructive-foreground": "oklch(0.98 0.01 0)",
        border: "oklch(0.3 0.02 240)",
        input: "oklch(0.3 0.02 240)",
        ring: "oklch(0.65 0.2 240)",
        "chart-1": "oklch(0.65 0.2 240)",
        "chart-2": "oklch(0.7 0.18 200)",
        "chart-3": "oklch(0.65 0.15 180)",
        "chart-4": "oklch(0.75 0.12 260)",
        "chart-5": "oklch(0.8 0.1 220)",
        radius: "0.625rem",
      },
    },
  },
  {
    name: "Cyberpunk Neon",
    styles: {
      light: {
        background: "oklch(0.95 0.01 300)",
        foreground: "oklch(0.2 0.05 300)",
        card: "oklch(0.98 0.005 300)",
        "card-foreground": "oklch(0.2 0.05 300)",
        popover: "oklch(0.98 0.005 300)",
        "popover-foreground": "oklch(0.2 0.05 300)",
        primary: "oklch(0.7 0.25 330)",
        "primary-foreground": "oklch(0.98 0 0)",
        secondary: "oklch(0.9 0.02 300)",
        "secondary-foreground": "oklch(0.3 0.05 300)",
        muted: "oklch(0.9 0.02 300)",
        "muted-foreground": "oklch(0.5 0.03 300)",
        accent: "oklch(0.75 0.2 180)",
        "accent-foreground": "oklch(0.15 0.05 180)",
        destructive: "oklch(0.6 0.25 25)",
        "destructive-foreground": "oklch(0.98 0 0)",
        border: "oklch(0.85 0.02 300)",
        input: "oklch(0.85 0.02 300)",
        ring: "oklch(0.7 0.25 330)",
        "chart-1": "oklch(0.7 0.25 330)",
        "chart-2": "oklch(0.75 0.2 180)",
        "chart-3": "oklch(0.65 0.22 60)",
        "chart-4": "oklch(0.6 0.2 270)",
        "chart-5": "oklch(0.7 0.18 120)",
        radius: "0.5rem",
      },
      dark: {
        background: "oklch(0.12 0.03 300)",
        foreground: "oklch(0.95 0.02 300)",
        card: "oklch(0.16 0.04 300)",
        "card-foreground": "oklch(0.95 0.02 300)",
        popover: "oklch(0.16 0.04 300)",
        "popover-foreground": "oklch(0.95 0.02 300)",
        primary: "oklch(0.75 0.28 330)",
        "primary-foreground": "oklch(0.12 0.03 300)",
        secondary: "oklch(0.22 0.04 300)",
        "secondary-foreground": "oklch(0.9 0.02 300)",
        muted: "oklch(0.22 0.04 300)",
        "muted-foreground": "oklch(0.65 0.03 300)",
        accent: "oklch(0.8 0.22 180)",
        "accent-foreground": "oklch(0.12 0.03 180)",
        destructive: "oklch(0.65 0.25 25)",
        "destructive-foreground": "oklch(0.98 0 0)",
        border: "oklch(0.3 0.05 300)",
        input: "oklch(0.3 0.05 300)",
        ring: "oklch(0.75 0.28 330)",
        "chart-1": "oklch(0.75 0.28 330)",
        "chart-2": "oklch(0.8 0.22 180)",
        "chart-3": "oklch(0.7 0.25 60)",
        "chart-4": "oklch(0.65 0.22 270)",
        "chart-5": "oklch(0.75 0.2 120)",
        radius: "0.5rem",
      },
    },
  },
  {
    name: "Forest Moss",
    styles: {
      light: {
        background: "oklch(0.97 0.01 90)",
        foreground: "oklch(0.2 0.02 90)",
        card: "oklch(0.99 0.005 90)",
        "card-foreground": "oklch(0.2 0.02 90)",
        popover: "oklch(0.99 0.005 90)",
        "popover-foreground": "oklch(0.2 0.02 90)",
        primary: "oklch(0.5 0.15 145)",
        "primary-foreground": "oklch(0.98 0.01 90)",
        secondary: "oklch(0.92 0.02 90)",
        "secondary-foreground": "oklch(0.3 0.02 90)",
        muted: "oklch(0.92 0.02 90)",
        "muted-foreground": "oklch(0.5 0.02 90)",
        accent: "oklch(0.85 0.08 80)",
        "accent-foreground": "oklch(0.25 0.02 90)",
        destructive: "oklch(0.55 0.2 30)",
        "destructive-foreground": "oklch(0.98 0 0)",
        border: "oklch(0.88 0.02 90)",
        input: "oklch(0.88 0.02 90)",
        ring: "oklch(0.5 0.15 145)",
        "chart-1": "oklch(0.5 0.15 145)",
        "chart-2": "oklch(0.6 0.12 120)",
        "chart-3": "oklch(0.7 0.1 80)",
        "chart-4": "oklch(0.55 0.1 160)",
        "chart-5": "oklch(0.65 0.08 100)",
        radius: "0.75rem",
      },
      dark: {
        background: "oklch(0.18 0.02 90)",
        foreground: "oklch(0.92 0.01 90)",
        card: "oklch(0.22 0.025 90)",
        "card-foreground": "oklch(0.92 0.01 90)",
        popover: "oklch(0.22 0.025 90)",
        "popover-foreground": "oklch(0.92 0.01 90)",
        primary: "oklch(0.6 0.15 145)",
        "primary-foreground": "oklch(0.15 0.02 145)",
        secondary: "oklch(0.28 0.02 90)",
        "secondary-foreground": "oklch(0.9 0.01 90)",
        muted: "oklch(0.28 0.02 90)",
        "muted-foreground": "oklch(0.65 0.02 90)",
        accent: "oklch(0.35 0.06 80)",
        "accent-foreground": "oklch(0.92 0.01 90)",
        destructive: "oklch(0.6 0.18 30)",
        "destructive-foreground": "oklch(0.98 0 0)",
        border: "oklch(0.32 0.025 90)",
        input: "oklch(0.32 0.025 90)",
        ring: "oklch(0.6 0.15 145)",
        "chart-1": "oklch(0.6 0.15 145)",
        "chart-2": "oklch(0.65 0.12 120)",
        "chart-3": "oklch(0.75 0.1 80)",
        "chart-4": "oklch(0.6 0.1 160)",
        "chart-5": "oklch(0.7 0.08 100)",
        radius: "0.75rem",
      },
    },
  },
];

/**
 * Parse CSS from tweakcn format into ThemeStyleProps
 * Supports :root { } and .dark { } blocks
 */
function parseCssBlock(css: string): ThemeStyleProps {
  const props: Record<string, string> = {};

  // Match CSS variable declarations: --name: value;
  const varRegex = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match;

  while ((match = varRegex.test(css), match = varRegex.exec(css)) !== null) {
    const [, name, value] = match;
    // Skip @theme inline variables (--color-*, --radius-*, --shadow-*)
    // and compound shadow values
    if (
      !name.startsWith("color-") &&
      !name.startsWith("radius-") &&
      !name.startsWith("shadow-2") &&
      name !== "shadow-xs" &&
      name !== "shadow-sm" &&
      name !== "shadow-md" &&
      name !== "shadow-lg" &&
      name !== "shadow-xl" &&
      name !== "shadow"
    ) {
      props[name] = value.trim();
    }
  }

  return props as unknown as ThemeStyleProps;
}

/**
 * Parse tweakcn CSS export into ThemeToken format
 * Accepts raw CSS with :root { } and .dark { } blocks
 */
export function parseTweakCnCss(
  css: string,
  name = "Custom Theme"
): { valid: true; theme: ThemeToken } | { valid: false; error: string } {
  try {
    // Extract :root block for light mode
    const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
    // Extract .dark block for dark mode
    const darkMatch = css.match(/\.dark\s*\{([^}]+)\}/);

    if (!rootMatch) {
      return { valid: false, error: "Missing :root { } block for light mode" };
    }

    const lightStyles = parseCssBlock(rootMatch[1]);
    const darkStyles = darkMatch
      ? parseCssBlock(darkMatch[1])
      : { ...lightStyles }; // Fall back to light if no dark

    // Validate that we have required properties
    const requiredProps = ["background", "foreground", "primary", "radius"];
    for (const prop of requiredProps) {
      if (!(prop in lightStyles)) {
        return {
          valid: false,
          error: `Missing required property: --${prop}`,
        };
      }
    }

    const theme: ThemeToken = {
      name,
      styles: {
        light: lightStyles,
        dark: darkStyles,
      },
    };

    return { valid: true, theme };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Failed to parse CSS",
    };
  }
}
