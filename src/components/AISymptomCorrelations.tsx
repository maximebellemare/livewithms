import { useState, useMemo } from "react";
import { Sparkles, RefreshCw, AlertTriangle, ThumbsUp, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DailyEntry } from "@/hooks/useEntries";

interface AISymptomCorrelationsProps {
  entries: DailyEntry[];
  range: 7 | 30;
}

interface InsightCard {
  emoji: string;
  title: string;
  body: string;
  sentiment: "warning" | "positive" | "neutral";
}

const METRICS = [
  { key: "fatigue", label: "Fatigue" },
  { key: "pain", label: "Pain" },
  { key: "brain_fog", label: "Brain Fog" },
  { key: "mood", label: "Mood" },
  { key: "mobility", label: "Mobility" },
  { key: "spasticity", label: "Spasticity" },
  { key: "stress", label: "Stress" },
  { key: "sleep_hours", label: "Sleep" },
  { key: "water_glasses", label: "Hydration" },
] as const;

type MetricKey = typeof METRICS[number]["key"];

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

const AISymptomCorrelations = ({ entries, range }: AISymptomCorrelationsProps) => {
  const [cards, setCards] = useState<InsightCard[] | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Compute all pairwise correlations (same-day + next-day)
  const topCorrelations = useMemo(() => {
    if (entries.length < 5) return [];
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

    type Corr = { metricA: string; metricB: string; r: number; lag: string; pairCount: number };
    const results: Corr[] = [];

    // Same-day correlations
    for (let i = 0; i < METRICS.length; i++) {
      for (let j = i + 1; j < METRICS.length; j++) {
        const a = METRICS[i], b = METRICS[j];
        const pairs = sorted
          .map((e) => ({
            x: e[a.key as keyof DailyEntry] as number | null,
            y: e[b.key as keyof DailyEntry] as number | null,
          }))
          .filter((p): p is { x: number; y: number } => p.x !== null && p.y !== null);
        if (pairs.length < 5) continue;
        const r = pearson(pairs.map((p) => p.x), pairs.map((p) => p.y));
        if (r !== null && Math.abs(r) >= 0.25) {
          results.push({ metricA: a.label, metricB: b.label, r, lag: "same-day", pairCount: pairs.length });
        }
      }
    }

    // Next-day correlations (metric A today → metric B tomorrow)
    const interestingLags: [MetricKey, MetricKey][] = [
      ["sleep_hours", "fatigue"],
      ["sleep_hours", "mood"],
      ["sleep_hours", "brain_fog"],
      ["sleep_hours", "pain"],
      ["stress", "fatigue"],
      ["stress", "pain"],
      ["stress", "sleep_hours"],
      ["mood", "fatigue"],
      ["water_glasses", "fatigue"],
      ["water_glasses", "brain_fog"],
      ["water_glasses", "mood"],
    ];

    for (const [aKey, bKey] of interestingLags) {
      const aLabel = METRICS.find((m) => m.key === aKey)!.label;
      const bLabel = METRICS.find((m) => m.key === bKey)!.label;
      const pairs: { x: number; y: number }[] = [];
      for (let i = 0; i < sorted.length - 1; i++) {
        const today = sorted[i];
        const tomorrow = sorted[i + 1];
        const x = today[aKey as keyof DailyEntry] as number | null;
        const y = tomorrow[bKey as keyof DailyEntry] as number | null;
        if (x !== null && y !== null) pairs.push({ x, y });
      }
      if (pairs.length < 5) continue;
      const r = pearson(pairs.map((p) => p.x), pairs.map((p) => p.y));
      if (r !== null && Math.abs(r) >= 0.25) {
        results.push({ metricA: aLabel, metricB: bLabel, r, lag: "next-day", pairCount: pairs.length });
      }
    }

    // Sort by absolute r descending, take top 6
    return results.sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).slice(0, 6);
  }, [entries]);

  const generate = async () => {
    if (topCorrelations.length === 0) {
      toast({ title: "Not enough data", description: "Log more days to detect patterns.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("symptom-correlations", {
        body: { correlations: topCorrelations },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Could not generate", description: data.error, variant: "destructive" });
        return;
      }
      setCards(data.cards ?? []);
    } catch {
      toast({ title: "Error", description: "Failed to detect patterns. Try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (entries.length < 5) return null;

  const sentimentStyles = {
    warning: "bg-destructive/8 border-destructive/20",
    positive: "bg-emerald-500/8 border-emerald-500/20",
    neutral: "bg-muted border-border",
  };

  const sentimentIcon = {
    warning: <AlertTriangle className="h-3.5 w-3.5 text-destructive" />,
    positive: <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />,
    neutral: <Minus className="h-3.5 w-3.5 text-muted-foreground" />,
  };

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft border border-primary/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </span>
          <div>
            <span className="text-sm font-semibold text-foreground">Symptom Patterns</span>
            <p className="text-[10px] text-muted-foreground">AI-detected correlations</p>
          </div>
        </div>
        {cards && cards.length > 0 && (
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        )}
      </div>

      {cards && cards.length > 0 ? (
        <div className="space-y-2.5">
          {cards.map((card, i) => (
            <div
              key={i}
              className={`rounded-lg border px-3 py-2.5 ${sentimentStyles[card.sentiment] ?? sentimentStyles.neutral}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg leading-none mt-0.5">{card.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-xs font-semibold text-foreground">{card.title}</p>
                    {sentimentIcon[card.sentiment]}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{card.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : cards && cards.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">
          No strong patterns detected yet. Keep logging to reveal connections.
        </p>
      ) : (
        <div className="flex flex-col items-center py-3 gap-3">
          <p className="text-xs text-muted-foreground text-center">
            Discover hidden links between your symptoms — like how sleep affects next-day fatigue or stress impacts pain.
          </p>
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Detecting patterns…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Detect patterns
              </>
            )}
          </button>
        </div>
      )}

      {loading && cards && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <RefreshCw className="h-2.5 w-2.5 animate-spin" />
          Refreshing…
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <span className="animate-sparkle-in inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/15 px-2.5 py-0.5 text-[9px] font-medium text-primary/80">
          <Sparkles className="h-2.5 w-2.5" />
          AI-generated
        </span>
      </div>
    </div>
  );
};

export default AISymptomCorrelations;
