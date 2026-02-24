import { useMemo } from "react";
import { format, subDays, parseISO } from "date-fns";

interface Entry {
  date: string;
  sleep_hours: number | null;
}

interface SleepSparklineProps {
  entries: Entry[];
  goal?: number;
}

function sleepColor(value: number, goal: number): string {
  const ratio = value / goal;
  if (ratio >= 0.9) return "hsl(220 60% 50%)";    // good – blue
  if (ratio >= 0.7) return "hsl(200 50% 55%)";    // okay – light blue
  if (ratio >= 0.5) return "hsl(45 90% 52%)";     // low – amber
  return "hsl(0 72% 51%)";                         // poor – red
}

export default function SleepSparkline({ entries, goal = 8 }: SleepSparklineProps) {
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i);
      return format(d, "yyyy-MM-dd");
    });
  }, []);

  const byDate = useMemo(
    () => Object.fromEntries(entries.map((e) => [e.date, e])),
    [entries],
  );

  const points = days.map((date) => {
    const entry = byDate[date];
    return { date, value: entry?.sleep_hours ?? null };
  });

  const hasAnyData = points.some((p) => p.value !== null);
  if (!hasAnyData) return null;

  const W = 200;
  const H = 36;
  const PAD = 4;
  const MAX = Math.max(12, goal + 2);

  const plotPoints = points
    .map((p, i) => ({ ...p, x: i }))
    .filter((p): p is { date: string; value: number; x: number } => p.value !== null);

  const toSvgX = (i: number) => PAD + (i / 6) * (W - PAD * 2);
  const toSvgY = (v: number) => PAD + ((MAX - v) / MAX) * (H - PAD * 2);

  const linePoints = plotPoints
    .map((p) => `${toSvgX(p.x)},${toSvgY(p.value)}`)
    .join(" ");

  const avg = plotPoints.length
    ? plotPoints.reduce((s, p) => s + p.value, 0) / plotPoints.length
    : null;

  // Trend
  const firstHalf = plotPoints.filter((p) => p.x <= 3);
  const secondHalf = plotPoints.filter((p) => p.x > 3);
  const avgHalf = (arr: typeof plotPoints) =>
    arr.length ? arr.reduce((s, p) => s + p.value, 0) / arr.length : null;
  const f = avgHalf(firstHalf);
  const s = avgHalf(secondHalf);
  const trend =
    f !== null && s !== null && s - f > 0.5
      ? "↑"
      : f !== null && s !== null && f - s > 0.5
      ? "↓"
      : "→";
  const trendColor =
    trend === "↑"
      ? "hsl(220 50% 45%)"
      : trend === "↓"
      ? "hsl(0 65% 42%)"
      : "hsl(var(--muted-foreground))";

  return (
    <div className="rounded-xl bg-card shadow-soft px-4 py-3 flex items-center gap-3">
      <div className="flex-shrink-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
          Sleep · 7-day
        </p>
        <div className="flex items-baseline gap-1">
          <span
            className="text-xl font-bold leading-none"
            style={{ color: avg !== null ? sleepColor(avg, goal) : "hsl(var(--muted-foreground))" }}
          >
            {avg !== null ? avg.toFixed(1) : "—"}
          </span>
          <span className="text-[10px] text-muted-foreground">hrs</span>
          <span className="text-sm font-semibold ml-0.5" style={{ color: trendColor }}>
            {trend}
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 36 }}
          preserveAspectRatio="none"
        >
          {/* Goal line */}
          <line
            x1={PAD} y1={toSvgY(goal)} x2={W - PAD} y2={toSvgY(goal)}
            stroke="hsl(var(--border))" strokeWidth="0.8" strokeDasharray="3 3"
          />

          {/* Fill area */}
          {plotPoints.length >= 2 && (
            <polyline
              points={[
                `${toSvgX(plotPoints[0].x)},${H - PAD}`,
                ...plotPoints.map((p) => `${toSvgX(p.x)},${toSvgY(p.value)}`),
                `${toSvgX(plotPoints[plotPoints.length - 1].x)},${H - PAD}`,
              ].join(" ")}
              fill="hsl(220 60% 50% / 0.10)"
              stroke="none"
            />
          )}

          {/* Line */}
          {plotPoints.length >= 2 && (
            <polyline
              points={linePoints}
              fill="none"
              stroke="hsl(220 60% 50%)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Dots */}
          {plotPoints.map((p) => (
            <circle
              key={p.date}
              cx={toSvgX(p.x)}
              cy={toSvgY(p.value)}
              r="2.5"
              fill={sleepColor(p.value, goal)}
              stroke="hsl(var(--card))"
              strokeWidth="1"
            />
          ))}
        </svg>

        <div className="flex justify-between mt-0.5 px-0.5">
          {days.map((date) => {
            const hasData = byDate[date]?.sleep_hours != null;
            return (
              <span
                key={date}
                className="text-[8px] leading-none"
                style={{ color: hasData ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground) / 0.4)" }}
              >
                {format(parseISO(date), "EEE")[0]}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
