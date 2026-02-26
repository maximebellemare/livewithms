import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronDown, ChevronRight, Check, ArrowLeft, Shuffle,
  UtensilsCrossed, ShieldCheck, ShieldAlert, ShieldX, Sparkles,
  RotateCcw, Loader2, Clock, Users, Flame, X, Calendar,
} from "lucide-react";
import {
  useDietPlans, useUserDietPlan, useSelectDietPlan, useDeselectDietPlan,
  useSwapRecipe, useResetRecipeSwap, useAISwapSuggestions, useUpdateWeeklySelections,
  type DietPlan, type Recipe, type WeeklySelections,
  DAYS, MEALS, DAY_LABELS,
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
      score += 3; reason = "Reduces inflammation linked to MS progression";
      if (msType === "RRMS") { score += 2; reason = "Great for managing RRMS flare-ups"; }
      if (sympLower.some(s => s.includes("pain") || s.includes("fatigue"))) score += 1;
    } else if (name.includes("mediterranean")) {
      score += 2; reason = "Heart-healthy fats support nerve protection";
      if (sympLower.some(s => s.includes("brain fog") || s.includes("cognitive"))) { score += 2; reason = "Rich in omega-3s that support cognitive function"; }
    } else if (name.includes("low sodium") || name.includes("low-sodium")) {
      score += 1; reason = "May help reduce lesion activity";
      if (msType === "PPMS" || msType === "SPMS") { score += 2; reason = "Research links low sodium to slower progression"; }
    } else if (name.includes("high fiber") || name.includes("high-fiber")) {
      score += 1; reason = "Supports gut health and immune regulation";
      if (sympLower.some(s => s.includes("digestion") || s.includes("bowel") || s.includes("constipation"))) { score += 3; reason = "Targets digestive symptoms you're tracking"; }
    } else if (name.includes("gluten")) {
      score += 1; reason = "May reduce gut-driven inflammation";
      if (sympLower.some(s => s.includes("bloating") || s.includes("nausea") || s.includes("stomach"))) { score += 3; reason = "Could help with your GI symptoms"; }
    }
    recs.push({ planId: plan.id, score, reason });
  }
  return recs.sort((a, b) => b.score - a.score);
}

// ── Plan Browser ──
function PlanBrowser({ plans, onSelect }: { plans: DietPlan[]; onSelect: (id: string) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: profile } = useProfile();
  const recommendations = getDietRecommendations(plans, profile?.ms_type ?? null, profile?.symptoms ?? []);
  const topRecId = recommendations.length > 0 ? recommendations[0].planId : null;
  const recMap = Object.fromEntries(recommendations.map(r => [r.planId, r.reason]));
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
            : "Select an MS-friendly diet plan to get food lists, recipe ideas, and daily goals."}
        </p>
      </div>
      {sortedPlans.map((plan) => (
        <div key={plan.id} className={`rounded-xl bg-card border shadow-soft overflow-hidden ${plan.id === topRecId ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}>
          <button onClick={() => setExpandedId(expandedId === plan.id ? null : plan.id)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/50 transition-colors">
            <span className="text-2xl flex-shrink-0">{plan.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                {plan.id === topRecId && (
                  <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1"><Sparkles className="h-2.5 w-2.5" /> Best Match</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
              {recMap[plan.id] && <p className="text-[11px] text-primary/80 mt-1 flex items-center gap-1"><Sparkles className="h-3 w-3 flex-shrink-0" /><span className="italic">{recMap[plan.id]}</span></p>}
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedId === plan.id ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {expandedId === plan.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <FoodListPreview icon={<ShieldCheck className="h-3.5 w-3.5 text-green-500" />} label="Eat More" items={plan.food_lists.eat_more} />
                    <FoodListPreview icon={<ShieldAlert className="h-3.5 w-3.5 text-amber-500" />} label="Limit" items={plan.food_lists.limit} />
                    <FoodListPreview icon={<ShieldX className="h-3.5 w-3.5 text-red-500" />} label="Avoid" items={plan.food_lists.avoid} />
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.recipes.length} recipes · {plan.daily_goals.length} daily goals</p>
                  <button onClick={() => onSelect(plan.id)} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all">Start This Plan</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function FoodListPreview({ icon, label, items }: { icon: React.ReactNode; label: string; items: string[] }) {
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
  const [activeSection, setActiveSection] = useState<"planner" | "recipes" | "foods" | "goals">("planner");
  const deselectPlan = useDeselectDietPlan();
  const handleDeselect = async () => {
    try { await deselectPlan.mutateAsync(); toast.success("Diet plan removed"); } catch { toast.error("Failed to remove plan"); }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-gradient-to-br from-primary/8 via-accent/40 to-card p-4 border border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{plan.emoji}</span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{plan.name} Diet</h3>
              <p className="text-xs text-muted-foreground">{plan.description.slice(0, 80)}…</p>
            </div>
          </div>
          <button onClick={handleDeselect} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><ArrowLeft className="h-3 w-3" /> Switch</button>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-secondary p-1">
        {(["planner", "recipes", "foods", "goals"] as const).map((s) => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${activeSection === s ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}>
            {s === "planner" ? "📅 My Week" : s === "recipes" ? "🍳 Recipes" : s === "foods" ? "🥗 Foods" : "✅ Goals"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSection === "planner" && <WeeklyPlannerSection key="planner" plan={plan} userPlan={userPlan} />}
        {activeSection === "recipes" && <RecipesSection key="recipes" plan={plan} userPlan={userPlan} />}
        {activeSection === "foods" && <FoodListsSection key="foods" plan={plan} />}
        {activeSection === "goals" && <GoalsSection key="goals" plan={plan} />}
      </AnimatePresence>
    </div>
  );
}

// ── Weekly Planner Section ──
function WeeklyPlannerSection({ plan, userPlan }: { plan: DietPlan; userPlan: NonNullable<ReturnType<typeof useUserDietPlan>["data"]> }) {
  const [selectedDay, setSelectedDay] = useState<string>(DAYS[0]);
  const [pickingSlot, setPickingSlot] = useState<string | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [customMealInput, setCustomMealInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState<string | null>(null); // meal type with custom input open
  const updateWeekly = useUpdateWeeklySelections();
  const selections = userPlan.weekly_selections || {};

  const getDisplayRecipe = (original: Recipe): Recipe => userPlan.swapped_recipes[original.id] || original;

  const recipeById = (id: string): Recipe | undefined => {
    if (id.startsWith("custom:")) {
      return { id, name: id.slice(7), meal: "", ingredients: [], instructions: "" };
    }
    for (const r of plan.recipes) {
      const displayed = getDisplayRecipe(r);
      if (displayed.id === id || r.id === id) return displayed;
    }
    return undefined;
  };

  const handleAssign = async (mealType: string, recipeId: string) => {
    const updated: WeeklySelections = { ...selections };
    if (!updated[selectedDay]) updated[selectedDay] = {};
    updated[selectedDay] = { ...updated[selectedDay], [mealType]: recipeId };
    try {
      await updateWeekly.mutateAsync({ userDietPlanId: userPlan.id, weekly_selections: updated });
      setPickingSlot(null);
    } catch { toast.error("Failed to save"); }
  };

  const handleRemove = async (mealType: string) => {
    const updated: WeeklySelections = { ...selections };
    if (updated[selectedDay]) {
      const { [mealType]: _, ...rest } = updated[selectedDay];
      updated[selectedDay] = rest;
    }
    try {
      await updateWeekly.mutateAsync({ userDietPlanId: userPlan.id, weekly_selections: updated });
    } catch { toast.error("Failed to remove"); }
  };

  const filledCount = Object.values(selections).reduce((sum, day) => sum + Object.keys(day || {}).length, 0);
  const totalSlots = DAYS.length * MEALS.length;
  const mealEmojis: Record<string, string> = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
      {/* Progress */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" />
        <div className="flex-1">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Weekly plan progress</span>
            <span>{filledCount}/{totalSlots} meals planned</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(filledCount / totalSlots) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {DAYS.map((day) => {
          const dayMeals = selections[day] || {};
          const dayCount = Object.keys(dayMeals).length;
          return (
            <button key={day} onClick={() => { setSelectedDay(day); setPickingSlot(null); }}
              className={`flex-shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-all ${selectedDay === day ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              <span className="block">{DAY_LABELS[day]}</span>
              {dayCount > 0 && <span className="block text-[9px] mt-0.5 opacity-80">{dayCount}/{MEALS.length}</span>}
            </button>
          );
        })}
      </div>

      {/* Meal slots for selected day */}
      <div className="space-y-2">
        {MEALS.map((meal) => {
          const assignedId = selections[selectedDay]?.[meal];
          const assignedRecipe = assignedId ? recipeById(assignedId) : undefined;
          const isPicking = pickingSlot === meal;

          return (
            <div key={meal} className="rounded-xl bg-card border border-border shadow-soft overflow-hidden">
              {assignedRecipe ? (
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{mealEmojis[meal]} {meal}</span>
                    <button onClick={() => handleRemove(meal)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                  </div>
                  {assignedId?.startsWith("custom:") ? (
                    <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      ✏️ {assignedRecipe.name}
                    </p>
                  ) : (
                    <button onClick={() => setViewingRecipe(assignedRecipe)} className="w-full text-left">
                      <p className="text-sm font-medium text-foreground">{assignedRecipe.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        {assignedRecipe.prep_time && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{assignedRecipe.prep_time}</span>}
                        {assignedRecipe.calories && <span className="flex items-center gap-0.5"><Flame className="h-3 w-3" />{assignedRecipe.calories} cal</span>}
                        {assignedRecipe.servings && <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{assignedRecipe.servings} servings</span>}
                      </div>
                    </button>
                  )}
                </div>
              ) : (
                <button onClick={() => { setPickingSlot(isPicking ? null : meal); setShowCustomInput(null); setCustomMealInput(""); }}
                  className="w-full p-3 text-left hover:bg-secondary/50 transition-colors">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{mealEmojis[meal]} {meal}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{isPicking ? "Choose a recipe below ↓" : "Tap to add a meal"}</p>
                </button>
              )}

              {/* Recipe picker */}
              <AnimatePresence>
                {isPicking && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="border-t border-border p-2 space-y-1">
                      {plan.recipes.filter(r => r.meal === meal).map((r) => {
                        const displayed = getDisplayRecipe(r);
                        return (
                          <button key={r.id} onClick={() => handleAssign(meal, displayed.id)}
                            className="w-full text-left rounded-lg p-2.5 hover:bg-secondary/80 transition-colors">
                            <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                              <UtensilsCrossed className="h-3 w-3 text-primary" /> {displayed.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                              {displayed.prep_time && <span>{displayed.prep_time}</span>}
                              {displayed.calories && <span>· {displayed.calories} cal</span>}
                            </div>
                          </button>
                        );
                      })}
                      {plan.recipes.filter(r => r.meal === meal).length === 0 && (
                        <p className="text-xs text-muted-foreground p-2">No {meal} recipes in this plan</p>
                      )}

                      {/* Custom meal option */}
                      {showCustomInput === meal ? (
                        <div className="flex items-center gap-2 p-2">
                          <input
                            type="text"
                            value={customMealInput}
                            onChange={(e) => setCustomMealInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && customMealInput.trim()) {
                                handleAssign(meal, `custom:${customMealInput.trim()}`);
                                setCustomMealInput("");
                                setShowCustomInput(null);
                              }
                            }}
                            placeholder="e.g. Oatmeal with berries"
                            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                            autoFocus
                            maxLength={100}
                          />
                          <button
                            onClick={() => {
                              if (customMealInput.trim()) {
                                handleAssign(meal, `custom:${customMealInput.trim()}`);
                                setCustomMealInput("");
                                setShowCustomInput(null);
                              }
                            }}
                            disabled={!customMealInput.trim()}
                            className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                          >
                            Add
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setShowCustomInput(meal); setCustomMealInput(""); }}
                          className="w-full text-left rounded-lg p-2.5 hover:bg-secondary/80 transition-colors border border-dashed border-border"
                        >
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            ✏️ Write your own meal
                          </p>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Recipe detail modal */}
      <AnimatePresence>
        {viewingRecipe && <RecipeDetailSheet recipe={viewingRecipe} onClose={() => setViewingRecipe(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Recipe Detail Sheet ──
function RecipeDetailSheet({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card border-t border-border p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">{recipe.name}</h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              {recipe.prep_time && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{recipe.prep_time}</span>}
              {recipe.servings && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{recipe.servings} servings</span>}
              {recipe.calories && <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5" />{recipe.calories} cal</span>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-secondary"><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Ingredients</p>
          <ul className="space-y-1.5">
            {recipe.ingredients?.map((ing, i) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                {ing}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Instructions</p>
          <div className="space-y-2">
            {recipe.instructions?.split("\n").filter(Boolean).map((step, i) => (
              <p key={i} className="text-sm text-foreground/90 leading-relaxed">{step}</p>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
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
          <button onClick={() => setExpanded(expanded === s.key ? null : s.key)} className="w-full flex items-center gap-2 p-3 text-left">
            {s.icon}<span className="text-sm font-medium text-foreground flex-1">{s.label}</span>
            <span className="text-xs text-muted-foreground mr-1">{s.items.length}</span>
            <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expanded === s.key ? "rotate-90" : ""}`} />
          </button>
          <AnimatePresence>
            {expanded === s.key && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="px-3 pb-3 space-y-1">
                  {s.items.map((item, i) => (<p key={i} className="text-xs text-foreground/80 flex items-start gap-2"><span className="text-muted-foreground mt-0.5">•</span> {item}</p>))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </motion.div>
  );
}

// ── Recipes Section (browse all with detail) ──
function RecipesSection({ plan, userPlan }: { plan: DietPlan; userPlan: NonNullable<ReturnType<typeof useUserDietPlan>["data"]> }) {
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [swapTarget, setSwapTarget] = useState<string | null>(null);
  const aiSwap = useAISwapSuggestions();
  const swapRecipe = useSwapRecipe();
  const resetSwap = useResetRecipeSwap();
  const [alternatives, setAlternatives] = useState<Recipe[]>([]);

  const getDisplayRecipe = (original: Recipe): Recipe => userPlan.swapped_recipes[original.id] || original;

  const handleGetSwaps = async (recipe: Recipe) => {
    setSwapTarget(recipe.id); setAlternatives([]);
    try {
      const alts = await aiSwap.mutateAsync({ recipe: getDisplayRecipe(recipe), dietName: plan.name, mealType: recipe.meal });
      setAlternatives(alts);
    } catch (e: any) { toast.error(e.message || "Failed to get suggestions"); setSwapTarget(null); }
  };
  const handleSwap = async (originalId: string, newRecipe: Recipe) => {
    try {
      await swapRecipe.mutateAsync({ userDietPlanId: userPlan.id, originalRecipeId: originalId, newRecipe, currentSwaps: userPlan.swapped_recipes });
      toast.success("Recipe swapped!"); setSwapTarget(null); setAlternatives([]);
    } catch { toast.error("Failed to swap"); }
  };
  const handleReset = async (originalId: string) => {
    try {
      await resetSwap.mutateAsync({ userDietPlanId: userPlan.id, originalRecipeId: originalId, currentSwaps: userPlan.swapped_recipes });
      toast.success("Restored original recipe");
    } catch { toast.error("Failed to restore"); }
  };

  const mealGroups: Record<string, Recipe[]> = {};
  plan.recipes.forEach((r) => { const key = r.meal || "other"; if (!mealGroups[key]) mealGroups[key] = []; mealGroups[key].push(r); });
  const mealOrder = ["breakfast", "lunch", "dinner", "snack", "other"];
  const mealEmojis: Record<string, string> = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎", other: "🍽️" };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
      {mealOrder.filter((m) => mealGroups[m]).map((meal) => (
        <div key={meal}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{mealEmojis[meal]} {meal}</p>
          <div className="space-y-2">
            {mealGroups[meal].map((originalRecipe) => {
              const displayed = getDisplayRecipe(originalRecipe);
              const isSwapped = !!userPlan.swapped_recipes[originalRecipe.id];
              const isExpanded = expandedRecipe === originalRecipe.id;
              const isSwapMode = swapTarget === originalRecipe.id;

              return (
                <div key={originalRecipe.id} className="rounded-xl bg-card border border-border shadow-soft overflow-hidden">
                  <button onClick={() => setExpandedRecipe(isExpanded ? null : originalRecipe.id)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/50 transition-colors">
                    <UtensilsCrossed className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{displayed.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        {displayed.prep_time && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{displayed.prep_time}</span>}
                        {displayed.calories && <span className="flex items-center gap-0.5"><Flame className="h-3 w-3" />{displayed.calories} cal</span>}
                        {displayed.servings && <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{displayed.servings}</span>}
                      </div>
                    </div>
                    {isSwapped && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">swapped</span>}
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-3 pb-3 space-y-3">
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Ingredients</p>
                            <ul className="space-y-1">
                              {displayed.ingredients?.map((ing, i) => (
                                <li key={i} className="text-xs text-foreground/90 flex items-start gap-2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" /> {ing}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Instructions</p>
                            <div className="space-y-1.5">
                              {displayed.instructions?.split("\n").filter(Boolean).map((step, i) => (
                                <p key={i} className="text-xs text-foreground/80 leading-relaxed">{step}</p>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button onClick={() => handleGetSwaps(originalRecipe)} disabled={aiSwap.isPending}
                              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-2 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50 transition-all">
                              {aiSwap.isPending && swapTarget === originalRecipe.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} AI Swap
                            </button>
                            {isSwapped && (
                              <button onClick={() => handleReset(originalRecipe.id)} className="flex items-center gap-1.5 rounded-lg bg-secondary py-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                                <RotateCcw className="h-3.5 w-3.5" /> Original
                              </button>
                            )}
                          </div>

                          <AnimatePresence>
                            {isSwapMode && alternatives.length > 0 && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-1.5 pt-1">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Choose an alternative:</p>
                                {alternatives.map((alt, i) => (
                                  <button key={alt.id || i} onClick={() => handleSwap(originalRecipe.id, alt)} className="w-full text-left rounded-lg bg-secondary/80 hover:bg-secondary p-2.5 transition-colors">
                                    <p className="text-xs font-medium text-foreground flex items-center gap-1.5"><Shuffle className="h-3 w-3 text-primary" /> {alt.name}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{alt.ingredients?.slice(0, 4).join(", ")}</p>
                                  </button>
                                ))}
                                <button onClick={() => { setSwapTarget(null); setAlternatives([]); }} className="text-[10px] text-muted-foreground hover:text-foreground">Cancel</button>
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
  const toggle = (i: number) => { setChecked((prev) => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; }); };
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-1.5">
      {plan.daily_goals.map((goal, i) => {
        const done = checked.has(i);
        return (
          <button key={i} onClick={() => toggle(i)} className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${done ? "bg-primary/8" : "bg-secondary"}`}>
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
    try { await selectPlan.mutateAsync(planId); toast.success("Diet plan activated! 🥗"); } catch { toast.error("Failed to select plan"); }
  };
  if (plansLoading || userPlanLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (activePlan && userPlan) return <ActivePlanView plan={activePlan} userPlan={userPlan} />;
  return <PlanBrowser plans={plans} onSelect={handleSelect} />;
}
