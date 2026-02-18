import { useMemo } from "react";
import { Flame } from "lucide-react";
import { format, subDays } from "date-fns";
import { useEntries } from "@/hooks/useEntries";

const StreakBadge = () => {
  const { data: entries = [], isLoading } = useEntries();

  const { streak, isAliveToday } = useMemo(() => {
    if (entries.length === 0) return { streak: 0, isAliveToday: false };

    const logged = new Set(entries.map((e) => e.date));
    const today = format(new Date(), "yyyy-MM-dd");
    const todayLogged = logged.has(today);

    // Walk backwards from today (or yesterday if today not yet logged)
    let count = 0;
    let cursor = todayLogged ? 0 : 1; // start at today or yesterday

    while (true) {
      const dateStr = format(subDays(new Date(), cursor), "yyyy-MM-dd");
      if (logged.has(dateStr)) {
        count++;
        cursor++;
      } else {
        break;
      }
    }

    return { streak: count, isAliveToday: todayLogged };
  }, [entries]);

  if (isLoading || streak === 0) return null;

  const isHot = streak >= 7;
  const isMid = streak >= 3;

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
      {/* Flame icon — animated when streak is active today */}
      <span
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
          isHot
            ? "bg-orange-100 dark:bg-orange-900/60"
            : isMid
            ? "bg-amber-100 dark:bg-amber-900/60"
            : "bg-muted"
        }`}
      >
        <Flame
          className={`h-5 w-5 ${
            isHot
              ? "text-orange-500 dark:text-orange-400"
              : isMid
              ? "text-amber-500 dark:text-amber-400"
              : "text-muted-foreground"
          } ${isAliveToday ? "drop-shadow-[0_0_4px_rgba(249,115,22,0.6)]" : ""}`}
          fill={isAliveToday ? "currentColor" : "none"}
        />
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold leading-tight ${
          isHot ? "text-orange-700 dark:text-orange-300" :
          isMid ? "text-amber-700 dark:text-amber-300" :
          "text-foreground"
        }`}>
          {streak} day{streak !== 1 ? "s" : ""} in a row
          {isHot ? " 🔥" : isMid ? " ⚡" : ""}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
          {isAliveToday
            ? streak >= 7
              ? "You're on fire — incredible consistency!"
              : streak >= 3
              ? "Great habit forming — keep it up!"
              : "Nice start — come back tomorrow!"
            : "Log today to keep your streak alive!"}
        </p>
      </div>

      {/* Streak number badge */}
      <div className={`flex-shrink-0 flex items-center justify-center rounded-full h-9 w-9 text-sm font-extrabold tabular-nums ${
        isHot
          ? "bg-orange-500 dark:bg-orange-600 text-white"
          : isMid
          ? "bg-amber-500 dark:bg-amber-600 text-white"
          : "bg-primary text-primary-foreground"
      }`}>
        {streak}
      </div>
    </div>
  );
};

export default StreakBadge;
