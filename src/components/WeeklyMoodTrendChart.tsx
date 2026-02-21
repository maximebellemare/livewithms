import { useMemo } from "react";
import { format, parseISO, startOfWeek, endOfWeek, eachWeekOfInterval, subDays } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, ReferenceLine, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Entry {
  date: string;
  mood: number | null;
  mood_tags?: string[] | null;
}

interface Props {
  entries: Entry[];
}

const TAG_COLORS: Record<string, string> = {
  Happy: "hsl(145 45% 45%)",
  Calm: "hsl(210 60% 50%)",
  Strong: "hsl(25 85% 50%)",
  Frustrated: "hsl(0 72% 51%)",
  Sad: "hsl(270 50% 55%)",
  Anxious: "hsl(350 65% 55%)",
  Tired: "hsl(35 80% 50%)",
  Low: "hsl(220 40% 50%)",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-card text-xs">
      <p className="font-semibold text-foreground mb-1">{d.label}</p>
      <p className="text-muted-foreground">
        Avg mood: <span className="font-bold text-foreground">{d.avg !== null ? d.avg.toFixed(1) : "—"}</span>/10
      </p>
      <p className="text-muted-foreground">
        {d.count} {d.count === 1 ? "entry" : "entries"}
      </p>
      {d.topTags?.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {d.topTags.map((t: string) => (
            <span key={t} className="rounded-full px-1.5 py-0.5 text-[9px] font-medium bg-muted text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const WeeklyMoodTrendChart = ({ entries }: Props) => {
  const data = useMemo(() => {
    const today = new Date();
    const start = subDays(today, 29);
    const weeks = eachWeekOfInterval({ start, end: today }, { weekStartsOn: 1 });

    return weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekEntries = entries.filter((e) => {
        const d = e.date;
        const ws = format(weekStart, "yyyy-MM-dd");
        const we = format(weekEnd, "yyyy-MM-dd");
        return d >= ws && d <= we;
      });

      const moods = weekEntries
        .map((e) => e.mood)
        .filter((v): v is number => v !== null);

      const avg = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null;

      // Count mood tags
      const tagCounts: Record<string, number> = {};
      weekEntries.forEach((e) => {
        e.mood_tags?.forEach((t) => {
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
      });
      const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([t]) => t);

      return {
        label: `${format(weekStart, "MMM d")}`,
        avg,
        count: moods.length,
        topTags,
      };
    });
  }, [entries]);

  const overallAvg = useMemo(() => {
    const vals = data.filter((d) => d.avg !== null).map((d) => d.avg!);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }, [data]);

  // Week-over-week trend
  const wowTrend = useMemo(() => {
    const withData = data.filter((d) => d.avg !== null);
    if (withData.length < 2) return "flat" as const;
    const last = withData[withData.length - 1].avg!;
    const prev = withData[withData.length - 2].avg!;
    if (last - prev > 0.5) return "up" as const;
    if (prev - last > 0.5) return "down" as const;
    return "flat" as const;
  }, [data]);

  const hasData = data.some((d) => d.avg !== null);

  if (!hasData) return null;

  return (
    <div className="rounded-xl bg-card shadow-soft overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-1">
        <div>
          <p className="text-sm font-semibold text-foreground">😊 Weekly Mood Trend</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">30-day mood patterns by week</p>
        </div>
        <div className="flex items-center gap-1.5">
          {overallAvg !== null && (
            <span className="text-lg font-bold text-foreground">{overallAvg.toFixed(1)}</span>
          )}
          <span
            className="inline-flex items-center gap-0.5 text-[10px] font-medium rounded-full px-1.5 py-0.5"
            style={{
              background: wowTrend === "up" ? "hsl(145 45% 45% / 0.12)" :
                          wowTrend === "down" ? "hsl(0 72% 51% / 0.1)" :
                          "hsl(var(--muted))",
              color: wowTrend === "up" ? "hsl(145 45% 35%)" :
                     wowTrend === "down" ? "hsl(0 72% 45%)" :
                     "hsl(var(--muted-foreground))",
            }}
          >
            {wowTrend === "up" ? <TrendingUp className="h-2.5 w-2.5" /> :
             wowTrend === "down" ? <TrendingDown className="h-2.5 w-2.5" /> :
             <Minus className="h-2.5 w-2.5" />}
            {wowTrend === "flat" ? "Stable" : wowTrend === "up" ? "Rising" : "Dipping"}
          </span>
        </div>
      </div>

      <div className="px-4 pb-4 pt-2">
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                ticks={[0, 2, 4, 6, 8, 10]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
              {overallAvg !== null && (
                <ReferenceLine
                  y={overallAvg}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}
              <Bar dataKey="avg" radius={[6, 6, 0, 0]} maxBarSize={40}>
                {data.map((entry, i) => {
                  const val = entry.avg;
                  const color = val === null ? "hsl(var(--muted))" :
                    val >= 7 ? "hsl(145 45% 45%)" :
                    val >= 4 ? "hsl(25 85% 50%)" :
                    "hsl(0 72% 51%)";
                  return <Cell key={i} fill={color} opacity={val === null ? 0.3 : 0.85} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "hsl(145 45% 45%)" }} />
            Good (7+)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "hsl(25 85% 50%)" }} />
            Moderate (4–6)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "hsl(0 72% 51%)" }} />
            Low (&lt;4)
          </span>
        </div>

        {/* Mood tag frequency */}
        {(() => {
          const allTags: Record<string, number> = {};
          entries.forEach((e) => {
            e.mood_tags?.forEach((t) => {
              allTags[t] = (allTags[t] || 0) + 1;
            });
          });
          const sorted = Object.entries(allTags).sort((a, b) => b[1] - a[1]).slice(0, 5);
          if (sorted.length === 0) return null;
          const max = sorted[0][1];

          return (
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Top mood tags (30 days)
              </p>
              <div className="space-y-1.5">
                {sorted.map(([tag, count]) => (
                  <div key={tag} className="flex items-center gap-2">
                    <span className="text-xs w-20 truncate text-foreground font-medium">{tag}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(count / max) * 100}%`,
                          backgroundColor: TAG_COLORS[tag] || "hsl(var(--primary))",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-6 text-right">{count}×</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        <p className="mt-3 text-[9px] text-muted-foreground text-center">
          Dashed line = 30-day average · Bars colored by mood level
        </p>
      </div>
    </div>
  );
};

export default WeeklyMoodTrendChart;
