import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, ShoppingCart, Copy, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  useDietPlans, useUserDietPlan,
  type DietPlan, type Recipe,
  DAYS, DAY_LABELS,
} from "@/hooks/useDietPlans";

export default function GroceryList() {
  const { data: plans = [] } = useDietPlans();
  const { data: userPlan } = useUserDietPlan();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);

  const plan = plans.find(p => p.id === userPlan?.plan_id);

  const ingredients = useMemo(() => {
    if (!plan || !userPlan?.weekly_selections) return [];

    const getDisplayRecipe = (original: Recipe): Recipe =>
      userPlan.swapped_recipes[original.id] || original;

    const recipeById = (id: string): Recipe | undefined => {
      if (id.startsWith("custom:")) return undefined; // custom meals have no ingredients
      for (const r of plan.recipes) {
        const displayed = getDisplayRecipe(r);
        if (displayed.id === id || r.id === id) return displayed;
      }
      return undefined;
    };

    // Collect all ingredients from assigned recipes
    const ingredientMap = new Map<string, { count: number; raw: string }>();

    for (const day of DAYS) {
      const daySelections = userPlan.weekly_selections[day];
      if (!daySelections) continue;
      for (const recipeId of Object.values(daySelections)) {
        const recipe = recipeById(recipeId);
        if (!recipe?.ingredients) continue;
        for (const ing of recipe.ingredients) {
          // Normalize: lowercase, trim
          const key = ing.toLowerCase().trim();
          const existing = ingredientMap.get(key);
          if (existing) {
            existing.count++;
          } else {
            ingredientMap.set(key, { count: 1, raw: ing });
          }
        }
      }
    }

    return Array.from(ingredientMap.entries())
      .sort((a, b) => a[1].raw.localeCompare(b[1].raw))
      .map(([key, val]) => ({
        key,
        label: val.raw,
        count: val.count,
      }));
  }, [plan, userPlan]);

  if (!plan || !userPlan) {
    return (
      <div className="rounded-xl bg-card border border-border p-4 shadow-soft text-center">
        <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Select a diet plan and fill your weekly planner to generate a grocery list.</p>
      </div>
    );
  }

  if (ingredients.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border p-4 shadow-soft text-center">
        <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Add meals to your weekly planner to auto-generate your grocery list.</p>
      </div>
    );
  }

  const toggle = (key: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleCopy = () => {
    const text = ingredients
      .filter(i => !checkedItems.has(i.key))
      .map(i => `☐ ${i.label}${i.count > 1 ? ` (×${i.count})` : ""}`)
      .join("\n");
    navigator.clipboard.writeText(text).then(() => toast.success("Grocery list copied!"));
  };

  const uncheckedCount = ingredients.filter(i => !checkedItems.has(i.key)).length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-semibold text-foreground">Grocery List</h3>
          <span className="text-xs text-muted-foreground">({uncheckedCount} items)</span>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${collapsed ? "-rotate-90" : ""}`} />
        </button>
        <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
      </div>

      {!collapsed && (
        <div className="rounded-xl bg-card border border-border shadow-soft p-3 space-y-1">
          {ingredients.map(item => {
            const done = checkedItems.has(item.key);
            return (
              <button key={item.key} onClick={() => toggle(item.key)}
                className={`w-full flex items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors ${done ? "opacity-50" : "hover:bg-secondary/50"}`}>
                <div className={`flex-shrink-0 h-4.5 w-4.5 rounded border-2 flex items-center justify-center transition-all ${done ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                  {done && <Check className="h-3 w-3" />}
                </div>
                <span className={`text-sm flex-1 ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {item.label}
                </span>
                {item.count > 1 && <span className="text-[10px] text-muted-foreground bg-secondary rounded-full px-1.5">×{item.count}</span>}
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
