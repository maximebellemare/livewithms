import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Hand, Ear, Wind, Cookie, Check, RotateCcw, ChevronRight } from "lucide-react";

interface Step {
  count: number;
  sense: string;
  prompt: string;
  icon: typeof Eye;
  color: string;
}

const STEPS: Step[] = [
  { count: 5, sense: "See", prompt: "Name 5 things you can see right now", icon: Eye, color: "hsl(var(--primary))" },
  { count: 4, sense: "Touch", prompt: "Name 4 things you can physically feel", icon: Hand, color: "hsl(var(--primary))" },
  { count: 3, sense: "Hear", prompt: "Name 3 things you can hear", icon: Ear, color: "hsl(var(--primary))" },
  { count: 2, sense: "Smell", prompt: "Name 2 things you can smell", icon: Wind, color: "hsl(var(--primary))" },
  { count: 1, sense: "Taste", prompt: "Name 1 thing you can taste", icon: Cookie, color: "hsl(var(--primary))" },
];

const GroundingWidget = () => {
  const [stepIdx, setStepIdx] = useState(0);
  const [checked, setChecked] = useState<boolean[][]>(
    STEPS.map((s) => Array(s.count).fill(false))
  );
  const [done, setDone] = useState(false);

  const currentStep = STEPS[stepIdx];
  const allCheckedInStep = checked[stepIdx]?.every(Boolean);
  const totalItems = STEPS.reduce((s, st) => s + st.count, 0);
  const totalChecked = checked.flat().filter(Boolean).length;
  const progress = totalChecked / totalItems;

  const haptic = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(10);
  }, []);

  const toggleItem = (itemIdx: number) => {
    haptic();
    setChecked((prev) => {
      const next = prev.map((arr) => [...arr]);
      next[stepIdx][itemIdx] = !next[stepIdx][itemIdx];
      return next;
    });
  };

  const nextStep = () => {
    haptic();
    if (stepIdx + 1 >= STEPS.length) {
      setDone(true);
    } else {
      setStepIdx((i) => i + 1);
    }
  };

  const reset = () => {
    setStepIdx(0);
    setChecked(STEPS.map((s) => Array(s.count).fill(false)));
    setDone(false);
  };

  const CIRCLE_R = 46;
  const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Progress ring with step icon */}
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
        <svg width={120} height={120} className="absolute -rotate-90">
          <circle cx={60} cy={60} r={CIRCLE_R} fill="none" stroke="hsl(var(--muted))" strokeWidth={5} />
          <circle
            cx={60}
            cy={60}
            r={CIRCLE_R}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.4s ease" }}
          />
        </svg>
        <AnimatePresence mode="wait">
          <motion.div
            key={done ? "done" : stepIdx}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute flex flex-col items-center"
          >
            {done ? (
              <>
                <Check className="h-6 w-6 text-primary" />
                <span className="text-xs font-semibold text-foreground mt-1">Grounded</span>
              </>
            ) : (
              <>
                <currentStep.icon className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold text-foreground mt-0.5">{currentStep.count}</span>
                <span className="text-[10px] text-muted-foreground">{currentStep.sense}</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Step prompt */}
      {!done && (
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="text-sm text-foreground font-medium text-center max-w-[240px]"
          >
            {currentStep.prompt}
          </motion.p>
        </AnimatePresence>
      )}

      {/* Checkboxes */}
      {!done && (
        <div className="flex items-center gap-2">
          {checked[stepIdx].map((isChecked, i) => (
            <motion.button
              key={i}
              onClick={() => toggleItem(i)}
              whileTap={{ scale: 0.85 }}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 transition-all ${
                isChecked
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground"
              }`}
              aria-label={`Item ${i + 1}`}
            >
              {isChecked ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-xs font-medium">{i + 1}</span>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Step indicator */}
      <p className="text-[11px] text-muted-foreground">
        {done ? "All 5 senses complete" : `Step ${stepIdx + 1} of 5`}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!done && allCheckedInStep && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={nextStep}
            className="flex h-9 items-center gap-1.5 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium active:scale-95 transition-transform"
          >
            {stepIdx + 1 >= STEPS.length ? "Finish" : "Next"}
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        )}
        {done && (
          <button
            onClick={reset}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            aria-label="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Detects if a message contains a 5-4-3-2-1 grounding exercise.
 */
export function detectGroundingExercise(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    lower.includes("5-4-3-2-1") ||
    lower.includes("5–4–3–2–1") ||
    lower.includes("five senses grounding") ||
    lower.includes("5 things you can see") ||
    (lower.includes("grounding exercise") &&
      lower.includes("see") &&
      lower.includes("hear"))
  );
}

export default GroundingWidget;
