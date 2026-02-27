import { useMemo } from "react";
import { Target, CheckCircle2, AlertCircle } from "lucide-react";

interface DayData {
  date: string;
  total_spoons: number;
  used: number;
}

export default function WeeklyConsistency({ history }: { history: DayData[] }) {
  const stats = useMemo(() => {
    if (history.length < 3) return null;

    const withinBudget = history.filter((d) => d.used <= d.total_spoons).length;
    const avgUsed = Math.round(history.reduce((s, d) => s + d.used, 0) / history.length);
    const avgBudget = Math.round(history.reduce((s, d) => s + d.total_spoons, 0) / history.length);
    const consistency = Math.round((withinBudget / history.length) * 100);
    const daysLogged = history.length;

    return { withinBudget, avgUsed, avgBudget, consistency, daysLogged };
  }, [history]);

  if (!stats) return null;

  const isGood = stats.consistency >= 70;

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
      <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-1.5">
        <Target className="h-4 w-4 text-primary" />
        Weekly Summary
      </h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">{stats.daysLogged}</p>
          <p className="text-[10px] text-muted-foreground">Days tracked</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">{stats.avgUsed}</p>
          <p className="text-[10px] text-muted-foreground">Avg spoons/day</p>
        </div>
        <div className="text-center">
          <p className={`text-xl font-bold ${isGood ? "text-green-500" : "text-yellow-500"}`}>
            {stats.consistency}%
          </p>
          <p className="text-[10px] text-muted-foreground">Within budget</p>
        </div>
      </div>
      <div className="flex items-start gap-2 pt-1">
        {isGood ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Great pacing! You stayed within budget {stats.withinBudget} of {stats.daysLogged} days.
            </p>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              You exceeded your budget on {stats.daysLogged - stats.withinBudget} days. Consider increasing your budget or planning fewer activities.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
