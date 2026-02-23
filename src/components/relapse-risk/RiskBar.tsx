import { useEffect, useState, useRef } from "react";
import { RiskLevel } from "./types";

const BAR_COLORS: Record<RiskLevel, string> = {
  low: "bg-emerald-500",
  moderate: "bg-amber-500",
  elevated: "bg-orange-500",
  high: "bg-red-500",
};

const TEXT_COLORS: Record<RiskLevel, string> = {
  low: "text-emerald-600 dark:text-emerald-400",
  moderate: "text-amber-600 dark:text-amber-400",
  elevated: "text-orange-600 dark:text-orange-400",
  high: "text-red-600 dark:text-red-400",
};

interface RiskBarProps {
  level: RiskLevel;
  score: number;
}

export default function RiskBar({ level, score }: RiskBarProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (animated.current) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          observer.disconnect();
          const duration = 600;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setDisplayScore(Math.round(eased * score));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [score]);

  return (
    <div ref={ref} className="flex items-center gap-2 mb-2">
      <div className="h-1.5 flex-1 rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${BAR_COLORS[level]} transition-all duration-500`}
          style={{ width: `${Math.max(5, displayScore)}%` }}
        />
      </div>
      <span className={`text-[11px] font-bold tabular-nums ${TEXT_COLORS[level]}${level === "elevated" || level === "high" ? " animate-pulse" : ""}`}>
        {displayScore}/100
      </span>
    </div>
  );
}
