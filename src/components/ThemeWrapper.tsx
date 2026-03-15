import { ReactNode } from "react";

/**
 * ThemeWrapper — thin passthrough.
 * Theme class management is handled entirely by next-themes ThemeProvider
 * (attribute="class"). Previous manual classList toggling caused race
 * conditions during route transitions in dark mode, leading to content
 * disappearing when switching tabs.
 */
const ThemeWrapper = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);

export default ThemeWrapper;
