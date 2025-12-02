"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type MouseEvent,
} from "react";
import {
  type ThemeToken,
  type ThemeStyleProps,
  applyTheme as applyThemeStyles,
  validateThemeToken,
} from "@/lib/schema";

interface ThemeContextValue {
  /** Currently active theme token */
  activeTheme: ThemeToken | null;
  /** Current mode (light/dark) */
  mode: "light" | "dark";
  /** List of available theme tokens from wallet */
  availableThemes: ThemeToken[];
  /** Set available themes (called by wallet hook) */
  setAvailableThemes: (themes: ThemeToken[]) => void;
  /** Apply a theme token */
  applyTheme: (theme: ThemeToken | null) => void;
  /** Apply a theme token with splash animation from click position */
  applyThemeAnimated: (theme: ThemeToken | null, e?: MouseEvent) => void;
  /** Toggle light/dark mode with optional click event for animation */
  toggleMode: (e?: MouseEvent) => void;
  /** Set mode explicitly */
  setMode: (mode: "light" | "dark") => void;
  /** Reset to default site theme */
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "theme-token-selection";
const MODE_STORAGE_KEY = "theme-token-mode";

// Calculate max radius for circular reveal animation
function getMaxRadius(x: number, y: number): number {
  const right = window.innerWidth - x;
  const bottom = window.innerHeight - y;
  return Math.hypot(Math.max(x, right), Math.max(y, bottom));
}

// Animate the view transition with Web Animations API
function animateTransition(x: number, y: number): void {
  const maxRadius = getMaxRadius(x, y);
  document.documentElement.animate(
    {
      clipPath: [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${maxRadius}px at ${x}px ${y}px)`,
      ],
    },
    {
      duration: 500,
      easing: "ease-in-out",
      pseudoElement: "::view-transition-new(root)",
    }
  );
}

interface StoredThemeSelection {
  outpoint?: string;
  themeName?: string;
}

// CSS variables to reset when clearing a theme
const CSS_VARS_TO_RESET = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--destructive-foreground",
  "--border",
  "--input",
  "--ring",
  "--radius",
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
];

function applyThemeToDocument(styles: ThemeStyleProps | null): void {
  const root = document.documentElement;

  if (!styles) {
    // Reset to CSS defaults by removing inline styles
    CSS_VARS_TO_RESET.forEach((v) => root.style.removeProperty(v));
    return;
  }

  applyThemeStyles(styles);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [activeTheme, setActiveTheme] = useState<ThemeToken | null>(null);
  const [availableThemes, setAvailableThemes] = useState<ThemeToken[]>([]);
  const [mode, setModeState] = useState<"light" | "dark">("light");

  // Load saved mode preference on mount
  useEffect(() => {
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY);
    if (savedMode === "dark" || savedMode === "light") {
      setModeState(savedMode);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setModeState(prefersDark ? "dark" : "light");
    }
  }, []);

  // Apply dark class to html element
  useEffect(() => {
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [mode]);

  // Apply theme when activeTheme or mode changes
  useEffect(() => {
    if (activeTheme) {
      applyThemeToDocument(activeTheme.styles[mode]);
    }
  }, [activeTheme, mode]);

  const applyTheme = useCallback(
    (theme: ThemeToken | null) => {
      setActiveTheme(theme);

      if (theme) {
        applyThemeToDocument(theme.styles[mode]);
        // Save selection
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ themeName: theme.name })
        );
      } else {
        applyThemeToDocument(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    [mode]
  );

  const resetTheme = useCallback(() => {
    setActiveTheme(null);
    applyThemeToDocument(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const applyThemeAnimated = useCallback(
    async (theme: ThemeToken | null, e?: MouseEvent): Promise<void> => {
      // Use View Transitions API if available
      if (
        typeof document !== "undefined" &&
        "startViewTransition" in document
      ) {
        const x = e?.clientX ?? window.innerWidth / 2;
        const y = e?.clientY ?? window.innerHeight / 2;

        const transition = (document as Document & { startViewTransition: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } }).startViewTransition(() => {
          applyTheme(theme);
        });

        // Wait for transition to be ready, then animate
        await transition.ready;
        animateTransition(x, y);
        // Wait for animation to complete
        await transition.finished;
      } else {
        applyTheme(theme);
      }
    },
    [applyTheme]
  );

  const setMode = useCallback((newMode: "light" | "dark") => {
    setModeState(newMode);
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
  }, []);

  const toggleMode = useCallback(
    async (e?: MouseEvent) => {
      const newMode = mode === "light" ? "dark" : "light";

      // Use View Transitions API if available
      if (
        typeof document !== "undefined" &&
        "startViewTransition" in document
      ) {
        const x = e?.clientX ?? window.innerWidth / 2;
        const y = e?.clientY ?? window.innerHeight / 2;

        const transition = (document as Document & { startViewTransition: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } }).startViewTransition(() => {
          setMode(newMode);
        });

        // Wait for transition to be ready, then animate
        await transition.ready;
        animateTransition(x, y);
      } else {
        setMode(newMode);
      }
    },
    [mode, setMode]
  );

  // Try to restore saved theme when availableThemes changes
  useEffect(() => {
    if (availableThemes.length === 0) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const { themeName } = JSON.parse(saved) as StoredThemeSelection;
      if (themeName) {
        const found = availableThemes.find((t) => t.name === themeName);
        if (found) {
          setActiveTheme(found);
          applyThemeToDocument(found.styles[mode]);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [availableThemes, mode]);

  return (
    <ThemeContext.Provider
      value={{
        activeTheme,
        mode,
        availableThemes,
        setAvailableThemes,
        applyTheme,
        applyThemeAnimated,
        toggleMode,
        setMode,
        resetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Parse and validate a potential ThemeToken from fetched content
 */
export function parseThemeToken(data: unknown): ThemeToken | null {
  const result = validateThemeToken(data);
  return result.valid ? result.theme : null;
}
