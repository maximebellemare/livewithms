import { CalendarCheck } from "lucide-react";
import { useWeekStreak } from "@/hooks/useWeekStreak";

const WeekStreakBadge = () => {
  const { weekStreak, goal, isLoading } = useWeekStreak();

  if (isLoading || weekStreak === 0) return null;

  const isHot = weekStreak >= 3;
  const isMid = weekStreak >= 2;

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl px-4 py-3 shadow-soft animate-fade-in border ${
        isHot
          ? "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800"
          : isMid
          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
          : "bg-card border-border"
      }`}
    >
      <span
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
          isHot
            ? "bg-orange-100 dark:bg-orange-900/60"
            : isMid
            ? "bg-amber-100 dark:bg-amber-900/60"
            : "bg-muted"
        }`}
      >
        <CalendarCheck
          className={`h-5 w-5 ${
            isHot
              ? "text-orange-500 dark:text-orange-400"
              : isMid
              ? "text-amber-500 dark:text-amber-400"
              : "text-muted-foreground"
          }`}
        />
      </span>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-bold leading-tight ${
            isHot
              ? "text-orange-700 dark:text-orange-300"
              : isMid
              ? "text-amber-700 dark:text-amber-300"
              : "text-foreground"
          }`}
        >
          {weekStreak} week{weekStreak !== 1 ? "s" : ""} in a row
          {isHot ? " 🔥" : isMid ? " ⚡" : ""}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
          {isHot
            ? `Hitting your ${goal}-day goal every week — outstanding!`
            : isMid
            ? `${goal}-day goal met 2 weeks running — keep it up!`
            : `You hit your ${goal}-day goal this week!`}
        </p>
      </div>

      <div
        className={`flex-shrink-0 flex items-center justify-center rounded-full h-9 w-9 text-sm font-extrabold tabular-nums ${
          isHot
            ? "bg-orange-500 dark:bg-orange-600 text-white"
            : isMid
            ? "bg-amber-500 dark:bg-amber-600 text-white"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {weekStreak}
      </div>
    </div>
  );
};

export default WeekStreakBadge;
