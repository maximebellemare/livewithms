import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays, parseISO } from "date-fns";
import { ChevronRight } from "lucide-react";

interface Entry {
  date: string;
  fatigue: number | null;
}

interface FatigueSparklineProps {
  entries: Entry[];
}

/** Lower fatigue is better (0-10 scale) */
function fatigueColor(value: number): string {
  if (value <= 3) return "hsl(145 50% 42%)";     // green – low
  if (value <= 6) return "hsl(45 90% 52%)";      // amber – moderate
  return "hsl(0 72% 51%)";                        // red – high
}

export default function FatigueSparkline({ entries }: FatigueSparklineProps) {
  const navigate = useNavigate();

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
    return { date, value: entry?.fatigue ?? null };
  });

  const hasAnyData = points.some((p) => p.value !== null);
  if (!hasAnyData) return null;

  const W = 200;
  const H = 36;
  const PAD = 4;

  const plotPoints = points
    .map((p, i) => ({ ...p, x: i }))
    .filter((p): p is { date: string; value: number; x: number } => p.value !== null);

  const toSvgX = (i: number) => PAD + (i / 6) * (W - PAD * 2);
  const toSvgY = (v: number) => PAD + (v / 10) * (H - PAD * 2); // lower = higher on chart (better)

  const linePoints = plotPoints
    .map((p) => `${toSvgX(p.x)},${toSvgY(p.value)}`)
    .join(" ");

  const avg = plotPoints.length
    ? plotPoints.reduce((s, p) => s + p.value, 0) / plotPoints.length
    : null;

  // Trend: compare first half vs second half (lower is better, so rising avg = worse)
  const firstHalf = plotPoints.filter((p) => p.x <= 3);
  const secondHalf = plotPoints.filter((p) => p.x > 3);
  const avgHalf = (arr: typeof plotPoints) =>
    arr.length ? arr.reduce((s, p) => s + p.value, 0) / arr.length : null;
  const f = avgHalf(firstHalf);
  const s = avgHalf(secondHalf);
  // For fatigue, going DOWN is good (↓ = improving)
  const trend =
    f !== null && s !== null && f - s > 0.8
      ? "↓"
      : f !== null && s !== null && s - f > 0.8
      ? "↑"
      : "→";
  const trendColor =
    trend === "↓"
      ? "hsl(145 45% 35%)"   // improving – green
      : trend === "↑"
      ? "hsl(0 65% 42%)"     // worsening – red
      : "hsl(var(--muted-foreground))";

  return (
    <div
      className="rounded-xl bg-card shadow-soft px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors hover:bg-accent/50 active:scale-[0.98]"
      onClick={() => navigate("/insights", { state: { heatmapMetric: "fatigue" } })}
      role="button"
      tabIndex={0}
    >
      <div className="flex-shrink-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
          Fatigue · 7-day
        </p>
        <div className="flex items-baseline gap-1">
          <span
            className="text-xl font-bold leading-none"
            style={{ color: avg !== null ? fatigueColor(avg) : "hsl(var(--muted-foreground))" }}
          >
            {avg !== null ? avg.toFixed(1) : "—"}
          </span>
          <span className="text-[10px] text-muted-foreground">/10</span>
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
          {/* Mid-line at 5/10 */}
          <line
            x1={PAD} y1={toSvgY(5)} x2={W - PAD} y2={toSvgY(5)}
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
              fill="hsl(0 72% 51% / 0.08)"
              stroke="none"
            />
          )}

          {/* Line */}
          {plotPoints.length >= 2 && (
            <polyline
              points={linePoints}
              fill="none"
              stroke="hsl(25 85% 50%)"
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
              fill={fatigueColor(p.value)}
              stroke="hsl(var(--card))"
              strokeWidth="1"
            />
          ))}
        </svg>

        <div className="flex justify-between mt-0.5 px-0.5">
          {days.map((date) => {
            const hasData = byDate[date]?.fatigue != null;
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
