import { useMemo } from "react";
import { useRelapses } from "@/hooks/useRelapses";
import { differenceInDays, parseISO } from "date-fns";
import { Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function RelapseFreeStreakCompact() {
  const { data: relapses = [], isLoading } = useRelapses();
  const navigate = useNavigate();

  const { streakDays, hasOngoing } = useMemo(() => {
    if (relapses.length === 0) return { streakDays: null, hasOngoing: false };

    const today = new Date();
    const ongoing = relapses.some((r) => !r.is_recovered);
    const resolved = relapses.filter((r) => r.is_recovered && r.end_date);

    let currentStreak = 0;
    if (!ongoing && resolved.length > 0) {
      const lastEnd = resolved
        .map((r) => parseISO(r.end_date!))
        .sort((a, b) => b.getTime() - a.getTime())[0];
      currentStreak = differenceInDays(today, lastEnd);
    }

    return { streakDays: currentStreak, hasOngoing: ongoing };
  }, [relapses]);

  if (isLoading || relapses.length === 0) return null;

  const emoji =
    hasOngoing ? "💛" :
    streakDays! >= 90 ? "🏆" :
    streakDays! >= 30 ? "🌟" :
    streakDays! >= 7 ? "✨" : "🛡️";

  return (
    <button
      onClick={() => navigate("/insights")}
      className="w-full rounded-xl bg-card p-3 shadow-soft flex items-center gap-3 text-left transition-all hover:bg-secondary active:scale-[0.98]"
    >
      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
        <Shield className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">Relapse-Free Streak</p>
        {hasOngoing ? (
          <p className="text-[10px] text-muted-foreground">Active relapse · tap for details</p>
        ) : (
          <p className="text-[10px] text-muted-foreground">
            {streakDays} day{streakDays !== 1 ? "s" : ""} strong · tap for details
          </p>
        )}
      </div>
      <span className="text-xl">{emoji}</span>
    </button>
  );
}
