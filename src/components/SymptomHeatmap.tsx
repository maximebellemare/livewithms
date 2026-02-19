import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";

interface DayEntry {
  date: string;
  fatigue: number | null;
  pain: number | null;
  brain_fog: number | null;
  mood: number | null;
  mobility: number | null;
  spasticity?: number | null;
  stress?: number | null;
  sleep_hours?: number | null;
}

interface SymptomHeatmapProps {
  entries: DayEntry[];
  /** All days in the 30-day window, oldest → newest */
  days: string[];
  /** Controlled active metric (optional — component is self-controlled if omitted) */
  activeMetric?: MetricKey;
  onMetricChange?: (metric: MetricKey) => void;
}

const METRICS = [
  { key: "fatigue",     label: "Fatigue",     emoji: "🔋", higherIsBetter: false, maxValue: 10 },
  { key: "pain",        label: "Pain",        emoji: "⚡", higherIsBetter: false, maxValue: 10 },
  { key: "brain_fog",   label: "Brain Fog",   emoji: "🌫️", higherIsBetter: false, maxValue: 10 },
  { key: "mood",        label: "Mood",        emoji: "😊", higherIsBetter: true,  maxValue: 10 },
  { key: "mobility",    label: "Mobility",    emoji: "🚶", higherIsBetter: true,  maxValue: 10 },
  { key: "spasticity",  label: "Spasticity",  emoji: "🦵", higherIsBetter: false, maxValue: 10 },
  { key: "stress",      label: "Stress",      emoji: "😰", higherIsBetter: false, maxValue: 10 },
  { key: "sleep_hours", label: "Sleep",       emoji: "🌙", higherIsBetter: true,  maxValue: 12 },
] as const;

export type MetricKey = typeof METRICS[number]["key"];

/** Returns a CSS background colour string for a given value 0–maxValue */
function cellColor(value: number | null, higherIsBetter: boolean, maxValue = 10): string {
  if (value === null) return "hsl(var(--muted) / 0.4)";
  const norm = higherIsBetter ? value / maxValue : 1 - value / maxValue;
  if (norm >= 0.75) return "hsl(145 50% 42%)";
  if (norm >= 0.5)  return "hsl(145 40% 58%)";
  if (norm >= 0.35) return "hsl(45 90% 52%)";
  if (norm >= 0.2)  return "hsl(25 85% 50%)";
  return               "hsl(0 72% 51%)";
}

function labelColor(value: number | null, higherIsBetter: boolean, maxValue = 10): string {
  if (value === null) return "hsl(var(--muted-foreground))";
  const norm = higherIsBetter ? value / maxValue : 1 - value / maxValue;
  if (norm >= 0.5)  return "hsl(145 45% 30%)";
  if (norm >= 0.35) return "hsl(30 80% 28%)";
  return               "hsl(0 65% 40%)";
}

export default function SymptomHeatmap({ entries, days, activeMetric: controlledMetric, onMetricChange }: SymptomHeatmapProps) {
  const [internalMetric, setInternalMetric] = useState<MetricKey>("fatigue");
  const activeMetric = controlledMetric ?? internalMetric;
  const setActiveMetric = (m: MetricKey) => { setInternalMetric(m); onMetricChange?.(m); };

  const metric = METRICS.find((m) => m.key === activeMetric)!;

  const byDate = useMemo(
    () => Object.fromEntries(entries.map((e) => [e.date, e])),
    [entries],
  );

  // Build a calendar grid aligned to Monday–Sunday weeks
  // Pad the start with nulls so the first day lands in the correct column
  const { weeks, startDow } = useMemo(() => {
    if (days.length === 0) return { weeks: [], startDow: 0 };
    // day-of-week for the first day: 0=Mon … 6=Sun (ISO)
    const firstDate = parseISO(days[0]);
    // getDay() returns 0=Sun…6=Sat; convert to 0=Mon…6=Sun
    const jsDay = firstDate.getDay(); // 0=Sun, 1=Mon … 6=Sat
    const dow = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon … 6=Sun

    // Prefix nulls to align with Mon column
    const padded: (string | null)[] = [...Array(dow).fill(null), ...days];
    // Chunk into rows of 7
    const rows: (string | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      rows.push(padded.slice(i, i + 7));
    }
    return { weeks: rows, startDow: dow };
  }, [days]);

  const [tooltip, setTooltip] = useState<{ date: string; value: number | null } | null>(null);

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🗓️</span>
          <span className="text-sm font-semibold text-foreground">30-Day Heatmap</span>
        </div>
        <span className="text-xs text-muted-foreground">tap a day for details</span>
      </div>

      {/* Metric selector tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {METRICS.map(({ key, label, emoji }) => (
          <button
            key={key}
            onClick={() => setActiveMetric(key)}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
              activeMetric === key
                ? "bg-primary text-primary-foreground shadow-soft"
                : "bg-secondary text-muted-foreground hover:bg-muted"
            }`}
          >
            <span>{emoji}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Day-of-week labels — left gutter + 7 columns */}
      <div className="flex items-center gap-1 mb-1">
        <div className="w-7 shrink-0" /> {/* gutter spacer */}
        <div className="grid grid-cols-7 gap-1 flex-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center text-[9px] text-muted-foreground font-medium">
              {d}
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="space-y-1">
        {weeks.map((week, wi) => {
          const firstDate = week.find((d): d is string => d !== null);
          const weekLabel = firstDate ? format(parseISO(firstDate), "MMM d") : "";

          return (
            <div key={wi} className="flex items-center gap-1">
              {/* Week label */}
              <div className="w-7 shrink-0 text-right text-[8px] font-medium text-muted-foreground leading-none pr-0.5">
                {weekLabel}
              </div>
              {/* 7-cell row */}
              <div className="grid grid-cols-7 gap-1 flex-1">
                {week.map((date, di) => {
                  if (date === null) {
                    return <div key={`pad-${wi}-${di}`} className="aspect-square" />;
                  }
                  const entry = byDate[date];
                  const value = entry ? (entry[activeMetric as keyof DayEntry] as number | null) : null;
                  const isToday = date === format(new Date(), "yyyy-MM-dd");
                  const isActive = tooltip?.date === date;

                  return (
                    <button
                      key={date}
                      onClick={() => setTooltip(isActive ? null : { date, value })}
                      title={`${format(parseISO(date), "MMM d")}: ${value !== null ? value + (metric.maxValue === 12 ? " hrs" : "/10") : "No data"}`}
                      className={`aspect-square rounded-md transition-all duration-150 ${
                        isActive ? "ring-2 ring-primary ring-offset-1 ring-offset-card scale-105" : ""
                      } ${isToday ? "ring-2 ring-primary/50 ring-offset-1 ring-offset-card" : ""}`}
                      style={{ backgroundColor: cellColor(value, metric.higherIsBetter, metric.maxValue) }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tooltip detail */}
      {tooltip && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2">
          <span className="text-base">{metric.emoji}</span>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-foreground">
              {format(parseISO(tooltip.date), "EEEE, MMM d")}
            </p>
            <p
              className="text-[11px] font-medium"
              style={{ color: tooltip.value !== null ? labelColor(tooltip.value, metric.higherIsBetter, metric.maxValue) : "hsl(var(--muted-foreground))" }}
            >
              {tooltip.value !== null
                ? `${metric.label}: ${tooltip.value}${metric.maxValue === 12 ? " hrs" : "/10"}`
                : "No entry logged"}
            </p>
          </div>
          {tooltip.value !== null && (
            <span
              className="text-sm font-bold"
              style={{ color: labelColor(tooltip.value, metric.higherIsBetter, metric.maxValue) }}
            >
              {tooltip.value}
            </span>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-muted-foreground">
            {metric.higherIsBetter ? "Low" : "None"}
          </span>
          {["hsl(0 72% 51%)", "hsl(25 85% 50%)", "hsl(45 90% 52%)", "hsl(145 40% 58%)", "hsl(145 50% 42%)"].map(
            (color, i) => (
              <span
                key={i}
                className="h-3 w-4 rounded-sm inline-block"
                style={{ backgroundColor: metric.higherIsBetter ? color : ["hsl(145 50% 42%)", "hsl(145 40% 58%)", "hsl(45 90% 52%)", "hsl(25 85% 50%)", "hsl(0 72% 51%)"][i] }}
              />
            ),
          )}
          <span className="text-[9px] text-muted-foreground">
            {metric.higherIsBetter ? "High" : "Severe"}
          </span>
        </div>
        <span className="text-[9px] text-muted-foreground">
          <span className="inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ backgroundColor: "hsl(var(--muted) / 0.4)" }} />
          {" "}No data
        </span>
      </div>
    </div>
  );
}
