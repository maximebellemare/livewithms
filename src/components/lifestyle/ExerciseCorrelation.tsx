import { useState } from "react";
import { Brain, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ExerciseLog } from "@/hooks/useLifestyleTracking";
import ReactMarkdown from "react-markdown";

interface Props {
  exerciseLogs: ExerciseLog[];
  symptomEntries: { date: string; fatigue: number | null; mood: number | null; pain: number | null; brain_fog: number | null }[];
  msType: string | null;
}

interface Insights {
  summary: string;
  best_exercise: { type: string; reason: string };
  worst_days: string;
  recommendations: string[];
  fatigue_insight: string;
  optimal_pattern: string;
}

export default function ExerciseCorrelation({ exerciseLogs, symptomEntries, msType }: Props) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);

  const hasEnoughData = exerciseLogs.length >= 3 && symptomEntries.length >= 3;

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("exercise-correlation", {
        body: {
          exerciseLogs: exerciseLogs.slice(0, 30).map(l => ({
            date: l.date, type: l.type, duration: l.duration_minutes, intensity: l.intensity,
          })),
          symptomEntries: symptomEntries.slice(0, 30),
          msType,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setInsights(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate insights");
    } finally {
      setLoading(false);
    }
  };

  if (!hasEnoughData) {
    return (
      <div className="rounded-xl bg-card p-4 shadow-soft text-center">
        <Brain className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Log at least 3 exercises and 3 daily entries to unlock AI exercise insights.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold text-foreground">Exercise × Symptom Analysis</h3>
      </div>

      {!insights ? (
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">AI will analyze how your exercise patterns affect your MS symptoms.</p>
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? "Analyzing…" : "Generate Insights"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-foreground leading-relaxed">{insights.summary}</p>

          {insights.best_exercise && (
            <div className="rounded-lg bg-emerald-500/10 px-3 py-2.5">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                🏆 Best for you: {insights.best_exercise.type}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-0.5">{insights.best_exercise.reason}</p>
            </div>
          )}

          {insights.fatigue_insight && (
            <div className="rounded-lg bg-accent/50 px-3 py-2.5">
              <p className="text-xs text-accent-foreground leading-relaxed">
                <span className="font-semibold">⚡ Fatigue:</span> {insights.fatigue_insight}
              </p>
            </div>
          )}

          {insights.optimal_pattern && (
            <div className="rounded-lg bg-primary/5 px-3 py-2.5">
              <p className="text-xs text-foreground leading-relaxed">
                <span className="font-semibold">📅 Optimal pattern:</span> {insights.optimal_pattern}
              </p>
            </div>
          )}

          {insights.recommendations?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground">Recommendations:</p>
              {insights.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{r}</p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={generate}
            disabled={loading}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}
