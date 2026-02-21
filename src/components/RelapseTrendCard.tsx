import { useMemo } from "react";
import { useRelapses } from "@/hooks/useRelapses";
import { format, subMonths, startOfMonth, eachMonthOfInterval } from "date-fns";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";

export default function RelapseTrendCard() {
  const { data: relapses = [], isLoading } = useRelapses();

  const stats = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: startOfMonth(subMonths(now, 5)),
      end: now,
    });

    const counts = months.map((m) => {
      const key = format(m, "yyyy-MM");
      return {
        label: format(m, "MMM"),
        count: relapses.filter((r) => r.start_date.startsWith(key)).length,
      };
    });

    const recent3 = counts.slice(-3).reduce((s, c) => s + c.count, 0);
    const older3 = counts.slice(0, 3).reduce((s, c) => s + c.count, 0);
    const diff = recent3 - older3;
    const direction: "up" | "down" | "flat" =
      diff > 0 ? "up" : diff < 0 ? "down" : "flat";

    const avgPerMonth = relapses.length > 0
      ? (counts.reduce((s, c) => s + c.count, 0) / counts.length).toFixed(1)
      : "0";

    return { counts, recent3, older3, diff, direction, avgPerMonth };
  }, [relapses]);

  if (isLoading || relapses.length === 0) return null;

  const maxCount = Math.max(...stats.counts.map((c) => c.count), 1);

  return (
    <div className="card-base">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Relapse Trend</span>
      </div>

      {/* Mini bar sparkline */}
      <div className="flex items-end gap-1.5 h-12 mb-3">
        {stats.counts.map((m) => (
          <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-sm transition-all"
              style={{
                height: `${Math.max((m.count / maxCount) * 100, 6)}%`,
                backgroundColor: m.count > 0
                  ? "hsl(var(--primary))"
                  : "hsl(var(--muted))",
                opacity: m.count > 0 ? 1 : 0.3,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mb-3">
        {stats.counts.map((m) => (
          <span key={m.label} className="flex-1 text-center text-[9px] text-muted-foreground">
            {m.label}
          </span>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
          <p className="text-lg font-bold text-foreground">{stats.avgPerMonth}</p>
          <p className="text-[10px] text-muted-foreground">Avg / month</p>
        </div>
        <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
          <div className="flex items-center justify-center gap-1">
            {stats.direction === "up" && (
              <TrendingUp className="h-4 w-4 text-destructive" />
            )}
            {stats.direction === "down" && (
              <TrendingDown className="h-4 w-4 text-emerald-500" />
            )}
            {stats.direction === "flat" && (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={`text-lg font-bold ${
              stats.direction === "up" ? "text-destructive" :
              stats.direction === "down" ? "text-emerald-500" :
              "text-foreground"
            }`}>
              {stats.direction === "flat"
                ? "Stable"
                : `${stats.direction === "down" ? "↓" : "↑"} ${Math.abs(stats.diff)}`}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">vs prior 3 mo</p>
        </div>
      </div>
    </div>
  );
}
