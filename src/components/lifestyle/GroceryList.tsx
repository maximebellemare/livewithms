import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ShoppingCart, Copy, ChevronDown, ChevronRight, Printer } from "lucide-react";
import { toast } from "sonner";
import {
  useDietPlans, useUserDietPlan,
  type DietPlan, type Recipe,
  DAYS, DAY_LABELS,
} from "@/hooks/useDietPlans";

// ── Category classification ──
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "🥬 Produce": [
    "lettuce","arugula","spinach","kale","greens","broccoli","cauliflower","cabbage",
    "carrot","celery","cucumber","tomato","pepper","onion","garlic","ginger","avocado",
    "zucchini","squash","sweet potato","potato","mushroom","corn","peas","beans","beet",
    "radish","asparagus","eggplant","leek","shallot","scallion","cilantro","parsley",
    "basil","mint","dill","rosemary","thyme","oregano","chive","lemon","lime","orange",
    "apple","banana","berries","blueberr","strawberr","raspberr","mango","pineapple",
    "grape","peach","pear","melon","watermelon","pomegranate","fig","date","cranberr",
    "cherry","plum","kiwi","papaya","coconut","fruit","vegetable","salad","herb",
    "fennel","artichoke","bok choy","watercress","endive","romaine","mixed green",
  ],
  "🥩 Protein": [
    "chicken","turkey","beef","pork","lamb","fish","salmon","tuna","shrimp","prawn",
    "cod","tilapia","sardine","mackerel","trout","tofu","tempeh","seitan","egg",
    "sausage","bacon","ham","steak","ground","mince","fillet","breast","thigh",
    "lentil","chickpea","black bean","kidney bean","edamame","protein",
  ],
  "🧀 Dairy & Alternatives": [
    "milk","cheese","yogurt","yoghurt","cream","butter","ghee","kefir","cottage",
    "ricotta","mozzarella","parmesan","feta","cheddar","gouda","brie","sour cream",
    "whipping","half-and-half","oat milk","almond milk","soy milk","coconut milk",
    "cashew milk","dairy",
  ],
  "🌾 Grains & Bread": [
    "rice","pasta","noodle","bread","tortilla","wrap","oat","quinoa","barley","farro",
    "couscous","bulgur","cereal","granola","flour","cornmeal","polenta","pita",
    "bagel","roll","bun","cracker","breadcrumb","panko","muesli","rolled oat",
  ],
  "🥫 Pantry & Canned": [
    "olive oil","oil","vinegar","soy sauce","tamari","hot sauce","sriracha","mustard",
    "ketchup","mayo","mayonnaise","salsa","pesto","broth","stock","tomato paste",
    "tomato sauce","canned","diced tomato","coconut cream","coconut aminos",
    "maple syrup","honey","sugar","molasses","agave","jam","nut butter","almond butter",
    "peanut butter","tahini","hummus","nutritional yeast","baking","vanilla",
    "cocoa","chocolate","chip",
  ],
  "🧂 Spices & Seasonings": [
    "salt","pepper","cumin","paprika","turmeric","cinnamon","nutmeg","clove",
    "coriander","cardamom","cayenne","chili powder","curry","garam masala",
    "bay leaf","saffron","allspice","seasoning","spice","pinch","dried",
  ],
  "🥜 Nuts & Seeds": [
    "almond","walnut","cashew","pecan","pistachio","hazelnut","macadamia","peanut",
    "sunflower","pumpkin seed","chia","flax","hemp","sesame","pine nut","seed","nut",
  ],
  "❄️ Frozen": [
    "frozen","ice cream",
  ],
};

const CATEGORY_ORDER = Object.keys(CATEGORY_KEYWORDS);

function classifyIngredient(key: string): string {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => key.includes(kw))) return category;
  }
  return "📦 Other";
}

type IngredientItem = { key: string; label: string; count: number; category: string };

export default function GroceryList() {
  const { data: plans = [] } = useDietPlans();
  const { data: userPlan } = useUserDietPlan();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const plan = plans.find(p => p.id === userPlan?.plan_id);

  const ingredients: IngredientItem[] = useMemo(() => {
    if (!plan || !userPlan?.weekly_selections) return [];

    const getDisplayRecipe = (original: Recipe): Recipe =>
      userPlan.swapped_recipes[original.id] || original;

    const recipeById = (id: string): Recipe | undefined => {
      if (id.startsWith("custom:")) return undefined;
      for (const r of plan.recipes) {
        const displayed = getDisplayRecipe(r);
        if (displayed.id === id || r.id === id) return displayed;
      }
      return undefined;
    };

    const ingredientMap = new Map<string, { count: number; raw: string }>();

    for (const day of DAYS) {
      const daySelections = userPlan.weekly_selections[day];
      if (!daySelections) continue;
      for (const recipeId of Object.values(daySelections)) {
        const recipe = recipeById(recipeId);
        if (!recipe?.ingredients) continue;
        for (const ing of recipe.ingredients) {
          const key = ing.toLowerCase().trim();
          const existing = ingredientMap.get(key);
          if (existing) existing.count++;
          else ingredientMap.set(key, { count: 1, raw: ing });
        }
      }
    }

    return Array.from(ingredientMap.entries())
      .map(([key, val]) => ({
        key,
        label: val.raw,
        count: val.count,
        category: classifyIngredient(key),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [plan, userPlan]);

  const grouped = useMemo(() => {
    const map = new Map<string, IngredientItem[]>();
    for (const item of ingredients) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    // Sort categories by predefined order
    const sorted = [...map.entries()].sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a[0]);
      const bi = CATEGORY_ORDER.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    return sorted;
  }, [ingredients]);

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

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const buildText = (includeChecked: boolean) =>
    grouped
      .map(([cat, items]) => {
        const filtered = items.filter(i => includeChecked || !checkedItems.has(i.key));
        if (filtered.length === 0) return "";
        const lines = filtered
          .map(i => `  ${checkedItems.has(i.key) ? "☑" : "☐"} ${i.label}${i.count > 1 ? ` (×${i.count})` : ""}`)
          .join("\n");
        return `${cat}\n${lines}`;
      })
      .filter(Boolean)
      .join("\n\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(buildText(false)).then(() => toast.success("Grocery list copied!"));
  };

  const handlePrint = () => {
    const sections = grouped
      .map(([cat, items]) => {
        const rows = items
          .map(i => `<li style="padding:2px 0">${checkedItems.has(i.key) ? "☑" : "☐"} ${i.label}${i.count > 1 ? ` <span style="color:#888">(×${i.count})</span>` : ""}</li>`)
          .join("");
        return `<h2 style="font-size:1rem;margin:1.2rem 0 0.4rem">${cat}</h2><ul style="list-style:none;padding:0;margin:0">${rows}</ul>`;
      })
      .join("");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Grocery List</title><style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:600px}h1{font-size:1.25rem;margin-bottom:0.5rem}li{font-size:0.95rem}</style></head><body><h1>🛒 Grocery List</h1>${sections}</body></html>`);
    win.document.close();
    win.print();
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
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
            <Copy className="h-3.5 w-3.5" /> Copy
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="rounded-xl bg-card border border-border shadow-soft p-3 space-y-2">
          {grouped.map(([category, items]) => {
            const catCollapsed = collapsedCategories.has(category);
            const catChecked = items.filter(i => checkedItems.has(i.key)).length;
            return (
              <div key={category}>
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center gap-2 py-1.5 px-1 rounded-lg hover:bg-secondary/40 transition-colors"
                >
                  <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${catCollapsed ? "" : "rotate-90"}`} />
                  <span className="text-xs font-semibold text-foreground">{category}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {catChecked > 0 && `${catChecked}/`}{items.length}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {!catCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 space-y-0.5">
                        {items.map(item => {
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
