import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";

interface DayEntry {
  date: string;
  fatigue: number | null;
  pain: number | null;
  brain_fog: number | null;
  mood: number | null;
  mobility: number | null;
}

interface SymptomHeatmapProps {
  entries: DayEntry[];
  /** All days in the 30-day window, oldest → newest */
  days: string[];
}

const METRICS = [
  { key: "fatigue",   label: "Fatigue",    emoji: "🔋", higherIsBetter: false },
  { key: "pain",      label: "Pain",       emoji: "⚡", higherIsBetter: false },
  { key: "brain_fog", label: "Brain Fog",  emoji: "🌫️", higherIsBetter: false },
  { key: "mood",      label: "Mood",       emoji: "😊", higherIsBetter: true  },
  { key: "mobility",  label: "Mobility",   emoji: "🚶", higherIsBetter: true  },
] as const;

type MetricKey = typeof METRICS[number]["key"];

/** Returns a CSS background colour string for a given value 0–10 */
function cellColor(value: number | null, higherIsBetter: boolean): string {
  if (value === null) return "hsl(var(--muted) / 0.4)";

  // Normalise so 0 = bad, 1 = good
  const norm = higherIsBetter ? value / 10 : 1 - value / 10;

  if (norm >= 0.75) return "hsl(145 50% 42%)";  // emerald — great
  if (norm >= 0.5)  return "hsl(145 40% 58%)";  // light green — good
  if (norm >= 0.35) return "hsl(45 90% 52%)";   // amber — moderate
  if (norm >= 0.2)  return "hsl(25 85% 50%)";   // orange — concerning
  return               "hsl(0 72% 51%)";          // red — severe
}

function labelColor(value: number | null, higherIsBetter: boolean): string {
  if (value === null) return "hsl(var(--muted-foreground))";
  const norm = higherIsBetter ? value / 10 : 1 - value / 10;
  if (norm >= 0.5)  return "hsl(145 45% 30%)";
  if (norm >= 0.35) return "hsl(30 80% 28%)";
  return               "hsl(0 65% 40%)";
}

export default function SymptomHeatmap({ entries, days }: SymptomHeatmapProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("fatigue");

  const metric = METRICS.find((m) => m.key === activeMetric)!;

  const byDate = useMemo(
    () => Object.fromEntries(entries.map((e) => [e.date, e])),
    [entries],
  );

  // Split days into weeks (rows of 7)
  const weeks = useMemo(() => {
    const rows: string[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
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

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-center text-[9px] text-muted-foreground font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((date) => {
              const entry = byDate[date];
              const value = entry ? (entry[activeMetric as keyof DayEntry] as number | null) : null;
              const isToday = date === format(new Date(), "yyyy-MM-dd");
              const isActive = tooltip?.date === date;

              return (
                <button
                  key={date}
                  onClick={() =>
                    setTooltip(isActive ? null : { date, value })
                  }
                  title={`${format(parseISO(date), "MMM d")}: ${value !== null ? value + "/10" : "No data"}`}
                  className={`aspect-square rounded-md transition-all duration-150 ${
                    isActive ? "ring-2 ring-primary ring-offset-1 ring-offset-card scale-105" : ""
                  } ${isToday ? "ring-2 ring-primary/50 ring-offset-1 ring-offset-card" : ""}`}
                  style={{ backgroundColor: cellColor(value, metric.higherIsBetter) }}
                />
              );
            })}
          </div>
        ))}
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
              style={{ color: tooltip.value !== null ? labelColor(tooltip.value, metric.higherIsBetter) : "hsl(var(--muted-foreground))" }}
            >
              {tooltip.value !== null
                ? `${metric.label}: ${tooltip.value}/10`
                : "No entry logged"}
            </p>
          </div>
          {tooltip.value !== null && (
            <span
              className="text-sm font-bold"
              style={{ color: labelColor(tooltip.value, metric.higherIsBetter) }}
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
