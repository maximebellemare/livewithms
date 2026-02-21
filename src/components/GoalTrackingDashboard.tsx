import { useMemo, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useProfile } from "@/hooks/useProfile";
import { useTodayEntry, useEntriesInRange } from "@/hooks/useEntries";
import { useStreak } from "@/components/StreakBadge";
import { format, startOfWeek } from "date-fns";

interface RingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  bgColor: string;
  complete?: boolean;
  children: React.ReactNode;
}

const ProgressRing = ({ progress, size = 80, strokeWidth = 6, color, bgColor, complete, children }: RingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const offset = circumference * (1 - clamped);

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      animate={complete ? { scale: [1, 1.12, 1] } : {}}
      transition={complete ? { duration: 0.5, ease: "easeOut" } : {}}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={bgColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={complete ? strokeWidth + 1 : strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
          style={complete ? { filter: `drop-shadow(0 0 4px ${color})` } : {}}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </motion.div>
  );
};

const GoalTrackingDashboard = () => {
  const { data: profile } = useProfile();
  const { data: todayEntry } = useTodayEntry();
  const { streak } = useStreak();
  const celebratedRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const weekMonday = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const { data: weekEntries = [] } = useEntriesInRange(weekMonday, format(today, "yyyy-MM-dd"));

  const hydrationGoal = profile?.hydration_goal ?? 8;
  const hydrationCurrent = todayEntry?.water_glasses ?? 0;
  const hydrationProgress = hydrationGoal > 0 ? hydrationCurrent / hydrationGoal : 0;

  const logGoal = profile?.weekly_log_goal ?? 7;
  const logCurrent = weekEntries.length;
  const logProgress = logGoal > 0 ? logCurrent / logGoal : 0;

  const sleepTarget = (profile as any)?.sleep_goal ?? 8;
  const sleepCurrent = todayEntry?.sleep_hours ?? 0;
  const sleepProgress = sleepTarget > 0 ? sleepCurrent / sleepTarget : 0;

  const rings = useMemo(() => [
    { key: "hydration", label: "Hydration", emoji: "💧", current: hydrationCurrent, goal: hydrationGoal, unit: "", progress: hydrationProgress, color: "hsl(210, 60%, 50%)", bgColor: "hsl(210, 60%, 92%)" },
    { key: "streak", label: "Log Streak", emoji: "🔥", current: streak, goal: null as number | null, unit: "d", progress: Math.min(streak / 7, 1), color: "hsl(25, 85%, 50%)", bgColor: "hsl(25, 85%, 92%)" },
    { key: "weekly", label: "Weekly Logs", emoji: "📊", current: logCurrent, goal: logGoal, unit: "", progress: logProgress, color: "hsl(145, 45%, 45%)", bgColor: "hsl(145, 45%, 92%)" },
    { key: "sleep", label: "Sleep", emoji: "🌙", current: sleepCurrent, goal: sleepTarget, unit: "h", progress: sleepProgress, color: "hsl(260, 50%, 55%)", bgColor: "hsl(260, 50%, 92%)" },
  ], [hydrationCurrent, hydrationGoal, hydrationProgress, streak, logCurrent, logGoal, logProgress, sleepCurrent, sleepTarget, sleepProgress]);

  const fireConfetti = useCallback((index: number) => {
    const el = containerRef.current;
    if (!el) return;
    const ringEls = el.querySelectorAll("[data-ring]");
    const ringEl = ringEls[index];
    if (!ringEl) return;
    const rect = ringEl.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({
      particleCount: 40,
      spread: 50,
      startVelocity: 20,
      gravity: 0.8,
      scalar: 0.7,
      origin: { x, y },
      colors: ["#E8751A", "#FFB347", "#4CAF50", "#42A5F5", "#AB47BC"],
      disableForReducedMotion: true,
    });
  }, []);

  useEffect(() => {
    rings.forEach((r, i) => {
      if (r.progress >= 1 && !celebratedRef.current.has(r.key)) {
        celebratedRef.current.add(r.key);
        // Small delay so the ring animation plays first
        setTimeout(() => fireConfetti(i), 600);
      }
    });
  }, [rings, fireConfetti]);

  return (
    <div ref={containerRef} className="card-base space-y-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Today's Goals
      </p>
      <div className="grid grid-cols-4 gap-2">
        {rings.map((r) => {
          const complete = r.progress >= 1;
          return (
            <div key={r.key} data-ring className="flex flex-col items-center gap-1.5">
              <ProgressRing
                progress={r.progress}
                size={68}
                strokeWidth={5}
                color={r.color}
                bgColor={r.bgColor}
                complete={complete}
              >
                <span className="text-base leading-none">{r.emoji}</span>
                <span className={`text-[11px] font-bold tabular-nums leading-none mt-0.5 ${complete ? "text-primary" : "text-foreground"}`}>
                  {r.current}{r.unit}
                </span>
              </ProgressRing>
              <span className={`text-[10px] text-center leading-tight ${complete ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                {complete ? "✓ " : ""}{r.label}
              </span>
              {r.goal !== null && (
                <span className="text-[9px] text-muted-foreground/70 -mt-1">
                  / {r.goal}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalTrackingDashboard;
