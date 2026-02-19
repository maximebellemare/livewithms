import { useMemo, useState } from "react";
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";
import SymptomHeatmap, { MetricKey } from "./SymptomHeatmap";

interface DayEntry {
  date: string;
  fatigue: number | null;
  pain: number | null;
  brain_fog: number | null;
  mood: number | null;
  mobility: number | null;
}

interface Props {
  entries: DayEntry[];
  days: string[];
}

const METRICS = [
  { key: "fatigue"   as MetricKey, label: "Fatigue",   higherIsBetter: false },
  { key: "pain"      as MetricKey, label: "Pain",       higherIsBetter: false },
  { key: "brain_fog" as MetricKey, label: "Brain Fog",  higherIsBetter: false },
  { key: "mood"      as MetricKey, label: "Mood",       higherIsBetter: true  },
  { key: "mobility"  as MetricKey, label: "Mobility",   higherIsBetter: true  },
];

function avg(vals: (number | null)[]): number | null {
  const v = vals.filter((x): x is number => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function formatWeekRange(weekStart: Date): string {
  const s = format(weekStart, "MMM d");
  const e = format(endOfWeek(weekStart, { weekStartsOn: 1 }), "MMM d");
  return `${s}–${e}`;
}

/**
 * Splits `days` into Monday-anchored weeks and returns the best & worst week
 * for the given metric key.
 */
function bestWorstWeeks(
  days: string[],
  entries: DayEntry[],
  metricKey: MetricKey,
  higherIsBetter: boolean,
) {
  if (days.length === 0) return null;

  const byDate = Object.fromEntries(entries.map((e) => [e.date, e]));

  // Group days into Mon-anchored weeks
  const firstDay = parseISO(days[0]);
  const weekMap = new Map<string, { weekStart: Date; values: number[] }>();

  for (const day of days) {
    const d = parseISO(day);
    const ws = startOfWeek(d, { weekStartsOn: 1 });
    const wsKey = format(ws, "yyyy-MM-dd");
    if (!weekMap.has(wsKey)) weekMap.set(wsKey, { weekStart: ws, values: [] });
    const entry = byDate[day];
    const val = entry?.[metricKey] ?? null;
    if (val !== null) weekMap.get(wsKey)!.values.push(val);
  }

  // Compute average per week, require at least 2 data points
  const weeks = Array.from(weekMap.values())
    .map(({ weekStart, values }) => ({ weekStart, avg: avg(values), count: values.length }))
    .filter((w) => w.count >= 2 && w.avg !== null) as { weekStart: Date; avg: number; count: number }[];

  if (weeks.length < 2) return null;

  const best  = weeks.reduce((a, b) => (higherIsBetter ? b.avg > a.avg : b.avg < a.avg) ? b : a);
  const worst = weeks.reduce((a, b) => (higherIsBetter ? b.avg < a.avg : b.avg > a.avg) ? b : a);

  if (format(best.weekStart, "yyyy-MM-dd") === format(worst.weekStart, "yyyy-MM-dd")) return null;

  return { best, worst };
}

export default function HeatmapWithSummary({ entries, days }: Props) {
  // Mirror the active metric state so we can show the right summary
  const [activeMetric, setActiveMetric] = useState<MetricKey>("fatigue");

  const metric = METRICS.find((m) => m.key === activeMetric)!;

  const result = useMemo(
    () => bestWorstWeeks(days, entries, activeMetric, metric.higherIsBetter),
    [days, entries, activeMetric, metric.higherIsBetter],
  );

  return (
    <div className="space-y-2">
      {/* Pass activeMetric + setter down so the heatmap and summary stay in sync */}
      <SymptomHeatmap
        entries={entries}
        days={days}
        activeMetric={activeMetric}
        onMetricChange={setActiveMetric}
      />

      {/* Plain-English best / worst week sentence */}
      {result && (
        <div className="rounded-lg bg-secondary/50 border border-border px-3 py-2.5 space-y-1">
          <p className="text-[11px] text-foreground leading-snug">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">🌟 Best {metric.label} week</span>
            {" "}was{" "}
            <span className="font-semibold text-foreground">{formatWeekRange(result.best.weekStart)}</span>
            {" "}(avg {result.best.avg.toFixed(1)}/10).
          </p>
          <p className="text-[11px] text-foreground leading-snug">
            <span className="text-destructive font-semibold">💙 Toughest {metric.label} week</span>
            {" "}was{" "}
            <span className="font-semibold text-foreground">{formatWeekRange(result.worst.weekStart)}</span>
            {" "}(avg {result.worst.avg.toFixed(1)}/10).
          </p>
        </div>
      )}
    </div>
  );
}
