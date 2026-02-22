import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Snowflake, Music, Smile, Heart, Timer, ChevronDown, ChevronUp } from "lucide-react";

type Exercise = {
  id: string;
  icon: typeof Snowflake;
  title: string;
  duration: string;
  summary: string;
  steps: string[];
  tip: string;
};

const exercises: Exercise[] = [
  {
    id: "cold",
    icon: Snowflake,
    title: "Cold Exposure",
    duration: "30–60 sec",
    summary: "Splash cold water on your face or hold an ice cube to stimulate your vagus nerve.",
    steps: [
      "Fill a bowl with cold water or grab an ice cube.",
      "Splash cold water on your face — especially forehead, cheeks, and behind ears.",
      "Hold for 30 seconds while breathing slowly.",
      "Alternatively, hold an ice cube in your hands for 60 seconds.",
    ],
    tip: "The dive reflex activates when cold touches your face, immediately calming your heart rate.",
  },
  {
    id: "humming",
    icon: Music,
    title: "Humming & Singing",
    duration: "2–3 min",
    summary: "Gentle humming vibrates the vagus nerve through your vocal cords.",
    steps: [
      "Sit comfortably and close your eyes.",
      "Take a deep breath in through your nose.",
      "As you exhale, hum at a comfortable pitch — feel the vibration in your chest and throat.",
      "Continue for 6–10 breaths, varying the pitch if you like.",
    ],
    tip: "Gargling water vigorously works on the same principle if humming feels awkward.",
  },
  {
    id: "smile",
    icon: Smile,
    title: "Social Engagement",
    duration: "1–2 min",
    summary: "A genuine smile or laugh tells your nervous system you're safe.",
    steps: [
      "Think of someone you love or a moment that made you laugh.",
      "Let a natural smile form — don't force it.",
      "Notice the warmth spreading through your chest.",
      "If possible, text someone kind or look at a photo that makes you smile.",
    ],
    tip: "The ventral vagal system responds to faces and connection — even imagined connection helps.",
  },
  {
    id: "heartcoherence",
    icon: Heart,
    title: "Heart Coherence",
    duration: "3–5 min",
    summary: "Focus attention on your heart area while breathing to sync heart and brain rhythms.",
    steps: [
      "Place your hand on your heart.",
      "Breathe slowly — 5 seconds in, 5 seconds out.",
      "Imagine breathing through your heart.",
      "Recall a feeling of gratitude, love, or appreciation.",
      "Maintain this feeling for 3–5 minutes.",
    ],
    tip: "Heart coherence has been shown to improve HRV (heart rate variability), a key marker of vagal tone.",
  },
];

const VagalToneExercises = () => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        These gentle techniques stimulate your vagus nerve — the body's main "rest and restore" pathway.
      </p>

      {exercises.map((ex) => {
        const isOpen = expanded === ex.id;
        const Icon = ex.icon;
        return (
          <motion.div
            key={ex.id}
            layout
            className="rounded-xl bg-card shadow-soft overflow-hidden"
          >
            <button
              onClick={() => setExpanded(isOpen ? null : ex.id)}
              className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-accent/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{ex.title}</p>
                <p className="text-xs text-muted-foreground truncate">{ex.summary}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  {ex.duration}
                </span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
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
                  <div className="px-4 pb-4 space-y-3">
                    <div className="space-y-2">
                      {ex.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm text-foreground leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg bg-accent/50 px-3 py-2.5">
                      <p className="text-xs text-accent-foreground leading-relaxed">
                        <span className="font-semibold">💡 Why it works:</span> {ex.tip}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};

export default VagalToneExercises;
