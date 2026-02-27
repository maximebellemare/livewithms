import { useState } from "react";
import { Moon, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  totalSpoons: number;
  usedSpoons: number;
  activitiesCount: number;
}

const REFLECTION_KEY = "livewithms_energy_reflection_";

export default function EndOfDayReflection({ totalSpoons, usedSpoons, activitiesCount }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const key = REFLECTION_KEY + today;
  const isEvening = new Date().getHours() >= 17;
  const [done, setDone] = useState(() => {
    try { return localStorage.getItem(key) === "true"; } catch { return false; }
  });
  const [selectedAccuracy, setSelectedAccuracy] = useState<string | null>(null);

  if (!isEvening || activitiesCount === 0 || done) return null;

  const accuracyOptions = [
    { value: "too-few", label: "Budget too low", emoji: "😓" },
    { value: "just-right", label: "Just right", emoji: "👌" },
    { value: "had-extra", label: "Had energy left", emoji: "💪" },
  ];

  const handleSubmit = () => {
    localStorage.setItem(key, "true");
    if (selectedAccuracy) {
      // Store calibration hint for future budget suggestions
      try {
        const hints = JSON.parse(localStorage.getItem("livewithms_budget_hints") || "[]");
        hints.push({ date: today, accuracy: selectedAccuracy, budget: totalSpoons, used: usedSpoons });
        // Keep last 14
        localStorage.setItem("livewithms_budget_hints", JSON.stringify(hints.slice(-14)));
      } catch { }
    }
    setDone(true);
  };

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
      <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-1.5">
        <Moon className="h-4 w-4 text-primary" />
        End-of-Day Reflection
      </h3>
      <p className="text-xs text-muted-foreground">
        You used <span className="font-semibold text-foreground">{usedSpoons}</span> of{" "}
        <span className="font-semibold text-foreground">{totalSpoons}</span> spoons today.
        How did your budget feel?
      </p>
      <div className="flex gap-2">
        {accuracyOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelectedAccuracy(opt.value)}
            className={`flex-1 rounded-lg px-2 py-2 text-center text-xs transition-all ${
              selectedAccuracy === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-muted"
            }`}
          >
            <span className="block text-base mb-0.5">{opt.emoji}</span>
            {opt.label}
          </button>
        ))}
      </div>
      <AnimatePresence>
        {selectedAccuracy && (
          <motion.button
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onClick={handleSubmit}
            className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 flex items-center justify-center gap-1.5"
          >
            <Check className="h-3.5 w-3.5" /> Save Reflection
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

