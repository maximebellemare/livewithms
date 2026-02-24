import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays, parseISO } from "date-fns";
import { ChevronRight } from "lucide-react";

export interface SparklineConfig {
  /** Label shown above the value, e.g. "Mood" */
  label: string;
  /** Key to read from the entry object */
  dataKey: string;
  /** Unit label shown after the value, e.g. "/10", "hrs" */
  unit: string;
  /** Route state value passed to /insights heatmap */
  heatmapMetric: string;
  /** If true, lower values = better (fatigue, pain, brain_fog). If false, higher = better (mood). */
  lowerIsBetter: boolean;
  /** Color function: value → hsl string */
  colorFn: (value: number) => string;
  /** Line stroke color for the sparkline */
  lineColor: string;
  /** Fill color (with alpha) for the area under the line */
  fillColor: string;
  /** Max Y value for scaling. Defaults to 10. */
  maxY?: number;
  /** Threshold for trend detection. Defaults to 0.8. */
  trendThreshold?: number;
}

interface GenericSparklineProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entries: readonly { date: string; [key: string]: any }[];
  config: SparklineConfig;
}

export default function GenericSparkline({ entries, config }: GenericSparklineProps) {
  const navigate = useNavigate();
  const {
    label,
    dataKey,
    unit,
    heatmapMetric,
    lowerIsBetter,
    colorFn,
    lineColor,
    fillColor,
    maxY = 10,
    trendThreshold = 0.8,
  } = config;

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
    const raw = entry?.[dataKey];
    return { date, value: typeof raw === "number" ? raw : null };
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
  const toSvgY = (v: number) =>
    lowerIsBetter
      ? PAD + (v / maxY) * (H - PAD * 2)         // lower value = higher on chart
      : PAD + ((maxY - v) / maxY) * (H - PAD * 2); // higher value = higher on chart

  const svgLinePoints = plotPoints
    .map((p) => `${toSvgX(p.x)},${toSvgY(p.value)}`)
    .join(" ");

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

  let trend = "→";
  if (f !== null && s !== null) {
    if (lowerIsBetter) {
      // Going down = improving
      if (f - s > trendThreshold) trend = "↓";
      else if (s - f > trendThreshold) trend = "↑";
    } else {
      // Going up = improving
      if (s - f > trendThreshold) trend = "↑";
      else if (f - s > trendThreshold) trend = "↓";
    }
  }

  const improvingTrend = lowerIsBetter ? "↓" : "↑";
  const worseningTrend = lowerIsBetter ? "↑" : "↓";
  const trendColor =
    trend === improvingTrend
      ? "hsl(145 45% 35%)"
      : trend === worseningTrend
      ? "hsl(0 65% 42%)"
      : "hsl(var(--muted-foreground))";

  const midY = lowerIsBetter ? maxY / 2 : maxY / 2;

  return (
    <div
      className="rounded-xl bg-card shadow-soft px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors hover:bg-accent/50 active:scale-[0.98]"
      onClick={() => navigate("/insights", { state: { heatmapMetric } })}
      role="button"
      tabIndex={0}
    >
      <div className="flex-shrink-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
          {label} · 7-day
        </p>
        <div className="flex items-baseline gap-1">
          <span
            className="text-xl font-bold leading-none"
            style={{ color: avg !== null ? colorFn(avg) : "hsl(var(--muted-foreground))" }}
          >
            {avg !== null ? avg.toFixed(1) : "—"}
          </span>
          <span className="text-[10px] text-muted-foreground">{unit}</span>
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
          {/* Mid-line */}
          <line
            x1={PAD} y1={toSvgY(midY)} x2={W - PAD} y2={toSvgY(midY)}
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
              fill={fillColor}
              stroke="none"
            />
          )}

          {/* Line */}
          {plotPoints.length >= 2 && (
            <polyline
              points={svgLinePoints}
              fill="none"
              stroke={lineColor}
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
              fill={colorFn(p.value)}
              stroke="hsl(var(--card))"
              strokeWidth="1"
            />
          ))}
        </svg>

        <div className="flex justify-between mt-0.5 px-0.5">
          {days.map((date) => {
            const hasData = byDate[date]?.[dataKey] != null;
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
