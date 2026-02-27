import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, TrendingUp, AlertTriangle, Lightbulb, ShieldCheck, ShieldAlert, UtensilsCrossed, Ban, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePremium } from "@/hooks/usePremium";
import PremiumGate from "@/components/PremiumGate";
import { useMealLogs } from "@/hooks/useMealLogs";
import { useEntries } from "@/hooks/useEntries";
import { useUserDietPlan, useDietPlans, Recipe } from "@/hooks/useDietPlans";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const entries = useMemo(() => allEntries.slice(0, 30), [allEntries]);
  const excludedIngredients = profile?.excluded_ingredients ?? [];

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
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);

  const matchingMeals = useMemo(() => {
    if (!selectedIngredient) return [];
    const q = selectedIngredient.toLowerCase();
    return combinedMeals.filter(m =>
      m.name.toLowerCase().includes(q) || m.notes?.toLowerCase().includes(q)
    );
  }, [selectedIngredient, combinedMeals]);

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
        {hasRun && insights.length > 0 && (() => {
          const beneficial = new Set<string>();
          const problematic = new Set<string>();
          insights.forEach(i => {
            i.foods?.forEach(f => {
              if (i.sentiment === "positive") beneficial.add(f);
              else if (i.sentiment === "warning") problematic.add(f);
            });
          });
          // Remove items that appear in both
          beneficial.forEach(f => { if (problematic.has(f)) { beneficial.delete(f); problematic.delete(f); } });
          if (beneficial.size === 0 && problematic.size === 0) return null;
          return (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-4 shadow-soft space-y-3">
              <h4 className="text-xs font-semibold text-foreground tracking-wide uppercase">Ingredient Impact Summary</h4>
              {beneficial.size > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-[11px] font-medium text-green-600 dark:text-green-400">Beneficial</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[...beneficial].map((f, j) => (
                      <button key={j} onClick={() => setSelectedIngredient(f)} className="text-[10px] font-medium bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20 px-2 py-0.5 rounded-full hover:bg-green-500/20 transition-colors cursor-pointer">✓ {f}</button>
                    ))}
                  </div>
                </div>
              )}
              {problematic.size > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Watch Out</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[...problematic].map((f, j) => (
                      <button key={j} onClick={() => setSelectedIngredient(f)} className="text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full hover:bg-amber-500/20 transition-colors cursor-pointer">⚠ {f}</button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })()}

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

      <Dialog open={!!selectedIngredient} onOpenChange={(open) => !open && setSelectedIngredient(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <UtensilsCrossed className="h-4 w-4 text-primary" />
              Meals with "{selectedIngredient}"
            </DialogTitle>
            <DialogDescription>
              {matchingMeals.length > 0
                ? `Found in ${matchingMeals.length} meal${matchingMeals.length > 1 ? "s" : ""}`
                : "No exact matches found in your logged meals"}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {matchingMeals.map((m, i) => (
              <div key={m.id || i} className="rounded-lg border border-border bg-secondary/30 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{m.name}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{m.meal_type}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">{m.date}</span>
              </div>
            ))}
          </div>
          {selectedIngredient && !excludedIngredients.includes(selectedIngredient.toLowerCase()) && (
            <button
              onClick={async () => {
                const updated = [...excludedIngredients, selectedIngredient!.toLowerCase()];
                await updateProfile.mutateAsync({ excluded_ingredients: updated } as any);
                toast.success(`"${selectedIngredient}" will be excluded from future AI meal plans`);
                setSelectedIngredient(null);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Ban className="h-3.5 w-3.5" />
              Exclude from future meal plans
            </button>
          )}
          {selectedIngredient && excludedIngredients.includes(selectedIngredient.toLowerCase()) && (
            <p className="text-xs text-muted-foreground text-center py-1">
              ✓ Already excluded from AI meal plans
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Excluded ingredients list */}
      {excludedIngredients.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-3 shadow-soft">
          <div className="flex items-center gap-1.5 mb-2">
            <Ban className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-medium text-muted-foreground">Excluded from AI meal plans</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {excludedIngredients.map((ing, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded-full">
                {ing}
                <button
                  onClick={async () => {
                    const updated = excludedIngredients.filter(x => x !== ing);
                    await updateProfile.mutateAsync({ excluded_ingredients: updated } as any);
                    toast.success(`"${ing}" removed from exclusions`);
                  }}
                  className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
