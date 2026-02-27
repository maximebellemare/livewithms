import { useMemo } from "react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine, Tooltip } from "recharts";
import { TrendingUp } from "lucide-react";

interface DayData {
  date: string;
  total_spoons: number;
  used: number;
  remaining: number;
}

export default function WeeklyTrendsChart({ history }: { history: DayData[] }) {
  const chartData = useMemo(() => {
    return history.map((d) => ({
      day: format(new Date(d.date + "T12:00:00"), "EEE"),
      budget: d.total_spoons,
      used: d.used,
      remaining: d.remaining,
      over: d.used > d.total_spoons,
    }));
  }, [history]);

  const avgUsed = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.round(chartData.reduce((s, d) => s + d.used, 0) / chartData.length);
  }, [chartData]);

  const avgBudget = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.round(chartData.reduce((s, d) => s + d.budget, 0) / chartData.length);
  }, [chartData]);

  if (history.length < 2) return null;

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-primary" />
          Weekly Energy Trends
        </h3>
        <span className="text-[11px] text-muted-foreground">
          Avg: {avgUsed}/{avgBudget} spoons
        </span>
      </div>

      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%">
            <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis hide domain={[0, "dataMax + 2"]} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-lg bg-popover border border-border px-3 py-2 shadow-md text-xs">
                    <p className="font-semibold text-foreground">{d.day}</p>
                    <p className="text-muted-foreground">Used: {d.used} / {d.budget} spoons</p>
                  </div>
                );
              }}
            />
            <ReferenceLine y={avgBudget} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.3} />
            <Bar dataKey="used" radius={[4, 4, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.over ? "hsl(0 72% 51%)" : "hsl(var(--primary))"}
                  opacity={0.85}
                />
              ))}
            </Bar>
            <Bar dataKey="budget" radius={[4, 4, 0, 0]} fill="hsl(var(--muted))" opacity={0.3} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
