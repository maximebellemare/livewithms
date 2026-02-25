import { useState } from "react";
import { Sparkles, RefreshCw, Crown, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEntries } from "@/hooks/useEntries";
import { useRelapses } from "@/hooks/useRelapses";
import { useDbMedications, useDbMedicationLogs } from "@/hooks/useMedications";
import { useProfile } from "@/hooks/useProfile";
import { format, subDays } from "date-fns";
import PremiumGate from "@/components/PremiumGate";

const MonthlyHealthReview = () => {
  const [review, setReview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { data: entries = [] } = useEntries();
  const { data: relapses = [] } = useRelapses();
  const { data: meds = [] } = useDbMedications();
  const { data: profile } = useProfile();

  const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const recentEntries = entries.filter((e) => e.date >= thirtyDaysAgo);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("monthly-health-review", {
        body: {
          entries: recentEntries,
          relapses: relapses.slice(0, 5),
          medications: meds.map((m) => m.name),
          msType: profile?.ms_type,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Could not generate review", description: data.error, variant: "destructive" });
        return;
      }
      setReview(data.review ?? null);
    } catch {
      toast({ title: "Error", description: "Failed to generate review. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumGate feature="AI Monthly Health Review">
      <div className="rounded-xl bg-card p-5 shadow-soft border border-primary/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </span>
            <div>
              <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                Monthly Health Review
                <Crown className="h-3 w-3 text-primary" />
              </span>
              <p className="text-[10px] text-muted-foreground">
                <Calendar className="inline h-2.5 w-2.5 mr-0.5" />
                Based on last 30 days
              </p>
            </div>
          </div>
          {review && (
            <button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Regenerate
            </button>
          )}
        </div>

        {review ? (
          <div className="text-sm leading-relaxed text-foreground whitespace-pre-line">{review}</div>
        ) : (
          <div className="flex flex-col items-center py-4 gap-3">
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Get a comprehensive AI-generated summary of your health patterns, top symptom drivers, and personalized recommendations.
            </p>
            <button
              onClick={generate}
              disabled={loading || recentEntries.length < 3}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Analysing…</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5" /> Generate Monthly Review</>
              )}
            </button>
            {recentEntries.length < 3 && (
              <p className="text-[10px] text-muted-foreground">Log at least 3 days to generate a review.</p>
            )}
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <span className="animate-sparkle-in inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/15 px-2.5 py-0.5 text-[9px] font-medium text-primary/80">
            <Sparkles className="h-2.5 w-2.5" />
            AI-generated
          </span>
        </div>
      </div>
    </PremiumGate>
  );
};

export default MonthlyHealthReview;
