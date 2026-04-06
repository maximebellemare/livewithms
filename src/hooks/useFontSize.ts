import { useState, useEffect, useCallback } from "react";

export type FontSizeOption = "normal" | "large" | "xl";

const STORAGE_KEY = "ms-font-size";

const CLASS_MAP: Record<FontSizeOption, string> = {
  normal: "",
  large: "font-large",
  xl: "font-xl",
};

export const useFontSize = () => {
  const [fontSize, setFontSizeState] = useState<FontSizeOption>(() => {
    if (typeof window === "undefined") return "normal";
    return (localStorage.getItem(STORAGE_KEY) as FontSizeOption) || "normal";
  });

  useEffect(() => {
    const root = document.documentElement;
    // Remove all font classes
    root.classList.remove("font-large", "font-xl");
    // Add current
    const cls = CLASS_MAP[fontSize];
    if (cls) root.classList.add(cls);
  }, [fontSize]);

  const setFontSize = useCallback((size: FontSizeOption) => {
    localStorage.setItem(STORAGE_KEY, size);
    setFontSizeState(size);
  }, []);

  return { fontSize, setFontSize };
};
