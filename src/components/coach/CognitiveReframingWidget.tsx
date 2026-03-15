import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, AlertTriangle, Search, Lightbulb, Sparkles, ChevronRight, ChevronLeft, RotateCcw, Check } from "lucide-react";
import StepIndicator from "@/components/StepIndicator";

interface Step {
  id: string;
  title: string;
  prompt: string;
  placeholder: string;
  icon: typeof Brain;
  hint?: string;
}

const STEPS: Step[] = [
  {
    id: "identify",
    title: "Identify",
    prompt: "What negative thought are you having?",
    placeholder: "e.g. I'll never feel normal again…",
    icon: AlertTriangle,
    hint: "Write it exactly as it appears in your mind.",
  },
  {
    id: "evidence-for",
    title: "Evidence For",
    prompt: "What evidence supports this thought?",
    placeholder: "e.g. My symptoms have been worse this week…",
    icon: Search,
    hint: "Try to stick to facts, not feelings.",
  },
  {
    id: "evidence-against",
    title: "Challenge",
    prompt: "What evidence goes against this thought?",
    placeholder: "e.g. I had a good stretch last month…",
    icon: Search,
    hint: "Think of times the thought wasn't true.",
  },
  {
    id: "reframe",
    title: "Reframe",
    prompt: "Write a more balanced thought",
    placeholder: "e.g. Some days are harder, but I've managed before…",
    icon: Lightbulb,
    hint: "Aim for realistic, not overly positive.",
  },
];

const CognitiveReframingWidget = () => {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>(STEPS.map(() => ""));
  const [done, setDone] = useState(false);

  const currentStep = STEPS[stepIdx];
  const progress = done ? 1 : stepIdx / STEPS.length;

  const haptic = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(10);
  }, []);

  const updateAnswer = (value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[stepIdx] = value;
      return next;
    });
  };

  const canAdvance = answers[stepIdx]?.trim().length > 0;

  const nextStep = () => {
    haptic();
    if (stepIdx + 1 >= STEPS.length) {
      setDone(true);
    } else {
      setStepIdx((i) => i + 1);
    }
  };

  const prevStep = () => {
    haptic();
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  };

  const reset = () => {
    setStepIdx(0);
    setAnswers(STEPS.map(() => ""));
    setDone(false);
  };

  const CIRCLE_R = 46;
  const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Progress ring */}
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
        <svg width={120} height={120} className="absolute -rotate-90">
          <circle cx={60} cy={60} r={CIRCLE_R} fill="none" stroke="hsl(var(--muted))" strokeWidth={5} />
          <circle
            cx={60} cy={60} r={CIRCLE_R}
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
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="text-xs font-semibold text-foreground mt-1">Reframed</span>
              </>
            ) : (
              <>
                <currentStep.icon className="h-6 w-6 text-primary" />
                <span className="text-xs font-semibold text-foreground mt-1">{currentStep.title}</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Active step */}
      {!done && (
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-2 w-full max-w-[280px]"
          >
            <p className="text-sm font-medium text-foreground text-center">{currentStep.prompt}</p>
            {currentStep.hint && (
              <p className="text-[11px] text-muted-foreground text-center">{currentStep.hint}</p>
            )}
            <textarea
              value={answers[stepIdx]}
              onChange={(e) => updateAnswer(e.target.value)}
              placeholder={currentStep.placeholder}
              rows={3}
              className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Completion summary */}
      {done && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[280px] space-y-2"
        >
          <div className="rounded-xl bg-secondary/50 border border-border p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed"><span className="font-medium text-foreground">Original:</span> {answers[0]}</p>
            </div>
            <div className="flex items-start gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-foreground leading-relaxed font-medium">{answers[3]}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i < stepIdx || done
                ? "w-4 bg-primary"
                : i === stepIdx
                ? "w-4 bg-primary/50"
                : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {done ? "Cognitive reframing complete" : `Step ${stepIdx + 1} of ${STEPS.length}`}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!done && stepIdx > 0 && (
          <button
            onClick={prevStep}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            aria-label="Previous step"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {!done && canAdvance && (
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
 * Detects if a message contains a cognitive reframing exercise.
 */
export function detectCognitiveReframing(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    (lower.includes("cognitive reframing") || lower.includes("reframe") || lower.includes("reframing")) &&
    (lower.includes("thought") || lower.includes("think") || lower.includes("negative") || lower.includes("step"))
  ) || (
    lower.includes("identify") && lower.includes("challenge") && lower.includes("reframe")
  );
}

export default CognitiveReframingWidget;
