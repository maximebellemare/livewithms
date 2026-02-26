import { useMemo } from "react";
import { motion } from "framer-motion";
import { Droplets, Pill, Sun, Moon, Coffee } from "lucide-react";

interface Tip {
  icon: React.ReactNode;
  title: string;
  body: string;
  time: string;
}

const TIPS: Tip[] = [
  {
    icon: <Sun className="h-4 w-4 text-amber-500" />,
    title: "Morning hydration",
    body: "Drink a full glass of water before breakfast. Rehydrating after sleep supports energy and brain function.",
    time: "breakfast",
  },
  {
    icon: <Pill className="h-4 w-4 text-primary" />,
    title: "Vitamin D with fat",
    body: "Take Vitamin D supplements with a meal containing healthy fats for better absorption — try with lunch.",
    time: "lunch",
  },
  {
    icon: <Coffee className="h-4 w-4 text-amber-700 dark:text-amber-400" />,
    title: "Caffeine & hydration",
    body: "If you drink coffee, match each cup with an extra glass of water. Caffeine can increase dehydration.",
    time: "breakfast",
  },
  {
    icon: <Droplets className="h-4 w-4 text-blue-500" />,
    title: "Omega-3 timing",
    body: "Take fish oil or omega-3 supplements with your largest meal to reduce GI discomfort and boost absorption.",
    time: "dinner",
  },
  {
    icon: <Moon className="h-4 w-4 text-indigo-500" />,
    title: "Magnesium at night",
    body: "Magnesium glycinate before bed may help with sleep quality and muscle spasticity — common MS concerns.",
    time: "dinner",
  },
  {
    icon: <Droplets className="h-4 w-4 text-blue-500" />,
    title: "Sip, don't gulp",
    body: "Spread water intake throughout the day rather than large amounts at once. Aim for 8+ glasses daily.",
    time: "lunch",
  },
];

export default function WaterSupplementTips() {
  // Show 3 rotating tips based on the day of the year
  const dailyTips = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const startIdx = dayOfYear % TIPS.length;
    const selected: Tip[] = [];
    for (let i = 0; i < 3; i++) {
      selected.push(TIPS[(startIdx + i) % TIPS.length]);
    }
    return selected;
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Droplets className="h-4 w-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-foreground">Hydration & Supplement Tips</h3>
      </div>

      {dailyTips.map((tip, i) => (
        <motion.div key={tip.title} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
          className="rounded-xl bg-card border border-border p-3 shadow-soft">
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/80 flex-shrink-0 mt-0.5">
              {tip.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{tip.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{tip.body}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
