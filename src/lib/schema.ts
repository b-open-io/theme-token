/**
 * Theme Token Standard v1.0
 *
 * A standard for tokenizing ShadCN-compatible UI themes on blockchain.
 * Themes are inscribed as JSON following this schema.
 *
 * All color values use the Oklch format: "oklch(L C H / A?)"
 */

export const THEME_TOKEN_VERSION = "1.0" as const;
export const THEME_TOKEN_PROTOCOL = "ThemeToken" as const;
export const THEME_TOKEN_TYPE = "ShadCN-UI" as const;
export const THEME_TOKEN_CONTENT_TYPE = "application/json" as const;

/**
 * Color value in oklch format (preferred) or any CSS color
 * Examples: "oklch(0.145 0 0)", "hsl(222.2 84% 4.9%)", "#09090b"
 */
export type ColorValue = string;

/**
 * Theme Token metadata
 */
export interface ThemeMetadata {
  /** Theme display name */
  name: string;
  /** Theme description */
  description?: string;
  /** Theme author (address, paymail, or name) */
  author?: string;
  /** Theme tags for discovery */
  tags?: string[];
  /** Usage license */
  license?: "CC0" | "MIT" | string;
  /** Preview image URL (ordfs, ipfs, or https) */
  previewUrl?: string;
}

/**
 * Semantic color tokens - all ShadCN UI variables
 */
export interface ThemeColors {
  /** Page background */
  background: ColorValue;
  /** Default text color */
  foreground: ColorValue;

  /** Card/elevated surface background */
  card: ColorValue;
  /** Card text color */
  cardForeground: ColorValue;

  /** Popover/dropdown background */
  popover: ColorValue;
  /** Popover text color */
  popoverForeground: ColorValue;

  /** Primary brand color */
  primary: ColorValue;
  /** Text on primary color */
  primaryForeground: ColorValue;

  /** Secondary/muted actions */
  secondary: ColorValue;
  /** Text on secondary color */
  secondaryForeground: ColorValue;

  /** Muted backgrounds */
  muted: ColorValue;
  /** Muted text (placeholders, labels) */
  mutedForeground: ColorValue;

  /** Accent highlights */
  accent: ColorValue;
  /** Text on accent color */
  accentForeground: ColorValue;

  /** Destructive/error color */
  destructive: ColorValue;
  /** Text on destructive color */
  destructiveForeground: ColorValue;

  /** Border color */
  border: ColorValue;
  /** Input border color */
  input: ColorValue;
  /** Focus ring color */
  ring: ColorValue;
}

/**
 * Dimension tokens (spacing, radius)
 */
export interface ThemeDimensions {
  /** Border radius base value (e.g., "0.5rem", "0.625rem") */
  radius: string;
}

/**
 * Complete theme mode (light or dark)
 */
export interface ThemeMode {
  colors: ThemeColors;
  dimensions: ThemeDimensions;
  /** Chart colors (flexible, any number) */
  charts?: Record<string, ColorValue>;
}

/**
 * Complete Theme Token schema v1.0
 */
export interface ThemeToken {
  /** Schema version */
  $schema: typeof THEME_TOKEN_VERSION;
  /** Protocol identifier */
  protocol: typeof THEME_TOKEN_PROTOCOL;
  /** Theme system type */
  type: typeof THEME_TOKEN_TYPE;
  /** Theme metadata */
  metadata: ThemeMetadata;
  /** Light mode theme */
  light: ThemeMode;
  /** Dark mode theme */
  dark: ThemeMode;
}

/**
 * Convert ThemeMode to CSS custom properties
 */
export function themeToCssVars(theme: ThemeMode): Record<string, string> {
  const vars: Record<string, string> = {};

  // Convert colors (cardForeground -> --card-foreground)
  for (const [key, value] of Object.entries(theme.colors)) {
    const cssVar = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
    vars[cssVar] = value;
  }

  // Dimensions
  vars["--radius"] = theme.dimensions.radius;

  // Charts
  if (theme.charts) {
    for (const [key, value] of Object.entries(theme.charts)) {
      vars[`--chart-${key}`] = value;
    }
  }

  return vars;
}

/**
 * Apply theme to document root
 */
export function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  const vars = themeToCssVars(theme);

  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

/**
 * Example Theme Tokens
 */
export const exampleThemes: ThemeToken[] = [
  {
    $schema: "1.0",
    protocol: "ThemeToken",
    type: "ShadCN-UI",
    metadata: {
      name: "Ocean Depths",
      description: "A deep blue theme inspired by the ocean",
      author: "theme-token",
      tags: ["blue", "calm", "professional"],
      license: "CC0",
    },
    light: {
      colors: {
        background: "oklch(0.98 0.01 240)",
        foreground: "oklch(0.15 0.02 240)",
        card: "oklch(1 0 0)",
        cardForeground: "oklch(0.15 0.02 240)",
        popover: "oklch(1 0 0)",
        popoverForeground: "oklch(0.15 0.02 240)",
        primary: "oklch(0.55 0.2 240)",
        primaryForeground: "oklch(0.98 0.01 240)",
        secondary: "oklch(0.95 0.01 240)",
        secondaryForeground: "oklch(0.25 0.02 240)",
        muted: "oklch(0.95 0.01 240)",
        mutedForeground: "oklch(0.5 0.02 240)",
        accent: "oklch(0.95 0.02 200)",
        accentForeground: "oklch(0.25 0.02 240)",
        destructive: "oklch(0.55 0.25 25)",
        destructiveForeground: "oklch(0.98 0.01 0)",
        border: "oklch(0.9 0.01 240)",
        input: "oklch(0.9 0.01 240)",
        ring: "oklch(0.55 0.2 240)",
      },
      dimensions: { radius: "0.625rem" },
      charts: {
        "1": "oklch(0.55 0.2 240)",
        "2": "oklch(0.65 0.18 200)",
        "3": "oklch(0.6 0.15 180)",
        "4": "oklch(0.7 0.12 260)",
        "5": "oklch(0.75 0.1 220)",
      },
    },
    dark: {
      colors: {
        background: "oklch(0.15 0.02 240)",
        foreground: "oklch(0.95 0.01 240)",
        card: "oklch(0.2 0.02 240)",
        cardForeground: "oklch(0.95 0.01 240)",
        popover: "oklch(0.2 0.02 240)",
        popoverForeground: "oklch(0.95 0.01 240)",
        primary: "oklch(0.65 0.2 240)",
        primaryForeground: "oklch(0.15 0.02 240)",
        secondary: "oklch(0.25 0.02 240)",
        secondaryForeground: "oklch(0.95 0.01 240)",
        muted: "oklch(0.25 0.02 240)",
        mutedForeground: "oklch(0.65 0.02 240)",
        accent: "oklch(0.3 0.02 200)",
        accentForeground: "oklch(0.95 0.01 240)",
        destructive: "oklch(0.65 0.2 25)",
        destructiveForeground: "oklch(0.98 0.01 0)",
        border: "oklch(0.3 0.02 240)",
        input: "oklch(0.3 0.02 240)",
        ring: "oklch(0.65 0.2 240)",
      },
      dimensions: { radius: "0.625rem" },
      charts: {
        "1": "oklch(0.65 0.2 240)",
        "2": "oklch(0.7 0.18 200)",
        "3": "oklch(0.65 0.15 180)",
        "4": "oklch(0.75 0.12 260)",
        "5": "oklch(0.8 0.1 220)",
      },
    },
  },
  {
    $schema: "1.0",
    protocol: "ThemeToken",
    type: "ShadCN-UI",
    metadata: {
      name: "Cyberpunk Neon",
      description: "Electric neon colors on dark surfaces",
      author: "theme-token",
      tags: ["neon", "dark", "cyberpunk", "vibrant"],
      license: "CC0",
    },
    light: {
      colors: {
        background: "oklch(0.95 0.01 300)",
        foreground: "oklch(0.2 0.05 300)",
        card: "oklch(0.98 0.005 300)",
        cardForeground: "oklch(0.2 0.05 300)",
        popover: "oklch(0.98 0.005 300)",
        popoverForeground: "oklch(0.2 0.05 300)",
        primary: "oklch(0.7 0.25 330)",
        primaryForeground: "oklch(0.98 0 0)",
        secondary: "oklch(0.9 0.02 300)",
        secondaryForeground: "oklch(0.3 0.05 300)",
        muted: "oklch(0.9 0.02 300)",
        mutedForeground: "oklch(0.5 0.03 300)",
        accent: "oklch(0.75 0.2 180)",
        accentForeground: "oklch(0.15 0.05 180)",
        destructive: "oklch(0.6 0.25 25)",
        destructiveForeground: "oklch(0.98 0 0)",
        border: "oklch(0.85 0.02 300)",
        input: "oklch(0.85 0.02 300)",
        ring: "oklch(0.7 0.25 330)",
      },
      dimensions: { radius: "0.5rem" },
      charts: {
        "1": "oklch(0.7 0.25 330)",
        "2": "oklch(0.75 0.2 180)",
        "3": "oklch(0.65 0.22 60)",
        "4": "oklch(0.6 0.2 270)",
        "5": "oklch(0.7 0.18 120)",
      },
    },
    dark: {
      colors: {
        background: "oklch(0.12 0.03 300)",
        foreground: "oklch(0.95 0.02 300)",
        card: "oklch(0.16 0.04 300)",
        cardForeground: "oklch(0.95 0.02 300)",
        popover: "oklch(0.16 0.04 300)",
        popoverForeground: "oklch(0.95 0.02 300)",
        primary: "oklch(0.75 0.28 330)",
        primaryForeground: "oklch(0.12 0.03 300)",
        secondary: "oklch(0.22 0.04 300)",
        secondaryForeground: "oklch(0.9 0.02 300)",
        muted: "oklch(0.22 0.04 300)",
        mutedForeground: "oklch(0.65 0.03 300)",
        accent: "oklch(0.8 0.22 180)",
        accentForeground: "oklch(0.12 0.03 180)",
        destructive: "oklch(0.65 0.25 25)",
        destructiveForeground: "oklch(0.98 0 0)",
        border: "oklch(0.3 0.05 300)",
        input: "oklch(0.3 0.05 300)",
        ring: "oklch(0.75 0.28 330)",
      },
      dimensions: { radius: "0.5rem" },
      charts: {
        "1": "oklch(0.75 0.28 330)",
        "2": "oklch(0.8 0.22 180)",
        "3": "oklch(0.7 0.25 60)",
        "4": "oklch(0.65 0.22 270)",
        "5": "oklch(0.75 0.2 120)",
      },
    },
  },
  {
    $schema: "1.0",
    protocol: "ThemeToken",
    type: "ShadCN-UI",
    metadata: {
      name: "Forest Moss",
      description: "Earthy greens and warm neutrals",
      author: "theme-token",
      tags: ["green", "nature", "calm", "organic"],
      license: "CC0",
    },
    light: {
      colors: {
        background: "oklch(0.97 0.01 90)",
        foreground: "oklch(0.2 0.02 90)",
        card: "oklch(0.99 0.005 90)",
        cardForeground: "oklch(0.2 0.02 90)",
        popover: "oklch(0.99 0.005 90)",
        popoverForeground: "oklch(0.2 0.02 90)",
        primary: "oklch(0.5 0.15 145)",
        primaryForeground: "oklch(0.98 0.01 90)",
        secondary: "oklch(0.92 0.02 90)",
        secondaryForeground: "oklch(0.3 0.02 90)",
        muted: "oklch(0.92 0.02 90)",
        mutedForeground: "oklch(0.5 0.02 90)",
        accent: "oklch(0.85 0.08 80)",
        accentForeground: "oklch(0.25 0.02 90)",
        destructive: "oklch(0.55 0.2 30)",
        destructiveForeground: "oklch(0.98 0 0)",
        border: "oklch(0.88 0.02 90)",
        input: "oklch(0.88 0.02 90)",
        ring: "oklch(0.5 0.15 145)",
      },
      dimensions: { radius: "0.75rem" },
      charts: {
        "1": "oklch(0.5 0.15 145)",
        "2": "oklch(0.6 0.12 120)",
        "3": "oklch(0.7 0.1 80)",
        "4": "oklch(0.55 0.1 160)",
        "5": "oklch(0.65 0.08 100)",
      },
    },
    dark: {
      colors: {
        background: "oklch(0.18 0.02 90)",
        foreground: "oklch(0.92 0.01 90)",
        card: "oklch(0.22 0.025 90)",
        cardForeground: "oklch(0.92 0.01 90)",
        popover: "oklch(0.22 0.025 90)",
        popoverForeground: "oklch(0.92 0.01 90)",
        primary: "oklch(0.6 0.15 145)",
        primaryForeground: "oklch(0.15 0.02 145)",
        secondary: "oklch(0.28 0.02 90)",
        secondaryForeground: "oklch(0.9 0.01 90)",
        muted: "oklch(0.28 0.02 90)",
        mutedForeground: "oklch(0.65 0.02 90)",
        accent: "oklch(0.35 0.06 80)",
        accentForeground: "oklch(0.92 0.01 90)",
        destructive: "oklch(0.6 0.18 30)",
        destructiveForeground: "oklch(0.98 0 0)",
        border: "oklch(0.32 0.025 90)",
        input: "oklch(0.32 0.025 90)",
        ring: "oklch(0.6 0.15 145)",
      },
      dimensions: { radius: "0.75rem" },
      charts: {
        "1": "oklch(0.6 0.15 145)",
        "2": "oklch(0.65 0.12 120)",
        "3": "oklch(0.75 0.1 80)",
        "4": "oklch(0.6 0.1 160)",
        "5": "oklch(0.7 0.08 100)",
      },
    },
  },
];

/**
 * Validate a ThemeToken object
 */
export function validateThemeToken(
  data: unknown
): { valid: true; theme: ThemeToken } | { valid: false; error: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Theme must be an object" };
  }

  const obj = data as Record<string, unknown>;

  if (obj.$schema !== "1.0") {
    return { valid: false, error: '$schema must be "1.0"' };
  }

  if (obj.protocol !== "ThemeToken") {
    return { valid: false, error: 'protocol must be "ThemeToken"' };
  }

  if (obj.type !== "ShadCN-UI") {
    return { valid: false, error: 'type must be "ShadCN-UI"' };
  }

  if (!obj.metadata || typeof obj.metadata !== "object") {
    return { valid: false, error: "metadata is required" };
  }

  const metadata = obj.metadata as Record<string, unknown>;
  if (!metadata.name || typeof metadata.name !== "string") {
    return { valid: false, error: "metadata.name is required" };
  }

  if (!obj.light || typeof obj.light !== "object") {
    return { valid: false, error: "light mode is required" };
  }

  if (!obj.dark || typeof obj.dark !== "object") {
    return { valid: false, error: "dark mode is required" };
  }

  const requiredColors = [
    "background",
    "foreground",
    "card",
    "cardForeground",
    "popover",
    "popoverForeground",
    "primary",
    "primaryForeground",
    "secondary",
    "secondaryForeground",
    "muted",
    "mutedForeground",
    "accent",
    "accentForeground",
    "destructive",
    "destructiveForeground",
    "border",
    "input",
    "ring",
  ];

  for (const mode of ["light", "dark"] as const) {
    const modeObj = obj[mode] as Record<string, unknown>;
    if (!modeObj.colors || typeof modeObj.colors !== "object") {
      return { valid: false, error: `${mode}.colors is required` };
    }

    const colors = modeObj.colors as Record<string, unknown>;
    for (const color of requiredColors) {
      if (!colors[color] || typeof colors[color] !== "string") {
        return { valid: false, error: `${mode}.colors.${color} is required` };
      }
    }

    if (!modeObj.dimensions || typeof modeObj.dimensions !== "object") {
      return { valid: false, error: `${mode}.dimensions is required` };
    }

    const dimensions = modeObj.dimensions as Record<string, unknown>;
    if (!dimensions.radius || typeof dimensions.radius !== "string") {
      return { valid: false, error: `${mode}.dimensions.radius is required` };
    }
  }

  return { valid: true, theme: data as ThemeToken };
}
