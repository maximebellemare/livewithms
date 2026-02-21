import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

const iconVariants = {
  initial: { scale: 0.5, rotate: -90, opacity: 0 },
  animate: { scale: 1, rotate: 0, opacity: 1 },
  exit: { scale: 0.5, rotate: 90, opacity: 0 },
};

const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="flex gap-2">
      {themes.map(({ value, label, icon: Icon }) => {
        const isActive = theme === value;
        return (
          <motion.button
            key={value}
            onClick={() => setTheme(value)}
            aria-pressed={isActive}
            layout
            whileTap={{ scale: 0.92 }}
            className={`relative flex flex-1 flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-medium transition-colors duration-300 ${
              isActive
                ? "border-primary text-accent-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-secondary"
            }`}
          >
            {/* Animated background pill */}
            {isActive && (
              <motion.div
                layoutId="theme-pill"
                className="absolute inset-0 rounded-lg bg-accent"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}

            <span className="relative z-10">
              <AnimatePresence mode="wait">
                <motion.span
                  key={isActive ? `${value}-active` : value}
                  variants={iconVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="block"
                >
                  <Icon
                    className={`h-5 w-5 transition-colors duration-300 ${
                      isActive
                        ? value === "dark"
                          ? "text-yellow-400"
                          : value === "light"
                          ? "text-amber-500"
                          : "text-primary"
                        : ""
                    }`}
                  />
                </motion.span>
              </AnimatePresence>
            </span>

            <span className="relative z-10">{label}</span>

            {/* Glow ring on active */}
            {isActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -inset-px rounded-lg ring-2 ring-primary/20"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
