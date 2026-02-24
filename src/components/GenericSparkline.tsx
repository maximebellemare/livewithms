import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays, parseISO } from "date-fns";
import { ChevronRight, CheckCircle2 } from "lucide-react";

export interface SparklineConfig {
  /** Label shown above the value, e.g. "Mood" */
  label: string;
  /** Emoji prefix for card variant */
  emoji?: string;
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

/** Pointer-event handlers that distinguish tap vs long-press. */
function useLongPress(onClick?: () => void, onLongPress?: () => void, delay = 500) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const [isPressing, setIsPressing] = useState(false);

  const start = () => {
    fired.current = false;
    setIsPressing(true);
    timer.current = setTimeout(() => {
      fired.current = true;
      setIsPressing(false);
      navigator.vibrate?.([30, 50, 30]);
      onLongPress?.();
    }, delay);
  };

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    setIsPressing(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (fired.current) { e.preventDefault(); e.stopPropagation(); return; }
    onClick?.();
  };

  return { isPressing, onPointerDown: start, onPointerUp: cancel, onPointerLeave: cancel, onPointerCancel: cancel, onClick: handleClick };
}

interface GenericSparklineProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entries: readonly { date: string; [key: string]: any }[];
  config: SparklineConfig;
  /** "row" = horizontal layout for scroll area (default); "card" = vertical layout for grid */
  variant?: "row" | "card";
  /** Tap handler (card variant) */
  onClick?: () => void;
  /** Long-press handler (card variant) */
  onLongPress?: () => void;
  /** Flash green saved overlay (card variant) */
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
    label,
    emoji,
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

  const W = 200;
  const H = 36;
  const PAD = 4;

  const plotPoints = points
    .map((p, i) => ({ ...p, x: i }))
    .filter((p): p is { date: string; value: number; x: number } => p.value !== null);

  const toSvgX = (i: number) => PAD + (i / 6) * (W - PAD * 2);
  const toSvgY = (v: number) =>
    lowerIsBetter
      ? PAD + (v / maxY) * (H - PAD * 2)
      : PAD + ((maxY - v) / maxY) * (H - PAD * 2);

  const svgLinePoints = plotPoints
    .map((p) => `${toSvgX(p.x)},${toSvgY(p.value)}`)
    .join(" ");

  const avg = plotPoints.length
    ? plotPoints.reduce((s, p) => s + p.value, 0) / plotPoints.length
    : null;

  // Trend detection
  const firstHalf = plotPoints.filter((p) => p.x <= 3);
  const secondHalf = plotPoints.filter((p) => p.x > 3);
  const avgHalf = (arr: typeof plotPoints) =>
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

  const midY = maxY / 2;

  const sparklineSvg = (height: number) => (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      <line
        x1={PAD} y1={toSvgY(midY)} x2={W - PAD} y2={toSvgY(midY)}
        stroke="hsl(var(--border))" strokeWidth="0.8" strokeDasharray="3 3"
      />
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
  );

  const dayLabels = (
    <div className="flex justify-between px-0.5">
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
  );

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

        {sparklineSvg(32)}
        {dayLabels}

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
        {sparklineSvg(36)}
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

function LongPressOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden animate-fade-in flex items-center justify-center">
      <div className="absolute inset-0 bg-primary/8" />
      <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="22" cy="22" r="18" fill="none" stroke="hsl(var(--primary) / 0.15)" strokeWidth="3" />
        <circle
          cx="22" cy="22" r="18" fill="none"
          stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"
          strokeDasharray="113.1"
          style={{ animation: "ring-fill 0.5s linear forwards" }}
        />
      </svg>
      <span className="absolute bottom-1.5 text-[8px] font-semibold tracking-wide text-primary/80 bg-primary/15 px-2 py-0.5 rounded-full">
        insights →
      </span>
    </div>
  );
}

function SavedOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[hsl(145_45%_45%/0.12)] animate-fade-in pointer-events-none rounded-xl">
      <CheckCircle2 className="h-7 w-7 text-[hsl(145_45%_38%)] drop-shadow" />
    </div>
  );
}
