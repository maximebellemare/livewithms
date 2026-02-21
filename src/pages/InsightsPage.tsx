import { useMemo, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { ChevronDown } from "lucide-react";
import AnimatedList, { listItemVariants } from "@/components/AnimatedList";
import { motion } from "framer-motion";
import SymptomHeatmap from "@/components/SymptomHeatmap";
import HeatmapWithSummary from "@/components/HeatmapWithSummary";
import { format, parseISO, subDays, eachDayOfInterval } from "date-fns";
import PageHeader from "@/components/PageHeader";
import AIWeeklyInsight from "@/components/AIWeeklyInsight";
import AISymptomCorrelations from "@/components/AISymptomCorrelations";
import WeeklyMoodTrendChart from "@/components/WeeklyMoodTrendChart";
import SymptomCorrelationMatrix from "@/components/SymptomCorrelationMatrix";
import RelapseTimeline from "@/components/RelapseTimeline";
import RelapseTrendCard from "@/components/RelapseTrendCard";
import RelapseFreeStreak from "@/components/RelapseFreeStreak";
import RelapseSymptomBreakdown from "@/components/RelapseSymptomBreakdown";
import RelapseTriggerBreakdown from "@/components/RelapseTriggerBreakdown";
import RelapseSeverityChart from "@/components/RelapseSeverityChart";
import RelapseRecoveryTime from "@/components/RelapseRecoveryTime";
import ActiveRelapseDuration from "@/components/ActiveRelapseDuration";
import RelapseTreatmentSummary from "@/components/RelapseTreatmentSummary";
import RelapseNotesTimeline from "@/components/RelapseNotesTimeline";
import RelapseYearComparison from "@/components/RelapseYearComparison";
import RelapseFrequencyTrend from "@/components/RelapseFrequencyTrend";
import RelapseRiskIndicator from "@/components/RelapseRiskIndicator";
import ContactNeurologistCard from "@/components/ContactNeurologistCard";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, Area, AreaChart, ReferenceLine,
  ScatterChart, Scatter, ZAxis,
} from "recharts";
import { useEntries } from "@/hooks/useEntries";
import { InsightsSkeleton } from "@/components/PageSkeleton";
import { useNavigate, useLocation } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const MOOD_TAG_META: Record<string, string> = {
  Happy: "😊", Calm: "😌", Frustrated: "😤", Sad: "😔",
  Anxious: "😰", Tired: "😴", Strong: "💪", Low: "🌧️",
};

// positive tags (green), negative (red), neutral (muted)
const MOOD_TAG_SENTIMENT: Record<string, "positive" | "negative" | "neutral"> = {
  Happy: "positive", Calm: "positive", Strong: "positive",
  Frustrated: "negative", Sad: "negative", Anxious: "negative", Low: "negative",
  Tired: "neutral",
};

/* ── colour palette (matches design tokens) ───────────────── */
const COLORS = {
  fatigue:     { stroke: "hsl(25 85% 50%)",  fill: "hsl(25 85% 50% / 0.12)"  },
  pain:        { stroke: "hsl(0 72% 51%)",   fill: "hsl(0 72% 51% / 0.10)"   },
  brain_fog:   { stroke: "hsl(210 60% 50%)", fill: "hsl(210 60% 50% / 0.10)" },
  mood:        { stroke: "hsl(145 45% 45%)", fill: "hsl(145 45% 45% / 0.10)" },
  mobility:    { stroke: "hsl(270 50% 55%)", fill: "hsl(270 50% 55% / 0.10)" },
  spasticity:  { stroke: "hsl(35 80% 50%)",  fill: "hsl(35 80% 50% / 0.10)"  },
  stress:      { stroke: "hsl(350 65% 55%)", fill: "hsl(350 65% 55% / 0.10)" },
  sleep_hours: { stroke: "hsl(220 70% 60%)", fill: "hsl(220 70% 60% / 0.10)" },
};

const SYMPTOMS = [
  { key: "fatigue",     label: "Fatigue",     emoji: "🔋" },
  { key: "pain",        label: "Pain",        emoji: "⚡" },
  { key: "brain_fog",   label: "Brain Fog",   emoji: "🌫️" },
  { key: "mood",        label: "Mood",        emoji: "😊" },
  { key: "mobility",    label: "Mobility",    emoji: "🚶" },
  { key: "spasticity",  label: "Spasticity",  emoji: "🦵" },
  { key: "stress",      label: "Stress",      emoji: "😰" },
  { key: "sleep_hours", label: "Sleep",       emoji: "🌙" },
] as const;

type SymptomKey = typeof SYMPTOMS[number]["key"];

/* ── helpers ────────────────────────────────────────────────── */
function avg(vals: (number | null)[]): number | null {
  const v = vals.filter((x): x is number => x !== null && x !== undefined);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function trend(recent: (number | null)[], older: (number | null)[]): "up" | "down" | "flat" {
  const r = avg(recent), o = avg(older);
  if (r === null || o === null) return "flat";
  if (r - o > 0.5) return "up";
  if (o - r > 0.5) return "down";
  return "flat";
}

/** Pearson r between two equal-length number arrays. Returns null if not enough data. */
function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(
    xs.reduce((s, x) => s + (x - mx) ** 2, 0) *
    ys.reduce((s, y) => s + (y - my) ** 2, 0)
  );
  return den === 0 ? null : num / den;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-card text-xs">
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => {
        const isSleep = p.dataKey === "sleep_hours";
        // Find raw sleep value from the data point
        const rawSleep = isSleep && p.payload ? p.payload.sleep_hours_raw : null;
        const displayVal = isSleep
          ? (rawSleep !== null ? `${rawSleep.toFixed(1)} hrs` : "—")
          : (p.value != null ? p.value.toFixed(1) : "—");
        return (
          <p key={p.dataKey} style={{ color: p.stroke }} className="flex items-center gap-1">
            <span className="font-medium">{p.name}:</span>
            <span>{displayVal}</span>
          </p>
        );
      })}
    </div>
  );
};

/* ── main component ─────────────────────────────────────────── */
const InsightsPage = () => {
  const { data: allEntries = [], isLoading } = useEntries();
  const navigate = useNavigate();
  const location = useLocation();
  const initialHeatmapMetric = (location.state as { heatmapMetric?: string } | null)?.heatmapMetric;
  const [range, setRange] = useState<7 | 30>(30);
  const [activeSymptom, setActiveSymptom] = useState<SymptomKey | "all">("all");
  const [showPeaks, setShowPeaks] = useState(false);

  /* All 30 days as yyyy-MM-dd strings for the heatmap (always 30-day) */
  const heatmapDays = useMemo(() => {
    const today = new Date();
    return eachDayOfInterval({ start: subDays(today, 29), end: today }).map((d) =>
      format(d, "yyyy-MM-dd"),
    );
  }, []);

  /* Deduplicated entries by date (keep last entry per date) for heatmap */
  const dedupedEntries = useMemo(() => {
    const byDate = new Map<string, typeof allEntries[number]>();
    for (const entry of allEntries) {
      byDate.set(entry.date, entry); // later entries overwrite earlier ones
    }
    return Array.from(byDate.values());
  }, [allEntries]);

  /* Build a complete day-by-day series (fills gaps with null) */
  const chartData = useMemo(() => {
    const today = new Date();
    const days = eachDayOfInterval({ start: subDays(today, range - 1), end: today });
    const byDate = Object.fromEntries(allEntries.map((e) => [e.date, e]));

    return days.map((d) => {
      const key = format(d, "yyyy-MM-dd");
      const entry = byDate[key];
      // Normalize sleep_hours (0–12) to 0–10 scale for the combined chart
      const rawSleep = entry?.sleep_hours ?? null;
      return {
        date: format(d, range === 7 ? "EEE" : "MMM d"),
        fullDate: key,
        fatigue:     entry?.fatigue   ?? null,
        pain:        entry?.pain      ?? null,
        brain_fog:   entry?.brain_fog ?? null,
        mood:        entry?.mood      ?? null,
        mobility:    entry?.mobility  ?? null,
        spasticity:  entry?.spasticity ?? null,
        stress:      entry?.stress    ?? null,
        sleep_hours: rawSleep !== null ? parseFloat(((rawSleep / 12) * 10).toFixed(2)) : null,
        sleep_hours_raw: rawSleep,
      };
    });
  }, [allEntries, range]);

  /* Stats for the current window */
  const windowEntries = useMemo(() => {
    const cutoff = format(subDays(new Date(), range - 1), "yyyy-MM-dd");
    return allEntries.filter((e) => e.date >= cutoff);
  }, [allEntries, range]);

  const prevWindowEntries = useMemo(() => {
    const start = format(subDays(new Date(), range * 2 - 1), "yyyy-MM-dd");
    const end   = format(subDays(new Date(), range), "yyyy-MM-dd");
    return allEntries.filter((e) => e.date >= start && e.date <= end);
  }, [allEntries, range]);

  const hasData = windowEntries.length >= 2;

  /* Which symptom lines to show */
  const visibleSymptoms = activeSymptom === "all"
    ? SYMPTOMS
    : SYMPTOMS.filter((s) => s.key === activeSymptom);

  /* Average sleep */
  const avgSleep = avg(windowEntries.map((e) => e.sleep_hours));

  /* Sleep → next-day fatigue correlation */
  const sleepFatiguePairs = useMemo(() => {
    const sorted = [...allEntries].sort((a, b) => a.date.localeCompare(b.date));
    const pairs: { sleep: number; fatigue: number }[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const tonight = sorted[i];
      const tomorrow = sorted[i + 1];
      if (tonight.sleep_hours !== null && tomorrow.fatigue !== null) {
        pairs.push({ sleep: tonight.sleep_hours, fatigue: tomorrow.fatigue });
      }
    }
    return pairs;
  }, [allEntries]);

  const correlationR = useMemo(
    () => pearson(sleepFatiguePairs.map((p) => p.sleep), sleepFatiguePairs.map((p) => p.fatigue)),
    [sleepFatiguePairs],
  );

  const corrLabel = correlationR !== null ? (() => {
    const abs = Math.abs(correlationR);
    const negative = correlationR < 0;
    const strength = abs >= 0.6 ? "Strong" : abs >= 0.3 ? "Moderate" : "Weak";
    if (negative && abs >= 0.3) return { text: `${strength} link — less sleep → more fatigue`, emoji: "⚠️", positive: false };
    if (!negative && abs >= 0.3) return { text: `${strength} positive link — more sleep, more fatigue`, emoji: "🤔", positive: null };
    return { text: "No clear link found yet", emoji: "➖", positive: null };
  })() : null;

  return (
    <>
      <SEOHead title="Insights" description="Visualize MS symptom trends, correlations and relapse patterns over time." />
      <PageHeader title="Insights" subtitle="Your health at a glance" />
      <div className="mx-auto max-w-lg px-4 py-4 pb-8">

        {/* Range toggle */}
        <div data-tour="insights-range" className="mb-4 flex gap-2">
          {([7, 30] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                range === r
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-card text-muted-foreground hover:bg-secondary border border-border"
              }`}
            >
              {r === 7 ? "Last 7 days" : "Last 30 days"}
            </button>
          ))}
        </div>

        {isLoading ? (
          <InsightsSkeleton />
        ) : !hasData ? (
          <div className="py-16 text-center animate-fade-in">
            <span className="text-4xl">📈</span>
            <p className="mt-3 font-display text-lg font-medium text-foreground">Not enough data yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Log at least 2 days to see your trends.</p>
            <button
              onClick={() => navigate("/today")}
              className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
            >
              Log today
            </button>
          </div>
        ) : (
          <AnimatedList className="space-y-4">

            {/* ── Stat cards ── */}
            <div data-tour="insights-stats" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SYMPTOMS.slice(0, 6).map(({ key, label, emoji }) => {
                const higherIsBetter = key === "mood" || key === "mobility" || key === "sleep_hours";
                const isSleep = key === "sleep_hours";
                const cur = avg(windowEntries.map((e) => e[key as keyof typeof e] as number | null));
                const t = trend(
                  windowEntries.map((e) => e[key as keyof typeof e] as number | null),
                  prevWindowEntries.map((e) => e[key as keyof typeof e] as number | null),
                );
                const isGood = higherIsBetter ? t === "up" : t === "down";
                const isBad  = higherIsBetter ? t === "down" : t === "up";
                return (
                  <button
                    key={key}
                    onClick={() => setActiveSymptom(activeSymptom === key ? "all" : key as SymptomKey)}
                    className={`rounded-xl p-4 shadow-soft text-center transition-all border ${
                      activeSymptom === key
                        ? "bg-accent border-primary/30"
                        : "bg-card border-transparent hover:bg-secondary"
                    }`}
                  >
                    <span className="text-xl">{emoji}</span>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {cur !== null ? cur.toFixed(1) : "—"}
                      {isSleep && cur !== null && (
                        <span className="text-sm font-normal text-muted-foreground ml-0.5">hrs</span>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
                    <span
                      className="inline-flex items-center gap-0.5 text-[10px] font-medium rounded-full px-1.5 py-0.5"
                      style={{
                        background: isGood ? "hsl(145 45% 45% / 0.12)" :
                                    isBad  ? "hsl(0 72% 51% / 0.1)"    :
                                             "hsl(var(--muted))",
                        color:      isGood ? "hsl(145 45% 35%)"         :
                                    isBad  ? "hsl(0 72% 45%)"           :
                                             "hsl(var(--muted-foreground))",
                      }}
                    >
                      {t === "up"   ? <TrendingUp className="h-2.5 w-2.5" /> :
                       t === "down" ? <TrendingDown className="h-2.5 w-2.5" /> :
                                      <Minus className="h-2.5 w-2.5" />}
                      {t === "flat" ? "Stable" : t === "up" ? "Higher" : "Lower"}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground text-center -mt-1">
              Tap a card to focus that symptom
            </p>

            {/* ── 30-Day Heatmap ── */}
            <div data-tour="insights-heatmap">
              <HeatmapWithSummary entries={dedupedEntries} days={heatmapDays} initialMetric={initialHeatmapMetric} />
            </div>

            {/* ── Weekly Progress Summary ── */}
            {(() => {
              const rows = SYMPTOMS.map(({ key, label, emoji }) => {
                const curAvg  = avg(windowEntries.map((e) => e[key as keyof typeof e] as number | null));
                const prevAvg = avg(prevWindowEntries.map((e) => e[key as keyof typeof e] as number | null));
                if (curAvg === null) return null;
                const diff = prevAvg !== null ? curAvg - prevAvg : null;
                // For fatigue/pain/brain_fog lower is better; for mood/mobility higher is better
                const lowerIsBetter = key === "fatigue" || key === "pain" || key === "brain_fog";
                const improved = diff !== null && (lowerIsBetter ? diff < -0.4 : diff > 0.4);
                const worsened = diff !== null && (lowerIsBetter ? diff > 0.4 : diff < -0.4);

                // Find best/worst day within current window
                const entriesWithVal = windowEntries
                  .map((e) => ({ date: e.date, val: e[key as keyof typeof e] as number | null }))
                  .filter((e): e is { date: string; val: number } => e.val !== null);

                let bestDay: { date: string; val: number } | null = null;
                let worstDay: { date: string; val: number } | null = null;

                if (entriesWithVal.length > 0) {
                  if (lowerIsBetter) {
                    // best = lowest value, worst = highest value
                    bestDay  = entriesWithVal.reduce((a, b) => b.val < a.val ? b : a);
                    worstDay = entriesWithVal.reduce((a, b) => b.val > a.val ? b : a);
                  } else {
                    // best = highest value, worst = lowest value
                    bestDay  = entriesWithVal.reduce((a, b) => b.val > a.val ? b : a);
                    worstDay = entriesWithVal.reduce((a, b) => b.val < a.val ? b : a);
                  }
                  // Don't show if best === worst (only one unique value)
                  if (bestDay?.val === worstDay?.val) { bestDay = null; worstDay = null; }
                }

                return { key, label, emoji, curAvg, prevAvg, diff, improved, worsened, bestDay, worstDay, lowerIsBetter };
              }).filter(Boolean) as NonNullable<{
                key: string; label: string; emoji: string; curAvg: number;
                prevAvg: number | null; diff: number | null; improved: boolean; worsened: boolean;
                bestDay: { date: string; val: number } | null;
                worstDay: { date: string; val: number } | null;
                lowerIsBetter: boolean;
              }>[];

              const improvedCount = rows.filter((r) => r.improved).length;
              const worsenedCount = rows.filter((r) => r.worsened).length;
              const stableCount   = rows.length - improvedCount - worsenedCount;

              return (
                <div className="rounded-xl bg-card shadow-soft overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Weekly Progress</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        vs. prior {range}-day period
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {improvedCount > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                          <TrendingDown className="h-3 w-3" />{improvedCount} better
                        </span>
                      )}
                      {worsenedCount > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                          <TrendingUp className="h-3 w-3" />{worsenedCount} worse
                        </span>
                      )}
                      {stableCount > 0 && improvedCount === 0 && worsenedCount === 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          <Minus className="h-3 w-3" />Stable
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-border">
                    {rows.map(({ key, label, emoji, curAvg, prevAvg, diff, improved, worsened }) => (
                      <div key={key} className="flex items-center gap-3 px-4 py-3">
                        <span className="text-base w-6 text-center">{emoji}</span>
                        <span className="flex-1 text-sm text-foreground">{label}</span>

                        {/* Bar */}
                        <div className="flex-1 max-w-[90px]">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${(curAvg / 10) * 100}%`,
                                backgroundColor: improved ? "hsl(145 45% 45%)" : worsened ? "hsl(0 72% 51%)" : "hsl(var(--muted-foreground))",
                              }}
                            />
                          </div>
                        </div>

                        {/* Value + delta */}
                        <div className="flex items-center gap-1.5 min-w-[56px] justify-end">
                          <span className="text-sm font-bold text-foreground">{curAvg.toFixed(1)}</span>
                          {diff !== null ? (
                            <span
                              className="flex items-center gap-0.5 text-[10px] font-medium"
                              style={{ color: improved ? "hsl(145 45% 40%)" : worsened ? "hsl(0 72% 51%)" : "hsl(var(--muted-foreground))" }}
                            >
                              {improved ? <TrendingDown className="h-3 w-3" /> :
                               worsened ? <TrendingUp className="h-3 w-3" /> :
                                          <Minus className="h-3 w-3" />}
                              {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">new</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Best / Worst day callouts */}
                  {(() => {
                    // Find the overall best & worst day across all symptoms
                    // "Best day" = fewest total burden (low fatigue/pain/fog + high mood/mobility)
                    // Compute a composite "health score" per day (higher = better day)
                    const dayScores: Record<string, number> = {};
                    const dayCount:  Record<string, number> = {};
                    windowEntries.forEach((e) => {
                      let score = 0;
                      let count = 0;
                      SYMPTOMS.forEach(({ key }) => {
                        const v = e[key as keyof typeof e] as number | null;
                        if (v === null) return;
                        const lowerIsBetter = key === "fatigue" || key === "pain" || key === "brain_fog";
                        // Normalise so "higher contribution = better"
                        score += lowerIsBetter ? (10 - v) : v;
                        count++;
                      });
                      if (count > 0) {
                        dayScores[e.date] = (dayScores[e.date] ?? 0) + score / count;
                        dayCount[e.date]  = (dayCount[e.date]  ?? 0) + 1;
                      }
                    });

                    const scoredDays = Object.entries(dayScores).map(([date, raw]) => ({
                      date,
                      score: raw / dayCount[date],
                    }));

                    if (scoredDays.length < 2) return null;

                    const bestDay  = scoredDays.reduce((a, b) => b.score > a.score ? b : a);
                    const worstDay = scoredDays.reduce((a, b) => b.score < a.score ? b : a);

                    if (bestDay.date === worstDay.date) return null;

                    const fmtDate = (d: string) => {
                      try { return format(parseISO(d), range === 7 ? "EEE, MMM d" : "MMM d"); }
                      catch { return d; }
                    };

                    return (
                      <div className="mx-4 mb-4 mt-1 grid grid-cols-2 gap-2">
                        {/* Best day */}
                        <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/20 px-3 py-2">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-sm">🌟</span>
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                              Best day
                            </span>
                          </div>
                          <p className="text-xs font-bold text-foreground">{fmtDate(bestDay.date)}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Score {bestDay.score.toFixed(1)}/10
                          </p>
                        </div>

                        {/* Worst day */}
                        <div className="rounded-lg bg-destructive/8 border border-destructive/20 px-3 py-2">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-sm">💙</span>
                            <span className="text-[10px] font-semibold text-destructive uppercase tracking-wide">
                              Toughest day
                            </span>
                          </div>
                          <p className="text-xs font-bold text-foreground">{fmtDate(worstDay.date)}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Score {worstDay.score.toFixed(1)}/10
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Per-symptom peaks collapsible ── */}
                  {rows.some((r) => r.bestDay || r.worstDay) && (
                    <div className="border-t border-border">
                      <button
                        onClick={() => setShowPeaks((p) => !p)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-secondary/50 transition-colors"
                      >
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                          Per-symptom peaks
                        </span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${showPeaks ? "rotate-180" : ""}`}
                        />
                      </button>

                      {showPeaks && (
                        <div className="px-4 pb-4 space-y-3">
                          {rows.map(({ key, label, emoji, bestDay, worstDay, lowerIsBetter }) => {
                            if (!bestDay && !worstDay) return null;
                            const fmtDate = (d: string) => {
                              try { return format(parseISO(d), range === 7 ? "EEE d" : "MMM d"); }
                              catch { return d; }
                            };
                            return (
                              <div key={key} className="flex items-start gap-2">
                                {/* Symptom label */}
                                <span className="text-sm pt-0.5">{emoji}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-medium text-foreground mb-1">{label}</p>
                                  <div className="flex gap-2">
                                    {bestDay && (
                                      <div className="flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 min-w-0">
                                        <span className="text-[10px]">🌟</span>
                                        <div className="min-w-0">
                                          <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                                            {fmtDate(bestDay.date)}
                                          </p>
                                          <p className="text-[9px] text-muted-foreground">
                                            {bestDay.val}/10 · {lowerIsBetter ? "low" : "high"}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                    {worstDay && (
                                      <div className="flex items-center gap-1 rounded-md bg-destructive/8 border border-destructive/20 px-2 py-1 min-w-0">
                                        <span className="text-[10px]">⚠️</span>
                                        <div className="min-w-0">
                                          <p className="text-[10px] font-semibold text-destructive truncate">
                                            {fmtDate(worstDay.date)}
                                          </p>
                                          <p className="text-[9px] text-muted-foreground">
                                            {worstDay.val}/10 · {lowerIsBetter ? "high" : "low"}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer note */}
                  <p className="px-4 pb-3 pt-2 text-[10px] text-muted-foreground border-t border-border">
                     ↓ lower is better for fatigue, pain & fog · ↑ higher is better for mood & mobility
                  </p>
                </div>
              );
            })()}

            {/* ── AI Weekly Insight ── */}
            <AIWeeklyInsight entries={windowEntries} range={range} />

            {/* ── AI Symptom Correlations ── */}
            <AISymptomCorrelations entries={windowEntries} range={range} />

            {/* ── Weekly Mood Trend ── */}
            <WeeklyMoodTrendChart entries={allEntries} />

            {/* ── Main trend chart ── */}
            <div className="rounded-xl bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-foreground">
                  {activeSymptom === "all" ? "All symptoms" : SYMPTOMS.find(s => s.key === activeSymptom)?.label}
                </p>
                <span className="text-xs text-muted-foreground">{range}-day view</span>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      interval={range === 30 ? 6 : 0}
                    />
                    <YAxis
                      domain={[0, 10]}
                      tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      ticks={[0, 2, 4, 6, 8, 10]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {visibleSymptoms.map(({ key, label }) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        name={label}
                        stroke={COLORS[key].stroke}
                        strokeWidth={activeSymptom === "all" ? 2 : 2.5}
                        strokeDasharray={key === "sleep_hours" ? "5 3" : undefined}
                        dot={false}
                        connectNulls={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {visibleSymptoms.map(({ key, label, emoji }) => (
                  <span key={key} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    {key === "sleep_hours" ? (
                      <span
                        className="flex-shrink-0"
                        style={{
                          display: "inline-block",
                          width: 14,
                          height: 2,
                          borderTop: `2px dashed ${COLORS[key].stroke}`,
                          marginBottom: 1,
                        }}
                      />
                    ) : (
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[key].stroke }}
                      />
                    )}
                    {emoji} {label}{key === "sleep_hours" ? " (÷1.2)" : ""}
                  </span>
                ))}
              </div>
              {(activeSymptom === "all" || activeSymptom === "sleep_hours") && (
                <p className="mt-1.5 text-[9px] text-muted-foreground">
                  🌙 Sleep scaled to 0–10 (÷1.2) for comparison. Hover to see actual hours.
                </p>
              )}
            </div>

            {/* ── Per-symptom sparkline cards ── */}
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              By symptom
            </p>
            <div className="grid grid-cols-1 gap-3">
              {SYMPTOMS.map(({ key, label, emoji }) => {
                const isSleep = key === "sleep_hours";
                const vals = windowEntries.map((e) => e[key as keyof typeof e] as number | null);
                const curAvg = avg(vals);
                const validVals = vals.filter((v): v is number => v !== null);
                const minVal = validVals.length ? Math.min(...validVals) : null;
                const maxVal = validVals.length ? Math.max(...validVals) : null;
                const domainMax = isSleep ? 12 : 10;
                const unit = isSleep ? "hrs avg" : "/ 10 avg";
                const dataKey = isSleep ? "sleep_hours_raw" : key;
                const tooltipName = isSleep ? "Sleep (hrs)" : label;
                return (
                  <div key={key} className="rounded-xl bg-card p-4 shadow-soft">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{emoji}</span>
                        <span className="text-sm font-semibold text-foreground">{label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-foreground">
                          {curAvg !== null ? curAvg.toFixed(1) : "—"}
                        </span>
                        <span className="ml-1 text-xs text-muted-foreground">{unit}</span>
                      </div>
                    </div>
                    <div className="h-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor={COLORS[key].stroke} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={COLORS[key].stroke} stopOpacity={0}   />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" hide />
                          <YAxis domain={[0, domainMax]} hide />
                          <Tooltip content={<CustomTooltip />} />
                          {curAvg !== null && (
                            <ReferenceLine
                              y={curAvg}
                              stroke={COLORS[key].stroke}
                              strokeDasharray="4 3"
                              strokeOpacity={0.5}
                              strokeWidth={1}
                            />
                          )}
                          <Area
                            type="monotone"
                            dataKey={dataKey}
                            name={tooltipName}
                            stroke={COLORS[key].stroke}
                            strokeWidth={2}
                            fill={`url(#grad-${key})`}
                            dot={false}
                            connectNulls={false}
                            activeDot={{ r: 3, strokeWidth: 0 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Mini stats */}
                    <div className="mt-2 flex gap-4 text-[10px] text-muted-foreground">
                      <span>Min: <strong className="text-foreground">{minVal !== null ? minVal.toFixed(1) : "—"}</strong></span>
                      <span>Max: <strong className="text-foreground">{maxVal !== null ? maxVal.toFixed(1) : "—"}</strong></span>
                      <span>Days logged: <strong className="text-foreground">{validVals.length}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Sleep vs Fatigue Correlation ── */}
            {sleepFatiguePairs.length >= 3 && (
              <div className="rounded-xl bg-card p-4 shadow-soft">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔗</span>
                    <span className="text-sm font-semibold text-foreground">Sleep → Next-Day Fatigue</span>
                  </div>
                  {correlationR !== null && (
                    <span className="text-xs font-mono font-bold text-muted-foreground">
                      r = {correlationR.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Each dot = one night's sleep paired with the following day's fatigue score.
                </p>

                {/* Scatter plot */}
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        type="number"
                        dataKey="sleep"
                        name="Sleep"
                        domain={[0, 12]}
                        ticks={[0, 2, 4, 6, 8, 10, 12]}
                        tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: "Sleep hrs", position: "insideBottom", offset: -2, fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        type="number"
                        dataKey="fatigue"
                        name="Fatigue"
                        domain={[0, 10]}
                        ticks={[0, 2, 4, 6, 8, 10]}
                        tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: "Fatigue", angle: -90, position: "insideLeft", offset: 12, fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                      />
                      <ZAxis range={[28, 28]} />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-card text-xs">
                              <p className="text-foreground">💤 <strong>{payload[0]?.value}</strong> hrs sleep</p>
                              <p className="text-foreground">🔋 <strong>{payload[1]?.value}</strong> fatigue next day</p>
                            </div>
                          );
                        }}
                      />
                      <Scatter
                        data={sleepFatiguePairs}
                        fill={COLORS.fatigue.stroke}
                        fillOpacity={0.75}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary pill */}
                {corrLabel && (
                  <div className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs ${
                    corrLabel.positive === false
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    <span className="text-base leading-none">{corrLabel.emoji}</span>
                    <div>
                      <p className="font-medium text-foreground">{corrLabel.text}</p>
                      <p className="mt-0.5 text-muted-foreground">
                        Based on {sleepFatiguePairs.length} consecutive day pairs
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* ── Symptom Correlation Matrix ── */}
            <SymptomCorrelationMatrix entries={allEntries} />

            {/* ── Relapse Risk Indicator ── */}
            <div data-tour="insights-risk">
              <RelapseRiskIndicator />
            </div>
            <ContactNeurologistCard />

            {/* ── Relapse Timeline ── */}
            <RelapseTimeline />
            <RelapseTrendCard />
            <RelapseFreeStreak />
            <RelapseSymptomBreakdown />
            <RelapseTriggerBreakdown />
            <RelapseSeverityChart />
            <RelapseRecoveryTime />
            <ActiveRelapseDuration />
            <RelapseTreatmentSummary />
            <RelapseNotesTimeline />
            <RelapseYearComparison />
            <RelapseFrequencyTrend />

            {/* ── Mood Tags Breakdown ── */}
            {(() => {
              const tagCounts: Record<string, number> = {};
              windowEntries.forEach((e) => {
                (e.mood_tags ?? []).forEach((tag) => {
                  tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
                });
              });

              const sorted = Object.entries(tagCounts)
                .sort((a, b) => b[1] - a[1]);

              if (sorted.length === 0) return null;

              const max = sorted[0][1];

              return (
                <div className="rounded-xl bg-card p-4 shadow-soft">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏷️</span>
                      <span className="text-sm font-semibold text-foreground">Mood Tags</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{range}-day view</span>
                  </div>
                  <div className="space-y-2.5">
                    {sorted.map(([tag, count]) => {
                      const sentiment = MOOD_TAG_SENTIMENT[tag] ?? "neutral";
                      const emoji = MOOD_TAG_META[tag] ?? "🏷️";
                      const pct = (count / max) * 100;
                      const barColor =
                        sentiment === "positive" ? "hsl(145 45% 45%)" :
                        sentiment === "negative" ? "hsl(0 72% 51%)"   :
                        "hsl(var(--muted-foreground))";
                      return (
                        <div key={tag} className="flex items-center gap-3">
                          <span className="w-5 text-center text-sm flex-shrink-0">{emoji}</span>
                          <span className="w-20 text-xs text-foreground flex-shrink-0 truncate">{tag}</span>
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: barColor }}
                            />
                          </div>
                          <span className="w-8 text-right text-xs font-semibold text-foreground flex-shrink-0">
                            {count}×
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />Positive
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-destructive inline-block" />Negative
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground inline-block" />Neutral
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* ── CTA ── */}
            <button
              onClick={() => navigate("/reports")}
              className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]"
            >
              📄 Generate Doctor Report
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Export a professional PDF for your neurologist
            </p>
          </AnimatedList>
        )}
      </div>
    </>
  );
};

export default InsightsPage;
