import { useState, useRef, useCallback, forwardRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

const PULL_THRESHOLD = 64;
const MAX_PULL = 100;

const PullToRefresh = forwardRef<HTMLDivElement, PullToRefreshProps>(({ onRefresh, children, className }, _ref) => {
  const [refreshing, setRefreshing] = useState(false);
  const y = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);

  const indicatorOpacity = useTransform(y, [0, PULL_THRESHOLD * 0.5, PULL_THRESHOLD], [0, 0.5, 1]);
  const indicatorScale = useTransform(y, [0, PULL_THRESHOLD], [0.6, 1]);
  const indicatorRotate = useTransform(y, [0, MAX_PULL], [0, 180]);
  const thresholdReached = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    const el = containerRef.current;
    if (el && el.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, [refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshing) return;
    const delta = Math.max(0, e.touches[0].clientY - startY.current);
    const dampened = Math.min(MAX_PULL, delta * 0.45);
    y.set(dampened);

    // Haptic-style bounce when crossing threshold
    if (dampened >= PULL_THRESHOLD && !thresholdReached.current) {
      thresholdReached.current = true;
      animate(y, dampened + 6, { type: "spring", stiffness: 600, damping: 12, mass: 0.3 });
      navigator.vibrate?.(10);
    } else if (dampened < PULL_THRESHOLD * 0.8) {
      thresholdReached.current = false;
    }
  }, [refreshing, y]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current || refreshing) return;
    pulling.current = false;
    thresholdReached.current = false;

    if (y.get() >= PULL_THRESHOLD) {
      setRefreshing(true);
      animate(y, PULL_THRESHOLD * 0.6, { type: "spring", stiffness: 300, damping: 30 });
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
      }
    } else {
      animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  }, [refreshing, y, onRefresh]);

  return (
    <div
      ref={containerRef}
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        className="flex items-center justify-center overflow-hidden"
        style={{ height: y }}
      >
        <motion.div
          style={{ opacity: indicatorOpacity, scale: indicatorScale }}
          className="flex items-center justify-center"
        >
          {refreshing ? (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          ) : (
            <motion.div style={{ rotate: indicatorRotate }}>
              <svg
                className="h-5 w-5 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="7 13 12 18 17 13" />
                <line x1="12" y1="6" x2="12" y2="18" />
              </svg>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {children}
    </div>
  );
});

PullToRefresh.displayName = "PullToRefresh";

export default PullToRefresh;
