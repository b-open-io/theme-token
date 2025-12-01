"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  type ThemeToken,
  type ThemeMode,
  themeToCssVars,
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
  /** Toggle light/dark mode */
  toggleMode: () => void;
  /** Set mode explicitly */
  setMode: (mode: "light" | "dark") => void;
  /** Reset to default site theme */
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "theme-token-selection";
const MODE_STORAGE_KEY = "theme-token-mode";

interface StoredThemeSelection {
  outpoint?: string;
  themeName?: string;
}

function applyThemeToDocument(theme: ThemeMode | null): void {
  const root = document.documentElement;

  if (!theme) {
    // Reset to CSS defaults by removing inline styles
    const vars = [
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
    ];
    vars.forEach((v) => root.style.removeProperty(v));
    return;
  }

  const cssVars = themeToCssVars(theme);
  for (const [key, value] of Object.entries(cssVars)) {
    root.style.setProperty(key, value);
  }
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
      applyThemeToDocument(activeTheme[mode]);
    }
  }, [activeTheme, mode]);

  const applyTheme = useCallback(
    (theme: ThemeToken | null) => {
      setActiveTheme(theme);

      if (theme) {
        applyThemeToDocument(theme[mode]);
        // Save selection
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ themeName: theme.metadata.name })
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

  const setMode = useCallback((newMode: "light" | "dark") => {
    setModeState(newMode);
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === "light" ? "dark" : "light");
  }, [mode, setMode]);

  // Try to restore saved theme when availableThemes changes
  useEffect(() => {
    if (availableThemes.length === 0) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const { themeName } = JSON.parse(saved) as StoredThemeSelection;
      if (themeName) {
        const found = availableThemes.find(
          (t) => t.metadata.name === themeName
        );
        if (found) {
          setActiveTheme(found);
          applyThemeToDocument(found[mode]);
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
