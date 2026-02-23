import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, ChevronRight, ChevronLeft, RotateCcw, Sparkles, Star } from "lucide-react";

const VALUES = [
  "Family", "Health", "Growth", "Courage", "Kindness",
  "Independence", "Connection", "Creativity", "Peace", "Purpose",
  "Resilience", "Honesty", "Joy", "Gratitude", "Adventure",
];

interface Step {
  title: string;
  instruction: string;
  type: "select" | "write" | "summary";
  placeholder?: string;
}

const STEPS: Step[] = [
  {
    title: "Reflect",
    instruction: "Take a breath. Values aren't goals — they're directions you choose to walk in, regardless of what life throws at you.",
    type: "write",
  },
  {
    title: "Choose Your Core Values",
    instruction: "Pick 3–5 values that feel most meaningful to you right now. There are no wrong answers.",
    type: "select",
  },
  {
    title: "Why These Matter",
    instruction: "Pick one value you chose and write about why it's important to you — especially in the context of living with MS.",
    placeholder: "e.g. 'Resilience matters because it reminds me I've survived every hard day so far…'",
    type: "write",
  },
  {
    title: "Living Your Values",
    instruction: "Think of one small action you could take today or this week that honours one of your values.",
    placeholder: "e.g. 'I'll call my sister (Connection) even if I'm tired…'",
    type: "write",
  },
  {
    title: "Anchor",
    instruction: "Read back what you wrote. Let your values be a compass, not a checklist.",
    type: "summary",
  },
];

export function detectValues(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    /values?\s*(clarification|exercise|exploration|reflection|journal)/i.test(lower) ||
    (lower.includes("core values") && (lower.includes("identify") || lower.includes("reflect") || lower.includes("explore") || lower.includes("exercise"))) ||
    (lower.includes("values") && lower.includes("compass") && (lower.includes("guide") || lower.includes("exercise")))
  );
}

const ValuesWidget = () => {
  const [stepIdx, setStepIdx] = useState(0);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(STEPS.map(() => ""));
  const [done, setDone] = useState(false);

  const current = STEPS[stepIdx];

  const canAdvance =
    current.type === "select"
      ? selectedValues.length >= 3
      : current.type === "summary" || current.type === "write"
      ? stepIdx === 0 || answers[stepIdx]?.trim().length > 0
      : true;

  const haptic = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(10);
  }, []);

  const toggleValue = (v: string) => {
    setSelectedValues((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : prev.length < 5 ? [...prev, v] : prev
    );
  };

  const updateAnswer = (value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[stepIdx] = value;
      return next;
    });
  };

  const next = () => {
    haptic();
    if (stepIdx + 1 >= STEPS.length) setDone(true);
    else setStepIdx((i) => i + 1);
  };

  const prev = () => {
    haptic();
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  };

  const reset = () => {
    setStepIdx(0);
    setSelectedValues([]);
    setAnswers(STEPS.map(() => ""));
    setDone(false);
  };

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/30">
        <Compass className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">Values Clarification</span>
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

              {current.type === "select" && (
                <div className="flex flex-wrap gap-1.5">
                  {VALUES.map((v) => {
                    const active = selectedValues.includes(v);
                    return (
                      <button
                        key={v}
                        onClick={() => toggleValue(v)}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-medium border transition-all active:scale-95 ${
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary text-foreground border-border hover:border-primary/40"
                        }`}
                      >
                        {v}
                      </button>
                    );
                  })}
                  <p className="w-full text-[10px] text-muted-foreground mt-1">
                    {selectedValues.length}/5 selected (min 3)
                  </p>
                </div>
              )}

              {current.type === "write" && stepIdx > 0 && (
                <textarea
                  value={answers[stepIdx]}
                  onChange={(e) => updateAnswer(e.target.value)}
                  placeholder={current.placeholder}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}

              {current.type === "summary" && (
                <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedValues.map((v) => (
                      <span key={v} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                        <Star className="h-3 w-3" /> {v}
                      </span>
                    ))}
                  </div>
                  {answers[2]?.trim() && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1">Why it matters</p>
                      <p className="text-xs text-foreground leading-relaxed">{answers[2]}</p>
                    </div>
                  )}
                  {answers[3]?.trim() && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1">My action</p>
                      <p className="text-xs text-foreground leading-relaxed">{answers[3]}</p>
                    </div>
                  )}
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
              <p className="text-sm font-medium text-foreground">Values anchored 🧭</p>
              <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 space-y-3 text-left">
                <div className="flex flex-wrap gap-1.5">
                  {selectedValues.map((v) => (
                    <span key={v} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                      <Star className="h-3 w-3" /> {v}
                    </span>
                  ))}
                </div>
                {answers[3]?.trim() && (
                  <p className="text-xs text-foreground leading-relaxed">
                    <span className="font-medium">Next step:</span> {answers[3]}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Your values don't change with your symptoms. They're your compass on every kind of day.
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

export default ValuesWidget;
