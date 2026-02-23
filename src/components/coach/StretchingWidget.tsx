import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ChevronRight, Pause, Play, RotateCcw, SkipForward } from "lucide-react";

const STRETCHES = [
  {
    name: "Neck Tilt",
    instruction: "Slowly tilt your head toward your right shoulder. Hold gently — don't force it.",
    tip: "If seated, let your opposite hand rest on the chair for stability.",
    duration: 20,
    side: "right",
  },
  {
    name: "Neck Tilt",
    instruction: "Now tilt your head toward your left shoulder. Breathe slowly and let gravity do the work.",
    tip: "Close your eyes if it helps you focus on the stretch.",
    duration: 20,
    side: "left",
  },
  {
    name: "Shoulder Rolls",
    instruction: "Roll both shoulders forward in slow circles, 5 times. Then reverse direction.",
    tip: "Keep your arms relaxed at your sides — no tension in the hands.",
    duration: 25,
  },
  {
    name: "Seated Spinal Twist",
    instruction: "Sitting tall, place your right hand on your left knee. Gently twist your torso to the left.",
    tip: "Only twist as far as feels comfortable. Your spine should stay long.",
    duration: 20,
    side: "left",
  },
  {
    name: "Seated Spinal Twist",
    instruction: "Now place your left hand on your right knee and gently twist to the right.",
    tip: "Use your exhale to deepen the twist slightly, if it feels okay.",
    duration: 20,
    side: "right",
  },
  {
    name: "Wrist Circles",
    instruction: "Extend your arms forward and slowly circle your wrists — 5 times each direction.",
    tip: "Great for reducing stiffness, especially if you've been typing or gripping.",
    duration: 20,
  },
  {
    name: "Ankle Circles",
    instruction: "Lift one foot slightly off the floor and draw slow circles with your toes. Switch feet.",
    tip: "Hold onto your chair if you need balance support — no rush.",
    duration: 25,
  },
  {
    name: "Chest Opener",
    instruction: "Clasp your hands behind your back (or hold a towel). Gently lift your arms and open your chest.",
    tip: "This counteracts forward-leaning posture. Breathe into the stretch.",
    duration: 20,
  },
  {
    name: "Deep Breath Reset",
    instruction: "Close your eyes. Inhale for 4 counts, hold for 2, exhale for 6. Repeat 3 times.",
    tip: "Notice how your body feels after moving. You did something kind for yourself.",
    duration: 25,
  },
];

export const detectStretching = (content: string): boolean => {
  const lower = content.toLowerCase();
  return (
    /stretching\s*(exercise|routine|guide|session|widget|break)/i.test(lower) ||
    /guided\s*stretch/i.test(lower) ||
    /gentle\s*stretch/i.test(lower) ||
    /ms[- ]friendly\s*(stretch|movement|routine)/i.test(lower) ||
    (lower.includes("stretch") && (lower.includes("guide") || lower.includes("through") || lower.includes("let's") || lower.includes("here") || lower.includes("try") || lower.includes("routine"))) ||
    (lower.includes("movement") && lower.includes("routine") && (lower.includes("gentle") || lower.includes("seated")))
  );
};

const StretchingWidget = () => {
  const [state, setState] = useState<"idle" | "active" | "complete">("idle");
  const [step, setStep] = useState(0);
  const [timer, setTimer] = useState(0);
  const [paused, setPaused] = useState(false);

  const current = STRETCHES[step];

  useEffect(() => {
    if (state !== "active" || paused) return;
    if (timer >= current.duration) {
      if (step < STRETCHES.length - 1) {
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
    if (step < STRETCHES.length - 1) {
      setStep((s) => s + 1);
      setTimer(0);
    } else {
      setState("complete");
    }
  }, [step]);

  const progress = current ? timer / current.duration : 1;
  const remaining = current ? current.duration - timer : 0;

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/30">
        <Activity className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">Gentle Stretching Routine</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {state === "active"
            ? `${step + 1} / ${STRETCHES.length}`
            : state === "complete"
            ? "Complete"
            : `${STRETCHES.length} stretches`}
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
                A gentle {STRETCHES.length}-step seated routine designed for MS — no standing required. Go at your own pace.
              </p>
              <button
                onClick={start}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Activity className="h-3.5 w-3.5" /> Start Routine
              </button>
            </motion.div>
          )}

          {state === "active" && current && (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35 }}
              className="space-y-3"
            >
              {/* Stretch name + side badge */}
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                  {current.name}
                </p>
                {current.side && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-medium text-muted-foreground uppercase">
                    {current.side} side
                  </span>
                )}
              </div>

              <p className="text-xs text-foreground leading-relaxed">{current.instruction}</p>

              <div className="rounded-xl bg-primary/5 border border-primary/10 px-3 py-2">
                <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                  💡 {current.tip}
                </p>
              </div>

              {/* Timer + progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Hold</span>
                  <span className="text-xs font-mono font-medium text-foreground tabular-nums">
                    {remaining}s
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Controls */}
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
                  <SkipForward className="h-3 w-3" /> Skip
                </button>
              </div>

              {/* Step dots */}
              <div className="flex justify-center gap-1 pt-1 flex-wrap">
                {STRETCHES.map((_, i) => (
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
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Routine complete!</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Great job moving your body. Even small stretches can reduce stiffness and lift your mood.
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

export default StretchingWidget;
