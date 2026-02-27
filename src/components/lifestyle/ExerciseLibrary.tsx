import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Flame, Zap, Heart, Clock, AlertTriangle } from "lucide-react";

type MSExercise = {
  id: string;
  name: string;
  category: "cardio" | "strength" | "flexibility" | "balance";
  fatigueLevel: "low" | "moderate" | "high";
  duration: string;
  benefits: string[];
  description: string;
  msTips: string;
  heatSafe: boolean;
};

const EXERCISES: MSExercise[] = [
  {
    id: "aqua", name: "Aquatic Exercise", category: "cardio", fatigueLevel: "low",
    duration: "20–30 min", heatSafe: true,
    benefits: ["Reduces spasticity", "Improves balance", "Low joint impact", "Natural cooling"],
    description: "Exercising in cool water (27-29°C) helps manage body temperature while building strength and endurance.",
    msTips: "Pool temperature matters — avoid hot pools. Start with 15 minutes and build up. Water supports your body weight, making movement easier.",
  },
  {
    id: "yoga", name: "Adaptive Yoga", category: "flexibility", fatigueLevel: "low",
    duration: "15–30 min", heatSafe: true,
    benefits: ["Reduces stress", "Improves flexibility", "Better balance", "Mood boost"],
    description: "Modified yoga poses designed for varying ability levels, using chairs or walls for support.",
    msTips: "Chair yoga is excellent for days with high fatigue. Focus on breathing techniques which also help with anxiety and pain management.",
  },
  {
    id: "walking", name: "Walking Program", category: "cardio", fatigueLevel: "moderate",
    duration: "10–30 min", heatSafe: false,
    benefits: ["Cardiovascular health", "Mood improvement", "Bone density", "Social activity"],
    description: "Progressive walking tailored to your energy levels, starting with short intervals.",
    msTips: "Walk during cooler parts of the day. Use cooling vest in warm weather. Break into 10-minute sessions if fatigue is high. Consider using a walking aid on difficult days.",
  },
  {
    id: "resistance", name: "Resistance Bands", category: "strength", fatigueLevel: "moderate",
    duration: "15–20 min", heatSafe: true,
    benefits: ["Muscle strength", "Bone health", "Functional mobility", "Easy to modify"],
    description: "Gentle resistance training using elastic bands — adjustable difficulty, can be done seated.",
    msTips: "Start with the lightest band. Do exercises seated if balance is a concern. Focus on large muscle groups first. Rest 60–90 seconds between sets.",
  },
  {
    id: "tai-chi", name: "Tai Chi", category: "balance", fatigueLevel: "low",
    duration: "15–30 min", heatSafe: true,
    benefits: ["Fall prevention", "Balance", "Stress relief", "Pain reduction"],
    description: "Slow, flowing movements that improve balance, coordination, and mindfulness.",
    msTips: "Excellent for improving balance and reducing fall risk. Can be done seated. The slow pace is ideal for managing fatigue.",
  },
  {
    id: "pilates", name: "Modified Pilates", category: "strength", fatigueLevel: "moderate",
    duration: "20–30 min", heatSafe: true,
    benefits: ["Core strength", "Posture", "Flexibility", "Bladder control"],
    description: "Core-focused exercises modified for MS — strengthens the trunk muscles that support balance and posture.",
    msTips: "Strong core muscles help with balance and reduce fall risk. Pelvic floor exercises can help with bladder issues common in MS.",
  },
  {
    id: "cycling", name: "Recumbent Cycling", category: "cardio", fatigueLevel: "moderate",
    duration: "15–25 min", heatSafe: true,
    benefits: ["Cardiovascular fitness", "Leg strength", "Low fall risk", "Climate controlled"],
    description: "Seated cycling on a recumbent bike — provides back support and eliminates balance concerns.",
    msTips: "The reclined position supports your back. Start with low resistance. Indoor cycling lets you control temperature. Use a fan for cooling.",
  },
  {
    id: "stretching", name: "Stretching Routine", category: "flexibility", fatigueLevel: "low",
    duration: "10–15 min", heatSafe: true,
    benefits: ["Spasticity relief", "Range of motion", "Pain reduction", "Sleep quality"],
    description: "Gentle stretches targeting muscles commonly affected by MS spasticity.",
    msTips: "Stretch daily, especially before bed to reduce nighttime spasticity. Hold stretches for 30–60 seconds. Never bounce. Focus on calves, hamstrings, and hip flexors.",
  },
];

const CATEGORY_COLORS = {
  cardio: "bg-red-500/10 text-red-600 dark:text-red-400",
  strength: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  flexibility: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  balance: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

const FATIGUE_COLORS = {
  low: "text-emerald-500",
  moderate: "text-amber-500",
  high: "text-red-500",
};

export default function ExerciseLibrary() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? EXERCISES : EXERCISES.filter(e => e.category === filter);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground">MS-Safe Exercise Guide</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Exercises curated for people with MS. Each includes fatigue ratings and heat-safety info.
      </p>

      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap">
        {["all", "cardio", "strength", "flexibility", "balance"].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-full px-2.5 py-1 text-[11px] capitalize transition-all ${
              filter === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-muted"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.map(ex => {
        const isOpen = expanded === ex.id;
        return (
          <motion.div key={ex.id} layout className="rounded-xl bg-card shadow-soft overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : ex.id)}
              className="flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-accent/30"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-foreground">{ex.name}</p>
                  {!ex.heatSafe && <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${CATEGORY_COLORS[ex.category]}`}>
                    {ex.category}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px]">
                    <Zap className={`h-3 w-3 ${FATIGUE_COLORS[ex.fatigueLevel]}`} />
                    <span className={FATIGUE_COLORS[ex.fatigueLevel]}>{ex.fatigueLevel} fatigue</span>
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> {ex.duration}
                  </span>
                </div>
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-3.5 pb-3.5 space-y-3">
                    <p className="text-sm text-foreground leading-relaxed">{ex.description}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {ex.benefits.map((b, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          <Heart className="h-2.5 w-2.5" /> {b}
                        </span>
                      ))}
                    </div>

                    <div className="rounded-lg bg-accent/50 px-3 py-2.5">
                      <p className="text-xs text-accent-foreground leading-relaxed">
                        <span className="font-semibold">🧠 MS Tip:</span> {ex.msTips}
                      </p>
                    </div>

                    {!ex.heatSafe && (
                      <div className="rounded-lg bg-amber-500/10 px-3 py-2">
                        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                          <span className="font-semibold">⚠️ Heat Warning:</span> This exercise may raise body temperature. Use cooling strategies and avoid exercising during peak heat.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
