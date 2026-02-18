import { useTheme } from "next-themes";
import { useEffect, useState, ReactNode } from "react";

const ThemeWrapper = ({ children }: { children: ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Apply theme class directly to document.documentElement so Tailwind dark: classes work
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [resolvedTheme, mounted]);

  return <>{children}</>;
};

export default ThemeWrapper;
