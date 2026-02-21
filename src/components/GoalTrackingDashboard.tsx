import { useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useTodayEntry, useEntriesInRange } from "@/hooks/useEntries";
import { useStreak } from "@/components/StreakBadge";
import { format, startOfWeek } from "date-fns";

interface RingProps {
  progress: number; // 0–1
  size?: number;
  strokeWidth?: number;
  color: string;
  bgColor: string;
  children: React.ReactNode;
}

const ProgressRing = ({ progress, size = 80, strokeWidth = 6, color, bgColor, children }: RingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const offset = circumference * (1 - clamped);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
};

const GoalTrackingDashboard = () => {
  const { data: profile } = useProfile();
  const { data: todayEntry } = useTodayEntry();
  const { streak } = useStreak();

  const today = new Date();
  const weekMonday = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const { data: weekEntries = [] } = useEntriesInRange(weekMonday, format(today, "yyyy-MM-dd"));

  const hydrationGoal = profile?.hydration_goal ?? 8;
  const hydrationCurrent = todayEntry?.water_glasses ?? 0;
  const hydrationProgress = hydrationGoal > 0 ? hydrationCurrent / hydrationGoal : 0;

  const logGoal = profile?.weekly_log_goal ?? 7;
  const logCurrent = weekEntries.length;
  const logProgress = logGoal > 0 ? logCurrent / logGoal : 0;

  const sleepTarget = 8;
  const sleepCurrent = todayEntry?.sleep_hours ?? 0;
  const sleepProgress = sleepTarget > 0 ? sleepCurrent / sleepTarget : 0;

  const rings = [
    {
      label: "Hydration",
      emoji: "💧",
      current: hydrationCurrent,
      goal: hydrationGoal,
      unit: "",
      progress: hydrationProgress,
      color: "hsl(210, 60%, 50%)",
      bgColor: "hsl(210, 60%, 92%)",
    },
    {
      label: "Log Streak",
      emoji: "🔥",
      current: streak,
      goal: null,
      unit: "d",
      progress: Math.min(streak / 7, 1),
      color: "hsl(25, 85%, 50%)",
      bgColor: "hsl(25, 85%, 92%)",
    },
    {
      label: "Weekly Logs",
      emoji: "📊",
      current: logCurrent,
      goal: logGoal,
      unit: "",
      progress: logProgress,
      color: "hsl(145, 45%, 45%)",
      bgColor: "hsl(145, 45%, 92%)",
    },
    {
      label: "Sleep",
      emoji: "🌙",
      current: sleepCurrent,
      goal: sleepTarget,
      unit: "h",
      progress: sleepProgress,
      color: "hsl(260, 50%, 55%)",
      bgColor: "hsl(260, 50%, 92%)",
    },
  ];

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Today's Goals
      </p>
      <div className="grid grid-cols-4 gap-2">
        {rings.map((r) => (
          <div key={r.label} className="flex flex-col items-center gap-1.5">
            <ProgressRing
              progress={r.progress}
              size={68}
              strokeWidth={5}
              color={r.color}
              bgColor={r.bgColor}
            >
              <span className="text-base leading-none">{r.emoji}</span>
              <span className="text-[11px] font-bold tabular-nums text-foreground leading-none mt-0.5">
                {r.current}{r.unit}
              </span>
            </ProgressRing>
            <span className="text-[10px] text-muted-foreground text-center leading-tight">
              {r.label}
            </span>
            {r.goal !== null && (
              <span className="text-[9px] text-muted-foreground/70 -mt-1">
                / {r.goal}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GoalTrackingDashboard;
