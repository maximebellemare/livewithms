import { useMemo } from "react";
import { format, subMonths, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ComposedChart, Bar, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { useRelapses } from "@/hooks/useRelapses";
import { TrendingUp } from "lucide-react";

const RelapseMonthlyTrendChart = () => {
  const { data: relapses } = useRelapses();

  const chartData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(now, 11 - i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const count = relapses?.filter((r) =>
        isWithinInterval(parseISO(r.start_date), { start, end })
      ).length ?? 0;
      return {
        month: format(date, "MMM"),
        fullMonth: format(date, "MMMM yyyy"),
        count,
      };
    });
    return months;
  }, [relapses]);

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);
  const totalYear = chartData.reduce((sum, d) => sum + d.count, 0);

  if (!relapses || relapses.length === 0) return null;

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Monthly Frequency</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {totalYear} relapse{totalYear !== 1 ? "s" : ""} · past 12 months
        </span>
      </div>

      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} barCategoryGap="20%">
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={16}
              domain={[0, Math.max(maxCount, 2)]}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--accent) / 0.3)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-lg bg-popover border border-border px-3 py-2 shadow-md">
                    <p className="text-xs font-medium text-foreground">{d.fullMonth}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.count} relapse{d.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={24}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.count > 0 ? "hsl(var(--primary))" : "hsl(var(--muted) / 0.5)"}
                />
              ))}
            </Bar>
            <Line
              dataKey="count"
              type="monotone"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              strokeOpacity={0.6}
              dot={false}
              activeDot={false}
              strokeDasharray="4 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RelapseMonthlyTrendChart;
