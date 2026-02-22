import { useMemo } from "react";
import { Flame, Snowflake } from "lucide-react";
import { format, subDays, startOfWeek, differenceInDays } from "date-fns";
import { useEntries } from "@/hooks/useEntries";
import { useProfile } from "@/hooks/useProfile";

/* Shared hook so TodayPage can also read the streak */
export const useStreak = () => {
  const { data: entries = [], isLoading: entriesLoading } = useEntries();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const result = useMemo(() => {
    if (entries.length === 0) return { streak: 0, isAliveToday: false, frozeToday: false, freezesRemaining: 0 };

    const logged = new Set(entries.map((e) => e.date));
    const today = format(new Date(), "yyyy-MM-dd");
    const todayLogged = logged.has(today);
    const freezeEnabled = profile?.streak_freeze_enabled ?? false;

    let count = 0;
    let cursor = todayLogged ? 0 : 1;
    let freezeUsedThisWeek = false;
    let frozeToday = false;

    while (true) {
      const dateStr = format(subDays(new Date(), cursor), "yyyy-MM-dd");
      if (logged.has(dateStr)) {
        count++;
        cursor++;
      } else if (freezeEnabled) {
        const missedDate = subDays(new Date(), cursor);
        const weekKey = format(startOfWeek(missedDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
        const currentWeekKey = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

        if (weekKey !== currentWeekKey) freezeUsedThisWeek = false;

        if (!freezeUsedThisWeek) {
          const dayBefore = format(subDays(new Date(), cursor + 1), "yyyy-MM-dd");
          if (logged.has(dayBefore)) {
            freezeUsedThisWeek = true;
            if (cursor === 1 && !todayLogged) frozeToday = true;
            cursor++;
            continue;
          }
        }
        break;
      } else {
        break;
      }
    }

    const freezesRemaining = freezeEnabled ? (freezeUsedThisWeek ? 0 : 1) : 0;

    return { streak: count, isAliveToday: todayLogged, frozeToday, freezesRemaining };
  }, [entries, profile]);

  return { ...result, isLoading: entriesLoading || profileLoading };
};

/* ── Badge component ─────────────────────────────────────── */
const StreakBadge = () => {
  const { streak, isAliveToday, frozeToday, freezesRemaining, isLoading } = useStreak();

  if (isLoading || streak === 0) return null;
  const freezeEnabled = freezesRemaining > 0 || frozeToday;

  const isHot = streak >= 7;
  const isMid = streak >= 3;

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl px-4 py-3 shadow-soft animate-fade-in border transition-all duration-200 hover:shadow-card hover:-translate-y-0.5 ${
        isHot
          ? "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800"
          : isMid
          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
          : "bg-card border-border"
      }`}
    >
      <span
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
          isHot ? "bg-orange-100 dark:bg-orange-900/60"
          : isMid ? "bg-amber-100 dark:bg-amber-900/60"
          : "bg-muted"
        }`}
      >
        <Flame
          className={`h-5 w-5 ${
            isHot ? "text-orange-500 dark:text-orange-400"
            : isMid ? "text-amber-500 dark:text-amber-400"
            : "text-muted-foreground"
          } ${isAliveToday ? "drop-shadow-[0_0_4px_rgba(249,115,22,0.6)]" : ""}`}
          fill={isAliveToday ? "currentColor" : "none"}
        />
      </span>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold leading-tight ${
          isHot ? "text-orange-700 dark:text-orange-300"
          : isMid ? "text-amber-700 dark:text-amber-300"
          : "text-foreground"
        }`}>
          {streak} day{streak !== 1 ? "s" : ""} in a row
          {isHot ? " 🔥" : isMid ? " ⚡" : ""}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
          {frozeToday
            ? <span className="inline-flex items-center gap-1">
                <Snowflake className="h-3 w-3 text-sky-500" />
                Streak freeze active — log today to stay strong!
              </span>
            : isAliveToday
              ? streak >= 7 ? "You're on fire — incredible consistency!"
                : streak >= 3 ? "Great habit forming — keep it up!"
                : "Nice start — come back tomorrow!"
              : "Log today to keep your streak alive!"}
        </p>
        {freezeEnabled && (
          <div className="flex items-center gap-1 mt-1">
            <Snowflake className={`h-3 w-3 ${freezesRemaining > 0 ? "text-sky-400" : "text-muted-foreground/50"}`} />
            <span className="text-[10px] text-muted-foreground">
              {freezesRemaining > 0 ? "1 freeze available this week" : "Freeze used this week"}
            </span>
          </div>
        )}
      </div>

      <div className={`flex-shrink-0 flex items-center justify-center rounded-full h-9 w-9 text-sm font-extrabold tabular-nums ${
        isHot ? "bg-orange-500 dark:bg-orange-600 text-white"
        : isMid ? "bg-amber-500 dark:bg-amber-600 text-white"
        : "bg-primary text-primary-foreground"
      }`}>
        {streak}
      </div>
    </div>
  );
};

export default StreakBadge;
