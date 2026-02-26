import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronDown, ChevronRight, Check, ArrowLeft, Shuffle,
  UtensilsCrossed, ShieldCheck, ShieldAlert, ShieldX, Sparkles, RotateCcw, Loader2
} from "lucide-react";
import {
  useDietPlans, useUserDietPlan, useSelectDietPlan, useDeselectDietPlan,
  useSwapRecipe, useResetRecipeSwap, useAISwapSuggestions,
  type DietPlan, type Recipe,
} from "@/hooks/useDietPlans";
import { useProfile } from "@/hooks/useProfile";

// ── Diet Recommendation Engine ──
function getDietRecommendations(plans: DietPlan[], msType: string | null, symptoms: string[]): { planId: string; reason: string }[] {
  const recs: { planId: string; score: number; reason: string }[] = [];
  const sympLower = symptoms.map(s => s.toLowerCase());

  for (const plan of plans) {
    let score = 0;
    let reason = "";
    const name = plan.name.toLowerCase();

    if (name.includes("anti-inflammatory")) {
      score += 3; // good baseline for all MS types
      reason = "Reduces inflammation linked to MS progression";
      if (msType === "RRMS") { score += 2; reason = "Great for managing RRMS flare-ups"; }
      if (sympLower.some(s => s.includes("pain") || s.includes("fatigue"))) score += 1;
    } else if (name.includes("mediterranean")) {
      score += 2;
      reason = "Heart-healthy fats support nerve protection";
      if (sympLower.some(s => s.includes("brain fog") || s.includes("cognitive"))) { score += 2; reason = "Rich in omega-3s that support cognitive function"; }
    } else if (name.includes("low sodium") || name.includes("low-sodium")) {
      score += 1;
      reason = "May help reduce lesion activity";
      if (msType === "PPMS" || msType === "SPMS") { score += 2; reason = "Research links low sodium to slower progression"; }
    } else if (name.includes("high fiber") || name.includes("high-fiber")) {
      score += 1;
      reason = "Supports gut health and immune regulation";
      if (sympLower.some(s => s.includes("digestion") || s.includes("bowel") || s.includes("constipation"))) { score += 3; reason = "Targets digestive symptoms you're tracking"; }
    } else if (name.includes("gluten")) {
      score += 1;
      reason = "May reduce gut-driven inflammation";
      if (sympLower.some(s => s.includes("bloating") || s.includes("nausea") || s.includes("stomach"))) { score += 3; reason = "Could help with your GI symptoms"; }
    }

    recs.push({ planId: plan.id, score, reason });
  }

  return recs.sort((a, b) => b.score - a.score);
}

// ── Plan Browser (when no plan selected) ──
function PlanBrowser({ plans, onSelect }: { plans: DietPlan[]; onSelect: (id: string) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: profile } = useProfile();
  const recommendations = getDietRecommendations(plans, profile?.ms_type ?? null, profile?.symptoms ?? []);
  const topRecId = recommendations.length > 0 ? recommendations[0].planId : null;
  const recMap = Object.fromEntries(recommendations.map(r => [r.planId, r.reason]));

  // Sort plans: recommended first
  const sortedPlans = [...plans].sort((a, b) => {
    const aIdx = recommendations.findIndex(r => r.planId === a.id);
    const bIdx = recommendations.findIndex(r => r.planId === b.id);
    return aIdx - bIdx;
  });

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-gradient-to-br from-primary/8 via-accent/40 to-card p-4 border border-primary/10">
        <h3 className="text-sm font-semibold text-foreground mb-1">Choose Your Diet Plan</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {profile?.ms_type || (profile?.symptoms?.length ?? 0) > 0
            ? "We've ranked these MS-friendly diets based on your profile. Tap any plan to explore."
            : "Select an MS-friendly diet plan to get food lists, recipe ideas, and daily goals. You can swap recipes anytime with AI suggestions."}
        </p>
      </div>

      {sortedPlans.map((plan) => (
         <div key={plan.id} className={`rounded-xl bg-card border shadow-soft overflow-hidden ${plan.id === topRecId ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}>
          <button
            onClick={() => setExpandedId(expandedId === plan.id ? null : plan.id)}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/50 transition-colors"
          >
            <span className="text-2xl flex-shrink-0">{plan.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                {plan.id === topRecId && (
                  <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> Best Match
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
              {recMap[plan.id] && (
                <p className="text-[11px] text-primary/80 mt-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 flex-shrink-0" />
                  <span className="italic">{recMap[plan.id]}</span>
                </p>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedId === plan.id ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {expandedId === plan.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
                  {/* Food list preview */}
                  <div className="grid grid-cols-3 gap-2">
                    <FoodListPreview icon={<ShieldCheck className="h-3.5 w-3.5 text-green-500" />} label="Eat More" items={plan.food_lists.eat_more} color="green" />
                    <FoodListPreview icon={<ShieldAlert className="h-3.5 w-3.5 text-amber-500" />} label="Limit" items={plan.food_lists.limit} color="amber" />
                    <FoodListPreview icon={<ShieldX className="h-3.5 w-3.5 text-red-500" />} label="Avoid" items={plan.food_lists.avoid} color="red" />
                  </div>

                  <p className="text-xs text-muted-foreground">{plan.recipes.length} recipes · {plan.daily_goals.length} daily goals</p>

                  <button
                    onClick={() => onSelect(plan.id)}
                    className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    Start This Plan
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function FoodListPreview({ icon, label, items, color }: { icon: React.ReactNode; label: string; items: string[]; color: string }) {
  return (
    <div className="rounded-lg bg-secondary/50 p-2">
      <div className="flex items-center gap-1 mb-1">{icon}<span className="text-[10px] font-medium text-muted-foreground">{label}</span></div>
      <p className="text-[10px] text-foreground leading-tight line-clamp-3">{items.slice(0, 3).join(", ")}</p>
      {items.length > 3 && <p className="text-[10px] text-muted-foreground">+{items.length - 3} more</p>}
    </div>
  );
}

// ── Active Plan View ──
function ActivePlanView({ plan, userPlan }: { plan: DietPlan; userPlan: NonNullable<ReturnType<typeof useUserDietPlan>["data"]> }) {
  const [activeSection, setActiveSection] = useState<"foods" | "recipes" | "goals">("recipes");
  const deselectPlan = useDeselectDietPlan();

  const handleDeselect = async () => {
    try {
      await deselectPlan.mutateAsync();
      toast.success("Diet plan removed");
    } catch { toast.error("Failed to remove plan"); }
  };

  return (
    <div className="space-y-3">
      {/* Plan header */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/8 via-accent/40 to-card p-4 border border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{plan.emoji}</span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{plan.name} Diet</h3>
              <p className="text-xs text-muted-foreground">{plan.description.slice(0, 80)}…</p>
            </div>
          </div>
          <button onClick={handleDeselect} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Switch
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 rounded-xl bg-secondary p-1">
        {(["recipes", "foods", "goals"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${activeSection === s ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}
          >
            {s === "recipes" ? "🍳 Recipes" : s === "foods" ? "🥗 Food Lists" : "✅ Goals"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSection === "foods" && <FoodListsSection key="foods" plan={plan} />}
        {activeSection === "recipes" && <RecipesSection key="recipes" plan={plan} userPlan={userPlan} />}
        {activeSection === "goals" && <GoalsSection key="goals" plan={plan} />}
      </AnimatePresence>
    </div>
  );
}

// ── Food Lists Section ──
function FoodListsSection({ plan }: { plan: DietPlan }) {
  const [expanded, setExpanded] = useState<string | null>("eat_more");

  const sections = [
    { key: "eat_more", label: "Eat More", icon: <ShieldCheck className="h-4 w-4 text-green-500" />, items: plan.food_lists.eat_more, bgClass: "bg-green-500/5 border-green-500/20" },
    { key: "limit", label: "Limit", icon: <ShieldAlert className="h-4 w-4 text-amber-500" />, items: plan.food_lists.limit, bgClass: "bg-amber-500/5 border-amber-500/20" },
    { key: "avoid", label: "Avoid", icon: <ShieldX className="h-4 w-4 text-red-500" />, items: plan.food_lists.avoid, bgClass: "bg-red-500/5 border-red-500/20" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
      {sections.map((s) => (
        <div key={s.key} className={`rounded-xl border ${s.bgClass} overflow-hidden`}>
          <button
            onClick={() => setExpanded(expanded === s.key ? null : s.key)}
            className="w-full flex items-center gap-2 p-3 text-left"
          >
            {s.icon}
            <span className="text-sm font-medium text-foreground flex-1">{s.label}</span>
            <span className="text-xs text-muted-foreground mr-1">{s.items.length}</span>
            <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expanded === s.key ? "rotate-90" : ""}`} />
          </button>
          <AnimatePresence>
            {expanded === s.key && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="px-3 pb-3 space-y-1">
                  {s.items.map((item, i) => (
                    <p key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                      <span className="text-muted-foreground mt-0.5">•</span> {item}
                    </p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </motion.div>
  );
}

// ── Recipes Section ──
function RecipesSection({ plan, userPlan }: { plan: DietPlan; userPlan: NonNullable<ReturnType<typeof useUserDietPlan>["data"]> }) {
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [swapTarget, setSwapTarget] = useState<string | null>(null);
  const aiSwap = useAISwapSuggestions();
  const swapRecipe = useSwapRecipe();
  const resetSwap = useResetRecipeSwap();
  const [alternatives, setAlternatives] = useState<Recipe[]>([]);

  const getDisplayRecipe = (original: Recipe): Recipe => {
    return userPlan.swapped_recipes[original.id] || original;
  };

  const handleGetSwaps = async (recipe: Recipe) => {
    setSwapTarget(recipe.id);
    setAlternatives([]);
    try {
      const alts = await aiSwap.mutateAsync({
        recipe: getDisplayRecipe(recipe),
        dietName: plan.name,
        mealType: recipe.meal,
      });
      setAlternatives(alts);
    } catch (e: any) {
      toast.error(e.message || "Failed to get suggestions");
      setSwapTarget(null);
    }
  };

  const handleSwap = async (originalId: string, newRecipe: Recipe) => {
    try {
      await swapRecipe.mutateAsync({
        userDietPlanId: userPlan.id,
        originalRecipeId: originalId,
        newRecipe,
        currentSwaps: userPlan.swapped_recipes,
      });
      toast.success("Recipe swapped!");
      setSwapTarget(null);
      setAlternatives([]);
    } catch { toast.error("Failed to swap"); }
  };

  const handleReset = async (originalId: string) => {
    try {
      await resetSwap.mutateAsync({
        userDietPlanId: userPlan.id,
        originalRecipeId: originalId,
        currentSwaps: userPlan.swapped_recipes,
      });
      toast.success("Restored original recipe");
    } catch { toast.error("Failed to restore"); }
  };

  const mealGroups: Record<string, Recipe[]> = {};
  plan.recipes.forEach((r) => {
    const key = r.meal || "other";
    if (!mealGroups[key]) mealGroups[key] = [];
    mealGroups[key].push(r);
  });

  const mealOrder = ["breakfast", "lunch", "dinner", "snack", "other"];
  const mealEmojis: Record<string, string> = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎", other: "🍽️" };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
      {mealOrder.filter((m) => mealGroups[m]).map((meal) => (
        <div key={meal}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            {mealEmojis[meal]} {meal}
          </p>
          <div className="space-y-2">
            {mealGroups[meal].map((originalRecipe) => {
              const displayed = getDisplayRecipe(originalRecipe);
              const isSwapped = !!userPlan.swapped_recipes[originalRecipe.id];
              const isExpanded = expandedRecipe === originalRecipe.id;
              const isSwapMode = swapTarget === originalRecipe.id;

              return (
                <div key={originalRecipe.id} className="rounded-xl bg-card border border-border shadow-soft overflow-hidden">
                  <button
                    onClick={() => setExpandedRecipe(isExpanded ? null : originalRecipe.id)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/50 transition-colors"
                  >
                    <UtensilsCrossed className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{displayed.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{displayed.ingredients?.slice(0, 4).join(", ")}</p>
                    </div>
                    {isSwapped && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">swapped</span>
                    )}
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-3 pb-3 space-y-2">
                          {/* Ingredients */}
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Ingredients</p>
                            <div className="flex flex-wrap gap-1">
                              {displayed.ingredients?.map((ing, i) => (
                                <span key={i} className="text-[11px] bg-secondary rounded-full px-2 py-0.5 text-foreground">{ing}</span>
                              ))}
                            </div>
                          </div>

                          {/* Instructions */}
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Instructions</p>
                            <p className="text-xs text-foreground/80 leading-relaxed">{displayed.instructions}</p>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleGetSwaps(originalRecipe)}
                              disabled={aiSwap.isPending}
                              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-2 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50 transition-all"
                            >
                              {aiSwap.isPending && swapTarget === originalRecipe.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="h-3.5 w-3.5" />
                              )}
                              AI Swap
                            </button>
                            {isSwapped && (
                              <button
                                onClick={() => handleReset(originalRecipe.id)}
                                className="flex items-center gap-1.5 rounded-lg bg-secondary py-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Original
                              </button>
                            )}
                          </div>

                          {/* Swap alternatives */}
                          <AnimatePresence>
                            {isSwapMode && alternatives.length > 0 && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-1.5 pt-1">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Choose an alternative:</p>
                                {alternatives.map((alt, i) => (
                                  <button
                                    key={alt.id || i}
                                    onClick={() => handleSwap(originalRecipe.id, alt)}
                                    className="w-full text-left rounded-lg bg-secondary/80 hover:bg-secondary p-2.5 transition-colors"
                                  >
                                    <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                                      <Shuffle className="h-3 w-3 text-primary" /> {alt.name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{alt.ingredients?.slice(0, 4).join(", ")}</p>
                                  </button>
                                ))}
                                <button onClick={() => { setSwapTarget(null); setAlternatives([]); }} className="text-[10px] text-muted-foreground hover:text-foreground">
                                  Cancel
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ── Goals Section ──
function GoalsSection({ plan }: { plan: DietPlan }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-1.5">
      {plan.daily_goals.map((goal, i) => {
        const done = checked.has(i);
        return (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${done ? "bg-primary/8" : "bg-secondary"}`}
          >
            <div className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${done ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
              {done && <Check className="h-3 w-3" />}
            </div>
            <span className={`text-sm ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>{goal}</span>
          </button>
        );
      })}
    </motion.div>
  );
}

// ── Main Export ──
export default function DietPlanTab() {
  const { data: plans = [], isLoading: plansLoading } = useDietPlans();
  const { data: userPlan, isLoading: userPlanLoading } = useUserDietPlan();
  const selectPlan = useSelectDietPlan();

  const activePlan = plans.find((p) => p.id === userPlan?.plan_id);

  const handleSelect = async (planId: string) => {
    try {
      await selectPlan.mutateAsync(planId);
      toast.success("Diet plan activated! 🥗");
    } catch { toast.error("Failed to select plan"); }
  };

  if (plansLoading || userPlanLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (activePlan && userPlan) {
    return <ActivePlanView plan={activePlan} userPlan={userPlan} />;
  }

  return <PlanBrowser plans={plans} onSelect={handleSelect} />;
}
