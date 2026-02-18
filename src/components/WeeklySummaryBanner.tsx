import { useMemo } from "react";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useEntries, DailyEntry } from "@/hooks/useEntries";

/* ─── helpers ─────────────────────────────────────────────── */
function avg(vals: (number | null | undefined)[]): number | null {
  const v = vals.filter((x): x is number => typeof x === "number");
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

type Direction = "up" | "down" | "flat";

function direction(current: number | null, previous: number | null): Direction {
  if (current === null || previous === null) return "flat";
  const delta = current - previous;
  if (delta > 0.3) return "up";
  if (delta < -0.3) return "down";
  return "flat";
}

/* For fatigue/pain, "up" is bad; for mood, "up" is good */
interface Metric {
  label: string;
  emoji: string;
  key: keyof DailyEntry;
  higherIsBetter: boolean;
}

const METRICS: Metric[] = [
  { label: "Fatigue", emoji: "🔋", key: "fatigue",   higherIsBetter: false },
  { label: "Pain",    emoji: "⚡", key: "pain",      higherIsBetter: false },
  { label: "Mood",    emoji: "😊", key: "mood",      higherIsBetter: true  },
];

/* ─── Trend pill ──────────────────────────────────────────── */
interface TrendPillProps {
  dir: Direction;
  higherIsBetter: boolean;
  delta: number | null;
}

const TrendPill = ({ dir, higherIsBetter, delta }: TrendPillProps) => {
  const isGood = dir === "flat" ? null : (dir === "up") === higherIsBetter;

  const colorClass =
    dir === "flat"  ? "bg-muted text-muted-foreground" :
    isGood          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" :
                      "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";

  const Icon = dir === "up" ? TrendingUp : dir === "down" ? TrendingDown : Minus;

  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${colorClass}`}>
      <Icon className="h-2.5 w-2.5" />
      {dir === "flat" ? "Same" : delta !== null ? `${Math.abs(delta).toFixed(1)}` : "—"}
    </span>
  );
};

/* ─── Main component ──────────────────────────────────────── */
const WeeklySummaryBanner = () => {
  const { data: allEntries = [], isLoading } = useEntries();

  const { thisWeek, lastWeek } = useMemo(() => {
    const today = new Date();
    // "This week" = last 7 days; "Last week" = 8–14 days ago
    const thisStart  = format(subDays(today, 6),  "yyyy-MM-dd");
    const thisEnd    = format(today,               "yyyy-MM-dd");
    const lastStart  = format(subDays(today, 13), "yyyy-MM-dd");
    const lastEnd    = format(subDays(today, 7),  "yyyy-MM-dd");

    return {
      thisWeek: allEntries.filter((e) => e.date >= thisStart && e.date <= thisEnd),
      lastWeek: allEntries.filter((e) => e.date >= lastStart && e.date <= lastEnd),
    };
  }, [allEntries]);

  // Need at least 1 entry in each window to show comparison
  if (isLoading || thisWeek.length === 0 || lastWeek.length === 0) return null;

  const stats = METRICS.map(({ label, emoji, key, higherIsBetter }) => {
    const cur  = avg(thisWeek.map((e) => e[key] as number | null));
    const prev = avg(lastWeek.map((e) => e[key] as number | null));
    const dir  = direction(cur, prev);
    const delta = cur !== null && prev !== null ? cur - prev : null;
    return { label, emoji, cur, prev, dir, delta, higherIsBetter };
  });

  // Count improvements
  const improvements = stats.filter(
    (s) => s.dir !== "flat" && (s.dir === "up") === s.higherIsBetter
  ).length;
  const regressions = stats.filter(
    (s) => s.dir !== "flat" && (s.dir === "up") !== s.higherIsBetter
  ).length;

  const headline =
    improvements > regressions ? "Better than last week 🌟" :
    regressions > improvements ? "Tougher than last week 💙" :
    "About the same as last week";

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Weekly summary
        </p>
        <span className="text-[11px] font-medium text-foreground">{headline}</span>
      </div>

      {/* Metric rows */}
      <div className="space-y-2">
        {stats.map(({ label, emoji, cur, prev, dir, delta, higherIsBetter }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">{emoji}</span>
              <span className="text-xs font-medium text-foreground">{label}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* This week avg */}
              <span className="text-xs text-muted-foreground tabular-nums">
                {cur !== null ? cur.toFixed(1) : "—"}
                <span className="text-[10px]"> /10</span>
              </span>
              {/* vs last week */}
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                vs {prev !== null ? prev.toFixed(1) : "—"}
              </span>
              <TrendPill dir={dir} higherIsBetter={higherIsBetter} delta={delta} />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground">
        This week vs last 7 days · {thisWeek.length} entries logged
      </p>
    </div>
  );
};

export default WeeklySummaryBanner;
