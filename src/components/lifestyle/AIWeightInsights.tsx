import { useState } from "react";
import { Sparkles, AlertTriangle, Lightbulb, TrendingUp, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { WeightLog } from "@/hooks/useLifestyleTracking";

interface WeightInsights {
  weekly_summary: string;
  recommendations: string[];
  anomalies: string[];
  correlation_insight: string | null;
}

interface Props {
  weightLogs: WeightLog[];
  symptomEntries: { date: string; fatigue: number | null; mood: number | null; pain: number | null; brain_fog: number | null }[];
  profile: { ms_type?: string | null; height_cm?: number | null; goal_weight?: number | null; goal_weight_unit?: string } | null;
}

export default function AIWeightInsights({ weightLogs, symptomEntries, profile }: Props) {
  const [insights, setInsights] = useState<WeightInsights | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (weightLogs.length < 2) {
      toast.error("Log at least 2 weight entries first");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("weight-insights", {
        body: { weightLogs, symptomEntries, profile },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setInsights(data);
    } catch {
      toast.error("Failed to generate insights");
    } finally {
      setLoading(false);
    }
  };

  if (!insights) {
    return (
      <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 text-center space-y-2">
        <Sparkles className="h-5 w-5 text-primary mx-auto" />
        <p className="text-xs text-muted-foreground">Get AI-powered weight insights tailored to your MS journey</p>
        <button
          onClick={generate}
          disabled={loading || weightLogs.length < 2}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5"
        >
          {loading ? (
            <><RefreshCw className="h-3 w-3 animate-spin" />Analyzing…</>
          ) : (
            <><Sparkles className="h-3 w-3" />Generate Insights</>
          )}
        </button>
        {weightLogs.length < 2 && (
          <p className="text-[10px] text-muted-foreground">Log at least 2 weight entries to unlock</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Weekly Summary */}
      <div className="rounded-xl bg-card p-4 shadow-soft space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm font-semibold text-foreground">AI Weight Summary</h3>
          </div>
          <button onClick={generate} disabled={loading} className="text-muted-foreground hover:text-primary">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{insights.weekly_summary}</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary animate-[sparkle-in_0.4s_ease-out]">
          ✨ AI-generated
        </span>
      </div>

      {/* Anomaly Alerts */}
      {insights.anomalies.length > 0 && (
        <div className="rounded-xl bg-destructive/5 border border-destructive/15 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <p className="text-xs font-semibold text-foreground">Anomaly Alerts</p>
          </div>
          {insights.anomalies.map((a, i) => (
            <p key={i} className="text-[11px] text-muted-foreground leading-relaxed">⚠️ {a}</p>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <div className="rounded-xl bg-card p-4 shadow-soft space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h3 className="font-display text-sm font-semibold text-foreground">Smart Recommendations</h3>
          </div>
          <div className="space-y-1.5">
            {insights.recommendations.map((r, i) => (
              <p key={i} className="text-xs text-muted-foreground leading-relaxed">💡 {r}</p>
            ))}
          </div>
        </div>
      )}

      {/* Correlation Insight */}
      {insights.correlation_insight && (
        <div className="rounded-xl bg-accent/30 border border-accent/40 p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            📊 {insights.correlation_insight}
          </p>
        </div>
      )}
    </div>
  );
}
