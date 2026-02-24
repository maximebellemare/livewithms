import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays, parseISO } from "date-fns";
import { ChevronRight } from "lucide-react";

interface Entry {
  date: string;
  mood: number | null;
}

interface MoodSparklineProps {
  entries: Entry[];
}

/** Colour for a 0-10 mood value (higher = better) */
function moodColor(value: number): string {
  const norm = value / 10;
  if (norm >= 0.7) return "hsl(145 50% 42%)";   // emerald
  if (norm >= 0.5) return "hsl(145 40% 58%)";   // light green
  if (norm >= 0.35) return "hsl(45 90% 52%)";   // amber
  if (norm >= 0.2) return "hsl(25 85% 50%)";    // orange
  return "hsl(0 72% 51%)";                       // red
}

export default function MoodSparkline({ entries }: MoodSparklineProps) {
  const navigate = useNavigate();
  const days = useMemo(() => {
    const today = new Date();
    // Last 7 days ending yesterday (today's value is being entered now)
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
    return { date, value: entry?.mood ?? null };
  });

  const hasAnyData = points.some((p) => p.value !== null);
  if (!hasAnyData) return null;

  // SVG sparkline dimensions
  const W = 200;
  const H = 36;
  const PAD = 4;

  // Only plot days with data
  const plotPoints = points
    .map((p, i) => ({ ...p, x: i }))
    .filter((p): p is { date: string; value: number; x: number } => p.value !== null);

  // Build SVG polyline points
  const toSvgX = (i: number) => PAD + (i / 6) * (W - PAD * 2);
  const toSvgY = (v: number) => PAD + ((10 - v) / 10) * (H - PAD * 2);

  const linePoints = plotPoints
    .map((p) => `${toSvgX(p.x)},${toSvgY(p.value)}`)
    .join(" ");

  // Latest mood value for the summary label
  const latest = [...plotPoints].reverse().find(Boolean);
  const avg = plotPoints.length
    ? plotPoints.reduce((s, p) => s + p.value, 0) / plotPoints.length
    : null;

  // Trend: compare first half vs second half
  const firstHalf = plotPoints.filter((p) => p.x <= 3);
  const secondHalf = plotPoints.filter((p) => p.x > 3);
  const avgHalf = (arr: typeof plotPoints) =>
    arr.length ? arr.reduce((s, p) => s + p.value, 0) / arr.length : null;
  const f = avgHalf(firstHalf);
  const s = avgHalf(secondHalf);
  const trend =
    f !== null && s !== null && s - f > 0.8
      ? "↑"
      : f !== null && s !== null && f - s > 0.8
      ? "↓"
      : "→";
  const trendColor =
    trend === "↑"
      ? "hsl(145 45% 35%)"
      : trend === "↓"
      ? "hsl(0 65% 42%)"
      : "hsl(var(--muted-foreground))";

  return (
    <div
      className="rounded-xl bg-card shadow-soft px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors hover:bg-accent/50 active:scale-[0.98]"
      onClick={() => navigate("/insights", { state: { heatmapMetric: "mood" } })}
      role="button"
      tabIndex={0}
    >
      {/* Icon + label */}
      <div className="flex-shrink-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
          Mood · 7-day
        </p>
        <div className="flex items-baseline gap-1">
          <span
            className="text-xl font-bold leading-none"
            style={{ color: latest ? moodColor(latest.value) : "hsl(var(--muted-foreground))" }}
          >
            {avg !== null ? avg.toFixed(1) : "—"}
          </span>
          <span className="text-[10px] text-muted-foreground">/10</span>
          <span className="text-sm font-semibold ml-0.5" style={{ color: trendColor }}>
            {trend}
          </span>
        </div>
      </div>

      {/* Sparkline SVG */}
      <div className="flex-1 min-w-0">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 36 }}
          preserveAspectRatio="none"
        >
          {/* Subtle mid-line at 5/10 */}
          <line
            x1={PAD} y1={toSvgY(5)} x2={W - PAD} y2={toSvgY(5)}
            stroke="hsl(var(--border))" strokeWidth="0.8" strokeDasharray="3 3"
          />

          {/* Fill area under line */}
          {plotPoints.length >= 2 && (
            <polyline
              points={[
                `${toSvgX(plotPoints[0].x)},${H - PAD}`,
                ...plotPoints.map((p) => `${toSvgX(p.x)},${toSvgY(p.value)}`),
                `${toSvgX(plotPoints[plotPoints.length - 1].x)},${H - PAD}`,
              ].join(" ")}
              fill="hsl(145 45% 45% / 0.10)"
              stroke="none"
            />
          )}

          {/* Line */}
          {plotPoints.length >= 2 && (
            <polyline
              points={linePoints}
              fill="none"
              stroke="hsl(145 45% 45%)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Dots for each data point */}
          {plotPoints.map((p) => (
            <circle
              key={p.date}
              cx={toSvgX(p.x)}
              cy={toSvgY(p.value)}
              r="2.5"
              fill={moodColor(p.value)}
              stroke="hsl(var(--card))"
              strokeWidth="1"
            />
          ))}
        </svg>

        {/* Day labels */}
        <div className="flex justify-between mt-0.5 px-0.5">
          {days.map((date, i) => {
            const hasData = byDate[date]?.mood != null;
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
      <ChevronRight className="flex-shrink-0 w-4 h-4 text-muted-foreground/50" />
    </div>
  );
}
