import { useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DailyEntry } from "@/hooks/useEntries";

interface AIWeeklyInsightProps {
  entries: DailyEntry[];
  range: 7 | 30;
}

const AIWeeklyInsight = ({ entries, range }: AIWeeklyInsightProps) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("weekly-insight", {
        body: { entries, range },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "Could not generate insight", description: data.error, variant: "destructive" });
        return;
      }
      setInsight(data.insight ?? null);
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate insight. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft border border-primary/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </span>
          <span className="text-sm font-semibold text-foreground">AI Weekly Insight</span>
        </div>
        {insight && (
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Regenerate insight"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Regenerate
          </button>
        )}
      </div>

      {/* Body */}
      {insight ? (
        <p className="text-sm leading-relaxed text-foreground">{insight}</p>
      ) : (
        <div className="flex flex-col items-center py-3 gap-3">
          <p className="text-xs text-muted-foreground text-center">
            Get a plain-language summary of your {range}-day symptom patterns, written just for you.
          </p>
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Analysing…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Generate insight
              </>
            )}
          </button>
        </div>
      )}

      {loading && insight && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <RefreshCw className="h-2.5 w-2.5 animate-spin" />
          Refreshing…
        </div>
      )}

    </div>
  );
};

export default AIWeeklyInsight;
