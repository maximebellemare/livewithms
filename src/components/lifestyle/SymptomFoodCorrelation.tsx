import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePremium } from "@/hooks/usePremium";
import PremiumGate from "@/components/PremiumGate";
import { useMealLogs } from "@/hooks/useMealLogs";
import { useEntries } from "@/hooks/useEntries";
import { useUserDietPlan, useDietPlans, Recipe } from "@/hooks/useDietPlans";
import { useMemo } from "react";

interface FoodInsight {
  emoji: string;
  title: string;
  body: string;
  sentiment: "positive" | "warning" | "neutral";
  foods: string[];
  symptom: string;
}

export default function SymptomFoodCorrelation() {
  const { isPremium } = usePremium();
  const { data: mealLogs = [] } = useMealLogs(30);
  const { data: allEntries = [] } = useEntries();
  const { data: userDietPlan } = useUserDietPlan();
  const { data: dietPlans = [] } = useDietPlans();
  const entries = useMemo(() => allEntries.slice(0, 30), [allEntries]);

  // Merge manual meal logs with planned meals from the active diet plan
  const combinedMeals = useMemo(() => {
    const meals = [...mealLogs];
    if (userDietPlan?.weekly_selections) {
      const plan = dietPlans.find(p => p.id === userDietPlan.plan_id);
      const allRecipes = plan?.recipes ?? [];
      const swaps = userDietPlan.swapped_recipes ?? {};
      Object.entries(userDietPlan.weekly_selections).forEach(([day, dayMeals]) => {
        Object.entries(dayMeals as Record<string, string>).forEach(([mealType, recipeId]) => {
          const recipe: Recipe | undefined = swaps[recipeId] ?? allRecipes.find(r => r.id === recipeId);
          const name = recipe?.name ?? recipeId;
          // Only add if not already in meal logs (avoid duplicates)
          const isDuplicate = meals.some(m => m.name === name && m.meal_type === mealType);
          if (!isDuplicate) {
            meals.push({
              id: `plan-${day}-${mealType}`,
              user_id: "",
              date: day,
              meal_type: mealType,
              name,
              notes: recipe?.ingredients?.join(", ") ?? null,
              created_at: "",
            });
          }
        });
      });
    }
    return meals;
  }, [mealLogs, userDietPlan, dietPlans]);

  const [insights, setInsights] = useState<FoodInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  if (!isPremium) return <PremiumGate feature="Symptom-Food Correlation" compact />;

  const handleAnalyze = async () => {
    if (combinedMeals.length < 5) { toast.error("Log at least 5 meals to see correlations"); return; }
    if (entries.length < 5) { toast.error("Log at least 5 daily entries to see correlations"); return; }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("symptom-food-correlation", {
        body: { meal_logs: combinedMeals.slice(0, 50), daily_entries: entries.slice(0, 30) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setInsights(data.insights || []);
      setHasRun(true);
    } catch (e: any) {
      toast.error(e.message || "Failed to analyze correlations");
    } finally {
      setIsLoading(false);
    }
  };

  const sentimentStyles = {
    positive: "border-green-500/20 bg-green-500/5",
    warning: "border-amber-500/20 bg-amber-500/5",
    neutral: "border-border bg-card",
  };

  const sentimentIcons = {
    positive: <TrendingUp className="h-4 w-4 text-green-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    neutral: <Lightbulb className="h-4 w-4 text-primary" />,
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/50 to-card p-4 border border-primary/15 shadow-soft">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Symptom-Food Correlation</h3>
            <p className="text-[11px] text-muted-foreground">AI analyzes how your diet affects symptoms</p>
          </div>
        </div>

        <button onClick={handleAnalyze} disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-all">
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</> : <><Sparkles className="h-4 w-4" /> Analyze My Diet</>}
        </button>

        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Based on {combinedMeals.length} meals & {entries.length} symptom entries
        </p>
      </div>

      <AnimatePresence>
        {hasRun && insights.length === 0 && !isLoading && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground text-center py-4">
            No clear patterns found yet. Keep logging for more insights!
          </motion.p>
        )}

        {insights.map((insight, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`rounded-xl border p-4 shadow-soft ${sentimentStyles[insight.sentiment]}`}>
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{insight.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-foreground">{insight.title}</h4>
                  {sentimentIcons[insight.sentiment]}
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">{insight.body}</p>
                {insight.foods?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {insight.foods.map((f, j) => (
                      <span key={j} className="text-[10px] bg-secondary/80 text-muted-foreground px-2 py-0.5 rounded-full">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
