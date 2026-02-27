import { useState } from "react";
import { Sparkles, Loader2, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ExerciseLog } from "@/hooks/useLifestyleTracking";

interface Props {
  exerciseLogs: ExerciseLog[];
  symptomEntries: { date: string; fatigue: number | null; mood: number | null; pain: number | null }[];
  msType: string | null;
}

interface Suggestion {
  exercise: string;
  duration: string;
  intensity: string;
  reason: string;
  alternative: string;
  caution: string | null;
}

export default function ExerciseDailySuggestion({ exerciseLogs, symptomEntries, msType }: Props) {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("exercise-correlation", {
        body: {
          exerciseLogs: exerciseLogs.slice(0, 14).map(l => ({
            date: l.date, type: l.type, duration: l.duration_minutes, intensity: l.intensity,
          })),
          symptomEntries: symptomEntries.slice(-7),
          msType,
          mode: "daily_suggestion",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSuggestion(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to get suggestion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold text-foreground">Today's Suggestion</h3>
      </div>

      {!suggestion ? (
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">Get a personalized exercise recommendation based on your recent symptoms and activity.</p>
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? "Thinking…" : "Suggest Exercise"}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 rounded-lg bg-primary/5 p-3">
            <Dumbbell className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">{suggestion.exercise}</p>
              <p className="text-xs text-muted-foreground">{suggestion.duration} · {suggestion.intensity} intensity</p>
            </div>
          </div>

          <p className="text-xs text-foreground leading-relaxed">{suggestion.reason}</p>

          {suggestion.alternative && (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Alternative:</span> {suggestion.alternative}
            </p>
          )}

          {suggestion.caution && (
            <div className="rounded-lg bg-amber-500/10 px-3 py-2">
              <p className="text-xs text-amber-700 dark:text-amber-400">⚠️ {suggestion.caution}</p>
            </div>
          )}

          <button
            onClick={generate}
            disabled={loading}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            New suggestion
          </button>
        </div>
      )}
    </div>
  );
}
