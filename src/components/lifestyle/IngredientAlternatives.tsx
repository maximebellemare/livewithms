import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Search, Leaf, ChevronDown } from "lucide-react";

interface Alternative {
  inflammatory: string;
  swap: string;
  reason: string;
  category: string;
}

const ALTERNATIVES: Alternative[] = [
  // Dairy
  { inflammatory: "Whole milk", swap: "Oat milk or almond milk", reason: "Lower saturated fat, less inflammatory", category: "Dairy" },
  { inflammatory: "Cheese (cheddar, processed)", swap: "Nutritional yeast or cashew cheese", reason: "Eliminates casein, anti-inflammatory fats", category: "Dairy" },
  { inflammatory: "Ice cream", swap: "Frozen banana blend or coconut milk ice cream", reason: "No dairy, natural sweetness", category: "Dairy" },
  { inflammatory: "Butter", swap: "Extra virgin olive oil or avocado", reason: "Rich in omega-3 and monounsaturated fats", category: "Dairy" },
  // Grains
  { inflammatory: "White bread", swap: "Sourdough or gluten-free bread", reason: "Lower glycemic, easier digestion", category: "Grains" },
  { inflammatory: "White pasta", swap: "Lentil pasta or zucchini noodles", reason: "Higher protein, lower inflammation", category: "Grains" },
  { inflammatory: "White rice", swap: "Quinoa or cauliflower rice", reason: "More nutrients, anti-inflammatory", category: "Grains" },
  // Proteins
  { inflammatory: "Processed meat (bacon, sausage)", swap: "Turkey or tempeh", reason: "No nitrates, lower saturated fat", category: "Proteins" },
  { inflammatory: "Red meat (beef)", swap: "Wild salmon or sardines", reason: "Omega-3 rich, anti-inflammatory", category: "Proteins" },
  { inflammatory: "Fried chicken", swap: "Baked or grilled chicken", reason: "No trans fats from frying oils", category: "Proteins" },
  // Sweeteners
  { inflammatory: "Refined sugar", swap: "Raw honey or maple syrup", reason: "Contains antioxidants, lower glycemic", category: "Sweeteners" },
  { inflammatory: "Artificial sweeteners", swap: "Stevia or monk fruit", reason: "Natural, no gut disruption", category: "Sweeteners" },
  { inflammatory: "Soda / sugary drinks", swap: "Sparkling water with lemon", reason: "Zero sugar, hydrating", category: "Sweeteners" },
  // Fats & Oils
  { inflammatory: "Vegetable oil (canola, soybean)", swap: "Extra virgin olive oil or avocado oil", reason: "High in omega-9, anti-inflammatory", category: "Fats & Oils" },
  { inflammatory: "Margarine", swap: "Grass-fed ghee or coconut oil", reason: "No trans fats, contains butyrate", category: "Fats & Oils" },
  // Snacks
  { inflammatory: "Potato chips", swap: "Kale chips or roasted nuts", reason: "Rich in vitamins, healthy fats", category: "Snacks" },
  { inflammatory: "Candy bars", swap: "Dark chocolate (70%+) with almonds", reason: "Flavonoids, lower sugar", category: "Snacks" },
  { inflammatory: "Crackers (refined flour)", swap: "Seed crackers or rice cakes", reason: "Whole ingredients, less processed", category: "Snacks" },
];

const categories = [...new Set(ALTERNATIVES.map(a => a.category))];

export default function IngredientAlternatives() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [openCat, setOpenCat] = useState<string | null>(null);

  const filtered = search.trim()
    ? ALTERNATIVES.filter(
        a =>
          a.inflammatory.toLowerCase().includes(search.toLowerCase()) ||
          a.swap.toLowerCase().includes(search.toLowerCase())
      )
    : ALTERNATIVES;

  const grouped = categories
    .map(cat => ({
      cat,
      items: filtered.filter(a => a.category === cat),
    }))
    .filter(g => g.items.length > 0);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between rounded-xl bg-card border border-border p-3 shadow-soft hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Leaf className="h-4 w-4 text-green-500" />
          <span className="text-xs font-semibold text-foreground">MS-Friendly Swaps Library</span>
          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
            {ALTERNATIVES.length} swaps
          </span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-card border border-border p-3 shadow-soft space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search ingredient or swap..."
                  className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Grouped list */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {grouped.map(({ cat, items }) => (
                  <div key={cat}>
                    <button
                      onClick={() => setOpenCat(openCat === cat ? null : cat)}
                      className="flex w-full items-center justify-between py-1"
                    >
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {cat}
                      </span>
                      <ChevronDown
                        className={`h-3 w-3 text-muted-foreground transition-transform ${openCat === cat ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {(openCat === cat || search.trim()) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-1.5"
                        >
                          {items.map((alt, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 rounded-lg bg-secondary/50 px-3 py-2"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-medium text-destructive/80 line-through">
                                    {alt.inflammatory}
                                  </span>
                                  <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                    {alt.swap}
                                  </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{alt.reason}</p>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
                {grouped.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No matches found</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
