"use client";

import { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const classList = document.documentElement.classList;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function updateTheme() {
      if (mediaQuery.matches) {
        classList.add("dark");
      } else {
        classList.remove("dark");
      }
    }

    updateTheme();
    mediaQuery.addEventListener("change", updateTheme);
    return () => {
      mediaQuery.removeEventListener("change", updateTheme);
    };
  }, []);

  return <>{children}</>;
}
