import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronRight, ChevronLeft, RotateCcw, Sparkles } from "lucide-react";

const PROMPTS = [
  "Something small that made you smile today",
  "A person who supports or cares about you",
  "Something your body allowed you to do today",
  "A comfort you often take for granted",
  "A lesson a difficult moment taught you",
];

const STEPS = [
  {
    title: "Settle In",
    instruction: "Take a slow breath. Let your shoulders drop. Gratitude lands better in a calm body.",
  },
  {
    title: "Gratitude 1",
    instruction: PROMPTS[0],
    placeholder: "e.g. My morning tea was perfect…",
    writeable: true,
  },
  {
    title: "Gratitude 2",
    instruction: PROMPTS[1],
    placeholder: "e.g. My partner checked in on me…",
    writeable: true,
  },
  {
    title: "Gratitude 3",
    instruction: PROMPTS[2],
    placeholder: "e.g. I managed a short walk…",
    writeable: true,
  },
  {
    title: "Savour",
    instruction: "Read back what you wrote. Let the warmth of each one sit with you for a moment.",
    summary: true,
  },
];

export const detectGratitude = (content: string): boolean => {
  const lower = content.toLowerCase();
  return (
    /gratitude\s*(journal|exercise|practice|log|session|prompt)/i.test(lower) ||
    /grateful\s*(journal|exercise|practice|list|writing)/i.test(lower) ||
    (lower.includes("gratitude") && (lower.includes("write") || lower.includes("guide") || lower.includes("thankful") || lower.includes("exercise"))) ||
    (lower.includes("thankful") && (lower.includes("journal") || lower.includes("write") || lower.includes("list") || lower.includes("exercise")))
  );
};

const GratitudeWidget = () => {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>(STEPS.map(() => ""));
  const [done, setDone] = useState(false);

  const current = STEPS[stepIdx];
  const canAdvance = !current.writeable || answers[stepIdx]?.trim().length > 0;

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

  const next = () => {
    haptic();
    if (stepIdx + 1 >= STEPS.length) {
      setDone(true);
    } else {
      setStepIdx((i) => i + 1);
    }
  };

  const prev = () => {
    haptic();
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  };

  const reset = () => {
    setStepIdx(0);
    setAnswers(STEPS.map(() => ""));
    setDone(false);
  };

  const writtenEntries = STEPS.map((s, i) => ({ step: s, text: answers[i] })).filter(
    (e) => e.step.writeable && e.text.trim()
  );

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/30">
        <Heart className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">Gratitude Journal</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {done ? "Complete" : `${stepIdx + 1} / ${STEPS.length}`}
        </span>
      </div>

      <div className="px-4 py-4">
        <AnimatePresence mode="wait">
          {!done && (
            <motion.div
              key={stepIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                {current.title}
              </p>
              <p className="text-xs text-foreground leading-relaxed">{current.instruction}</p>

              {current.writeable && (
                <textarea
                  value={answers[stepIdx]}
                  onChange={(e) => updateAnswer(e.target.value)}
                  placeholder={current.placeholder}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}

              {current.summary && writtenEntries.length > 0 && (
                <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 space-y-2">
                  {writtenEntries.map((e, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Heart className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-foreground leading-relaxed">{e.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {done && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-3"
            >
              <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Gratitude noted 💛</p>
              <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 space-y-2 text-left">
                {writtenEntries.map((e, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Heart className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-foreground leading-relaxed">{e.text}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Noticing the good — even on hard days — rewires your brain for resilience.
              </p>
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary transition-colors"
              >
                <RotateCcw className="h-3 w-3" /> Repeat
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step dots */}
        {!done && (
          <div className="flex justify-center gap-1.5 pt-3">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i < stepIdx ? "bg-primary" : i === stepIdx ? "bg-primary/60" : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}

        {/* Controls */}
        {!done && (
          <div className="flex items-center justify-center gap-2 pt-3">
            {stepIdx > 0 && (
              <button
                onClick={prev}
                className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="h-3 w-3" /> Back
              </button>
            )}
            {canAdvance && (
              <button
                onClick={next}
                className="flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {stepIdx === 0 ? "Begin" : stepIdx + 1 >= STEPS.length ? "Finish" : "Next"}
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GratitudeWidget;
