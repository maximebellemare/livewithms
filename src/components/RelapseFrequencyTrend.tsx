import { useMemo } from "react";
import { useRelapses } from "@/hooks/useRelapses";
import { TrendingUp } from "lucide-react";
import { parseISO, format, startOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

export default function RelapseFrequencyTrend() {
  const { data: relapses = [], isLoading } = useRelapses();

  const chartData = useMemo(() => {
    if (relapses.length === 0) return [];

    const dates = relapses.map((r) => parseISO(r.start_date));
    const earliest = dates.reduce((a, b) => (a < b ? a : b));
    const now = new Date();

    const months = eachMonthOfInterval({
      start: startOfMonth(earliest),
      end: startOfMonth(now),
    });

    const counts: Record<string, number> = {};
    relapses.forEach((r) => {
      const key = format(startOfMonth(parseISO(r.start_date)), "yyyy-MM");
      counts[key] = (counts[key] ?? 0) + 1;
    });

    const raw = months.map((m) => {
      const key = format(m, "yyyy-MM");
      return {
        month: format(m, "MMM yy"),
        count: counts[key] ?? 0,
      };
    });

    // 3-month moving average
    const WINDOW = 3;
    return raw.map((d, i) => {
      if (i < WINDOW - 1) return { ...d, avg: null };
      let sum = 0;
      for (let j = i - WINDOW + 1; j <= i; j++) sum += raw[j].count;
      return { ...d, avg: parseFloat((sum / WINDOW).toFixed(2)) };
    });
  }, [relapses]);

  if (isLoading || chartData.length === 0) return null;

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Relapse Frequency</span>
        <span className="ml-auto text-[10px] text-muted-foreground">monthly · 3-mo avg</span>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="freqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
                color: "hsl(var(--popover-foreground))",
              }}
              formatter={(value: number, name: string) => {
                if (name === "avg") return [`${value}`, "3-mo avg"];
                return [`${value} relapse${value !== 1 ? "s" : ""}`, "Count"];
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#freqGrad)"
              dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
