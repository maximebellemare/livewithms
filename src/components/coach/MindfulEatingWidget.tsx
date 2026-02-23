import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Apple, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";

const STEPS = [
  {
    title: "Pause & Observe",
    instruction: "Before eating, take a moment to look at your food. Notice the colours, textures, and arrangement on your plate.",
    phrase: "Eating begins with awareness.",
    duration: 15,
  },
  {
    title: "Gratitude Breath",
    instruction: "Take one slow, deep breath. Silently appreciate the effort that brought this food to you — from the earth to your plate.",
    phrase: "Nourishment is a gift worth noticing.",
    duration: 15,
  },
  {
    title: "Engage Your Senses",
    instruction: "Bring the food close. Notice its aroma. How does it smell? Does your body respond with anticipation?",
    phrase: "Your senses are guides — let them lead.",
    duration: 15,
  },
  {
    title: "First Bite",
    instruction: "Take a small first bite and let it rest on your tongue. Notice the flavour, temperature, and texture before chewing slowly.",
    phrase: "Slow down — there's no rush.",
    duration: 18,
  },
  {
    title: "Chew with Intention",
    instruction: "Chew each bite thoroughly — aim for 15-20 chews. Notice how the flavour changes as you chew.",
    phrase: "Digestion starts in the mouth.",
    duration: 18,
  },
  {
    title: "Body Check-In",
    instruction: "Pause halfway through your meal. Place your fork down. How full do you feel on a scale of 1-10? Is your body asking for more?",
    phrase: "Your body knows — trust it.",
    duration: 18,
  },
  {
    title: "Closing Moment",
    instruction: "When you finish, sit for a moment. Notice how your body feels now compared to before. Thank yourself for slowing down.",
    phrase: "Mindful eating is self-care in action.",
    duration: 15,
  },
];

export const detectMindfulEating = (content: string): boolean => {
  const lower = content.toLowerCase();
  return (
    /mindful\s*(eating|meal|food)/i.test(lower) ||
    /conscious\s*(eating|meal|food)/i.test(lower) ||
    /eating\s*(exercise|practice|meditation|mindful)/i.test(lower) ||
    (lower.includes("mindful") && (lower.includes("eat") || lower.includes("meal") || lower.includes("food"))) ||
    (lower.includes("conscious") && lower.includes("eating"))
  );
};

const MindfulEatingWidget = () => {
  const [state, setState] = useState<"idle" | "active" | "complete">("idle");
  const [step, setStep] = useState(0);
  const [timer, setTimer] = useState(0);
  const [paused, setPaused] = useState(false);

  const current = STEPS[step];

  useEffect(() => {
    if (state !== "active" || paused) return;
    if (timer >= current.duration) {
      if (step < STEPS.length - 1) {
        setStep((s) => s + 1);
        setTimer(0);
      } else {
        setState("complete");
      }
      return;
    }
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [state, paused, timer, step, current.duration]);

  const start = () => {
    setState("active");
    setStep(0);
    setTimer(0);
    setPaused(false);
  };

  const skip = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      setTimer(0);
    } else {
      setState("complete");
    }
  }, [step]);

  const progress = current ? timer / current.duration : 1;

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/30">
        <Apple className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">Mindful Eating</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {state === "active" ? `${step + 1} / ${STEPS.length}` : state === "complete" ? "Complete" : `${STEPS.length} steps`}
        </span>
      </div>

      <div className="px-4 py-4">
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-3"
            >
              <p className="text-xs text-muted-foreground leading-relaxed">
                A gentle {STEPS.length}-step guide to eating with presence and intention. Best used before or during a meal.
              </p>
              <button
                onClick={start}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Apple className="h-3.5 w-3.5" /> Begin Mindful Eating
              </button>
            </motion.div>
          )}

          {state === "active" && current && (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                {current.title}
              </p>
              <p className="text-xs text-foreground leading-relaxed">{current.instruction}</p>
              <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 text-center">
                <p className="text-sm font-medium text-foreground italic leading-relaxed">
                  "{current.phrase}"
                </p>
              </div>

              <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  onClick={() => setPaused((p) => !p)}
                  className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary transition-colors"
                >
                  {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  {paused ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={skip}
                  className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <ChevronRight className="h-3 w-3" /> Skip
                </button>
              </div>

              <div className="flex justify-center gap-1.5 pt-1">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      i < step ? "bg-primary" : i === step ? "bg-primary/60" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {state === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-3"
            >
              <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Apple className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Nourished & Present 🍃</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                You ate with intention and awareness. Every mindful meal is a step towards better wellbeing.
              </p>
              <button
                onClick={start}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary transition-colors"
              >
                <RotateCcw className="h-3 w-3" /> Repeat
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MindfulEatingWidget;
