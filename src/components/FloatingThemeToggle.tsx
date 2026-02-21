import { useTheme } from "next-themes";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const FloatingThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const { scrollY } = useScroll();

  useEffect(() => setMounted(true), []);

  useMotionValueEvent(scrollY, "change", (y) => {
    const delta = y - lastY.current;
    if (Math.abs(delta) > 5) {
      setVisible(delta < 0 || y < 20);
    }
    lastY.current = y;
  });

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";
  const toggle = () => setTheme(isDark ? "light" : "dark");

  return (
    <motion.button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: visible ? 1 : 0.6, opacity: visible ? 1 : 0, y: visible ? 0 : -20 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.88 }}
      style={{ pointerEvents: visible ? "auto" : "none" }}
      className="fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-elevated backdrop-blur-sm transition-colors"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ rotate: -90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <Moon className="h-5 w-5 text-yellow-400" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: 90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -90, scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <Sun className="h-5 w-5 text-amber-500" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default FloatingThemeToggle;
