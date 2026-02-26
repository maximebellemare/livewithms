import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2, Star, Target, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePremium } from "@/hooks/usePremium";
import PremiumGate from "@/components/PremiumGate";
import { useMealLogs } from "@/hooks/useMealLogs";
import { useEntries } from "@/hooks/useEntries";
import { useProfile } from "@/hooks/useProfile";
import { useDietPlans, useUserDietPlan } from "@/hooks/useDietPlans";

interface CoachingTip {
  emoji: string;
  title: string;
  body: string;
  priority: "high" | "medium" | "low";
}

interface CoachingResult {
  greeting: string;
  tips: CoachingTip[];
  weekly_focus: string;
}

const priorityStyles = {
  high: "border-primary/25 bg-primary/5",
  medium: "border-border bg-card",
  low: "border-border bg-secondary/30",
};

export default function NutritionCoaching() {
  const { isPremium } = usePremium();
  const { data: mealLogs = [] } = useMealLogs(30);
  const { data: allEntries = [] } = useEntries();
  const entries = useMemo(() => allEntries.slice(0, 14), [allEntries]);
  const { data: profile } = useProfile();
  const { data: plans = [] } = useDietPlans();
  const { data: userPlan } = useUserDietPlan();
  const [result, setResult] = useState<CoachingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const activePlan = plans.find(p => p.id === userPlan?.plan_id);

  if (!isPremium) return <PremiumGate feature="Nutrition Coaching" compact />;

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("nutrition-coaching", {
        body: {
          meal_logs: mealLogs.slice(0, 30),
          daily_entries: entries.slice(0, 14),
          ms_type: profile?.ms_type,
          symptoms: profile?.symptoms,
          diet_name: activePlan?.name,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      setExpanded(true);
    } catch (e: any) {
      toast.error(e.message || "Failed to get coaching tips");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/50 to-card p-4 border border-primary/15 shadow-soft">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Nutrition Coach</h3>
            <p className="text-[11px] text-muted-foreground">Personalized weekly diet tips from AI</p>
          </div>
        </div>

        <button onClick={handleGenerate} disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-all">
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating tips…</> : <><Brain className="h-4 w-4" /> Get Weekly Tips</>}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {result.greeting && (
              <p className="text-sm text-foreground/80 italic px-1">{result.greeting}</p>
            )}

            {result.weekly_focus && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
                <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wide">This Week's Focus</p>
                  <p className="text-sm text-foreground/90 mt-0.5">{result.weekly_focus}</p>
                </div>
              </div>
            )}

            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "" : "-rotate-90"}`} />
              {result.tips.length} personalized tips
            </button>

            {expanded && result.tips.map((tip, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className={`rounded-xl border p-3 shadow-soft ${priorityStyles[tip.priority]}`}>
                <div className="flex items-start gap-2.5">
                  <span className="text-lg flex-shrink-0">{tip.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{tip.title}</h4>
                      {tip.priority === "high" && <Star className="h-3 w-3 text-primary fill-primary" />}
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed mt-1">{tip.body}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
