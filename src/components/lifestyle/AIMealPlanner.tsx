import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Wand2, Brain, Pill, Zap, TrendingUp, Lightbulb, Flame, Fish, Shield, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePremium } from "@/hooks/usePremium";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import PremiumGate from "@/components/PremiumGate";
import {
  useDietPlans, useUserDietPlan, useUpdateWeeklySelections,
  type Recipe, type WeeklySelections,
} from "@/hooks/useDietPlans";

interface DayNutrition {
  calories: number;
  omega3_mg: number;
  anti_inflammatory_score: number;
  top_nutrients: string[];
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};

export default function AIMealPlanner() {
  const { isPremium } = usePremium();
  const { data: plans = [] } = useDietPlans();
  const { data: userPlan } = useUserDietPlan();
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const updateWeekly = useUpdateWeeklySelections();
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingDay, setRegeneratingDay] = useState<string | null>(null);
  const [preferences, setPreferences] = useState("");
  const [reasoning, setReasoning] = useState<string[]>([]);
  const [dailyNutrition, setDailyNutrition] = useState<Record<string, DayNutrition>>({});
  const [selectedNutrDay, setSelectedNutrDay] = useState(0);
  const [generatedMealNames, setGeneratedMealNames] = useState<string[]>([]);
  const [mealRatings, setMealRatings] = useState<Record<string, "up" | "down">>({});

  const plan = plans.find(p => p.id === userPlan?.plan_id);
  const dietName = plan?.name || "";

  // Load existing ratings
  useEffect(() => {
    if (!user?.id || !dietName) return;
    supabase
      .from("meal_ratings")
      .select("meal_name, rating")
      .eq("user_id", user.id)
      .eq("diet_plan", dietName)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, "up" | "down"> = {};
          data.forEach((r: any) => { map[r.meal_name] = r.rating; });
          setMealRatings(map);
        }
      });
  }, [user?.id, dietName]);

  const handleRate = useCallback(async (mealName: string, rating: "up" | "down") => {
    if (!user?.id) return;
    const existing = mealRatings[mealName];
    const newRatings = { ...mealRatings };

    if (existing === rating) {
      // Toggle off
      delete newRatings[mealName];
      setMealRatings(newRatings);
      await supabase.from("meal_ratings").delete()
        .eq("user_id", user.id).eq("meal_name", mealName).eq("diet_plan", dietName);
    } else {
      newRatings[mealName] = rating;
      setMealRatings(newRatings);
      await supabase.from("meal_ratings").upsert(
        { user_id: user.id, meal_name: mealName, rating, diet_plan: dietName },
        { onConflict: "user_id,meal_name,diet_plan" }
      );
    }
  }, [user?.id, mealRatings, dietName]);

  if (!isPremium) {
    return <PremiumGate feature="AI Meal Planner" />;
  }

  if (!plan || !userPlan) {
    return (
      <div className="rounded-xl bg-card border border-border p-4 shadow-soft text-center">
        <Wand2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Select a diet plan first, then use AI to auto-fill your weekly meals.</p>
      </div>
    );
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    setReasoning([]);
    setDailyNutrition({});
    setGeneratedMealNames([]);
    try {
      const { data, error } = await supabase.functions.invoke("ai-meal-planner", {
        body: {
          recipes: plan.recipes,
          diet_name: plan.name,
          preferences: preferences.trim() || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const generatedPlan = data.plan as WeeklySelections;
      await updateWeekly.mutateAsync({
        userDietPlanId: userPlan.id,
        weekly_selections: generatedPlan,
      });

      if (data.reasoning?.length) {
        setReasoning(data.reasoning);
      }
      if (data.daily_nutrition && Object.keys(data.daily_nutrition).length > 0) {
        setDailyNutrition(data.daily_nutrition);
        setSelectedNutrDay(0);
      }

      // Extract unique meal names for rating
      const recipes = plan.recipes as any[];
      const recipeMap = new Map(recipes.map((r: any) => [r.id, r.name]));
      const names = new Set<string>();
      for (const day of Object.values(generatedPlan)) {
        for (const val of Object.values(day as Record<string, string>)) {
          if (val.startsWith("custom:")) {
            names.add(val.replace("custom:", ""));
          } else if (recipeMap.has(val)) {
            names.add(recipeMap.get(val)!);
          }
        }
      }
      setGeneratedMealNames(Array.from(names));

      toast.success("Personalized meal plan generated! 🎉");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate meal plan");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateDay = async (day: string) => {
    setRegeneratingDay(day);
    try {
      const { data, error } = await supabase.functions.invoke("ai-meal-planner", {
        body: {
          recipes: plan.recipes,
          diet_name: plan.name,
          preferences: preferences.trim() || undefined,
          single_day: day,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const dayPlan = data.plan as WeeklySelections;
      // Merge the single day into existing selections
      const currentSelections = userPlan.weekly_selections || {};
      const merged: WeeklySelections = { ...currentSelections, ...dayPlan };
      await updateWeekly.mutateAsync({
        userDietPlanId: userPlan.id,
        weekly_selections: merged,
      });

      // Update daily nutrition for just this day
      if (data.daily_nutrition?.[day]) {
        setDailyNutrition(prev => ({ ...prev, [day]: data.daily_nutrition[day] }));
      }

      if (data.reasoning?.length) {
        setReasoning(data.reasoning);
      }

      toast.success(`${DAY_LABELS[day]} meals regenerated! 🔄`);
    } catch (e: any) {
      toast.error(e.message || "Failed to regenerate day");
    } finally {
      setRegeneratingDay(null);
    }
  };


  const signals: { icon: typeof Brain; label: string }[] = [];
  if (profile?.ms_type) signals.push({ icon: Brain, label: profile.ms_type });
  if (profile?.symptoms?.length) signals.push({ icon: TrendingUp, label: `${profile.symptoms.length} symptoms tracked` });
  if (profile?.medications?.length) signals.push({ icon: Pill, label: `${profile.medications.length} medications` });
  signals.push({ icon: Zap, label: "Energy-aware" });

  // Nutrition helpers
  const nutritionDays = DAYS.filter(d => dailyNutrition[d]);
  const currentDay = nutritionDays[selectedNutrDay];
  const currentNutr = currentDay ? dailyNutrition[currentDay] : null;

  const weeklyAvg = nutritionDays.length > 0 ? {
    calories: Math.round(nutritionDays.reduce((s, d) => s + (dailyNutrition[d]?.calories || 0), 0) / nutritionDays.length),
    omega3: Math.round(nutritionDays.reduce((s, d) => s + (dailyNutrition[d]?.omega3_mg || 0), 0) / nutritionDays.length),
    antiInflam: (nutritionDays.reduce((s, d) => s + (dailyNutrition[d]?.anti_inflammatory_score || 0), 0) / nutritionDays.length).toFixed(1),
  } : null;

  const scoreColor = (score: number) =>
    score >= 8 ? "text-green-500" : score >= 5 ? "text-yellow-500" : "text-red-400";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/50 to-card p-4 border border-primary/15 shadow-soft">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Meal Planner</h3>
            <p className="text-[11px] text-muted-foreground">Personalized to your MS profile, symptoms & medications</p>
          </div>
        </div>

        {/* Personalization signals */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {signals.map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1 rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] text-muted-foreground">
              <Icon className="h-2.5 w-2.5" />
              {label}
            </span>
          ))}
        </div>

        <input
          type="text"
          value={preferences}
          onChange={e => setPreferences(e.target.value)}
          placeholder="Any preferences? (e.g. 'no dairy', 'quick meals only')"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 mb-3"
          maxLength={200}
        />

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all"
        >
          {isGenerating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing your profile & generating…</>
          ) : (
            <><Wand2 className="h-4 w-4" /> Generate Personalized Plan</>
          )}
        </button>

        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Uses your symptoms, medications, energy level & recent trends to tailor meals.
        </p>
      </div>

      {/* Daily Nutrition Breakdown */}
      <AnimatePresence>
        {nutritionDays.length > 0 && currentNutr && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl bg-gradient-to-br from-green-500/10 via-card to-card p-4 border border-green-500/15 shadow-soft"
          >
            {/* Header with day nav */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/15">
                  <Flame className="h-3.5 w-3.5 text-green-500" />
                </div>
                <h4 className="text-xs font-semibold text-foreground">Daily Nutrition</h4>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedNutrDay(p => Math.max(0, p - 1))}
                  disabled={selectedNutrDay === 0}
                  className="p-0.5 rounded hover:bg-secondary/60 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <span className="text-[11px] font-medium text-foreground min-w-[28px] text-center">
                  {DAY_LABELS[currentDay]}
                </span>
                <button
                  onClick={() => setSelectedNutrDay(p => Math.min(nutritionDays.length - 1, p + 1))}
                  disabled={selectedNutrDay === nutritionDays.length - 1}
                  className="p-0.5 rounded hover:bg-secondary/60 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleRegenerateDay(currentDay)}
                  disabled={!!regeneratingDay}
                  className="p-1 rounded-md hover:bg-secondary/60 disabled:opacity-40 transition-colors ml-1"
                  title={`Regenerate ${DAY_LABELS[currentDay]} meals`}
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${regeneratingDay === currentDay ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="rounded-xl bg-secondary/40 p-2.5 text-center">
                <Flame className="h-3.5 w-3.5 text-orange-400 mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{currentNutr.calories}</p>
                <p className="text-[9px] text-muted-foreground">Calories</p>
              </div>
              <div className="rounded-xl bg-secondary/40 p-2.5 text-center">
                <Fish className="h-3.5 w-3.5 text-blue-400 mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{currentNutr.omega3_mg >= 1000 ? `${(currentNutr.omega3_mg / 1000).toFixed(1)}g` : `${currentNutr.omega3_mg}mg`}</p>
                <p className="text-[9px] text-muted-foreground">Omega-3</p>
              </div>
              <div className="rounded-xl bg-secondary/40 p-2.5 text-center">
                <Shield className="h-3.5 w-3.5 text-green-400 mx-auto mb-1" />
                <p className={`text-sm font-bold ${scoreColor(currentNutr.anti_inflammatory_score)}`}>
                  {currentNutr.anti_inflammatory_score}/10
                </p>
                <p className="text-[9px] text-muted-foreground">Anti-inflam.</p>
              </div>
            </div>

            {/* Top nutrients */}
            {currentNutr.top_nutrients?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {currentNutr.top_nutrients.map(n => (
                  <span key={n} className="rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[10px] text-green-400 font-medium">
                    {n}
                  </span>
                ))}
              </div>
            )}

            {/* Weekly average bar */}
            {weeklyAvg && (
              <div className="rounded-lg bg-secondary/30 px-3 py-2 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-medium">Weekly avg</span>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>{weeklyAvg.calories} cal</span>
                  <span className="text-blue-400">{weeklyAvg.omega3 >= 1000 ? `${(weeklyAvg.omega3 / 1000).toFixed(1)}g` : `${weeklyAvg.omega3}mg`} ω-3</span>
                  <span className={scoreColor(parseFloat(weeklyAvg.antiInflam))}>{weeklyAvg.antiInflam}/10 AI</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reasoning summary card */}
      <AnimatePresence>
        {reasoning.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl bg-gradient-to-br from-accent/60 via-card to-card p-4 border border-primary/10 shadow-soft"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
                <Lightbulb className="h-3.5 w-3.5 text-primary" />
              </div>
              <h4 className="text-xs font-semibold text-foreground">Why these meals?</h4>
            </div>
            <ul className="space-y-2">
              {reasoning.map((reason, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span>{reason}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meal Ratings */}
      <AnimatePresence>
        {generatedMealNames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl bg-gradient-to-br from-secondary/40 via-card to-card p-4 border border-border shadow-soft"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
                <ThumbsUp className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">Rate these meals</h4>
                <p className="text-[10px] text-muted-foreground">Your feedback improves future plans</p>
              </div>
            </div>

            <div className="mt-2 space-y-1">
              {generatedMealNames.map((name, i) => {
                const rating = mealRatings[name];
                return (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-secondary/30 transition-colors"
                  >
                    <span className="text-xs text-foreground truncate mr-2">{name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleRate(name, "up")}
                        className={`p-1 rounded-md transition-all ${
                          rating === "up"
                            ? "bg-green-500/20 text-green-500"
                            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                        }`}
                        aria-label={`Like ${name}`}
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleRate(name, "down")}
                        className={`p-1 rounded-md transition-all ${
                          rating === "down"
                            ? "bg-red-400/20 text-red-400"
                            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                        }`}
                        aria-label={`Dislike ${name}`}
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Summary */}
            {Object.keys(mealRatings).length > 0 && (
              <div className="mt-2 rounded-lg bg-secondary/30 px-3 py-1.5 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Your ratings</span>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-green-500">
                    {Object.values(mealRatings).filter(r => r === "up").length} 👍
                  </span>
                  <span className="text-red-400">
                    {Object.values(mealRatings).filter(r => r === "down").length} 👎
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
