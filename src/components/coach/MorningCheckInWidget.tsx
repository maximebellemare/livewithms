import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";

const STEPS = [
  {
    title: "Gentle Awakening",
    instruction: "Before opening your eyes fully, take three slow, deep breaths. Feel the weight of your body on the bed.",
    phrase: "A new day begins gently.",
    duration: 15,
  },
  {
    title: "Body Awareness",
    instruction: "Wiggle your fingers and toes. Slowly stretch your arms overhead. Notice how your body feels this morning.",
    phrase: "Listen to what your body is telling you.",
    duration: 18,
  },
  {
    title: "Energy Check",
    instruction: "On a scale of 1–10, how rested do you feel? Don't judge — just notice. This helps you plan your day wisely.",
    phrase: "Awareness is the first step to pacing well.",
    duration: 18,
  },
  {
    title: "Gratitude Seed",
    instruction: "Think of one thing you're looking forward to today, even something small like a warm drink or a favourite song.",
    phrase: "Small joys anchor big days.",
    duration: 15,
  },
  {
    title: "Gentle Movement",
    instruction: "Sit up slowly. Roll your shoulders back three times. Tilt your head side to side to release neck tension.",
    phrase: "Movement is medicine — start small.",
    duration: 18,
  },
  {
    title: "Hydration Moment",
    instruction: "Take a sip of water. Even a small glass helps your brain wake up and your body rehydrate after sleep.",
    phrase: "Water first, everything else second.",
    duration: 12,
  },
  {
    title: "Day Intention",
    instruction: "Set one kind intention for yourself today. It could be: 'I will rest when I need to' or 'I will be patient with myself.'",
    phrase: "You don't have to do it all — just begin.",
    duration: 18,
  },
];

export const detectMorningCheckIn = (content: string): boolean => {
  const lower = content.toLowerCase();
  return (
    /morning\s*(check[- ]?in|routine|wake[- ]?up)/i.test(lower) ||
    /wake[- ]?up\s*(routine|exercise|practice|sequence|check)/i.test(lower) ||
    /gentle\s*(wake|morning|awakening)\s*(routine|sequence|exercise)?/i.test(lower) ||
    (lower.includes("morning") && lower.includes("routine") && (lower.includes("gentle") || lower.includes("energy") || lower.includes("calm"))) ||
    (lower.includes("morning") && lower.includes("check") && lower.includes("in"))
  );
};

const MorningCheckInWidget = () => {
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
        <Sun className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">Morning Check-In</span>
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
                A gentle {STEPS.length}-step morning sequence to wake your body, check your energy, and set a kind intention for the day.
              </p>
              <button
                onClick={start}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Sun className="h-3.5 w-3.5" /> Start Morning Check-In
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
                <Sun className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Good morning ☀️</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                You've checked in with your body and set a kind intention. Take things one step at a time today.
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

export default MorningCheckInWidget;
