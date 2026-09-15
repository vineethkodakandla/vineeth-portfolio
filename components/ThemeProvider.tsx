"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";
type Ctx = { theme: Theme; toggle: () => void; set: (t: Theme) => void };

const ThemeCtx = createContext<Ctx>({ theme: "light", toggle: () => {}, set: () => {} });

const THEME_COLOR: Record<Theme, string> = { light: "#fafaf7", dark: "#0e0f11" };

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // The pre-paint script in layout.tsx has already stamped <html data-theme>.
  useEffect(() => {
    setThemeState(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  const apply = (t: Theme) => {
    setThemeState(t);
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem("theme", t);
    } catch {
      /* storage may be blocked */
    }
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", THEME_COLOR[t]));
  };

  return (
    <ThemeCtx.Provider
      value={{
        theme,
        toggle: () => apply(document.documentElement.dataset.theme === "dark" ? "light" : "dark"),
        set: apply,
      }}
    >
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
