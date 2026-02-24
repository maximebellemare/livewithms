import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays } from "date-fns";
import { ChevronRight } from "lucide-react";
import type { SparklineConfig } from "./sparkline/types";
import type { PlotPoint } from "./sparkline/types";
import { useLongPress } from "./sparkline/useLongPress";
import SparklineSvg from "./sparkline/SparklineSvg";
import DayLabels from "./sparkline/DayLabels";
import { LongPressOverlay, SavedOverlay } from "./sparkline/Overlays";

export type { SparklineConfig } from "./sparkline/types";

interface GenericSparklineProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entries: readonly { date: string; [key: string]: any }[];
  config: SparklineConfig;
  /** "row" = horizontal layout for scroll area (default); "card" = vertical layout for grid */
  variant?: "row" | "card";
  onClick?: () => void;
  onLongPress?: () => void;
  saved?: boolean;
}

export default function GenericSparkline({
  entries,
  config,
  variant = "row",
  onClick,
  onLongPress,
  saved = false,
}: GenericSparklineProps) {
  const navigate = useNavigate();
  const {
    label, emoji, dataKey, unit, heatmapMetric, lowerIsBetter,
    colorFn, lineColor, fillColor, maxY = 10, trendThreshold = 0.8,
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
  const isCard = variant === "card";
  const interactive = !!(onClick || onLongPress);
  const { isPressing, ...pressHandlers } = useLongPress(onClick, onLongPress);

  // Card variant: empty state
  if (!hasAnyData && isCard) {
    const Tag = interactive ? "button" : "div";
    return (
      <Tag
        {...(interactive ? pressHandlers : {})}
        className={`relative rounded-xl bg-card shadow-soft px-3 py-3 flex flex-col gap-1.5 text-left w-full border border-dashed border-border/60 overflow-hidden transition-all duration-200${interactive ? " cursor-pointer hover:bg-secondary/70 hover:border-primary/40 hover:shadow-card hover:-translate-y-0.5 active:scale-95" : ""}${saved ? " ring-2 ring-[hsl(145_45%_45%)] shadow-[0_0_12px_2px_hsl(145_45%_45%/0.35)]" : ""}`}
      >
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          {emoji} {label}
        </p>
        <div className="flex flex-1 items-center justify-center py-3">
          <span className="text-[10px] text-muted-foreground/40 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
            No data yet
          </span>
        </div>
        {onLongPress && isPressing && <LongPressOverlay />}
        {saved && <SavedOverlay />}
      </Tag>
    );
  }

  // Row variant: hide if no data
  if (!hasAnyData) return null;

  const plotPoints: PlotPoint[] = points
    .map((p, i) => ({ ...p, x: i }))
    .filter((p): p is PlotPoint => p.value !== null);

  const avg = plotPoints.length
    ? plotPoints.reduce((s, p) => s + p.value, 0) / plotPoints.length
    : null;

  // Trend detection
  const firstHalf = plotPoints.filter((p) => p.x <= 3);
  const secondHalf = plotPoints.filter((p) => p.x > 3);
  const avgHalf = (arr: PlotPoint[]) =>
    arr.length ? arr.reduce((s, p) => s + p.value, 0) / arr.length : null;
  const f = avgHalf(firstHalf);
  const s = avgHalf(secondHalf);

  let trend = "→";
  if (f !== null && s !== null) {
    if (lowerIsBetter) {
      if (f - s > trendThreshold) trend = "↓";
      else if (s - f > trendThreshold) trend = "↑";
    } else {
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

  const svgProps = { plotPoints, maxY, lowerIsBetter, lineColor, fillColor, colorFn };

  // ── Card variant ──
  if (isCard) {
    const Tag = interactive ? "button" : "div";
    return (
      <Tag
        {...(interactive ? pressHandlers : {})}
        className={`relative rounded-xl bg-card shadow-soft px-3 py-3 flex flex-col gap-1.5 text-left w-full overflow-hidden transition-all duration-200${interactive ? " cursor-pointer hover:bg-secondary/70 hover:shadow-card hover:-translate-y-0.5 active:scale-95" : ""}${saved ? " ring-2 ring-[hsl(145_50%_48%)] shadow-[0_0_16px_4px_hsl(145_50%_48%/0.4)]" : ""}`}
      >
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            {emoji} {label}
          </p>
          <div className="flex items-baseline gap-0.5">
            <span
              className="text-base font-bold leading-none"
              style={{ color: avg !== null ? colorFn(avg) : "hsl(var(--muted-foreground))" }}
            >
              {avg !== null ? avg.toFixed(1) : "—"}
            </span>
            <span className="text-[9px] text-muted-foreground">{unit}</span>
            <span className="text-xs font-semibold ml-0.5" style={{ color: trendColor }}>
              {trend}
            </span>
          </div>
        </div>
        <SparklineSvg {...svgProps} height={32} />
        <DayLabels days={days} dataKey={dataKey} byDate={byDate} />
        {onLongPress && isPressing && <LongPressOverlay />}
        {saved && <SavedOverlay />}
      </Tag>
    );
  }

  // ── Row variant (default) ──
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
        <SparklineSvg {...svgProps} height={36} />
        <div className="mt-0.5">
          <DayLabels days={days} dataKey={dataKey} byDate={byDate} />
        </div>
      </div>
      <ChevronRight className="flex-shrink-0 w-4 h-4 text-muted-foreground/50" />
    </div>
  );
}
