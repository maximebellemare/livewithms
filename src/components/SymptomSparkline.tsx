import { useMemo, useRef, useState } from "react";
import { format, subDays, parseISO } from "date-fns";
import { CheckCircle2 } from "lucide-react";

interface Entry {
  date: string;
  fatigue: number | null;
  pain: number | null;
  brain_fog: number | null;
  mood: number | null;
  mobility: number | null;
  spasticity?: number | null;
  stress?: number | null;
  sleep_hours?: number | null;
  notes?: string | null;
  mood_tags?: string[];
}

type MetricKey = "fatigue" | "pain" | "brain_fog" | "mood" | "mobility" | "spasticity" | "stress" | "sleep_hours";

interface SymptomSparklineProps {
  entries: Entry[];
  metric: MetricKey;
  label: string;
  emoji: string;
  higherIsBetter?: boolean;
  /** Max scale value — defaults to 10, use 12 for sleep hours */
  maxValue?: number;
  /** Unit shown after the average — defaults to "/10" */
  unit?: string;
  onClick?: () => void;
  /** Long-press (≥500 ms) handler — e.g. navigate to Insights */
  onLongPress?: () => void;
  /** Flash a green saved confirmation overlay */
  saved?: boolean;
}

/** Returns pointer-event handlers that distinguish tap vs long-press. */
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

  return {
    isPressing,
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onClick: handleClick,
  };
}

function metricColor(value: number, higherIsBetter: boolean): string {
  const norm = higherIsBetter ? value / 10 : 1 - value / 10;
  if (norm >= 0.75) return "hsl(145 50% 42%)";
  if (norm >= 0.5)  return "hsl(145 40% 58%)";
  if (norm >= 0.35) return "hsl(45 90% 52%)";
  if (norm >= 0.2)  return "hsl(25 85% 50%)";
  return "hsl(0 72% 51%)";
}

export default function SymptomSparkline({
  entries,
  metric,
  label,
  emoji,
  higherIsBetter = false,
  maxValue = 10,
  unit = "/10",
  onClick,
  onLongPress,
  saved = false,
}: SymptomSparklineProps) {
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) =>
      format(subDays(today, 6 - i), "yyyy-MM-dd"),
    );
  }, []);

  const byDate = useMemo(
    () => Object.fromEntries(entries.map((e) => [e.date, e])),
    [entries],
  );

  const points = days.map((date) => {
    const val = byDate[date]?.[metric] ?? null;
    return { date, value: typeof val === "number" ? val : null };
  });

  const hasAnyData = points.some((p) => p.value !== null);

  const Tag = (onClick || onLongPress) ? "button" : "div";
  const { isPressing, ...pressHandlers } = useLongPress(onClick, onLongPress);

  if (!hasAnyData) {
    return (
      <Tag
        {...((onClick || onLongPress) ? pressHandlers : {})}
        className={`relative rounded-xl bg-card shadow-soft px-3 py-3 flex flex-col gap-1.5 text-left w-full border border-dashed border-border/60 overflow-hidden transition-all duration-300${(onClick || onLongPress) ? " cursor-pointer hover:bg-secondary/70 hover:border-primary/40 active:scale-95 transition-all duration-150" : ""}${saved ? " ring-2 ring-[hsl(145_45%_45%)] shadow-[0_0_12px_2px_hsl(145_45%_45%/0.35)]" : ""}`}
      >
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          {emoji} {label}
        </p>
        <div className="flex flex-1 items-center justify-center py-3">
          <span className="text-[10px] text-muted-foreground/40 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
            No data yet
          </span>
        </div>
        {onLongPress && isPressing && (
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
        )}
        {saved && (
          <div className="absolute inset-0 flex items-center justify-center bg-[hsl(145_45%_45%/0.12)] animate-fade-in pointer-events-none">
            <CheckCircle2 className="h-7 w-7 text-[hsl(145_45%_40%)] drop-shadow" />
          </div>
        )}
      </Tag>
    );
  }

  const W = 200, H = 36, PAD = 4;

  const plotPoints = points
    .map((p, i) => ({ ...p, x: i }))
    .filter((p): p is { date: string; value: number; x: number } => p.value !== null);

  const toSvgX = (i: number) => PAD + (i / 6) * (W - PAD * 2);
  const toSvgY = (v: number) => PAD + ((maxValue - v) / maxValue) * (H - PAD * 2);

  const linePoints = plotPoints
    .map((p) => `${toSvgX(p.x)},${toSvgY(p.value)}`)
    .join(" ");

  const avg =
    plotPoints.length
      ? plotPoints.reduce((s, p) => s + p.value, 0) / plotPoints.length
      : null;

  const firstHalf = plotPoints.filter((p) => p.x <= 3);
  const secondHalf = plotPoints.filter((p) => p.x > 3);
  const halfAvg = (arr: typeof plotPoints) =>
    arr.length ? arr.reduce((s, p) => s + p.value, 0) / arr.length : null;
  const f = halfAvg(firstHalf);
  const s = halfAvg(secondHalf);
  const improving = f !== null && s !== null && (higherIsBetter ? s - f : f - s) > 0.8;
  const worsening = f !== null && s !== null && (higherIsBetter ? f - s : s - f) > 0.8;
  const trend = improving ? "↑" : worsening ? "↓" : "→";
  const trendColor = improving
    ? "hsl(145 45% 35%)"
    : worsening
    ? "hsl(0 65% 42%)"
    : "hsl(var(--muted-foreground))";

  const lineColor = avg !== null ? metricColor((avg / maxValue) * 10, higherIsBetter) : "hsl(145 45% 45%)";


  return (
    <Tag
      {...((onClick || onLongPress) ? pressHandlers : {})}
      className={`relative rounded-xl bg-card shadow-soft px-3 py-3 flex flex-col gap-1.5 text-left w-full overflow-hidden transition-all duration-300${(onClick || onLongPress) ? " cursor-pointer hover:bg-secondary/70 active:scale-95 transition-all duration-150" : ""}${saved ? " ring-2 ring-[hsl(145_50%_48%)] shadow-[0_0_16px_4px_hsl(145_50%_48%/0.4)]" : ""}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          {emoji} {label}
        </p>
        <div className="flex items-baseline gap-0.5">
          <span
            className="text-base font-bold leading-none"
            style={{ color: avg !== null ? metricColor(avg / maxValue * 10, higherIsBetter) : "hsl(var(--muted-foreground))" }}
          >
            {avg !== null ? avg.toFixed(1) : "—"}
          </span>
          <span className="text-[9px] text-muted-foreground">{unit}</span>
          <span className="text-xs font-semibold ml-0.5" style={{ color: trendColor }}>
            {trend}
          </span>
        </div>
      </div>

      {/* SVG sparkline */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 32 }}
        preserveAspectRatio="none"
      >
        {/* midline at half of maxValue */}
        <line
          x1={PAD} y1={toSvgY(maxValue / 2)} x2={W - PAD} y2={toSvgY(maxValue / 2)}
          stroke="hsl(var(--border))" strokeWidth="0.8" strokeDasharray="3 3"
        />
        {/* fill */}
        {plotPoints.length >= 2 && (
          <polyline
            points={[
              `${toSvgX(plotPoints[0].x)},${H - PAD}`,
              ...plotPoints.map((p) => `${toSvgX(p.x)},${toSvgY(p.value)}`),
              `${toSvgX(plotPoints[plotPoints.length - 1].x)},${H - PAD}`,
            ].join(" ")}
            fill={`${lineColor.replace(")", " / 0.12)")}`}
            stroke="none"
          />
        )}
        {/* line */}
        {plotPoints.length >= 2 && (
          <polyline
            points={linePoints}
            fill="none"
            stroke={lineColor}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {/* dots */}
        {plotPoints.map((p) => (
          <circle
            key={p.date}
            cx={toSvgX(p.x)}
            cy={toSvgY(p.value)}
            r="2.5"
            fill={metricColor((p.value / maxValue) * 10, higherIsBetter)}
            stroke="hsl(var(--card))"
            strokeWidth="1"
          />
        ))}
      </svg>

      {/* Day labels */}
      <div className="flex justify-between px-0.5">
        {days.map((date) => {
          const hasData = typeof byDate[date]?.[metric] === "number";
          return (
            <span
              key={date}
              className="text-[8px] leading-none"
              style={{
                color: hasData
                  ? "hsl(var(--muted-foreground))"
                  : "hsl(var(--muted-foreground) / 0.35)",
              }}
            >
              {format(parseISO(date), "EEE")[0]}
            </span>
          );
        })}
      </div>

      {onLongPress && isPressing && (
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
      )}

      {/* Green saved confirmation overlay */}
      {saved && (
        <div className="absolute inset-0 flex items-center justify-center bg-[hsl(145_45%_45%/0.12)] animate-fade-in pointer-events-none rounded-xl">
          <CheckCircle2 className="h-7 w-7 text-[hsl(145_45%_38%)] drop-shadow" />
        </div>
      )}
    </Tag>
  );
}
